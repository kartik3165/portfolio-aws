from pydantic import BaseModel, HttpUrl, Field
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
    slug: str = Field(max_length=200)
    title: str = Field(max_length=255)
    excerpt: str = Field(max_length=1000)
    author: str = Field(max_length=200)
    date: str = Field(max_length=50)
    readtime: str = Field(max_length=50)
    image: str = Field(max_length=1000)
    is_draft: bool = False
    gallery: List[str] = []
    tags: List[str] = []
    content: str = Field(max_length=200_000)

class BlogUpdate(BaseModel):
    slug: str | None = Field(default=None, max_length=200)
    title: str | None = Field(default=None, max_length=255)
    excerpt: str | None = Field(default=None, max_length=1000)
    author: str | None = Field(default=None, max_length=200)
    date: str | None = Field(default=None, max_length=50)
    readtime: str | None = Field(default=None, max_length=50)
    image: str | None = Field(default=None, max_length=1000)
    is_draft: bool | None = None
    gallery: List[str] | None = None
    tags: List[str] | None = None
    content: str | None = Field(default=None, max_length=200_000)

class BlogDelete(BaseModel):
    id: str

class Comment(BaseModel):
    id: str
    name: str
    body: str
    date: str
    timestamp: str

class CommentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    body: str = Field(min_length=1, max_length=4000)
