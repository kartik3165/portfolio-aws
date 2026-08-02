from fastapi import APIRouter
from typing import List
from uuid import UUID
from app.schemas.blog import Comment, CommentCreate
from app.repositories.comment_repo import CommentRepo

router = APIRouter(prefix="/comment", tags=["Comments"])


@router.get("/{blogId}", response_model=List[Comment])
async def get_comments(blogId: UUID):
    repo = CommentRepo()
    items = await repo.list_comments(blogId)

    items.sort(key=lambda x: x["timestamp"]) # type: ignore

    return items


@router.post("/{blogId}", response_model=Comment)
async def create_comment(blogId: UUID, payload: CommentCreate):
    repo = CommentRepo()
    item = await repo.create_comment(blogId, payload.name, payload.body)
    return item