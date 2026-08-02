#!/usr/bin/env bash
set -euo pipefail

# Creates the DynamoDB tables in dynamodb-local.
# Usage: ./scripts/init_local_db.sh [endpoint]  (default http://localhost:8000)
ENDPOINT="${1:-http://localhost:8000}"

create_table() {
  local name="$1"
  local pk="$2"
  local sk="$3"
  if aws dynamodb describe-table --endpoint-url "$ENDPOINT" --table-name "$name" >/dev/null 2>&1; then
    echo "exists: $name"
  else
    aws dynamodb create-table \
      --endpoint-url "$ENDPOINT" \
      --table-name "$name" \
      --attribute-definitions AttributeName="$pk",AttributeType=S AttributeName="$sk",AttributeType=S \
      --key-schema AttributeName="$pk",KeyType=HASH AttributeName="$sk",KeyType=RANGE \
      --billing-mode PAY_PER_REQUEST
    echo "created: $name"
  fi
}

create_table BlogsTable PK SK
create_table BlogCommentsTable PK SK
create_table SkillsTable SKILLS METADATA
create_table ProjectsTable PK SK
create_table ProfileTable PK SK

echo "Local DynamoDB ready at $ENDPOINT"
