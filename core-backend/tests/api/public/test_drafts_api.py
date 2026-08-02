
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_list_blogs_includes_drafts():
    # Mock verify_passkey
    with patch("app.api.admin.blog.verify_passkey"):
        # Mock BlogRepo
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

            response = client.get("/admin/blog?passkey=secret")
            
            # Note: passkey is query param or separate? 
            # Reviewing admin/blog.py: list_all_blogs(passkey: str) -> query param
            
            assert response.status_code == 200
            assert len(response.json()) == 1
            assert response.json()[0]["title"] == "Draft"
            assert "is_draft" in response.json()[0]
            assert response.json()[0]["is_draft"] is True
            mock_instance.list_blogs.assert_called_once_with(include_drafts=True)

def test_public_list_blogs_excludes_drafts():
     with patch("app.api.public.blog.BlogRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        # Public API calls list_projects()
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
        # Verify it did NOT call with include_drafts=True
        # We can check args. 
        # call_args is (args, kwargs)
        args, kwargs = mock_instance.list_blogs.call_args
        assert kwargs.get("include_drafts", False) is False
        
        # KEY CHECK: is_draft field should NOT be in the response
        if len(response.json()) > 0:
             assert "is_draft" not in response.json()[0]

def test_admin_list_projects_includes_drafts():
    with patch("app.api.admin.projects.verify_passkey"):
        with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
            mock_instance = MockRepo.return_value
            mock_instance.list_projects = MagicMock(return_value=[
                {"id": "p1", "name": "Draft Project", "is_draft": True}
            ])

            response = client.get("/admin/projects?passkey=secret")
            
            assert response.status_code == 200
            assert len(response.json()) == 1
            assert "is_draft" in response.json()[0]
            mock_instance.list_projects.assert_called_once_with(include_drafts=True)

def test_public_list_projects_excludes_drafts():
    with patch("app.api.public.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        # Public API calls list_projects()
        mock_instance.list_projects = MagicMock(return_value=[
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
        
        # KEY CHECK: is_draft field should NOT be in the response
        if len(response.json()) > 0:
             assert "is_draft" not in response.json()[0]
