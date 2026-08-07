import asyncio
import hmac

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.security import (
    COOKIE_NAMES,
    TOTP_ISSUER,
    create_access_token,
    create_preauth_token,
    create_refresh_token,
    get_current_email,
    verify_token,
)
from app.repositories.auth_repo import DUMMY_PASSWORD_HASH, AuthRepo
from app.schemas.auth import (
    AdminAuthInit,
    AdminAuthResponse,
    AdminLoginRequest,
    PreauthLoginRequest,
    TOTPConfirmRequest,
    TOTPRotateRequest,
)

router = APIRouter(prefix="", tags=["Auth (Admin)"])

_ACCESS_MAX_AGE = 15 * 60
_REFRESH_MAX_AGE = 7 * 24 * 60 * 60


def _set_auth_cookies(response: JSONResponse, access_token: str, refresh_token: str) -> None:
    for name, value, max_age in (
        (COOKIE_NAMES["access"], access_token, _ACCESS_MAX_AGE),
        (COOKIE_NAMES["refresh"], refresh_token, _REFRESH_MAX_AGE),
    ):
        response.set_cookie(
            key=name,
            value=value,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=max_age,
        )


async def _check_lockout(repo: AuthRepo) -> None:
    if await repo.is_locked_out():
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Try again later.",
            headers={"Retry-After": str(await repo.retry_after_seconds())},
        )


@router.post("/auth/init", response_model=AdminAuthInit)
async def init_admin_credentials(bootstrap_secret: str = Header(..., alias="x-bootstrap-secret")):
    """Initialize admin credentials with TOTP setup (one-time setup, requires bootstrap secret)"""
    if not settings.BOOTSTRAP_SECRET:
        raise HTTPException(
            status_code=500,
            detail="BOOTSTRAP_SECRET environment variable must be configured before init",
        )
    if not hmac.compare_digest(bootstrap_secret, settings.BOOTSTRAP_SECRET):
        raise HTTPException(status_code=401, detail="Invalid bootstrap secret")

    repo = AuthRepo()

    creds = await repo.get_credentials()
    if creds:
        raise HTTPException(status_code=409, detail="Admin credentials already initialized")

    email = settings.ADMIN_EMAIL
    password = settings.ADMIN_PASSWORD

    if not email or not password:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_EMAIL and ADMIN_PASSWORD environment variables must be set",
        )

    result = await repo.init_credentials(email, password)
    return {
        "message": "Admin credentials initialized successfully",
        "email": result["email"],
        "totp_secret": result["totp_secret"],
        "backup_codes": result["backup_codes"],
    }


@router.post("/login", response_model=dict)
async def admin_login(payload: AdminLoginRequest):
    """Login step 1: verify email + password, return a short-lived preauth token"""
    repo = AuthRepo()
    await _check_lockout(repo)

    creds = await repo.get_credentials()
    if not creds:
        # Equalize timing against the "unknown account" case
        await asyncio.to_thread(repo.verify_password, DUMMY_PASSWORD_HASH, payload.password)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if creds["email"] != payload.email.lower().strip():
        await asyncio.to_thread(repo.verify_password, DUMMY_PASSWORD_HASH, payload.password)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    password_ok = await asyncio.to_thread(
        repo.verify_password, creds["password_hash"], payload.password
    )
    if not password_ok:
        await repo.record_failed_attempt()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    preauth_token = create_preauth_token({"sub": creds["email"]})
    return {
        "message": "Please verify with TOTP code",
        "email": creds["email"],
        "preauth_token": preauth_token,
    }


@router.post("/login/totp", response_model=dict)
async def admin_login_with_totp(payload: PreauthLoginRequest):
    """Login step 2: verify TOTP against the preauth proof, issue session cookies"""
    repo = AuthRepo()
    await _check_lockout(repo)

    try:
        preauth = verify_token(payload.preauth_token, "preauth")
    except HTTPException:
        raise HTTPException(status_code=401, detail="Login session expired, please login again")

    email = preauth.get("sub")
    creds = await repo.get_credentials()
    if not creds or creds["email"] != email:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Fail closed: TOTP is always required for this admin
    totp_secret = creds.get("totp_secret")
    if not totp_secret:
        raise HTTPException(
            status_code=500, detail="TOTP is not configured. Contact support to re-initialize."
        )

    code = payload.totp_code
    mfa_ok = False
    if code.isdigit():
        mfa_ok = repo.verify_totp(totp_secret, code)
    else:
        # Recovery: a single-use backup code is accepted in place of the OTP
        mfa_ok = await repo.consume_backup_code(code)

    if not mfa_ok:
        await repo.record_failed_attempt()
        raise HTTPException(status_code=401, detail="Invalid TOTP or backup code")

    await repo.clear_failed_attempts()

    token_version = creds.get("token_version", 0)
    access_token = create_access_token({"sub": creds["email"]})
    refresh_token = create_refresh_token({"sub": creds["email"], "ver": token_version})

    response = JSONResponse(content={"message": "Login successful", "email": creds["email"]})
    _set_auth_cookies(response, access_token, refresh_token)
    return response


