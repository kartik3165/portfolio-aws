from unittest.mock import patch, AsyncMock

from botocore.exceptions import ClientError


BLOG_PAYLOAD = {
    "slug": "test-blog",
    "title": "Test Blog",
    "excerpt": "Blog excerpt",
    "author": "Author Name",
    "date": "2023-01-01",
    "readtime": "5 min",
    "image": "http://image.com/blog.png",
    "gallery": [],
    "tags": ["Tag1"],
    "content": "Blog content",
    "is_draft": False,
}


def _async_repo():
    mock = AsyncMock()
    mock_instance = mock.return_value
    return mock, mock_instance


def test_create_blog_success(auth_client):
    mock_response = {
        "id": "123",
        **{k: v for k, v in BLOG_PAYLOAD.items() if k != "is_draft"},
        "is_draft": False,
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00",
    }

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_blog = AsyncMock(return_value=mock_response)

        response = auth_client.post("/admin/blog", json=BLOG_PAYLOAD)

        assert response.status_code == 200
        assert response.json() == mock_response
        mock_instance.create_blog.assert_called_once()


def test_create_blog_client_error(auth_client):
    err = ClientError({"Error": {"Code": "SomeError", "Message": "boom"}}, "PutItem")
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_blog = AsyncMock(side_effect=err)

        response = auth_client.post("/admin/blog", json=BLOG_PAYLOAD)

        assert response.status_code == 400


def test_list_all_blogs_success(auth_client):
    mock_blog = {**BLOG_PAYLOAD, "id": "1", "created_at": "now", "updated_at": "now"}
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(return_value=[mock_blog])

        response = auth_client.get("/admin/blog")

        assert response.status_code == 200
        assert response.json() == [mock_blog]


def test_list_all_blogs_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "Query")
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(side_effect=err)

        response = auth_client.get("/admin/blog")

        assert response.status_code == 404


def test_update_blog_success(auth_client):
    blog_id = "123"
    payload = {"title": "Updated Blog Title"}
    expected_response = {**BLOG_PAYLOAD, "id": blog_id, "title": "Updated Blog Title",
                         "created_at": "now", "updated_at": "now"}

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_blog = AsyncMock(return_value=expected_response)

        response = auth_client.put(f"/admin/blog/{blog_id}", json=payload)

        assert response.status_code == 200
        assert response.json() == expected_response
        mock_instance.update_blog.assert_called_once()


def test_update_blog_not_found(auth_client):
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_blog = AsyncMock(return_value=None)

        response = auth_client.put("/admin/blog/123", json={"title": "x"})

        assert response.status_code == 404


def test_update_blog_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "UpdateItem")
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_blog = AsyncMock(side_effect=err)

        response = auth_client.put("/admin/blog/123", json={"title": "x"})

        assert response.status_code == 404


def test_delete_blog_success(auth_client):
    blog_id = "123"
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_blog = AsyncMock(return_value=True)

        response = auth_client.request("DELETE", f"/admin/blog/{blog_id}")

        assert response.status_code == 200
        assert response.json() == {"message": f"Blog deleted successfully of id {blog_id}"}


def test_delete_blog_not_found(auth_client):
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_blog = AsyncMock(return_value=False)

        response = auth_client.request("DELETE", "/admin/blog/123")

        assert response.status_code == 404


def test_delete_blog_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "DeleteItem")
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_blog = AsyncMock(side_effect=err)

        response = auth_client.request("DELETE", "/admin/blog/123")

        assert response.status_code == 404


def test_blog_requires_auth(client):
    response = client.get("/admin/blog")
    assert response.status_code == 401