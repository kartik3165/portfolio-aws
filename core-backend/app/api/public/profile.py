from fastapi import APIRouter, HTTPException
from app.repositories.profile_repo import ProfileRepo
from app.schemas.profile import (
    ExperienceResponse,
    ResearchPaperResponse,
    AchievementResponse
)

router = APIRouter(prefix="", tags=["Profile"])

@router.get("/experience", response_model=ExperienceResponse)
async def get_experience():
    repo = ProfileRepo()
    items = await repo.list_experience()
    return {"experience": items}

@router.get("/research_papers", response_model=ResearchPaperResponse)
async def get_research_papers():
    repo = ProfileRepo()
    items = await repo.list_papers()
    return {"research_papers": items}

@router.get("/achievements", response_model=AchievementResponse)
async def get_achievements():
    repo = ProfileRepo()
    items = await repo.list_achievements()
    return {"achievements": items}


@router.get("/bio")
async def get_bio():
    repo = ProfileRepo()
    data = await repo.get_bio()
    return {
        "data": {
            "bio": data
        }
    }
