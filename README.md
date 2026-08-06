# Kanbs Portfolio — Deployment Guide

Personal portfolio monorepo: **frontend** (public site + admin CMS) + **core-backend** (serverless API).

| Folder          | What it is                                     | Stack                        |
|-----------------|------------------------------------------------|------------------------------|
| `frontend/`       | Public site + admin CMS (dev port `5173`)   | React + Vite                 |
| `core-backend/`    | API for both apps                           | FastAPI + AWS Lambda/DynamoDB|

The frontend talks to the backend API. The API URL comes from `VITE_API_URL` (`frontend/.env`, copied from `.env.example`).

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.10+ with `venv` available
- **Docker** (for local DynamoDB)
- **AWS CLI + SAM CLI**, configured (`aws configure`, region `ap-south-1`) — production only
  - [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
  - [SAM CLI installation guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- **Cloudflare account** — for R2 (uploads) and Pages (hosting the frontend)

---

## Part 1 — Local deployment

### 1. Backend (FastAPI + DynamoDB local)

```bash
cd core-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env              # fill in values, uncomment DYNAMODB_ENDPOINT

# Start persistent DynamoDB in Docker (port 8001) + create tables
./scripts/start_local_db.sh            # safe to re-run on every restart

# Run the API
uvicorn app.main:app --reload --port 8000
```

API is now at `http://localhost:8000` (docs at `/docs`).

> **Why `start_local_db.sh`?** The older `docker run` command started DynamoDB with `-inMemory`, so every container restart wiped the tables — forcing a re-run of `/admin/auth/init` and a fresh TOTP secret. The script creates the container with a named volume (`dynamodb-data`) and `--restart unless-stopped`, so admin credentials + TOTP survive restarts and reboots. It also (re)creates the tables via `init_local_db.sh`, so re-running it is safe.

### 2. Frontend (public site + admin CMS)

One Vite app for both: the public site is served at the root (`/`, `/about`, `/blog`, …) and the admin CMS under `/admin`.

```bash
cd frontend
cp .env.example .env              # VITE_API_URL=http://localhost:8000
npm install
npm run dev                       # http://localhost:5173
```

The dev server proxies `/public` and `/admin` to the backend (see `vite.config.js`), so the public site works without CORS issues even without `.env`.

### 3. First admin login

Init once, then login with email + password + TOTP:

```bash
curl -X POST http://localhost:8000/admin/auth/init \
  -H "x-bootstrap-secret: <BOOTSTRAP_SECRET from core-backend/.env>"
# -> returns totp_secret: add to your authenticator app
```

Open `http://localhost:5173/admin`, login with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then the TOTP code.

---

## Part 2 — Production deployment

Architecture: **AWS SAM (Lambda + API Gateway + DynamoDB)** for the API, **Cloudflare Pages** for the frontend. Secrets live in **SSM Parameter Store**.

### 1. Backend + admin init (one command)

```bash
cd core-backend
./scripts/deploy.sh               # prompts for secrets once, then builds, deploys, and inits the admin
```

The script does everything: creates the SSM parameters (`init_ssm.sh`), `sam build` + `sam deploy`, then calls `/admin/auth/init` — and prints both outputs at the end:

```text
=== Deployment complete ===
API base URL:   https://<api-id>.execute-api.ap-south-1.amazonaws.com
TOTP setup:     {"totp_secret": "...", ...}
  -> Add the totp_secret above to your authenticator app, then login
     at the admin site with ADMIN_EMAIL/ADMIN_PASSWORD + the TOTP code.
```

Save the **API base URL** (you need it for the frontends) and add the **`totp_secret`** to your authenticator app.

R2 credentials are **required** (uploads are part of the project) — have your Cloudflare R2 bucket ready before deploying; the script will re-prompt until you provide them.

> First time? See [R2 bucket setup guide](https://developers.cloudflare.com/r2/get-started/) — you need the account ID, bucket, and an API token with read/write access to the bucket.

### 2. Frontend (public site + admin CMS, Cloudflare Pages)

```bash
cd frontend
npm install
VITE_API_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com npm run build
```

Deploy the `dist/` folder to Cloudflare Pages — or set `VITE_API_URL` as a Pages environment variable and build there. CORS already allows the public and admin origins.

> First time? See the [Cloudflare Pages getting started guide](https://developers.cloudflare.com/pages/get-started/).

### 3. Production gotchas

- **Cookies are `SameSite=strict`** — the admin UI (served under `/admin` on the frontend) and the API must be on the *same site* (or localhost). A Pages frontend + `*.execute-api.ap-south-1.amazonaws.com` are *different* sites → admin login will fail in production. Fix: point a custom domain at the API via API Gateway (e.g. `api.kanbs.me`) or serve the admin UI on the API's own domain.
- If you change CORS origins, update `ALLOWED_ORIGINS` in `core-backend/app/main.py` **and** the SAM template's `CorsConfiguration`, then redeploy.

---

## Operations

### Rotate secrets

Old secrets exist in git history. Rotate `JWT_SECRET` (and R2 keys), then purge history:

```bash
aws ssm put-parameter --name /portfolio/JWT_SECRET --value <new> \
  --type SecureString --overwrite
# redeploy backend, then:
git filter-repo            # purge old history, force-push
```

### Check which admin email is set

`.env`/SSM matter only at the moment `/admin/auth/init` runs — login uses the email stored in DynamoDB:

```bash
# Local
aws dynamodb get-item --endpoint-url http://localhost:8001 --table-name ProfileTable \
  --key '{"PK": {"S": "ADMIN#CREDENTIALS"}, "SK": {"S": "METADATA"}}' \
  --projection-expression "email, updated_at" --region ap-south-1
# Prod: same command without --endpoint-url
```

If stored email differs from `.env`/SSM, delete the `ADMIN#CREDENTIALS`/`METADATA` row and re-run init.

---

## Notes

- Login routes are rate-limited (burst 5, rate 10/s) + 5-failure/15-min account lockout.
- Uploads: max 10 MB, images only (Cloudflare R2).
- DynamoDB local runs on port `8001` (to avoid clashing with the API on `8000`).
