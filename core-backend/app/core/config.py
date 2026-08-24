import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    AWS_REGION: str = "ap-south-1"

    # Optional: point at dynamodb-local (Docker) instead of real AWS
    DYNAMODB_ENDPOINT: str = ""

    # DynamoDB Tables
    BLOG_TABLE: str = "BlogsTable"
    COMMENTS_TABLE: str = "BlogCommentsTable"
    SKILL_TABLE: str = "SkillsTable"
    PROJECTS_TABLE: str = "ProjectsTable"
    PROFILE_TABLE: str = "ProfileTable"
    RATE_LIMIT_TABLE: str = ""

    # Security
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "portfolio-api"
    JWT_AUDIENCE: str = "portfolio-admin"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15 # 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days
    AUTH_COOKIE_SECURE: bool = True
    AUTH_COOKIE_SAMESITE: str = "strict"

    # Optional Fernet key (32-byte urlsafe-base64). When set, the TOTP secret,
    # pending TOTP secret, and backup-code material are encrypted at rest.
    TOTP_ENCRYPTION_KEY: str = ""

    # Admin Credentials
    ADMIN_EMAIL: str = ""
    ADMIN_PASSWORD: str = ""
    BOOTSTRAP_SECRET: str = ""

    # Global URL bases — change once here (or via SSM)
    SITE_URL: str = "https://example.com"  # base link for site (share URLs, CORS)
    ALLOWED_ORIGINS: str = ""  # comma-separated extra origins (appended to derived SITE_URL variants)
    R2_PUBLIC_BASE_URL: str = ""  # img/CDN base; also IMG_BASE_URL (VITE_IMG_BASE_URL on frontend)
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""

    # SSM parameter names (only set in Lambda). Secret values are fetched at
    # init time with a single ssm:GetParameters(WithDecryption=True) call.
    JWT_SECRET_PARAM: str = ""
    ADMIN_EMAIL_PARAM: str = ""
    ADMIN_PASSWORD_PARAM: str = ""
    BOOTSTRAP_SECRET_PARAM: str = ""
    TOTP_ENCRYPTION_KEY_PARAM: str = ""
    R2_ACCOUNT_ID_PARAM: str = ""
    R2_ACCESS_KEY_ID_PARAM: str = ""
    R2_SECRET_ACCESS_KEY_PARAM: str = ""
    R2_BUCKET_NAME_PARAM: str = ""
    R2_PUBLIC_BASE_URL_PARAM: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )


# Maps each secret setting to its SSM parameter-name setting.
_SECRET_TO_PARAM = [
    ("JWT_SECRET", "JWT_SECRET_PARAM"),
    ("ADMIN_EMAIL", "ADMIN_EMAIL_PARAM"),
    ("ADMIN_PASSWORD", "ADMIN_PASSWORD_PARAM"),
    ("BOOTSTRAP_SECRET", "BOOTSTRAP_SECRET_PARAM"),
    ("TOTP_ENCRYPTION_KEY", "TOTP_ENCRYPTION_KEY_PARAM"),
    ("R2_ACCOUNT_ID", "R2_ACCOUNT_ID_PARAM"),
    ("R2_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID_PARAM"),
    ("R2_SECRET_ACCESS_KEY", "R2_SECRET_ACCESS_KEY_PARAM"),
    ("R2_BUCKET_NAME", "R2_BUCKET_NAME_PARAM"),
    ("R2_PUBLIC_BASE_URL", "R2_PUBLIC_BASE_URL_PARAM"),
]


def load_secrets_from_ssm(settings_obj) -> None:
    """Fetch /portfolio/* secrets from SSM in one call and cache them in memory.

    Values are written to both the settings object and os.environ so that
    consumers reading os.getenv (e.g. app.services.storage) stay in sync.
    Secrets are never logged or printed; missing parameters are reported by
    name only (metadata), never their decrypted values.
    """
    names = [
        getattr(settings_obj, param_field)
        for _, param_field in _SECRET_TO_PARAM
        if getattr(settings_obj, param_field)
    ]
    if not names:
        return  # local / .env development mode

    import boto3
    ssm = boto3.client("ssm", region_name=settings_obj.AWS_REGION or None)
    resp = ssm.get_parameters(Names=names, WithDecryption=True)

    values = {p["Name"]: p["Value"] for p in resp.get("Parameters", [])}
    missing = resp.get("InvalidParameters") or []
    if missing:
        raise RuntimeError(
            "Missing required SSM parameters (create them with scripts/init_ssm.sh): "
            + ", ".join(missing)
        )

    for secret_field, param_field in _SECRET_TO_PARAM:
        param_name = getattr(settings_obj, param_field)
        if not param_name:
            continue
        value = values.get(param_name, "")
        setattr(settings_obj, secret_field, value)
        os.environ[secret_field] = value


settings = Settings()
load_secrets_from_ssm(settings)
