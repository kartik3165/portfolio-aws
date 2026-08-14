import os
from unittest.mock import MagicMock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.rate_limit import RateLimitMiddleware, _client_ip, _rule_for
from app.repositories.rate_limit_repo import RateLimitStore


def make_scope(**overrides):
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/admin/login",
        "client": ("203.0.113.9", 1234),
    }
    scope.update(overrides)
    return scope


class StubStore:
    def __init__(self, enabled=True, count=0):
        self._enabled = enabled
        self.count = count
        self.calls = []

    @property
    def enabled(self):
        return self._enabled

    def increment(self, ip, rule_id, window_seconds):
        self.calls.append((ip, rule_id, window_seconds))
        self.count += 1
        return self.count


def test_client_ip_from_aws_event_httpapi():
    scope = make_scope(
        **{
            "aws.event": {
                "requestContext": {
                    "http": {"method": "POST", "path": "/admin/login", "sourceIp": "198.51.100.7"}
                }
            }
        }
    )
    assert _client_ip(scope) == "198.51.100.7"


def test_client_ip_falls_back_to_scope_client():
    assert _client_ip(make_scope()) == "203.0.113.9"


def test_client_ip_unknown_when_missing():
    assert _client_ip(make_scope(client=None)) == "unknown"


def test_rule_for_most_specific_prefix_wins():
    _prefix, limit, window = _rule_for("/admin/login/totp")
    assert (limit, window) == (10, 60)
    _prefix, limit, window = _rule_for("/admin/login")
    assert (limit, window) == (10, 60)
    assert _rule_for("/admin/login/totp")[0] == "/admin/login/totp"


def test_rule_for_comment_and_no_rule_returns_none():
    assert _rule_for("/public/comment/abc") == ("/public/comment/", 30, 600)
    assert _rule_for("/public/blogs") is None


def test_store_increment_builds_window_key_and_ttl():
    table = MagicMock()
    table.update_item.return_value = {"Attributes": {"requests": 4}}
    store = RateLimitStore(table_name="RateLimitsTable")
    store._table = MagicMock(return_value=table)

    count = store.increment("203.0.113.9", "/admin/login", 60)

    assert count == 4
    call = table.update_item.call_args.kwargs
    assert call["Key"]["PK"] == "RATE#203.0.113.9"
    window_start = int(call["Key"]["SK"].split("#")[-1])
    assert call["Key"]["SK"].startswith("/admin/login#")
    assert call["UpdateExpression"] == "ADD requests :one SET expires_at = :expires"
    assert call["ExpressionAttributeValues"][":one"] == 1
    assert call["ExpressionAttributeValues"][":expires"] == window_start + 60
    assert call["ReturnValues"] == "ALL_NEW"


def test_store_enabled_via_env_var():
    with patch.dict(os.environ, {"RATE_LIMIT_TABLE": "RateLimitsTable"}, clear=False):
        store = RateLimitStore()
        assert store.enabled is True
        assert store.table_name == "RateLimitsTable"


def test_store_table_resolves_through_dynamo():
    ddb = MagicMock()
    ddb.Table.return_value = "tbl"
    with patch("app.repositories.rate_limit_repo.get_dynamodb", return_value=ddb):
        store = RateLimitStore(table_name="RateLimitsTable")
        assert store._table() == "tbl"
        ddb.Table.assert_called_once_with("RateLimitsTable")


def test_store_disabled_when_no_table():
    assert RateLimitStore(table_name="").enabled is False
    assert RateLimitStore(table_name="RateLimitsTable").enabled is True


def test_middleware_passes_through_under_limit():
    store = StubStore()
    app = FastAPI()

    @app.post("/admin/login")
    async def login():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    resp = client.post("/admin/login")
    assert resp.status_code == 200
    assert store.calls and store.calls[0][1] == "/admin/login"


def test_middleware_429_after_limit():
    store = StubStore(count=10)
    app = FastAPI()

    @app.post("/admin/login")
    async def login():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    resp = client.post("/admin/login")
    assert resp.status_code == 429
    assert "Retry-After" in resp.headers


def test_middleware_get_on_comment_list_does_not_write():
    store = StubStore()
    app = FastAPI()

    @app.get("/public/comment/abc")
    async def comments():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.get("/public/comment/abc").status_code == 200
    assert store.calls == []


def test_middleware_post_comment_writes():
    store = StubStore()
    app = FastAPI()

    @app.post("/public/comment/abc")
    async def create_comment():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.post("/public/comment/abc").status_code == 200
    assert store.calls and store.calls[0][1] == "/public/comment/"


def test_middleware_non_rule_post_does_not_write():
    store = StubStore()
    app = FastAPI()

    @app.post("/public/blogs")
    async def blogs():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.post("/public/blogs").status_code == 200
    assert store.calls == []


def test_middleware_disabled_store_passthrough():
    store = StubStore(enabled=False)
    app = FastAPI()

    @app.get("/public/blogs")
    async def blogs():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.get("/public/blogs").status_code == 200
    assert store.calls == []


def test_middleware_options_preflight_not_limited():
    store = StubStore()
    app = FastAPI()

    @app.options("/admin/login")
    async def preflight():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.options("/admin/login").status_code == 200
    assert store.calls == []


def test_middleware_fails_open_on_store_error():
    store = StubStore()

    def boom(*args, **kwargs):
        raise RuntimeError("dynamo down")

    store.increment = boom
    app = FastAPI()

    @app.post("/admin/login")
    async def login():
        return {"ok": True}

    app.add_middleware(RateLimitMiddleware, store=store)
    client = TestClient(app)
    assert client.post("/admin/login").status_code == 200