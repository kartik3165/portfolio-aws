from pydantic import BaseModel, EmailStr, Field

# Admin Credential Management


class AdminAuthResponse(BaseModel):
    """Response model for GET /admin/auth - returns email and success status"""
    email: str
    valid: bool = True


class AdminAuthInit(BaseModel):
    """Response model for POST /admin/auth/init (one-time setup)"""
    message: str
    email: str
    totp_secret: str


class AdminLoginRequest(BaseModel):
    """Request model for admin login (step 1: email + password)"""
    email: EmailStr
    password: str = Field(min_length=8)


class PreauthLoginRequest(BaseModel):
    """Request model for admin login (step 2: preauth proof + TOTP code)"""
    preauth_token: str
    totp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class TOTPRotateRequest(BaseModel):
    """Request model to rotate the TOTP secret (requires current TOTP code)"""
    totp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class TOTPConfirmRequest(BaseModel):
    """Request model to confirm a pending TOTP secret with a new device code"""
    totp_code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
