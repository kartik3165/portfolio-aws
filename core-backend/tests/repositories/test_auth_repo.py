import asyncio

from unittest.mock import MagicMock, patch, AsyncMock
import pytest

from botocore.exceptions import ClientError

from app.core.config import settings
from app.repositories.auth_repo import AuthRepo, BACKUP_CODE_LENGTH


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


class TestAuthRepo:
    def test_get_credentials(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.return_value = {"Item": {"email": "a@x", "token_version": "2"}}
        repo = AuthRepo()
        repo.table = table
        creds = run(repo.get_credentials())
        assert creds["token_version"] == 2

    def test_get_credentials_no_token_version(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.return_value = {"Item": {"email": "a@x"}}
        repo = AuthRepo()
        repo.table = table
        creds = run(repo.get_credentials())
        assert creds["email"] == "a@x"

    def test_get_credentials_error_returns_none(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.side_effect = _client_error("SomeError")
        repo = AuthRepo()
        repo.table = table
        assert run(repo.get_credentials()) is None

    def test_init_credentials(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        result = run(repo.init_credentials("ADMIN@X.COM", "password123"))
        assert result["email"] == "admin@x.com"
        assert result["totp_secret"]
        table.put_item.assert_called_once()

    def test_verify_password_ok(self):
        from app.repositories.auth_repo import AuthRepo
        repo = AuthRepo()
        h = repo.ph.hash("secret")
        assert repo.verify_password(h, "secret") is True

    def test_verify_password_bad(self):
        from app.repositories.auth_repo import AuthRepo
        repo = AuthRepo()
        h = repo.ph.hash("secret")
        assert repo.verify_password(h, "wrong") is False

    def test_verify_totp_empty(self):
        from app.repositories.auth_repo import AuthRepo
        repo = AuthRepo()
        assert repo.verify_totp("", "") is False
        assert repo.verify_totp("SECRET", "") is False

    def test_generate_totp_secret(self):
        from app.repositories.auth_repo import AuthRepo
        repo = AuthRepo()
        secret = repo.generate_totp_secret()
        assert len(secret) > 0

    def test_provisioning_uri(self):
        from app.repositories.auth_repo import AuthRepo
        repo = AuthRepo()
        uri = repo.provisioning_uri("a@x", repo.generate_totp_secret(), "Issuer")
        assert "otpauth://" in uri

    def test_set_pending_totp_secret(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        run(repo.set_pending_totp_secret("a@x", "SECRET"))
        table.update_item.assert_called_once()

    def test_confirm_pending_totp_secret(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        run(repo.confirm_pending_totp_secret("a@x", "SECRET"))
        table.update_item.assert_called_once()

    def test_revoke_tokens(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        run(repo.revoke_tokens("a@x"))
        table.update_item.assert_called_once()

    def test_is_locked_out(self):
        from app.repositories.auth_repo import AuthRepo
        from datetime import datetime, timedelta
        table = MagicMock()
        table.get_item.return_value = {
            "Item": {"locked_until": (datetime.now() + timedelta(minutes=5)).isoformat()}
        }
        repo = AuthRepo()
        repo.table = table
        assert run(repo.is_locked_out()) is True

    def test_is_locked_out_false(self):
        from app.repositories.auth_repo import AuthRepo
        from datetime import datetime, timedelta
        table = MagicMock()
        table.get_item.return_value = {
            "Item": {"locked_until": (datetime.now() - timedelta(minutes=5)).isoformat()}
        }
        repo = AuthRepo()
        repo.table = table
        assert run(repo.is_locked_out()) is False

    def test_is_locked_out_no_item(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.return_value = {}
        repo = AuthRepo()
        repo.table = table
        assert run(repo.is_locked_out()) is False

    def test_is_locked_out_no_locked_until(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.return_value = {"Item": {"fail_count": 1}}
        repo = AuthRepo()
        repo.table = table
        assert run(repo.is_locked_out()) is False

    def test_is_locked_out_error(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.side_effect = _client_error("SomeError")
        repo = AuthRepo()
        repo.table = table
        assert run(repo.is_locked_out()) is False

    def test_retry_after_seconds_locked(self):
        from app.repositories.auth_repo import AuthRepo
        from datetime import datetime, timedelta
        table = MagicMock()
        table.get_item.return_value = {
            "Item": {"locked_until": (datetime.now() + timedelta(minutes=2)).isoformat()}
        }
        repo = AuthRepo()
        repo.table = table
        assert run(repo.retry_after_seconds()) > 0

    def test_retry_after_seconds_no_item(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.return_value = {}
        repo = AuthRepo()
        repo.table = table
        assert run(repo.retry_after_seconds()) == 0

    def test_retry_after_seconds_error(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.get_item.side_effect = _client_error("SomeError")
        repo = AuthRepo()
        repo.table = table
        assert run(repo.retry_after_seconds()) == 15 * 60

    def test_record_failed_attempt_below_threshold(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.update_item.return_value = {"Attributes": {"fail_count": 2}}
        repo = AuthRepo()
        repo.table = table
        run(repo.record_failed_attempt())

    def test_record_failed_attempt_locks(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.update_item.return_value = {"Attributes": {"fail_count": 5}}
        repo = AuthRepo()
        repo.table = table
        run(repo.record_failed_attempt())
        # second update sets locked_until
        assert table.update_item.call_count == 2

    def test_record_failed_attempt_creates_attribute(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.update_item.return_value = {"Attributes": None}
        repo = AuthRepo()
        repo.table = table
        run(repo.record_failed_attempt())

    def test_record_failed_attempt_error(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.update_item.side_effect = _client_error("SomeError")
        repo = AuthRepo()
        repo.table = table
        run(repo.record_failed_attempt())

    def test_clear_failed_attempts(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.delete_item.return_value = {}
        repo = AuthRepo()
        repo.table = table
        run(repo.clear_failed_attempts())
        table.delete_item.assert_called_once()

    def test_clear_failed_attempts_error(self):
        from app.repositories.auth_repo import AuthRepo
        table = MagicMock()
        table.delete_item.side_effect = _client_error("SomeError")
        repo = AuthRepo()
        repo.table = table
        run(repo.clear_failed_attempts())


class TestTOTPEncryption:
    def test_encrypt_decrypt_with_key(self, monkeypatch):
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "TOTP_ENCRYPTION_KEY", key)
        enc, flag = AuthRepo._encrypt_secret("HELLOSECRET")
        assert flag is True
        assert enc != "HELLOSECRET"
        assert AuthRepo._decrypt_secret(enc, True) == "HELLOSECRET"

    def test_encrypt_without_key_passthrough(self, monkeypatch):
        monkeypatch.setattr(settings, "TOTP_ENCRYPTION_KEY", "")
        enc, flag = AuthRepo._encrypt_secret("HELLO")
        assert flag is False
        assert enc == "HELLO"
        assert AuthRepo._decrypt_secret("HELLO", False) == "HELLO"

    def test_init_credentials_encrypts_at_rest(self, monkeypatch):
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "TOTP_ENCRYPTION_KEY", key)
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        result = run(repo.init_credentials("A@X.COM", "password123"))
        item = table.put_item.call_args.kwargs["Item"]
        assert item["totp_secret_enc"] is True
        assert item["totp_secret"] != result["totp_secret"]
        assert len(result["backup_codes"]) > 0
        assert len(item["backup_codes"]) == len(result["backup_codes"])

    def test_get_credentials_decrypts_pending(self, monkeypatch):
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "TOTP_ENCRYPTION_KEY", key)
        enc, _ = AuthRepo._encrypt_secret("PLAINSECRET")
        table = MagicMock()
        table.get_item.return_value = {
            "Item": {
                "email": "a@x",
                "totp_secret": enc,
                "totp_secret_enc": True,
                "pending_totp_secret": enc,
                "pending_totp_secret_enc": True,
            }
        }
        repo = AuthRepo()
        repo.table = table
        creds = run(repo.get_credentials())
        assert creds["totp_secret"] == "PLAINSECRET"
        assert creds["pending_totp_secret"] == "PLAINSECRET"

    def test_confirm_pending_encrypts_with_key(self, monkeypatch):
        from cryptography.fernet import Fernet
        key = Fernet.generate_key().decode()
        monkeypatch.setattr(settings, "TOTP_ENCRYPTION_KEY", key)
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        run(repo.confirm_pending_totp_secret("a@x", "SECRET"))
        values = table.update_item.call_args.kwargs["ExpressionAttributeValues"]
        assert values[":enc"] is True
        assert values[":secret"] != "SECRET"


class TestBackupCodes:
    def test_generate_backup_codes(self):
        codes = AuthRepo.generate_backup_codes(count=3)
        assert len(codes) == 3
        assert all(len(c) == BACKUP_CODE_LENGTH for c in codes)
        assert len(set(codes)) == 3

    def test_hash_backup_code(self):
        h = AuthRepo._hash_backup_code("ABC23456")
        assert AuthRepo._hash_backup_code("ABC23456") == h
        assert AuthRepo._hash_backup_code("ABC23457") != h

    def test_replace_backup_codes(self):
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        run(repo.replace_backup_codes("a@x", ["ABC23456"]))
        table.update_item.assert_called_once()

    def test_consume_backup_code_success(self):
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        code = "ABC23456"
        h = AuthRepo._hash_backup_code(code)
        table.get_item.return_value = {
            "Item": {"backup_codes": [{"hash": h, "used": False}]}
        }
        assert run(repo.consume_backup_code(code)) is True
        stored = table.update_item.call_args.kwargs["ExpressionAttributeValues"][":codes"]
        assert stored[0]["used"] is True

    def test_consume_backup_code_wrong_code(self):
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        table.get_item.return_value = {
            "Item": {"backup_codes": [{"hash": "nope", "used": False}]}
        }
        assert run(repo.consume_backup_code("ABC23456")) is False

    def test_consume_backup_code_already_used(self):
        table = MagicMock()
        repo = AuthRepo()
        repo.table = table
        code = "ABC23456"
        h = AuthRepo._hash_backup_code(code)
        table.get_item.return_value = {
            "Item": {"backup_codes": [{"hash": h, "used": True}]}
        }
        assert run(repo.consume_backup_code(code)) is False

    def test_consume_backup_code_no_creds(self):
        table = MagicMock()
        table.get_item.return_value = {}
        repo = AuthRepo()
        repo.table = table
        assert run(repo.consume_backup_code("ABC23456")) is False

    def test_consume_backup_code_no_codes(self):
        table = MagicMock()
        table.get_item.return_value = {"Item": {"email": "a@x"}}
        repo = AuthRepo()
        repo.table = table
        assert run(repo.consume_backup_code("ABC23456")) is False