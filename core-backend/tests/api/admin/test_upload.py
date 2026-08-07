from unittest.mock import patch
from io import BytesIO


def test_generate_presigned_url_success(auth_client):
    payload = {
        "filename": "test.png",
        "content_type": "image/png",
        "folder": "blogs",
    }

    mock_response = {
        "upload_url": "http://s3.upload/url",
        "public_url": "http://public.url/blogs/uuid.png",
        "key": "blogs/uuid.png",
    }

    with patch("app.api.admin.upload.StorageService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.generate_presigned_url.return_value = mock_response

        response = auth_client.post("/admin/upload/presigned-url", json=payload)

        assert response.status_code == 200
        assert response.json() == mock_response


def test_generate_presigned_url_rejects_disallowed_extension(auth_client):
    payload = {
        "filename": "malicious.html",
        "content_type": "text/html",
        "folder": "blogs",
    }

    response = auth_client.post("/admin/upload/presigned-url", json=payload)

    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]


def test_generate_presigned_url_rejects_no_extension(auth_client):
    response = auth_client.post("/admin/upload/presigned-url", json={"filename": "noext", "folder": "blogs"})
    assert response.status_code == 400


def test_generate_presigned_url_rejects_invalid_folder(auth_client):
    response = auth_client.post("/admin/upload/presigned-url", json={"filename": "a.png", "folder": "bad folder!"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid folder name"


def test_generate_presigned_url_failure(auth_client):
    payload = {
        "filename": "test.png",
        "content_type": "image/png",
        "folder": "blogs",
    }

    with patch("app.api.admin.upload.StorageService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.generate_presigned_url.side_effect = Exception("S3 error")

        response = auth_client.post("/admin/upload/presigned-url", json=payload)

        assert response.status_code == 500
        assert response.json()["detail"] == "Failed to generate upload URL"


def test_upload_file_success(auth_client):
    with patch("app.api.admin.upload.StorageService") as MockService, \
         patch("app.api.admin.upload.uuid7", return_value="uuid123"):
        mock_instance = MockService.return_value
        mock_instance.bucket_name = "bucket"
        mock_instance.public_base_url = "https://cdn.example.com"
        mock_instance.s3_client.put_object.return_value = {}

        response = auth_client.post(
            "/admin/upload/upload-file",
            files={"file": ("photo.png", BytesIO(b"data"), "image/png")},
            data={"folder": "blogs"},
        )

        assert response.status_code == 200
        body = response.json()
        assert body["key"] == "blogs/uuid123.png"
        assert body["public_url"].endswith("blogs/uuid123.png")


def test_upload_file_rejects_disallowed_extension(auth_client):
    response = auth_client.post(
        "/admin/upload/upload-file",
        files={"file": ("bad.html", BytesIO(b"<html>"), "text/html")},
        data={"folder": "blogs"},
    )
    assert response.status_code == 400


def test_upload_file_rejects_invalid_folder(auth_client):
    response = auth_client.post(
        "/admin/upload/upload-file",
        files={"file": ("a.png", BytesIO(b"data"), "image/png")},
        data={"folder": "bad folder!"},
    )
    assert response.status_code == 400


def test_upload_file_too_large(auth_client):
    with patch("app.api.admin.upload.StorageService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.s3_client.put_object.return_value = {}
        response = auth_client.post(
            "/admin/upload/upload-file",
            files={"file": ("big.png", BytesIO(b"x" * 11 * 1024 * 1024), "image/png")},
            data={"folder": "blogs"},
        )
        assert response.status_code == 413


def test_upload_file_failure(auth_client):
    with patch("app.api.admin.upload.StorageService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.bucket_name = "bucket"
        mock_instance.s3_client.put_object.side_effect = Exception("boom")
        response = auth_client.post(
            "/admin/upload/upload-file",
            files={"file": ("a.png", BytesIO(b"data"), "image/png")},
            data={"folder": "blogs"},
        )
        assert response.status_code == 500


def test_upload_requires_auth(client):
    assert client.post("/admin/upload/presigned-url", json={"filename": "a.png", "folder": "blogs"}).status_code == 401
