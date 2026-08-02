#!/usr/bin/env bash
set -euo pipefail

# One-shot production deploy: SSM secrets -> SAM build/deploy -> admin init.
# Prints the API base URL and the TOTP secret to add to your authenticator app.
#
# Usage: ./scripts/deploy.sh [region]   (default: $AWS_REGION or ap-south-1)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

REGION="${1:-${AWS_REGION:-ap-south-1}}"
STACK="portfolio-backend"
PREFIX="/portfolio"

echo "==> [1/4] Creating SSM parameters (skips existing)..."
"$SCRIPT_DIR/init_ssm.sh" "$REGION"

echo "==> [2/4] Building the SAM app..."
sam build

echo "==> [3/4] Deploying stack '$STACK'..."
sam deploy --stack-name "$STACK" --region "$REGION" --no-confirm-changeset

API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
if [[ -z "$API_URL" || "$API_URL" == "None" ]]; then
  echo "ERROR: could not read ApiUrl from stack $STACK" >&2
  exit 1
fi

echo "==> [4/4] Initializing admin account..."
SECRET=$(aws ssm get-parameter --name "$PREFIX/BOOTSTRAP_SECRET" --region "$REGION" \
  --with-decryption --query Parameter.Value --output text)
INIT_RESULT=$(curl -sS -X POST "$API_URL/admin/auth/init" -H "x-bootstrap-secret: $SECRET")

echo
echo "=== Deployment complete ==="
echo "API base URL:   $API_URL"
echo "TOTP setup:     $INIT_RESULT"
echo "  -> Add the totp_secret above to your authenticator app, then login"
echo "     at the admin site with ADMIN_EMAIL/ADMIN_PASSWORD + the TOTP code."
