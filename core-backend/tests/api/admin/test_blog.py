from unittest.mock import patch, AsyncMock


def test_create_blog_success(auth_client):
    payload = {
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
    }

    mock_response = {
        "id": "123",
        **payload,
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00",
    }

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_blog = AsyncMock(return_value=mock_response)

        response = auth_client.post("/admin/blog", json=payload)

        assert response.status_code == 200
        assert response.json() == mock_response
        mock_instance.create_blog.assert_called_once()


def test_update_blog_success(auth_client):
    blog_id = "123"
    payload = {"title": "Updated Blog Title"}

    expected_response = {
        "id": blog_id,
        "title": "Updated Blog Title",
        "slug": "test-blog",
        "excerpt": "Blog excerpt",
        "author": "Author Name",
        "date": "2023-01-01",
        "readtime": "5 min",
        "image": "http://image.com/blog.png",
        "gallery": [],
        "tags": ["Tag1"],
        "content": "Blog content",
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00",
    }

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_blog = AsyncMock(return_value=expected_response)

        response = auth_client.put(f"/admin/blog/{blog_id}", json=payload)

        assert response.status_code == 200
        assert response.json() == expected_response
        mock_instance.update_blog.assert_called_once()


def test_update_blog_not_found(auth_client):
    blog_id = "nonexistent"
    payload = {"title": "Updated Blog Title"}

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_blog = AsyncMock(return_value=None)

        response = auth_client.put(f"/admin/blog/{blog_id}", json=payload)

        assert response.status_code == 404


def test_delete_blog_success(auth_client):
    blog_id = "123"

    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_blog = AsyncMock(return_value=True)

        response = auth_client.request("DELETE", f"/admin/blog/{blog_id}")

        assert response.status_code == 200
        assert response.json() == {"message": f"Blog deleted successfully of id {blog_id}"}


def test_blog_requires_auth(client):
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(return_value=[])

        response = client.get("/admin/blog")

        assert response.status_code == 401
