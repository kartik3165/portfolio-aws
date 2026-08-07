from unittest.mock import patch, AsyncMock
from botocore.exceptions import ClientError


def test_get_experience_success(client):
    items = [{"id": "e1", "role": "SWE", "company": "Acme", "period": "2020", "location": "Pune", "description": ["x"]}]
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_experience = AsyncMock(return_value=items)
        resp = client.get("/public/experience")
        assert resp.status_code == 200
        assert resp.json() == {"experience": items}


def test_get_experience_empty(client):
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_experience = AsyncMock(return_value=[])
        resp = client.get("/public/experience")
        assert resp.status_code == 200
        assert resp.json() == {"experience": []}


def test_get_research_papers_success(client):
    items = [{"id": "p1", "title": "T", "publication": "P", "description": "D", "tags": ["a"], "link": "http://x"}]
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_papers = AsyncMock(return_value=items)
        resp = client.get("/public/research_papers")
        assert resp.status_code == 200
        assert resp.json() == {"research_papers": items}


def test_get_research_papers_empty(client):
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_papers = AsyncMock(return_value=[])
        resp = client.get("/public/research_papers")
        assert resp.status_code == 200
        assert resp.json() == {"research_papers": []}


def test_get_achievements_success(client):
    items = [{"id": "a1", "title": "A", "description": "D"}]
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_achievements = AsyncMock(return_value=items)
        resp = client.get("/public/achievements")
        assert resp.status_code == 200
        assert resp.json() == {"achievements": items}


def test_get_achievements_empty(client):
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_achievements = AsyncMock(return_value=[])
        resp = client.get("/public/achievements")
        assert resp.status_code == 200
        assert resp.json() == {"achievements": []}


def test_get_bio(client):
    with patch("app.api.public.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_bio = AsyncMock(return_value={"summary": "Sum", "hero_image": "h.webp"})
        resp = client.get("/public/bio")
        assert resp.status_code == 200
        assert resp.json() == {"data": {"bio": {"summary": "Sum", "hero_image": "h.webp"}}}