from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_skills_success():
    mock_skills = {"skills": ["Python", "JavaScript"]}

    with patch("app.api.public.skills.SkillsRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.get_skills.return_value = mock_skills

        response = client.get("/public/skill")
        
        assert response.status_code == 200
        assert response.json() == mock_skills
        mock_instance.get_skills.assert_called_once()
