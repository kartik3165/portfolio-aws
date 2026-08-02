from datetime import datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pyotp import TOTP, random_base32

from app.db.dynamo import profile_table

CREDENTIALS_PK = "ADMIN#CREDENTIALS"
CREDENTIALS_SK = "METADATA"
ATTEMPTS_PK = "ADMIN#LOGIN_ATTEMPTS"
ATTEMPTS_SK = "COUNTER"

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Hash verified when credentials are missing so response timing stays uniform
DUMMY_PASSWORD_HASH = PasswordHasher().hash("dummy-password-for-timing-equality")


class AuthRepo:
    def __init__(self):
        self.table = profile_table()
        self.ph = PasswordHasher()

    async def get_credentials(self) -> dict | None:
        """Retrieve stored admin credentials"""
        try:
            response = self.table.get_item(
                Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK}
            )
            item = response.get("Item")
            if item and "token_version" in item:
                item["token_version"] = int(item["token_version"])
            return item
        except Exception as e:
            print(f"Error getting credentials: {e}")
            return None

    async def init_credentials(self, email: str, password: str) -> dict:
        """Initialize credentials from environment variables (one-time setup)"""
        normalized_email = email.lower().strip()
        password_hash = self.ph.hash(password)
        totp_secret = random_base32()
        now = datetime.now().isoformat()

        item = {
            "PK": CREDENTIALS_PK,
            "SK": CREDENTIALS_SK,
            "email": normalized_email,
            "password_hash": password_hash,
            "totp_secret": totp_secret,
            "token_version": 0,
            "created_at": now,
            "updated_at": now,
        }

        self.table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
        return {"email": normalized_email, "totp_secret": totp_secret}

    def verify_password(self, password_hash: str, password: str) -> bool:
        """Verify a password against a stored Argon2 hash (sync, CPU-bound)"""
        try:
            self.ph.verify(password_hash, password)
            return True
        except VerifyMismatchError:
            return False

    def verify_totp(self, secret: str, code: str, valid_window: int = 1) -> bool:
        """Verify a TOTP code, tolerating +/- valid_window time steps"""
        if not secret or not code:
            return False
        return TOTP(secret).verify(code, valid_window=valid_window)

    def generate_totp_secret(self) -> str:
        """Generate a new TOTP secret"""
        return TOTP.random_base32()

    def provisioning_uri(self, email: str, secret: str, issuer: str = "AdminCMS") -> str:
        return TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

    async def set_pending_totp_secret(self, email: str, secret: str) -> None:
        """Store a pending TOTP secret awaiting confirmation"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET pending_totp_secret = :secret, updated_at = :now",
            ExpressionAttributeValues={
                ":secret": secret,
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def confirm_pending_totp_secret(self, email: str) -> None:
        """Promote the pending TOTP secret to active"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET totp_secret = pending_totp_secret, pending_totp_secret = :blank, updated_at = :now",
            ExpressionAttributeValues={
                ":blank": "",
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def revoke_tokens(self, email: str) -> None:
        """Increment token version, invalidating all issued refresh tokens"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="ADD token_version :one",
            ExpressionAttributeValues={":one": 1},
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    # --- Login attempt lockout ---

    async def is_locked_out(self) -> bool:
        try:
            response = self.table.get_item(
                Key={"PK": ATTEMPTS_PK, "SK": ATTEMPTS_SK}
            )
            item = response.get("Item")
        except Exception as e:
            print(f"Error reading login attempts: {e}")
            return False
        if not item:
            return False
        locked_until = item.get("locked_until")
        if not locked_until:
            return False
        return datetime.fromisoformat(locked_until) > datetime.now()

    async def retry_after_seconds(self) -> int:
        try:
            response = self.table.get_item(
                Key={"PK": ATTEMPTS_PK, "SK": ATTEMPTS_SK}
            )
            item = response.get("Item") or {}
        except Exception:
            return LOCKOUT_MINUTES * 60
        locked_until = item.get("locked_until")
        if not locked_until:
            return 0
        remaining = datetime.fromisoformat(locked_until) - datetime.now()
        return max(0, int(remaining.total_seconds()))

    async def record_failed_attempt(self) -> None:
        """Increment failure counter; lock the account after MAX_FAILED_ATTEMPTS"""
        now = datetime.now()
        try:
            response = self.table.update_item(
                Key={"PK": ATTEMPTS_PK, "SK": ATTEMPTS_SK},
                UpdateExpression=(
                    "ADD fail_count :one "
                    "SET updated_at = :now"
                ),
                ExpressionAttributeValues={
                    ":one": 1,
                    ":now": now.isoformat(),
                },
                ReturnValues="ALL_NEW",
            )
        except Exception as e:
            print(f"Error recording failed attempt: {e}")
            return

        fail_count = (response.get("Attributes") or {}).get("fail_count", 1)
        if fail_count >= MAX_FAILED_ATTEMPTS:
            locked_until = now + timedelta(minutes=LOCKOUT_MINUTES)
            self.table.update_item(
                Key={"PK": ATTEMPTS_PK, "SK": ATTEMPTS_SK},
                UpdateExpression="SET locked_until = :until",
                ExpressionAttributeValues={":until": locked_until.isoformat()},
            )

    async def clear_failed_attempts(self) -> None:
        try:
            self.table.delete_item(Key={"PK": ATTEMPTS_PK, "SK": ATTEMPTS_SK})
        except Exception as e:
            print(f"Error clearing login attempts: {e}")
