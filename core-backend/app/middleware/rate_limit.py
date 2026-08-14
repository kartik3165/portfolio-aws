import time

from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.repositories.rate_limit_repo import RateLimitStore

# (path_prefix, limit, window_seconds) — most specific prefix must come first.
# Only these sensitive POST routes are rate limited per IP, so DynamoDB writes
# happen only for them (login brute-force and comment spam), never for reads.
_RULES = [
    ("/admin/login/totp", 10, 60),
    ("/admin/login", 10, 60),
    ("/admin/auth/init", 5, 300),
    ("/public/comment/", 30, 600),
]


def _client_ip(scope: Scope) -> str:
    """Resolve the caller IP, preferring the API Gateway-provided source IP."""
    event = scope.get("aws.event")
    if event:
        ip = (event.get("requestContext") or {}).get("http", {}).get("sourceIp")
        if ip:
            return ip
    client = scope.get("client")
    if client:
        return client[0]
    return "unknown"


def _rule_for(path: str) -> tuple[str, int, int] | None:
    for prefix, limit, window in _RULES:
        if path.startswith(prefix):
            return prefix, limit, window
    return None


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, store: RateLimitStore | None = None) -> None:
        self.app = app
        self.store = store or RateLimitStore()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or not self.store.enabled:
            await self.app(scope, receive, send)
            return

        rule = _rule_for(scope["path"])
        if rule is None or scope["method"] != "POST":
            await self.app(scope, receive, send)
            return

        prefix, limit, window = rule
        try:
            count = self.store.increment(_client_ip(scope), prefix, window)
        except Exception as exc:  # noqa: BLE001 - fail open so limiting never takes the API down
            print(f"Rate limit check failed: {exc}")
            await self.app(scope, receive, send)
            return

        if count > limit:
            now = time.time()
            retry_after = max(1, int((now // window * window + window) - now))
            response = JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(retry_after)},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)