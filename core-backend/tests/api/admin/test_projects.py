from unittest.mock import patch, AsyncMock

from botocore.exceptions import ClientError


def _project_payload():
    return {
        "slug": "test-project",
        "name": "Test Project",
        "subtitle": "A test project",
        "shortDesc": "Short description",
        "fullDesc": "Full description",
        "stats": [{"label": "Uptime", "value": "99%"}],
        "problem": "Problem statement",
        "solution": "Solution statement",
        "outcome": "Outcome statement",
        "architectureMermaid": None,
        "challenges": ["Challenge 1"],
        "learnings": ["Learning 1"],
        "future": ["Future plan"],
        "tech": [{"name": "Python", "purpose": "backend"}],
        "coverImage": "http://image.com/cover.png",
        "color": "blue",
        "github": "http://github.com",
        "live": "http://live.com",
        "document": "http://doc.com",
        "features": ["Feature 1"],
        "screenshots": ["http://image.com/screen1.png"],
    }


def _conditional_error():
    return ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException", "Message": "conflict"}},
        "PutItem",
    )


def test_create_project_success(auth_client):
    payload = _project_payload()
    mock_response = {
        "id": "123",
        **payload,
        "is_draft": False,
        "created_at": "2023-01-01T00:00:00",
        "updated_at": "2023-01-01T00:00:00",
    }

    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_project = AsyncMock(return_value=mock_response)

        response = auth_client.post("/admin/projects", json=payload)

        assert response.status_code == 200
        assert response.json() == mock_response
        mock_instance.create_project.assert_called_once()


def test_create_project_value_error(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_project = AsyncMock(side_effect=ValueError("not yours"))

        response = auth_client.post("/admin/projects", json=_project_payload())

        assert response.status_code == 401


def test_create_project_conflict(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_project = AsyncMock(side_effect=_conditional_error())

        response = auth_client.post("/admin/projects", json=_project_payload())

        assert response.status_code == 409
        assert response.json()["detail"] == "Project already exists"


def test_create_project_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "PutItem")
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_project = AsyncMock(side_effect=err)

        response = auth_client.post("/admin/projects", json=_project_payload())

        assert response.status_code == 400


def test_list_all_projects_success(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_projects = AsyncMock(return_value=[])

        response = auth_client.get("/admin/projects")

        assert response.status_code == 200
        assert response.json() == []


def test_list_all_projects_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "Query")
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.list_projects = AsyncMock(side_effect=err)

        response = auth_client.get("/admin/projects")

        assert response.status_code == 400


def test_update_project_success(auth_client):
    project_id = "123"
    payload = {"name": "Updated Project"}
    expected_response = {**_project_payload(), "id": project_id, "name": "Updated Project",
                         "is_draft": False, "created_at": "now", "updated_at": "now"}

    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_project = AsyncMock(return_value=expected_response)

        response = auth_client.put(f"/admin/projects/{project_id}", json=payload)

        assert response.status_code == 200
        assert response.json() == expected_response
        mock_instance.update_project.assert_called_once()


def test_update_project_not_found(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_project = AsyncMock(return_value=None)

        response = auth_client.put("/admin/projects/123", json={"name": "Updated Project"})

        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found"


def test_update_project_value_error(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_project = AsyncMock(side_effect=ValueError("not yours"))

        response = auth_client.put("/admin/projects/123", json={"name": "x"})

        assert response.status_code == 401


def test_update_project_conflict(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_project = AsyncMock(side_effect=_conditional_error())

        response = auth_client.put("/admin/projects/123", json={"name": "x"})

        assert response.status_code == 404


def test_update_project_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "UpdateItem")
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_project = AsyncMock(side_effect=err)

        response = auth_client.put("/admin/projects/123", json={"name": "x"})

        assert response.status_code == 400


def test_delete_project_success(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_project = AsyncMock(return_value=True)

        response = auth_client.request("DELETE", "/admin/projects/123")

        assert response.status_code == 200
        assert response.json() == {"message": "Project deleted successfully"}


def test_delete_project_value_error(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_project = AsyncMock(side_effect=ValueError("not yours"))

        response = auth_client.request("DELETE", "/admin/projects/123")

        assert response.status_code == 401


def test_delete_project_conflict(auth_client):
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_project = AsyncMock(side_effect=_conditional_error())

        response = auth_client.request("DELETE", "/admin/projects/123")

        assert response.status_code == 404


def test_delete_project_client_error(auth_client):
    err = ClientError({"Error": {"Code": "X", "Message": "boom"}}, "DeleteItem")
    with patch("app.api.admin.projects.ProjectRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_project = AsyncMock(side_effect=err)

        response = auth_client.request("DELETE", "/admin/projects/123")

        assert response.status_code == 400


def test_projects_requires_auth(client):
    response = client.get("/admin/projects")
    assert response.status_code == 401