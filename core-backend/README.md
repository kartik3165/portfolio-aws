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
