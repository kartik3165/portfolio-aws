from uuid import uuid4
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request, status
import jwt as pyjwt

from app.core.config import settings

JWT_ALGORITHM = settings.JWT_ALGORITHM
JWT_ISSUER = settings.JWT_ISSUER
JWT_AUDIENCE = settings.JWT_AUDIENCE
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS
PREAUTH_TOKEN_EXPIRE_MINUTES = 5
TOTP_ISSUER = "AdminCMS"

COOKIE_NAMES = {
    "access": "access_token",
    "refresh": "refresh_token",
}


def _jwt_secret() -> str:
    if not settings.JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not configured")
    return settings.JWT_SECRET


def _encode(data: dict) -> str:
    claims = {"iss": JWT_ISSUER, "aud": JWT_AUDIENCE, **data}
    return pyjwt.encode(claims, _jwt_secret(), algorithm=JWT_ALGORITHM)


def _base_claims(token_type: str, ttl: timedelta) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "iat": now,
        "exp": now + ttl,
        "jti": uuid4().hex,
        "type": token_type,
    }


def create_access_token(data: dict) -> str:
    """Create a JWT access token (short-lived)"""
    to_encode = data.copy()
    to_encode.update(_base_claims("access", timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)))
    return _encode(to_encode)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token (long-lived, carries token version for revocation)"""
    to_encode = data.copy()
    to_encode.update(_base_claims("refresh", timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)))
    return _encode(to_encode)


def create_preauth_token(data: dict) -> str:
    """Create a short-lived token proving email/password verification for TOTP step"""
    to_encode = data.copy()
    to_encode.update(_base_claims("preauth", timedelta(minutes=PREAUTH_TOKEN_EXPIRE_MINUTES)))
    return _encode(to_encode)


def verify_token(token: str, expected_type: str = "access") -> dict:
    """Verify and decode JWT token, enforcing token type + issuer/audience"""
    try:
        payload = pyjwt.decode(
            token,
            _jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud"]},
        )
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    if payload.get("type") != expected_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token type. Expected {expected_type}",
        )
    return payload


def get_current_email(request: Request) -> str:
    """Get current admin email from the HttpOnly access cookie"""
    token = request.cookies.get(COOKIE_NAMES["access"])
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = verify_token(token, "access")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return email
