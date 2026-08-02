from uuid import UUID
from pydantic import BaseModel

class Comment(BaseModel):
    id: UUID
    name: str
    body: str
    date: str
    timestamp: str


class CommentCreate(BaseModel):
    name: str
    body: str