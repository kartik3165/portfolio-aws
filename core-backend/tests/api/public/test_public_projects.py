from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_projects_success():
    mock_projects = [
        {
            "id": "1",
            "slug": "project-1",
            "name": "Project 1",
            "shortDesc": "Desc 1",
            "coverImage": "img1.png",
            "color": "blue",
            "tech": [{"name": "Python"}]
        }
    ]

    with patch("app.api.public.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_projects.return_value = mock_projects

        response = client.get("/public/projects")
        
        assert response.status_code == 200
        # Subset match
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == "1"
        assert data[0]["name"] == "Project 1"
        mock_instance.list_projects.assert_called_once()

def test_get_project_by_slug_success():
    slug = "project-1"
    mock_project = {
        "id": "1",
        "slug": slug,
        "name": "Project 1",
        "subtitle": "Subtitle",
        "shortDesc": "Desc 1",
        "fullDesc": "Full Desc",
        "stats": [{"label": "Uptime", "value": "99%"}],
        "problem": "Problem",
        "solution": "Solution",
        "outcome": "Outcome",
        "architecture": ["Arch"],
        "challenges": ["Challenge"],
        "learnings": ["Learning"],
        "future": ["Future"],
        "tech": [{"name": "Python", "purpose": "backend"}],
        "coverImage": "img1.png",
        "color": "blue",
        "github": "git",
        "live": "live",
        "document": "doc",
        "features": ["Feature"],
        "screenshots": ["screen.png"],
        "architectureImage": None,
        "created_at": None,
        "updated_at": None
    }

    with patch("app.api.public.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_project.return_value = mock_project

        response = client.get(f"/public/projects/{slug}")
        
        assert response.status_code == 200
        assert response.json() == mock_project
        mock_instance.get_project.assert_called_once_with(slug)

def test_get_project_not_found():
    slug = "nonexistent"

    with patch("app.api.public.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_project.return_value = None

        response = client.get(f"/public/projects/{slug}")
        
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found"
