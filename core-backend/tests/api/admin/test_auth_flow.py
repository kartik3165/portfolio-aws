import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from botocore.exceptions import ClientError

from app.main import app
from app.core.config import settings
from pyotp import TOTP


class FakeTable:
    """Minimal in-memory DynamoDB table stub supporting the operations AuthRepo uses."""

    def __init__(self):
        self.items = {}

    def get_item(self, Key):
        return {"Item": self.items.get((Key["PK"], Key["SK"]))}

    def put_item(self, Item, ConditionExpression=None):
        key = (Item["PK"], Item["SK"])
        if ConditionExpression and key in self.items:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "PutItem")
        self.items[key] = Item

    def update_item(self, Key, UpdateExpression=None, ExpressionAttributeValues=None,
                    ExpressionAttributeNames=None, ReturnValues=None, ConditionExpression=None):
        key = (Key["PK"], Key["SK"])
        if ConditionExpression and key not in self.items:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "UpdateItem")
        item = self.items.setdefault(key, {**Key})
        if UpdateExpression:
            if "ADD" in UpdateExpression:
                field = UpdateExpression.split("ADD ")[1].split(" ")[0]
                item[field] = item.get(field, 0) + ExpressionAttributeValues[":one"]
            if "SET" in UpdateExpression:
                for part in UpdateExpression.split("SET ")[1].split(","):
                    field, _, value_ref = part.strip().partition("=")
                    value_ref = value_ref.strip()
                    if value_ref == "pending_totp_secret":
                        item[field.strip()] = item["pending_totp_secret"]
                    else:
                        item[field.strip()] = ExpressionAttributeValues.get(value_ref, "")
        if ReturnValues == "ALL_NEW":
            return {"Attributes": item}
        return {}

    def delete_item(self, Key, ConditionExpression=None):
        self.items.pop((Key["PK"], Key["SK"]), None)


@pytest.fixture
def fake_table():
    table = FakeTable()
    with patch("app.repositories.auth_repo.profile_table", return_value=table):
        yield table


@pytest.fixture
def client():
    return TestClient(app)


ADMIN_EMAIL = "admin@kanbs.me"
ADMIN_PASSWORD = "StrongPassword123!"
BOOTSTRAP = settings.BOOTSTRAP_SECRET or "bootstrap-secret"


@pytest.fixture
def initialized(fake_table, client):
    response = client.post(
        "/admin/auth/init",
        headers={"x-bootstrap-secret": BOOTSTRAP},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _valid_totp_code(secret: str) -> str:
    return TOTP(secret).now()


@pytest.fixture
def logged_in(initialized):
    """A client fully authenticated through password + TOTP login."""
    client = TestClient(app)
    secret = initialized["totp_secret"]
    preauth = client.post(
        "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert preauth.status_code == 200, preauth.text
    resp = client.post(
        "/admin/login/totp",
        json={"preauth_token": preauth.json()["preauth_token"], "totp_code": _valid_totp_code(secret)},
    )
    assert resp.status_code == 200, resp.text
    # secure cookies are not re-sent over the http test transport; pass header explicitly
    cookie_header = "; ".join(
        f"{name}={resp.cookies[name]}"
        for name in ("access_token", "refresh_token")
        if name in resp.cookies
    )
    client.headers.update({"Cookie": cookie_header})
    return client


class TestInit:
    def test_init_requires_bootstrap_secret(self, fake_table, client):
        assert client.post("/admin/auth/init").status_code == 422

    def test_init_rejects_wrong_bootstrap_secret(self, fake_table, client):
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": "wrong"})
        assert resp.status_code == 401

    def test_init_success_returns_secret_once(self, fake_table, client):
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": BOOTSTRAP})
        assert resp.status_code == 200
        body = resp.json()
        assert body["totp_secret"]
        assert body["email"] == "admin@kanbs.me"

    def test_init_rejects_second_call(self, initialized, client):
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": BOOTSTRAP})
        assert resp.status_code == 409

    def test_init_requires_env_admin_credentials(self, fake_table, client, monkeypatch):
        monkeypatch.setattr(settings, "ADMIN_EMAIL", "")
        monkeypatch.setattr(settings, "ADMIN_PASSWORD", "")
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": BOOTSTRAP})
        assert resp.status_code == 500


class TestLoginFlow:
    def test_login_wrong_password(self, initialized, client):
        resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"})
        assert resp.status_code == 401

    def test_login_wrong_email(self, initialized, client):
        resp = client.post("/admin/login", json={"email": "other@kanbs.me", "password": ADMIN_PASSWORD})
        assert resp.status_code == 401

    def test_login_before_init(self, fake_table, client):
        resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 401

    def test_login_success_returns_preauth_but_no_secret(self, initialized, client):
        resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        body = resp.json()
        assert body["preauth_token"]
        assert "totp_secret" not in body

    def test_full_login_sets_cookies(self, initialized, client):
        secret = initialized["totp_secret"]
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]

        resp = client.post(
            "/admin/login/totp",
            json={"preauth_token": preauth, "totp_code": _valid_totp_code(secret)},
        )
        assert resp.status_code == 200
        assert "access_token" in resp.cookies
        assert "refresh_token" in resp.cookies

    def test_totp_step_rejects_wrong_code(self, initialized, client):
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]
        resp = client.post(
            "/admin/login/totp", json={"preauth_token": preauth, "totp_code": "000000"}
        )
        assert resp.status_code == 401

    def test_totp_step_rejects_invalid_preauth(self, initialized, client):
        resp = client.post(
            "/admin/login/totp", json={"preauth_token": "bogus", "totp_code": "123456"}
        )
        assert resp.status_code == 401


