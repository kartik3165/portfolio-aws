from pydantic import BaseModel, Field


class UploadRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    content_type: str = ""
    folder: str = "misc"  # e.g. "blogs", "projects"


class PresignedUrlResponse(BaseModel):
    upload_url: str
    public_url: str
    key: str
