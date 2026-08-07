from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_admin_list_blogs_includes_drafts(auth_client):
    with patch("app.api.admin.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(return_value=[
            {
                "id": "1",
                "title": "Draft",
                "is_draft": True,
                "slug": "draft",
                "excerpt": "excerpt",
                "author": "me",
                "date": "2023",
                "readtime": "1m",
                "image": "img",
                "gallery": [],
                "tags": [],
                "content": "content",
                "created_at": "now",
                "updated_at": "now"
            }
        ])

        response = auth_client.get("/admin/blog")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["title"] == "Draft"
        assert response.json()[0]["is_draft"] is True
        mock_instance.list_blogs.assert_called_once()
        assert mock_instance.list_blogs.call_args.kwargs["include_drafts"] is True


def test_public_list_blogs_excludes_drafts():
    with patch("app.api.public.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_blogs = AsyncMock(return_value=[
            {
                "id": "1",
                "title": "Published",
                "is_draft": False,
                "slug": "pub",
                "excerpt": "excerpt",
                "author": "me",
                "date": "2023",
                "readtime": "1m",
                "image": "img",
                "gallery": [],
                "tags": [],
                "content": "content",
                "created_at": "now",
                "updated_at": "now"
            }
        ])

        response = client.get("/public/blog")
        assert response.status_code == 200
        mock_instance.list_blogs.assert_called_once()
        args, kwargs = mock_instance.list_blogs.call_args
        assert kwargs.get("include_drafts", False) is False


def test_admin_list_projects_includes_drafts(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_projects = AsyncMock(return_value=[
            {"id": "p1", "name": "Draft Project", "is_draft": True}
        ])

        response = auth_client.get("/admin/projects")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["is_draft"] is True
        mock_instance.list_projects.assert_called_once()
        assert mock_instance.list_projects.call_args.kwargs["include_drafts"] is True


def test_public_list_projects_excludes_drafts():
    with patch("app.api.public.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_projects = AsyncMock(return_value=[
            {
                "id": "p1",
                "name": "Published Project",
                "is_draft": False,
                "slug": "pub",
                "subtitle": "sub",
                "shortDesc": "short",
                "fullDesc": "full",
                "stats": [],
                "problem": "prob",
                "solution": "sol",
                "outcome": "out",
                "architecture": [],
                "challenges": [],
                "learnings": [],
                "future": [],
                "tech": [],
                "coverImage": "img",
                "color": "red",
                "github": "git",
                "live": "live",
                "document": "doc",
                "features": [],
                "screenshots": [],
                "created_at": "now",
                "updated_at": "now"
            }
        ])

        response = client.get("/public/projects")
        assert response.status_code == 200
        mock_instance.list_projects.assert_called_once()
        args, kwargs = mock_instance.list_projects.call_args
        assert kwargs.get("include_drafts", False) is False
