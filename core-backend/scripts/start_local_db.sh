#!/usr/bin/env bash
set -euo pipefail

# Ensures a persistent dynamodb-local container is running and tables exist.
#
# The previous setup ran with `-inMemory`, so every container restart wiped
# all data — forcing a re-run of POST /admin/auth/init (new TOTP every time).
# This creates/repairs the container with:
#   - a named data volume (dynamodb-data) so data survives restarts
#   - a --restart unless-stopped policy so it comes back after a reboot
#   - no -inMemory flag (data written to /home/dynamodblocal/data)
#
# Usage: ./scripts/start_local_db.sh [port]   (default 8001, matches .env)

PORT="${1:-8001}"
NAME="dynamodb-local"
IMAGE="amazon/dynamodb-local"
VOLUME="dynamodb-data"
DB_PATH="/home/dynamodblocal/data"
ENDPOINT="http://localhost:$PORT"

# Does the existing container use a persistent setup already?
is_persistent() {
  docker inspect "$NAME" >/dev/null 2>&1 || return 1
  docker inspect --format '{{join .Config.Cmd ","}}' "$NAME" | grep -q -- '-inMemory' && return 1
  docker inspect --format '{{len .Mounts}}' "$NAME" | grep -q '^[1-9]'
}

if docker inspect "$NAME" >/dev/null 2>&1; then
  if is_persistent; then
    echo "==> '$NAME' already persistent; starting it..."
    docker start "$NAME" >/dev/null
  else
    echo "==> '$NAME' is ephemeral (-inMemory). Recreating with persistent volume..."
    docker rm -f "$NAME" >/dev/null
    docker run -d --name "$NAME" \
      -p "$PORT:8000" \
      -v "$VOLUME:$DB_PATH" \
      --restart unless-stopped \
      "$IMAGE" -jar DynamoDBLocal.jar -dbPath "$DB_PATH" >/dev/null
  fi
else
  echo "==> Creating persistent '$NAME' container..."
  docker run -d --name "$NAME" \
    -p "$PORT:8000" \
    -v "$VOLUME:$DB_PATH" \
    --restart unless-stopped \
    "$IMAGE" -jar DynamoDBLocal.jar -dbPath "$DB_PATH" >/dev/null
fi

# Wait for the endpoint to accept requests
for i in {1..30}; do
  if aws dynamodb list-tables --endpoint-url "$ENDPOINT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Creating tables (idempotent)..."
./scripts/init_local_db.sh "$ENDPOINT"

echo
echo "Local DynamoDB ready at $ENDPOINT (persistent — admin creds & TOTP survive restarts)."