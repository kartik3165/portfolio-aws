from fastapi import APIRouter
from app.schemas.skill import SkillsResponse
from app.repositories.skills_repo import SkillsRepo

router = APIRouter(prefix="/skill", tags=["Skills"])

@router.get("", response_model=SkillsResponse)
async def get_skills():
    repo = SkillsRepo()
    return await repo.get_skills()