from fastapi import APIRouter, HTTPException, Depends
from botocore.exceptions import ClientError
from typing import List

from app.schemas.blog import BlogCreate, BlogDelete, BlogDetailAdmin, BlogUpdate
from app.repositories.blog_repo import BlogRepo
from app.core.security import get_current_email

router = APIRouter(
    prefix="/blog",
    tags=["Blogs"]
)

@router.get("", response_model=List[BlogDetailAdmin])
async def list_all_blogs(email: str = Depends(get_current_email)):
    repo = BlogRepo()
    try:
        data = await repo.list_blogs(include_drafts=True, email=email)
        return data
    except ClientError:
        raise HTTPException(
            status_code=404, 
            detail="Unable to fetch Blogs"
        )


@router.post("", response_model=BlogDetailAdmin)
async def create_blog(data: BlogCreate, email: str = Depends(get_current_email)):
    repo = BlogRepo()
    try:
        item = await repo.create_blog(data.model_dump(), email)
        return item
    except ClientError as e:
        raise HTTPException(
            status_code=400, 
            detail=str(e)
        )

@router.put("/{id}", response_model=BlogDetailAdmin)
async def update_blog(id: str, payload: BlogUpdate, email: str = Depends(get_current_email)):
    repo = BlogRepo()
    try:
        updated = await repo.update_blog(id, payload.model_dump(), email)
        if not updated:
            raise HTTPException(status_code=404, detail="Blog not found")
        return updated
    except ClientError:
        raise HTTPException(status_code=404, detail="Blog not found")

@router.delete("/{id}")
async def delete_blog(id: str, payload: BlogDelete | None = None, email: str = Depends(get_current_email)):
    repo = BlogRepo()
    try:
        deleted = await repo.delete_blog(id, email) 
        if not deleted:
            raise HTTPException(status_code=404, detail="Blog not found")
        return {"message": f"Blog deleted successfully of id {id}"}
    except ClientError:
        raise HTTPException(status_code=404, detail="Blog not found")
    
        
