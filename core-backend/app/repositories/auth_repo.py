import hashlib
import re
import secrets
from datetime import datetime, timedelta

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pyotp import TOTP, random_base32

from cryptography.fernet import Fernet

from app.db.dynamo import profile_table
from app.core.config import settings

CREDENTIALS_PK = "ADMIN#CREDENTIALS"
CREDENTIALS_SK = "METADATA"
ATTEMPTS_PK = "ADMIN#LOGIN_ATTEMPTS"
ATTEMPTS_SK = "COUNTER"

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

# Hash verified when credentials are missing so response timing stays uniform
DUMMY_PASSWORD_HASH = PasswordHasher().hash("dummy-password-for-timing-equality")

BACKUP_CODE_LENGTH = 8
BACKUP_CODE_COUNT = 10
_BACKUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
_TOTP_RE = re.compile(r"^\d{6}$")


class AuthRepo:
    def __init__(self):
        self.table = profile_table()
        self.ph = PasswordHasher()

    @staticmethod
    def _fernet() -> Fernet | None:
        key = settings.TOTP_ENCRYPTION_KEY
        return Fernet(key.encode()) if key else None

    @classmethod
    def _encrypt_secret(cls, value: str) -> tuple[str, bool]:
        """Return (value, encrypted_flag). Encrypts TOTP material at rest."""
        fernet = cls._fernet()
        if not fernet:
            return value, False
        return fernet.encrypt(value.encode()).decode(), True

    @classmethod
    def _decrypt_secret(cls, value: str, encrypted: bool) -> str:
        fernet = cls._fernet()
        if not encrypted or not fernet:
            return value
        return fernet.decrypt(value.encode()).decode()

    @staticmethod
    def _hash_backup_code(code: str) -> str:
        return hashlib.sha256(code.encode()).hexdigest()

    @classmethod
    def generate_backup_codes(cls, count: int = BACKUP_CODE_COUNT) -> list[str]:
        return [
            "".join(secrets.choice(_BACKUP_CODE_ALPHABET) for _ in range(BACKUP_CODE_LENGTH))
            for _ in range(count)
        ]

    async def get_credentials(self) -> dict | None:
        """Retrieve stored admin credentials (decrypting TOTP material)"""
        try:
            response = self.table.get_item(
                Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK}
            )
            item = response.get("Item")
            if item and "token_version" in item:
                item["token_version"] = int(item["token_version"])
            if item and "totp_secret" in item:
                item["totp_secret"] = self._decrypt_secret(
                    item["totp_secret"], item.get("totp_secret_enc", False)
                )
            if item and "pending_totp_secret" in item:
                item["pending_totp_secret"] = self._decrypt_secret(
                    item["pending_totp_secret"], item.get("pending_totp_secret_enc", False)
                )
            return item
        except Exception as e:
            print(f"Error getting credentials: {e}")
            return None

    async def init_credentials(self, email: str, password: str) -> dict:
        """Initialize credentials from environment variables (one-time setup)"""
        normalized_email = email.lower().strip()
        password_hash = self.ph.hash(password)
        totp_secret = random_base32()
        backup_codes = self.generate_backup_codes()
        now = datetime.now().isoformat()

        totp_secret_enc, totp_enc = self._encrypt_secret(totp_secret)

        item = {
            "PK": CREDENTIALS_PK,
            "SK": CREDENTIALS_SK,
            "email": normalized_email,
            "password_hash": password_hash,
            "totp_secret": totp_secret_enc,
            "totp_secret_enc": totp_enc,
            "token_version": 0,
            "backup_codes": [
                {"hash": self._hash_backup_code(code), "used": False}
                for code in backup_codes
            ],
            "created_at": now,
            "updated_at": now,
        }

        self.table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
        return {"email": normalized_email, "totp_secret": totp_secret, "backup_codes": backup_codes}

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
        return random_base32()

    def provisioning_uri(self, email: str, secret: str, issuer: str = "AdminCMS") -> str:
        return TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)

    async def set_pending_totp_secret(self, email: str, secret: str) -> None:
        """Store a pending TOTP secret awaiting confirmation (encrypted at rest)"""
        secret_enc, enc = self._encrypt_secret(secret)
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET pending_totp_secret = :secret, pending_totp_secret_enc = :enc, updated_at = :now",
            ExpressionAttributeValues={
                ":secret": secret_enc,
                ":enc": enc,
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def confirm_pending_totp_secret(self, email: str, secret: str) -> None:
        """Promote the pending TOTP secret to active (re-encrypted at rest)"""
        secret_enc, enc = self._encrypt_secret(secret)
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression=(
                "SET totp_secret = :secret, totp_secret_enc = :enc, "
                "pending_totp_secret = :blank, pending_totp_secret_enc = :blank_enc, "
                "updated_at = :now"
            ),
            ExpressionAttributeValues={
                ":secret": secret_enc,
                ":enc": enc,
                ":blank": "",
                ":blank_enc": False,
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def replace_backup_codes(self, email: str, codes: list[str]) -> None:
        """Replace the stored backup codes (used on regeneration)"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET backup_codes = :codes, updated_at = :now",
            ExpressionAttributeValues={
                ":codes": [
                    {"hash": self._hash_backup_code(code), "used": False}
                    for code in codes
                ],
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def consume_backup_code(self, code: str) -> bool:
        """Validate and single-use consume a backup code for MFA recovery"""
        creds = await self.get_credentials()
        if not creds or not creds.get("backup_codes"):
            return False

        code_hash = self._hash_backup_code(code)
        codes = creds["backup_codes"]
        consumed = False
        for entry in codes:
            if entry.get("hash") == code_hash and not entry.get("used", False):
                entry["used"] = True
                consumed = True
                break
        if not consumed:
            return False

        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET backup_codes = :codes, updated_at = :now",
            ExpressionAttributeValues={
                ":codes": codes,
                ":now": datetime.now().isoformat(),
            },
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )
        return True

    async def revoke_tokens(self, email: str) -> None:
        """Increment token version, invalidating all issued refresh tokens"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="ADD token_version :one",
            ExpressionAttributeValues={":one": 1},
            ConditionExpression="attribute_exists(PK) AND attribute_exists(SK)",
        )

    async def set_last_refresh_jti(self, email: str, jti: str) -> None:
        """Persist the most recently issued refresh token id for reuse detection"""
        self.table.update_item(
            Key={"PK": CREDENTIALS_PK, "SK": CREDENTIALS_SK},
            UpdateExpression="SET last_refresh_jti = :jti, updated_at = :now",
            ExpressionAttributeValues={
                ":jti": jti,
                ":now": datetime.now().isoformat(),
            },
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
