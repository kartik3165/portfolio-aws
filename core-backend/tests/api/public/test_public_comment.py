from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_comments_success():
    blog_id = "00000000-0000-0000-0000-000000000001"
    mock_comments = [
        {
            "id": "c1",
            "name": "User 1",
            "body": "Nice blog",
            "date": "2023-01-01",
            "timestamp": "1234567890"
        }
    ]

    with patch("app.api.public.comment.CommentRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_comments.return_value = mock_comments

        response = client.get(f"/public/comment/{blog_id}")
        
        assert response.status_code == 200
        assert response.json() == mock_comments
        # Assert called with UUID object
        from uuid import UUID
        mock_instance.list_comments.assert_called_once_with(UUID(blog_id))

def test_add_comment_success():
    blog_id = "00000000-0000-0000-0000-000000000001"
    payload = {
        "name": "User 2",
        "body": "Great post"
    }
    mock_comment = {
        "id": "c2",
        "name": "User 2",
        "body": "Great post",
        "date": "2023-01-02",
        "timestamp": "1234567891"
    }

    with patch("app.api.public.comment.CommentRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_comment.return_value = mock_comment

        response = client.post(f"/public/comment/{blog_id}", json=payload)
        
        assert response.status_code == 200
        assert response.json() == mock_comment
        mock_instance.create_comment.assert_called_once()
