from uuid import UUID
from pydantic import BaseModel, Field

class Comment(BaseModel):
    id: UUID
    name: str
    body: str
    date: str
    timestamp: str


class CommentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=4000)