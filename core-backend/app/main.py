from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.api.admin.blog import router as admin_blog
from app.api.admin.skills import router as admin_skills
from app.api.admin.projects import router as admin_projects
from app.api.admin.upload import router as admin_upload
from app.api.admin.profile import router as admin_profile
from app.api.admin.comment import router as admin_comment
from app.api.admin.auth import router as admin_auth

from app.api.public.blog import router as public_blog
from app.api.public.skills import router as public_skills
from app.api.public.comment import router as public_comment
from app.api.public.projects import router as public_projects
from app.api.public.profile import router as public_profile


app = FastAPI()


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://admin.kanbs.me",
    "https://www.admin.kanbs.me",
    "https://kanbs.me",
    "https://www.kanbs.me",
    "https://kanbs.pages.dev",
    "https://portfolio-frontend-admin.pages.dev",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "x-bootstrap-secret"],
)


app.include_router(admin_blog, prefix="/admin")
app.include_router(admin_skills, prefix="/admin")
app.include_router(admin_projects, prefix="/admin")
app.include_router(admin_upload, prefix="/admin")
app.include_router(admin_profile, prefix="/admin")
app.include_router(admin_comment, prefix="/admin")
app.include_router(admin_auth, prefix="/admin")

app.include_router(public_blog, prefix="/public")
app.include_router(public_skills, prefix="/public")
app.include_router(public_comment, prefix="/public")
app.include_router(public_projects, prefix="/public")
app.include_router(public_profile, prefix="/public")


from mangum import Mangum

handler = Mangum(app)
