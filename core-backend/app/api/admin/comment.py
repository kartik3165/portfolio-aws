from fastapi import APIRouter, HTTPException, Depends
from app.repositories.comment_repo import CommentRepo
from app.core.security import get_current_email

router = APIRouter(prefix="/comment", tags=["Comments (Admin)"])

@router.delete("/{blogId}/{commentId}")
async def delete_comment(blogId: str, commentId: str, email: str = Depends(get_current_email)):
    repo = CommentRepo()
    deleted = await repo.delete_comment(blogId, commentId, email)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}
