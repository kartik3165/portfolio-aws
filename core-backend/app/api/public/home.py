import asyncio

from fastapi import APIRouter

from app.repositories.profile_repo import ProfileRepo
from app.repositories.skills_repo import SkillsRepo
from app.repositories.project_repo import ProjectRepo
from app.repositories.blog_repo import BlogRepo

router = APIRouter(prefix="/home", tags=["Home"])


_INTERNAL_KEYS = ("PK", "SK", "created_at", "updated_at", "updated_by")


def _strip(item):
    if isinstance(item, dict):
        for key in _INTERNAL_KEYS:
            item.pop(key, None)
    return item


@router.get("")
async def get_home_data():
    bio, skills, projects, blogs = await asyncio.gather(
        ProfileRepo().get_bio(),
        SkillsRepo().get_skills(),
        ProjectRepo().list_projects(),
        BlogRepo().list_blogs(),
    )
    return {
        "data": {
            "bio": _strip(bio),
            "skills": skills.get("skills", []),
            "projects": [_strip(p) for p in projects],
            "blogs": [_strip(b) for b in blogs],
        }
    }
