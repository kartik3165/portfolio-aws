from fastapi import APIRouter, HTTPException
from botocore.exceptions import ClientError

from app.schemas.blog import BlogCreate, BlogDelete, BlogDetail, BlogUpdate
from app.repositories.blog_repo import BlogRepo
from typing import List

router = APIRouter(
    prefix="/blog",
    tags=["Blogs"]
)


@router.get("", response_model=List[BlogDetail])
async def all_blogs():
    repo = BlogRepo()
    try:
        data = await repo.list_blogs()
        return data
    except ClientError:
        raise HTTPException(
            status_code=404, 
            detail="Unable to fetch Blogs"
        )
    
@router.get("/{slug}", response_model=BlogDetail)
async def get_blog(slug: str):
    repo = BlogRepo()
    try:
        data = await repo.get_blog(slug)
        if not data:
            raise HTTPException(status_code=404, detail="Blog not found")
        return data
    except ClientError:
        raise HTTPException(
            status_code=404, 
            detail="Blog not found"
        )