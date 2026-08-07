from unittest.mock import patch, AsyncMock


def test_delete_comment_success(auth_client):
    with patch("app.api.admin.comment.CommentRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_comment = AsyncMock(return_value=True)

        resp = auth_client.request("DELETE", "/admin/comment/blog1/comment1")

        assert resp.status_code == 200
        assert resp.json() == {"message": "Comment deleted successfully"}


def test_delete_comment_not_found(auth_client):
    with patch("app.api.admin.comment.CommentRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_comment = AsyncMock(return_value=False)

        resp = auth_client.request("DELETE", "/admin/comment/blog1/comment1")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Comment not found"


def test_delete_comment_requires_auth(client):
    resp = client.request("DELETE", "/admin/comment/blog1/comment1")
    assert resp.status_code == 401