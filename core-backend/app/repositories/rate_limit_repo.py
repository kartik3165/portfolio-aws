import os
import time

from app.db.dynamo import get_dynamodb


class RateLimitStore:
    """Per-IP request counters backed by DynamoDB using fixed time windows.

    Each (IP, rule, window) combination maps to one item whose sort key encodes
    the current window, so an expired window never blocks a fresh one. Items are
    auto-expired by DynamoDB TTL via the ``expires_at`` attribute.
    """

    def __init__(self, table_name: str | None = None) -> None:
        self.table_name = table_name or os.getenv("RATE_LIMIT_TABLE") or ""

    @property
    def enabled(self) -> bool:
        return bool(self.table_name)

    def _table(self):
        return get_dynamodb().Table(self.table_name)

    def increment(self, ip: str, rule_id: str, window_seconds: int) -> int:
        """Atomically increment the counter for the current window.

        Returns the new count. Creates the item on first hit in the window.
        """
        now = int(time.time())
        window_start = now // window_seconds * window_seconds
        resp = self._table().update_item(
            Key={"PK": f"RATE#{ip}", "SK": f"{rule_id}#{window_start}"},
            UpdateExpression="ADD requests :one SET expires_at = :expires",
            ExpressionAttributeValues={
                ":one": 1,
                ":expires": window_start + window_seconds,
            },
            ReturnValues="ALL_NEW",
        )
        return int(resp["Attributes"]["requests"])