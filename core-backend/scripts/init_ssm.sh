#!/usr/bin/env bash
set -euo pipefail

# Creates the SSM parameters referenced by template.yaml ({{resolve:ssm:/portfolio/<NAME>}}).
# Re-runnable: existing parameters are skipped. Run once before `sam deploy`.
# Usage: ./scripts/init_ssm.sh [region]  (default: $AWS_REGION or ap-south-1)
REGION="${1:-${AWS_REGION:-ap-south-1}}"

# Namespace is shared by all portfolio services.
PREFIX="/portfolio"

param_exists() {
  aws ssm get-parameter --region "$REGION" --name "$1" --with-decryption >/dev/null 2>&1
}

put_param() { # name, value
  aws ssm put-parameter \
    --region "$REGION" \
    --name "$1" \
    --type SecureString \
    --value "$2" \
    --overwrite >/dev/null
  echo "  [ok]   $1"
}

ask() { # name, prompt, [default], [is_secret], [required]
  local name="$1" prompt="$2" default="${3:-}" secret="${4:-0}" required="${5:-0}" val val2
  if param_exists "$name"; then
    echo "  [skip] $name (already exists)"
    return 0
  fi
  if [[ "$secret" == "1" ]]; then
    while :; do
      read -rsp "$prompt: " val; echo
      if [[ -z "$val" && "$required" == "1" ]]; then
        echo "  required, try again"
        continue
      fi
      read -rsp "Confirm $prompt: " val2; echo
      [[ -z "$val" && -z "$val2" ]] && break
      [[ "$val" == "$val2" ]] && break
      echo "  mismatch, try again"
    done
  else
    while :; do
      read -rp "$prompt${default:+ [$default]}: " val
      val="${val:-$default}"
      [[ -n "$val" ]] && break
      if [[ "$required" == "1" ]]; then
        echo "  required, try again"
        continue
      fi
      break
    done
  fi
  put_param "$name" "$val"
}

gen_param() { # name
  local name="$1" value
  if param_exists "$name"; then
    echo "  [skip] $name (already exists)"
    return 0
  fi
  value="$(openssl rand -base64 48)"
  put_param "$name" "$value"
  echo "  [info] generated a fresh random value for $name"
}

echo "==> SSM parameters for the portfolio backend (region: $REGION)"
echo "    Skips parameters that already exist. SecureString type."

gen_param "$PREFIX/JWT_SECRET"
gen_param "$PREFIX/BOOTSTRAP_SECRET"
ask "$PREFIX/ADMIN_EMAIL" "Admin email" "admin@kanbs.me"
ask "$PREFIX/ADMIN_PASSWORD" "Admin password" "" 1
ask "$PREFIX/R2_ACCOUNT_ID" "Cloudflare account ID" "" 1 1
ask "$PREFIX/R2_ACCESS_KEY_ID" "R2 access key ID" "" 1 1
ask "$PREFIX/R2_SECRET_ACCESS_KEY" "R2 secret access key" "" 1 1
ask "$PREFIX/R2_BUCKET_NAME" "R2 bucket name" "" 0 1
ask "$PREFIX/R2_PUBLIC_BASE_URL" "R2 public base URL (https://...)" "" 0 1

echo
echo "All parameters ready. Keep the BOOTSTRAP_SECRET:"
echo "  aws ssm get-parameter --region $REGION --name $PREFIX/BOOTSTRAP_SECRET --with-decryption --query Parameter.Value --output text"
echo "It is needed once for POST /admin/auth/init after deploy."
