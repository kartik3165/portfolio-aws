# 🚀 Portfolio Backend API

Serverless FastAPI backend for a personal portfolio — AWS Lambda + API Gateway, DynamoDB, Cloudflare R2.

## ✨ Features

- **Auth**: email/password + TOTP (2FA), JWT access (15 min) + refresh (7 days) HttpOnly cookies, token rotation, login rate limiting + lockout, one-time bootstrap init
- **Blog / Projects**: full CRUD with drafts, admin + public endpoints
- **Skills**: add/remove
- **Profile**: bio, experience, research papers, achievements CRUD
- **Comments**: public submit + admin moderation
- **Uploads**: images to Cloudflare R2 (max 10 MB, whitelisted extensions)

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── admin/             # Protected endpoints (auth, blog, comment, profile, projects, skills, upload)
│   │   └── public/            # Public endpoints (blog, comment, profile, projects, skills)
│   ├── core/                  # config.py (settings), security.py (JWT)
│   ├── db/                    # dynamo.py (table getters), keys.py (PK constants)
│   ├── repositories/          # Data access layer (auth, blog, comment, profile, project, skills)
│   ├── schemas/               # Pydantic request/response models
│   ├── services/              # storage.py (R2 uploads)
│   └── main.py                # FastAPI entry (also the Lambda handler)
├── scripts/
│   ├── start_local_db.sh       # Start persistent dynamodb-local container + create tables
│   ├── init_local_db.sh       # Create tables in dynamodb-local
│   ├── init_ssm.sh            # Create SSM secrets for deployment
│   ├── deploy.sh              # One-shot production deploy (SSM -> SAM -> admin init)
│   └── seed_bio.py            # Seed bio into ProfileTable
├── tests/                     # Test suite
├── template.yaml              # AWS SAM template
├── requirements.txt           # Python dependencies
└── pyproject.toml
```

## 🛠️ Tech Stack

FastAPI · Python 3.13 · AWS Lambda (SAM) · API Gateway · DynamoDB · Cloudflare R2 · Mangum · python-jose · argon2/passlib · pyotp

## 📚 API

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/public/blog`, `/public/blog/{slug}` | Published posts |
| GET | `/public/projects`, `/public/projects/{slug}` | Published projects |
| GET | `/public/skills` | Skills |
| GET | `/public/bio`, `/public/experience`, `/public/research_papers`, `/public/achievements` | Profile |
| GET / POST | `/public/comments/{blogId}` | Get / submit comments |

### Admin (JWT cookie required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/init` | One-time bootstrap (x-bootstrap-secret header) |
| POST | `/admin/login`, `/admin/login/totp` | Login with password, then TOTP |
| POST | `/admin/refresh`, `/admin/logout` | Refresh / invalidate tokens |
| GET | `/admin/auth` | Session check |
| GET/POST/PUT/DELETE | `/admin/blog`, `/admin/blog/{id}` | Blog CRUD |
| GET/POST/PUT/DELETE | `/admin/projects`, `/admin/projects/{id}` | Project CRUD |
| POST | `/admin/skill/add`, `/admin/skill/remove` | Skills |
| POST/PUT/DELETE | `/admin/experience`, `/admin/research_papers`, `/admin/achievements` | Profile items |
| PUT | `/admin/bio` | Bio update |
| DELETE | `/admin/comment/{blogId}/{commentId}` | Moderation |
| POST | `/admin/upload/presigned-url`, `/admin/upload/upload-file` | R2 uploads |

## 🚀 Deployment (AWS)

Serverless: FastAPI + Mangum runs on **AWS Lambda** behind an **HTTP API Gateway** (SAM), backed by **DynamoDB**, with secrets in **SSM Parameter Store** and images in **Cloudflare R2**. The admin frontend and public site are separate static builds (S3 + CloudFront / Amplify / Cloudflare Pages).

### 1. Prerequisites

```bash
aws configure            # region: ap-south-1
sam --version            # AWS SAM CLI
```
Also provision the 5 DynamoDB tables (partition key `PK`, sort key `SK`, both String, on-demand capacity):
```bash
for t in BlogsTable BlogCommentsTable SkillsTable ProjectsTable ProfileTable; do
  aws dynamodb create-table \
    --table-name "$t" \
    --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
    --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
    --billing-mode PAY_PER_REQUEST --region ap-south-1
done
```

### 2. Deploy the backend

`scripts/deploy.sh` does everything: creates SSM secrets (skips existing) → `sam build` → `sam deploy` → reads the API URL → initializes the admin account.

```bash
cd core-backend
./scripts/deploy.sh [region]    # default: $AWS_REGION or ap-south-1
```

At the end it prints the **API base URL** and the **TOTP secret** to add to your authenticator app.

Secrets live under `/portfolio/*` in SSM: `JWT_SECRET`, `BOOTSTRAP_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and the `R2_*` upload config. Run `./scripts/init_ssm.sh` on its own to (re)create them interactively.

### 3. Point the frontend at the API

The React/Vite frontend reads `VITE_API_URL` in production (`frontend/src/api/client.js`):
```bash
cd frontend
VITE_API_URL="<API_URL>" npm run build    # outputs dist/
```
Upload `dist/` to an S3 bucket and serve via **CloudFront** (SPA fallback: map `403`/`404` error responses to `/index.html`). Optionally add a custom domain with an ACM certificate (us-east-1 for CloudFront).

### 4. CORS

Both `ALLOWED_ORIGINS` in `app/main.py` and `CorsConfiguration` in `template.yaml` must list every domain that calls the API (public site + admin site). Add yours before deploying, e.g. `https://kanbs.example.com`.

### 5. Admin login

Login is 2-step: `POST /admin/auth/init` (one-time, requires the `x-bootstrap-secret` header) then `POST /admin/login` (email + password) → `POST /admin/login/totp` (TOTP or a backup code). Cookies are `HttpOnly` + `Secure` + `SameSite=Strict`, so the admin site must be served over HTTPS from a CORS-allowed origin.

### Gotchas

- Do **not** copy the local `.env` (`DYNAMODB_ENDPOINT=http://localhost:8001`) to Lambda — leave `DYNAMODB_ENDPOINT` unset in production.
- `deploy.sh` re-running is safe: SSM params are skipped if they exist, and `/admin/auth/init` returns 409 once credentials exist.
- Token rotation means rotating `JWT_SECRET` invalidates all sessions.
