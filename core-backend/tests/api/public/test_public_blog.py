from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all_blogs_success():
    mock_blogs = [
        {
            "id": "1",
            "slug": "blog-1",
            "title": "Blog 1",
            "excerpt": "Excerpt 1",
            "author": "Author",
            "date": "2023-01-01",
            "readtime": "5 min",
            "image": "img1.png",
            "gallery": [],
            "tags": ["Tag1"],
            "content": "Content 1",
            "created_at": "2023-01-01",
            "updated_at": "2023-01-01"
        }
    ]

    with patch("app.api.public.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(return_value=mock_blogs)

        response = client.get("/public/blog")
        
        assert response.status_code == 200
        assert response.json() == mock_blogs
        mock_instance.list_blogs.assert_called_once()

def test_get_blog_by_slug_success():
    slug = "blog-1"
    mock_blog = {
        "id": "1",
        "slug": slug,
        "title": "Blog 1",
        "excerpt": "Excerpt 1",
        "author": "Author",
        "date": "2023-01-01",
        "readtime": "5 min",
        "image": "img1.png",
        "gallery": [],
        "tags": ["Tag1"],
        "content": "Content",
        "created_at": "2023-01-01",
        "updated_at": "2023-01-01"
    }

    with patch("app.api.public.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_blog = AsyncMock(return_value=mock_blog)

        response = client.get(f"/public/blog/{slug}")
        
        assert response.status_code == 200
        assert response.json() == mock_blog
        mock_instance.get_blog.assert_called_once_with(slug)

def test_get_blog_not_found():
    slug = "nonexistent"

    with patch("app.api.public.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_blog = AsyncMock(return_value=None)

        response = client.get(f"/public/blog/{slug}")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Blog not found"
