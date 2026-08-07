from unittest.mock import patch, AsyncMock


def test_add_skill_success(auth_client):
    payload = {"skill": "Python"}
    mock_response = {"skills": ["Python"]}

    with patch("app.api.admin.skills.SkillsRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.add_skill = AsyncMock(return_value=mock_response)

        response = auth_client.post("/admin/skill/add", json=payload)

        assert response.status_code == 200
        assert response.json() == mock_response
        mock_instance.add_skill.assert_called_once()


def test_remove_skill_success(auth_client):
    payload = {"skill": "Python"}
    mock_response = {"skills": []}

    with patch("app.api.admin.skills.SkillsRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.remove_skill = AsyncMock(return_value=mock_response)

        response = auth_client.post("/admin/skill/remove", json=payload)

        assert response.status_code == 200
        assert response.json() == mock_response
        mock_instance.remove_skill.assert_called_once()


def test_skills_requires_auth(client):
    assert client.post("/admin/skill/add", json={"skill": "Python"}).status_code == 401
    assert client.post("/admin/skill/remove", json={"skill": "Python"}).status_code == 401