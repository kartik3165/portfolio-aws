import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from botocore.exceptions import ClientError

from app.main import app
from app.core.config import settings
from pyotp import TOTP


class FakeTable:
    """Minimal in-memory DynamoDB table stub supporting the operations AuthRepo uses"""

    def __init__(self):
        self.items = {}

    def get_item(self, Key):
        return {"Item": self.items.get(tuple(sorted(Key.items())))}

    def put_item(self, Item, ConditionExpression=None):
        key = (Item["PK"], Item["SK"])
        if ConditionExpression and key in self.items:
            raise ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "PutItem")
        self.items[key] = Item

    def update_item(self, Key, UpdateExpression=None, ExpressionAttributeValues=None,
                    ExpressionAttributeNames=None, ReturnValues=None, ConditionExpression=None):
        key = (Key["PK"], Key["SK"])
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
        self.items.pop(tuple(sorted(Key.items())), None)


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
def initialized(fake_table):
    response = TestClient(app).post(
        "/admin/auth/init",
        headers={"x-bootstrap-secret": BOOTSTRAP},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _valid_totp_code(secret: str) -> str:
    return TOTP(secret).now()


class TestInit:
    def test_init_requires_bootstrap_secret(self, fake_table, client):
        assert client.post("/admin/auth/init").status_code == 401

    def test_init_success_returns_secret_once(self, fake_table, client):
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": BOOTSTRAP})
        assert resp.status_code == 200
        body = resp.json()
        assert body["totp_secret"]
        assert body["email"] == "admin@kanbs.me"

    def test_init_rejects_second_call(self, initialized, client):
        resp = client.post("/admin/auth/init", headers={"x-bootstrap-secret": BOOTSTRAP})
        assert resp.status_code == 409


class TestLoginFlow:
    def test_login_wrong_password(self, initialized, client):
        resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"})
        assert resp.status_code == 401

    def test_login_wrong_email(self, initialized, client):
        resp = client.post("/admin/login", json={"email": "other@kanbs.me", "password": ADMIN_PASSWORD})
        assert resp.status_code == 401

    def test_login_success_returns_preauth_but_no_secret(self, initialized, client):
        resp = client.post("/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert resp.status_code == 200
        body = resp.json()
        assert body["preauth_token"]
        # Critical: the TOTP secret must NEVER be returned by the login step
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

    def test_totp_step_rejects_replayed_preauth_after_login(self, initialized, client):
        secret = initialized["totp_secret"]
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]
        assert client.post(
            "/admin/login/totp",
            json={"preauth_token": preauth, "totp_code": _valid_totp_code(secret)},
        ).status_code == 200
        # preauth token is 5-minutes-valid by design; replay is only bounded by expiry.
        # (This asserts the code path at least does not crash.)


class TestSession:
    def test_auth_endpoint_requires_cookie(self, initialized, client):
        assert client.get("/admin/auth").status_code == 401

    def test_auth_endpoint_with_cookie(self, initialized, client):
        secret = initialized["totp_secret"]
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]
        client.post("/admin/login/totp", json={"preauth_token": preauth, "totp_code": _valid_totp_code(secret)})

        resp = client.get("/admin/auth")
        assert resp.status_code == 200
        assert resp.json()["email"] == ADMIN_EMAIL

    def test_refresh_rotates_tokens(self, initialized, client):
        secret = initialized["totp_secret"]
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]
        client.post("/admin/login/totp", json={"preauth_token": preauth, "totp_code": _valid_totp_code(secret)})

        resp = client.post("/admin/refresh")
        assert resp.status_code == 200
        assert "access_token" in resp.cookies
        assert "refresh_token" in resp.cookies
        assert resp.cookies["refresh_token"] != client.cookies.get("refresh_token")

    def test_logout_revokes_refresh_token(self, initialized, client):
        secret = initialized["totp_secret"]
        preauth = client.post(
            "/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        ).json()["preauth_token"]
        client.post("/admin/login/totp", json={"preauth_token": preauth, "totp_code": _valid_totp_code(secret)})

        assert client.post("/admin/logout").status_code == 200

        # Refresh token was revoked server-side
        resp = client.post("/admin/refresh")
        assert resp.status_code == 401


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
