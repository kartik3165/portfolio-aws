# Security Policy

## Reporting a Vulnerability
Please email `kartiknagare3165@gmail.com` with details. Do not open a public issue for security reports. We aim to respond within 48 hours.

## Secrets
- Never commit `.env` files. `core-backend/.env` and `frontend/.env` are git-ignored (root `.gitignore`). Copy from `.env.example`.
- Production secrets live in **AWS SSM Parameter Store** (`/portfolio/*`) and are never baked into the Lambda zip (`.samignore` excludes `.env`, `.venv`).
- If a secret was ever committed, rotate it (`aws ssm put-parameter --overwrite`) and purge history with `git filter-repo`.

## Auth
- Admin login is 2-step: password + TOTP/backup code. `JWT_SECRET` rotation invalidates all sessions.
- Cookies are `HttpOnly`; prod uses `Secure=true` + `SameSite=none` for cross-site Pages → API Gateway. Local dev uses `Secure=false` + `SameSite=lax`.
- Rate limiting is app-level (DynamoDB `RateLimitsTable`, fail-open if unavailable) plus API Gateway throttling; lockout after 5 failed logins (15 min).

## Uploads
- Max 10 MB, extension allow-list, magic-byte check (see `app/api/admin/upload.py:20`).

## Dependencies
- Run `pip-audit` / `npm audit` before release. `pyproject.toml` requires Python 3.13+.
