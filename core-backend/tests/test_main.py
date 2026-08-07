import asyncio

from starlette.types import Receive, Scope, Send

from app.main import SecurityHeadersMiddleware, SECURITY_HEADERS


def test_security_headers_applied(client):
    res = client.get("/nope")
    assert res.status_code == 404
    for key, value in SECURITY_HEADERS.items():
        assert res.headers.get(key) == value


def test_security_headers_applied_on_error(client):
    res = client.post("/admin/upload/presigned-url", json={"x": 1})
    assert res.status_code == 401
    for key, value in SECURITY_HEADERS.items():
        assert res.headers.get(key) == value


def test_middleware_passes_through_non_http_scope():
    received: list = []

    async def app(scope: Scope, receive: Receive, send: Send):
        received.append(scope["type"])

    async def run():
        await SecurityHeadersMiddleware(app)({"type": "lifespan"}, None, None)

    asyncio.run(run())
    assert received == ["lifespan"]