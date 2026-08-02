from fastapi import APIRouter, Depends, HTTPException
from app.schemas.skill import SkillsResponse, SkillAdd, SkillRemove
from app.repositories.skills_repo import SkillsRepo
from app.core.security import get_current_email

router = APIRouter(prefix="/skill", tags=["Skills"])

@router.post("/add", response_model=SkillsResponse)
async def add_skill(payload: SkillAdd, email: str = Depends(get_current_email)):
    repo = SkillsRepo()
    return await repo.add_skill(payload.skill, email)


@router.post("/remove", response_model=SkillsResponse)
async def remove_skill(payload: SkillRemove, email: str = Depends(get_current_email)):
    repo = SkillsRepo()
    return await repo.remove_skill(payload.skill, email)