class TestSession:
    def test_auth_endpoint_requires_cookie(self, initialized, client):
        assert client.get("/admin/auth").status_code == 401

    def test_auth_endpoint_with_cookie(self, logged_in):
        resp = logged_in.get("/admin/auth")
        assert resp.status_code == 200
        assert resp.json()["email"] == ADMIN_EMAIL

    def test_refresh_rotates_tokens(self, logged_in):
        old_refresh = logged_in.cookies.get("refresh_token")
        resp = logged_in.post("/admin/refresh")
        assert resp.status_code == 200
        assert "access_token" in resp.cookies
        assert "refresh_token" in resp.cookies
        assert resp.cookies["refresh_token"] != old_refresh

    def test_refresh_requires_cookie(self, client):
        assert client.post("/admin/refresh").status_code == 401

    def test_logout_revokes_refresh_token(self, logged_in):
        assert logged_in.post("/admin/logout").status_code == 200
        resp = logged_in.post("/admin/refresh")
        assert resp.status_code == 401

    def test_logout_without_cookie(self, client):
        assert client.post("/admin/logout").status_code == 200


class TestLockout:
    def test_lockout_after_repeated_failures(self, initialized, client):
        for _ in range(5):
            resp = client.post(
                "/admin/login", json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"}
            )
            assert resp.status_code == 401
        resp = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert resp.status_code == 429


class TestTOTPRotate:
    def test_rotate_requires_auth(self, initialized, client):
        resp = client.post("/admin/auth/totp/rotate", json={"totp_code": "123456"})
        assert resp.status_code == 401

    def test_rotate_rejects_wrong_code(self, logged_in):
        resp = logged_in.post("/admin/auth/totp/rotate", json={"totp_code": "000000"})
        assert resp.status_code == 401

    def test_rotate_success(self, logged_in, initialized):
        secret = initialized["totp_secret"]
        resp = logged_in.post(
            "/admin/auth/totp/rotate", json={"totp_code": _valid_totp_code(secret)}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["totp_secret"]
        assert "otpauth_uri" in body

    def test_confirm_requires_pending(self, logged_in):
        resp = logged_in.post(
            "/admin/auth/totp/confirm", json={"totp_code": "123456"}
        )
        assert resp.status_code == 400

    def test_confirm_rejects_wrong_code(self, logged_in, initialized):
        secret = initialized["totp_secret"]
        logged_in.post("/admin/auth/totp/rotate", json={"totp_code": _valid_totp_code(secret)})
        resp = logged_in.post("/admin/auth/totp/confirm", json={"totp_code": "000000"})
        assert resp.status_code == 401

    def test_confirm_success(self, logged_in, initialized):
        secret = initialized["totp_secret"]
        new_secret = logged_in.post(
            "/admin/auth/totp/rotate", json={"totp_code": _valid_totp_code(secret)}
        ).json()["totp_secret"]
        resp = logged_in.post(
            "/admin/auth/totp/confirm", json={"totp_code": _valid_totp_code(new_secret)}
        )
        assert resp.status_code == 200
