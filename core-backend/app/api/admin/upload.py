import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.core.security import get_current_email
from app.schemas.upload import PresignedUrlResponse, UploadRequest
from app.services.storage import StorageService

from uuid6 import uuid7
from typing import Dict

router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

# Extension whitelist (SVG/HTML excluded to prevent stored-XSS via the public bucket)
ALLOWED_EXTENSIONS = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "avif": "image/avif",
    "ico": "image/x-icon",
    "pdf": "application/pdf",
    "mp4": "video/mp4",
    "webm": "video/webm",
}

FOLDER_PATTERN = re.compile(r"^[\w-]{1,50}$")


def _validate_folder(folder: str) -> None:
    if not FOLDER_PATTERN.fullmatch(folder or ""):
        raise HTTPException(status_code=400, detail="Invalid folder name")


def _validate_filename(filename: str) -> str:
    """Return the allowed extension of filename or raise 400"""
    if not filename or "." not in filename:
        raise HTTPException(status_code=400, detail="File must have an extension")
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    return ext


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def generate_presigned_url(request: UploadRequest, email: str = Depends(get_current_email)):
    try:
        ext = _validate_filename(request.filename)
        _validate_folder(request.folder)
        service = StorageService()
        key = f"{request.folder}/{uuid7()}.{ext}"
        # Content-Type is server-derived, not client-controlled
        return service.generate_presigned_url(key, ALLOWED_EXTENSIONS[ext])
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")


@router.post("/upload-file", response_model=Dict[str, str])
async def upload_file(
    file: UploadFile = File(...),
    folder: str = Form(...),
    email: str = Depends(get_current_email),
):
    """
    Upload file directly through backend to R2 (avoids CORS issues with presigned URLs).
    """
    try:
        ext = _validate_filename(file.filename or "")
        _validate_folder(folder)

        content = await file.read()
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

        service = StorageService()
        key = f"{folder}/{uuid7()}.{ext}"

        service.s3_client.put_object(
            Bucket=service.bucket_name,
            Key=key,
            Body=content,
            ContentType=ALLOWED_EXTENSIONS[ext],
        )

        base_url = (service.public_base_url or "").rstrip("/")
        public_url = f"{base_url}/{key}"

        return {"public_url": public_url, "key": key}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")
