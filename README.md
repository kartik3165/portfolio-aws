# Kanbs Portfolio

Personal portfolio monorepo with two apps that work together:

| Folder | What it is | Stack |
|---|---|---|
| `frontend/` | Public site + admin CMS (admin lives under `/admin`) | React + Vite |
| `core-backend/` | The API both apps talk to | FastAPI on AWS Lambda + API Gateway + DynamoDB |

The frontend needs to know where the API is. That URL is set in `VITE_API_URL` (`frontend/.env`, copied from `.env.example`).

This guide assumes **no prior AWS or Cloudflare experience**. Copy-paste the commands; they are designed to be safe to re-run.

---

## 1. What you need first

- **Node.js** 20+ and npm — https://nodejs.org
- **Python** 3.10+ — https://www.python.org
- **Docker** (only for running the database locally) — https://www.docker.com
- **AWS account** with the CLI configured — only needed for production:
  - [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  - [Install SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
  - Then run `aws configure` and pick region **`ap-south-1`**
- **Cloudflare account** — for R2 (image uploads) and Pages (hosting the public site)

> Skip the AWS/Cloudflare parts if you only want to run the app on your own computer (Part 2 below).

---

## 2. Run it locally (no AWS needed)

### 2.1 Start the backend

```bash
cd core-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # then fill in values + uncomment DYNAMODB_ENDPOINT
./scripts/start_local_db.sh # starts a local database in Docker, safe to re-run
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000` (interactive docs at `/docs`).

> **Why the script?** The local database is stored in a Docker volume, so your data (and admin login) survives restarts and reboots. Re-running `start_local_db.sh` is always safe.

### 2.2 Start the frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm install
npm run dev                 # open http://localhost:5173
```

The public site is at `/`, the admin CMS at `/admin`. During local development the dev server forwards `/public` and `/admin` requests to the backend automatically, so CORS is not a problem.

### 2.3 Create your admin account (once)

```bash
curl -X POST http://localhost:8000/admin/auth/init \
  -H "x-bootstrap-secret: <BOOTSTRAP_SECRET from core-backend/.env>"
```

The response contains a **`totp_secret`** and **`backup_codes`**:

1. Add the `totp_secret` to an authenticator app (Authy, Google Authenticator, 1Password...).
2. Save the backup codes somewhere safe — they are shown only once.
3. Open `http://localhost:5173/admin` and log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, then the 6-digit code from your authenticator.

> Already initialized and got a `409 "Admin credentials already initialized"`? That is normal — it means an account already exists. Just log in.

---

## 3. Deploy to production (AWS + Cloudflare)

How it fits together:

```
Your visitors → Cloudflare Pages (frontend) ─┐
                                             ├→ API Gateway URL (core-backend) → Lambda → DynamoDB / R2
You (admin) → /admin on the frontend ────────┘
```

Secrets (passwords, keys) are stored in **AWS SSM Parameter Store**; none are hard-coded.

### 3.1 Deploy the backend (one command)

```bash
cd core-backend
./scripts/deploy.sh
```

What the script does for you:

1. Creates all the secret parameters in SSM (skips any that already exist).
   It will **prompt you for** the admin email/password and the **Cloudflare R2** values (account ID, access key ID, secret, bucket name, public URL). R2 is required — the admin CMS uploads images there.
2. Builds and deploys the Lambda + API to AWS (creates the DynamoDB tables).
3. Creates your admin account and prints the results.

When it finishes you will see something like:

```text
=== Deployment complete ===
API base URL:   https://<api-id>.execute-api.ap-south-1.amazonaws.com
TOTP setup:     {"totp_secret": "...", "backup_codes": ["...", ...], ...}
```

**Save two things now:**

1. The **API base URL** — you need it for the frontend (step 3.3).
2. Add the **`totp_secret`** to your authenticator app and save the **backup codes** (shown once only).

Then log in at the admin site (once the frontend is deployed) with the admin email + password you entered, plus the TOTP code.

> **Re-running `deploy.sh` is safe.** It skips existing SSM parameters, updates the API in place, and "already initialized" (HTTP 409) from the admin-creation step is expected on subsequent runs.

### 3.2 (Alternative) Deploy the backend step by step

If you prefer to run the pieces yourself, or the one-command script is not for you:

```bash
cd core-backend
./scripts/init_ssm.sh          # prompts for secrets, generates random JWT/BOOTSTRAP/TOTP keys
sam build
sam deploy                     # uses samconfig.toml (stack: portfolio-backend, region: ap-south-1)
```

Then fetch your API URL and create the admin account:

```bash
API_URL=$(aws cloudformation describe-stacks --stack-name portfolio-backend --region ap-south-1 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
echo "$API_URL"

BOOT=$(aws ssm get-parameter --name /portfolio/BOOTSTRAP_SECRET --with-decryption \
  --region ap-south-1 --query Parameter.Value --output text)
curl -X POST "$API_URL/admin/auth/init" -H "x-bootstrap-secret: $BOOT"
```

### 3.3 Verify the backend

```bash
API_URL="https://<your-api-id>.execute-api.ap-south-1.amazonaws.com"

curl -s -o /dev/null -w "%{http_code}\n" "$API_URL/public/projects"   # expect 200

curl -s -X POST "$API_URL/admin/login" -H "Content-Type: application/json" \
  -d '{"email":"<your email>","password":"<your password>"}'           # expect a preauth_token
```

### 3.4 Deploy the frontend to Cloudflare Pages

```bash
cd frontend
npm install
VITE_API_URL="https://<your-api-id>.execute-api.ap-south-1.amazonaws.com" npm run build
```

This creates a `dist/` folder. Then:

- **Option A (drag & drop):** go to the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → upload the `dist/` folder.
- **Option B (connected Git repo):** connect the repo to Cloudflare Pages, set an environment variable `VITE_API_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com`, and Pages builds it for you.

CORS already allows the public and admin origins. The **admin CMS** has one important catch — see the gotchas below.

---

## 4. Production gotchas (read these)

- **Admin login cookies default to `SameSite=strict`.** If your admin UI and API are on different sites in production (for example `*.pages.dev` calling `*.execute-api.ap-south-1.amazonaws.com`), set `AUTH_COOKIE_SAMESITE=none` and keep `AUTH_COOKIE_SECURE=true` in the backend so the browser will send auth cookies on admin XHR requests. If both live on the same site, the default `strict` setting is still the safer choice.
- **Do not copy `core-backend/.env` to Lambda.** In production secrets come from SSM. `DYNAMODB_ENDPOINT=http://localhost:8001` must stay commented out — pointing Lambda at your laptop would break it.
- **Rate limiting is done in the app, not by a WAF.** (AWS WAF cannot protect HTTP APIs.) Details in the Notes section below.
- If you change CORS origins, update **both** `ALLOWED_ORIGINS` in `core-backend/app/main.py` **and** the `CorsConfiguration` in `core-backend/template.yaml`, then redeploy.
- **`sam deploy` is safe to re-run.** Tables are never touched, and DynamoDB is schemaless, so new fields need no migration.

---

## 5. Operations

### Rotate secrets

Old secrets exist in git history. Rotate `JWT_SECRET` (and R2 keys), then purge history:

```bash
aws ssm put-parameter --name /portfolio/JWT_SECRET --value <new> \
  --type SecureString --overwrite
# redeploy the backend, then:
git filter-repo   # purge old history, force-push
```

### Check which admin email is set

The `.env`/SSM values matter only when `/admin/auth/init` runs — login uses the email stored in DynamoDB:

```bash
# Local
aws dynamodb get-item --endpoint-url http://localhost:8001 --table-name ProfileTable \
  --key '{"PK": {"S": "ADMIN#CREDENTIALS"}, "SK": {"S": "METADATA"}}' \
  --projection-expression "email, updated_at" --region ap-south-1
# Prod: the same command without --endpoint-url
```

### Lost your authenticator app (and backup codes)?

The TOTP secret is stored encrypted and is **not recoverable**. To set up TOTP again:

```bash
# Delete the credentials row (email/password will be re-created from SSM),
# then re-run /admin/auth/init — you get a fresh totp_secret + backup codes.
aws dynamodb delete-item --table-name ProfileTable --region ap-south-1 \
  --key '{"PK": {"S": "ADMIN#CREDENTIALS"}, "SK": {"S": "METADATA"}}'
```

Then repeat the init request from step 3.2 and save the new secret + codes. Existing sessions are invalidated; email and password stay the same.

---

## 6. Troubleshooting

| Symptom | Meaning / fix |
|---|---|
| `No changes to deploy. Stack is up to date` | Not an error — you deployed the same code already. |
| `409 Admin credentials already initialized` | Admin already exists; just log in. |
| `Missing required SSM parameters ...` | Run `./scripts/init_ssm.sh` (or `deploy.sh`) to create them, then redeploy. |
| `429` when logging in | Rate limit hit (see Notes). Wait 1–5 minutes and try again. |
| Admin login works locally but not in production | The admin auth cookies are probably too strict for your deployed frontend/API split. If the admin site and API are on different sites, set `AUTH_COOKIE_SAMESITE=none` and keep `AUTH_COOKIE_SECURE=true`. |
| Warning about `ServerlessHttpApi` being a "reserved logical ID" | Harmless; ignore it. |
| Changes don't show up after deploy | Re-run `sam build` first, then `sam deploy`. |

---

## 7. Notes

- **Rate limiting** (per IP, counted in the app — no WAF):
  - `POST /admin/login` and `POST /admin/login/totp` — **10 tries per minute**
  - `POST /admin/auth/init` — **5 tries per 5 minutes**
  - `POST /public/comment/{blogId}` — **30 per 10 minutes**
  - All reads/GETs are **not** limited (nothing is written to the database for them)
  - Plus: **5 failed logins → 15-minute lockout** for the account
  - When a limit is exceeded you get `429` with a `Retry-After` header
- Uploads: max 10 MB, images only (stored in Cloudflare R2).
- The local database runs on port `8001` (so it never clashes with the API on `8000`).
