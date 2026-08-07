import pytest
from unittest.mock import AsyncMock
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core import security
from app.main import app


def test_create_tokens_have_expected_type():
    access = security.create_access_token({"sub": "a@x"})
    refresh = security.create_refresh_token({"sub": "a@x", "ver": 1})
    preauth = security.create_preauth_token({"sub": "a@x"})

    assert security.verify_token(access, "access")["sub"] == "a@x"
    assert security.verify_token(refresh, "refresh")["ver"] == 1
    assert security.verify_token(preauth, "preauth")["sub"] == "a@x"


def test_verify_token_wrong_type():
    access = security.create_access_token({"sub": "u@x"})
    with pytest.raises(HTTPException) as exc:
        security.verify_token(access, "refresh")
    assert exc.value.status_code == 401


def test_verify_token_invalid():
    with pytest.raises(HTTPException) as exc:
        security.verify_token("garbage.token.value", "access")
    assert exc.value.status_code == 401


def test_get_current_email(client, mocker):
    mocker.patch("app.api.admin.auth.AuthRepo.get_credentials", new_callable=lambda: AsyncMock(return_value={"email": "me@x.com"}))
    access = security.create_access_token({"sub": "me@x.com"})
    client.cookies.set("access_token", access)
    resp = client.get("/admin/auth")
    assert resp.status_code == 200


def test_get_current_email_missing_token(client):
    resp = client.get("/admin/auth")
    assert resp.status_code == 401


def test_get_current_email_invalid_token(client):
    client.cookies.set("access_token", "junk")
    resp = client.get("/admin/auth")
    assert resp.status_code == 401


def test_get_current_email_no_sub():
    tok = security.create_access_token({})
    from starlette.requests import Request
    headers = [(b"cookie", b"access_token=" + tok.encode())]
    scope = {"type": "http", "headers": headers}
    req = Request(scope)
    with pytest.raises(HTTPException) as exc:
        security.get_current_email(req)
    assert exc.value.status_code == 401


def test_missing_jwt_secret_raises(monkeypatch):
    from app.core import config
    assert security._jwt_secret()
    monkeypatch.setattr(config.settings, "JWT_SECRET", "")
    with pytest.raises(RuntimeError):
        security._jwt_secret()