@router.post("/refresh", response_model=dict)
async def refresh_tokens(refresh_token: str = Cookie(None)):
    """Refresh access token (and rotate refresh token) using the refresh cookie"""
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Tokens required")

    payload = verify_token(refresh_token, "refresh")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    repo = AuthRepo()
    creds = await repo.get_credentials()
    if not creds or creds["email"] != email:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Reject if tokens were revoked (logout) after this token was issued
    if payload.get("ver") != creds.get("token_version", 0):
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    # Reuse detection: a presented refresh token whose id differs from the most
    # recently issued one means a previously rotated token is being replayed.
    last_jti = creds.get("last_refresh_jti")
    if last_jti and last_jti != payload.get("jti"):
        await repo.revoke_tokens(email)
        raise HTTPException(
            status_code=401,
            detail="Refresh token reuse detected; all sessions revoked",
        )

    access_token = create_access_token({"sub": email})
    new_refresh_token = create_refresh_token({"sub": email, "ver": creds.get("token_version", 0)})
    new_jti = verify_token(new_refresh_token, "refresh")["jti"]
    await repo.set_last_refresh_jti(email, new_jti)

    response = JSONResponse(content={"message": "Token refreshed"})
    _set_auth_cookies(response, access_token, new_refresh_token)
    return response


@router.post("/logout")
async def logout(refresh_token: str = Cookie(None)):
    """Logout: revoke refresh tokens and clear cookies"""
    repo = AuthRepo()
    if refresh_token:
        try:
            payload = verify_token(refresh_token, "refresh")
            email = payload.get("sub")
            if email:
                await repo.revoke_tokens(email)
        except HTTPException:
            pass

    response = JSONResponse(content={"message": "Logged out successfully"})
    response.delete_cookie(COOKIE_NAMES["access"])
    response.delete_cookie(COOKIE_NAMES["refresh"])
    return response


@router.get("/auth", response_model=AdminAuthResponse)
async def get_admin_credentials(email: str = Depends(get_current_email)):
    """Get current admin email (requires valid access cookie)"""
    repo = AuthRepo()
    creds = await repo.get_credentials()
    if not creds:
        raise HTTPException(status_code=404, detail="Admin credentials not initialized")
    return {"email": creds["email"], "valid": True}


@router.post("/auth/totp/rotate", response_model=dict)
async def rotate_totp_secret(
    payload: TOTPRotateRequest,
    email: str = Depends(get_current_email),
):
    """Start TOTP rotation: prove current code, get a new secret to scan (not yet active)"""
    repo = AuthRepo()
    creds = await repo.get_credentials()
    if not creds:
        raise HTTPException(status_code=404, detail="Admin credentials not initialized")

    current_secret = creds.get("totp_secret")
    if not current_secret or not repo.verify_totp(current_secret, payload.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code")

    new_secret = repo.generate_totp_secret()
    await repo.set_pending_totp_secret(creds["email"], new_secret)

    return {
        "totp_secret": new_secret,
        "otpauth_uri": repo.provisioning_uri(creds["email"], new_secret, TOTP_ISSUER),
    }


@router.post("/auth/totp/confirm", response_model=dict)
async def confirm_totp_secret(
    payload: TOTPConfirmRequest,
    email: str = Depends(get_current_email),
):
    """Confirm a pending TOTP secret with a code from the new device"""
    repo = AuthRepo()
    creds = await repo.get_credentials()
    if not creds:
        raise HTTPException(status_code=404, detail="Admin credentials not initialized")

    pending_secret = creds.get("pending_totp_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="No pending TOTP secret. Start rotation first.")

    if not repo.verify_totp(pending_secret, payload.totp_code):
        raise HTTPException(status_code=401, detail="Invalid TOTP code for the new device")

    await repo.confirm_pending_totp_secret(creds["email"], pending_secret)
    return {"message": "TOTP secret updated successfully"}


@router.post("/backup-codes", response_model=dict)
async def regenerate_backup_codes(email: str = Depends(get_current_email)):
    """Regenerate single-use recovery codes (requires an existing valid session)"""
    repo = AuthRepo()
    creds = await repo.get_credentials()
    if not creds:
        raise HTTPException(status_code=404, detail="Admin credentials not initialized")

    codes = repo.generate_backup_codes()
    await repo.replace_backup_codes(creds["email"], codes)
    return {"backup_codes": codes}
