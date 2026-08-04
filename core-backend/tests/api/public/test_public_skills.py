from unittest.mock import patch

from botocore.exceptions import ClientError
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


def test_get_skills_missing_table_returns_empty_list():
    missing_table_error = ClientError(
        {
            "Error": {
                "Code": "ResourceNotFoundException",
                "Message": "Cannot do operations on a non-existent table",
            }
        },
        "GetItem",
    )

    with patch("app.repositories.skills_repo.skills_table") as mock_table_factory:
        mock_table = mock_table_factory.return_value
        mock_table.get_item.side_effect = missing_table_error

        response = client.get("/public/skill")

        assert response.status_code == 200
        assert response.json() == {"skills": []}
