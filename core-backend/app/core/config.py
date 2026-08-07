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

    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "portfolio-api"
    JWT_AUDIENCE: str = "portfolio-admin"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15 # 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7 # 7 days

    # Optional Fernet key (32-byte urlsafe-base64). When set, the TOTP secret,
    # pending TOTP secret, and backup-code material are encrypted at rest.
    TOTP_ENCRYPTION_KEY: str = ""

    # Admin Credentials
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    BOOTSTRAP_SECRET: str = ""

    # R2
    R2_ACCOUNT_ID: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_BUCKET_NAME: str
    R2_PUBLIC_BASE_URL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

settings = Settings()
