import os
from unittest.mock import patch, MagicMock

import pytest

from app.services.storage import StorageService


@patch.dict(os.environ, {
    "R2_ACCOUNT_ID": "acct",
    "R2_ACCESS_KEY_ID": "ak",
    "R2_SECRET_ACCESS_KEY": "sk",
    "R2_BUCKET_NAME": "bucket",
    "R2_PUBLIC_BASE_URL": "https://cdn.example.com",
}, clear=False)
def test_init_configures_client():
    with patch("app.services.storage.boto3.client") as mock_client:
        service = StorageService()
        assert service.bucket_name == "bucket"
        assert service.s3_client is mock_client.return_value
        mock_client.assert_called_once()


@patch.dict(os.environ, {
    "R2_ACCOUNT_ID": "",
    "R2_ACCESS_KEY_ID": "",
    "R2_SECRET_ACCESS_KEY": "",
    "R2_BUCKET_NAME": "",
}, clear=False)
def test_init_missing_credentials_raises():
    with pytest.raises(RuntimeError):
        StorageService()


def test_generate_presigned_url_success():
    service = StorageService.__new__(StorageService)
    service.bucket_name = "bucket"
    service.public_base_url = "https://cdn.example.com/"
    client = MagicMock()
    client.generate_presigned_url.return_value = "http://upload/url"
    service.s3_client = client

    result = service.generate_presigned_url("blogs/uuid.png", "image/png")

    assert result == {
        "upload_url": "http://upload/url",
        "public_url": "https://cdn.example.com/blogs/uuid.png",
        "key": "blogs/uuid.png",
    }
    client.generate_presigned_url.assert_called_once()


def test_generate_presigned_url_error():
    service = StorageService.__new__(StorageService)
    service.bucket_name = "bucket"
    service.public_base_url = "https://cdn.example.com"
    client = MagicMock()
    client.generate_presigned_url.side_effect = Exception("boom")
    service.s3_client = client

    with pytest.raises(Exception):
        service.generate_presigned_url("photos/uuid.png", "image/png")