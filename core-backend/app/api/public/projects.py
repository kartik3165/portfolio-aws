from fastapi import APIRouter, HTTPException
from typing import List
from app.schemas.project import ProjectSummary, ProjectDetail
from app.repositories.project_repo import ProjectRepo

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

@router.get("", response_model=List[ProjectSummary])
async def get_projects():
    repo = ProjectRepo()
    return await repo.list_projects()

@router.get("/{slug}", response_model=ProjectDetail)
async def get_project(slug: str):
    repo = ProjectRepo()
    project = await repo.get_project(slug)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
