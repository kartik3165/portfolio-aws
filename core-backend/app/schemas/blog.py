from pydantic import BaseModel, HttpUrl
from typing import List


class BlogSummary(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: str
    author: str
    date: str
    readtime: str
    image: str
    gallery: List[str] = []
    tags: List[str]
    created_at: str
    updated_at: str

class BlogSummaryAdmin(BlogSummary):
    is_draft: bool = False

class BlogDetail(BlogSummary):
    content: str

class BlogDetailAdmin(BlogDetail):
    is_draft: bool = False

class BlogCreate(BaseModel):
    slug: str
    title: str
    excerpt: str
    author: str
    date: str
    readtime: str
    image: str
    is_draft: bool = False
    gallery: List[str] = []
    tags: List[str]
    content: str

class BlogUpdate(BaseModel):
    slug: str | None = None
    title: str | None = None
    excerpt: str | None = None
    author: str | None = None
    date: str | None = None
    readtime: str | None = None
    image: str | None = None
    is_draft: bool | None = None
    gallery: List[str] | None = None
    tags: List[str] | None = None
    content: str | None = None

class BlogDelete(BaseModel):
    id: str

class Comment(BaseModel):
    id: str
    name: str
    body: str
    date: str
    timestamp: str

class CommentCreate(BaseModel):
    name: str
    body: str
