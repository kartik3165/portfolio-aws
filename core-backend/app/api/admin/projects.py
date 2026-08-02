from fastapi import APIRouter, HTTPException, Depends
from typing import List
from botocore.exceptions import ClientError
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectDelete, ProjectDetailAdmin, ProjectSummaryAdmin
from app.repositories.project_repo import ProjectRepo
from app.core.security import get_current_email

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

@router.get("", response_model=List[ProjectSummaryAdmin])
async def list_all_projects(email: str = Depends(get_current_email)):
    repo = ProjectRepo()
    try:
        return await repo.list_projects(include_drafts=True, email=email)
    except ClientError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=ProjectDetailAdmin)
async def create_project(project: ProjectCreate, email: str = Depends(get_current_email)):
    repo = ProjectRepo()
    try:
        return await repo.create_project(project.model_dump(), email)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
             raise HTTPException(status_code=409, detail="Project already exists")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{id}", response_model=ProjectDetailAdmin)
async def update_project(id: str, project: ProjectUpdate, email: str = Depends(get_current_email)):
    repo = ProjectRepo()
    try:
        updated = await repo.update_project(id, project.model_dump(), email)
        if not updated:
             raise HTTPException(status_code=404, detail="Project not found")
        return updated
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
             raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{id}")
async def delete_project(id: str, payload: ProjectDelete | None = None, email: str = Depends(get_current_email)):
    repo = ProjectRepo()
    try:
        await repo.delete_project(id, email)
        return {"message": "Project deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
             raise HTTPException(status_code=404, detail="Project not found")
        raise HTTPException(status_code=400, detail=str(e))
