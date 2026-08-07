from unittest.mock import patch, AsyncMock


def test_create_experience_success(auth_client):
    payload = {"role": "SWE", "company": "Acme", "period": "2020-2022", "location": "Pune", "description": ["Built stuff"]}
    mock_item = {"id": "e1", **payload}

    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_experience = AsyncMock(return_value=mock_item)

        resp = auth_client.post("/admin/experience", json=payload)
        assert resp.status_code == 200
        assert resp.json() == mock_item


def test_create_experience_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_experience = AsyncMock(side_effect=ValueError("not yours"))
        resp = auth_client.post("/admin/experience", json={
            "role": "SWE", "company": "Acme", "period": "2020", "location": "Pune", "description": []
        })
        assert resp.status_code == 401


def test_update_experience_success(auth_client):
    payload = {"role": "Senior SWE"}
    mock_item = {"id": "e1", "role": "Senior SWE", "company": "Acme", "period": "2020-2022", "location": "Pune", "description": ["x"]}
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_experience = AsyncMock(return_value=mock_item)
        resp = auth_client.put("/admin/experience/e1", json=payload)
        assert resp.status_code == 200
        assert resp.json() == mock_item


def test_update_experience_patch_preserves_required_fields(auth_client):
    full = {"id": "e1", "role": "Senior SWE", "company": "Acme", "period": "2020-2022", "location": "Pune", "description": ["x"]}
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_experience = AsyncMock(return_value=full)
        resp = auth_client.put("/admin/experience/e1", json={"role": "Senior SWE"})
        assert resp.status_code == 200
        assert resp.json() == full


def test_update_experience_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_experience = AsyncMock(return_value=None)
        resp = auth_client.put("/admin/experience/e1", json={"role": "X"})
        assert resp.status_code == 404


def test_update_experience_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_experience = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.put("/admin/experience/e1", json={"role": "X"})
        assert resp.status_code == 401


def test_delete_experience_success(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_experience = AsyncMock(return_value=True)
        resp = auth_client.request("DELETE", "/admin/experience/e1")
        assert resp.status_code == 200


def test_delete_experience_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_experience = AsyncMock(return_value=False)
        resp = auth_client.request("DELETE", "/admin/experience/e1")
        assert resp.status_code == 404


def test_delete_experience_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_experience = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.request("DELETE", "/admin/experience/e1")
        assert resp.status_code == 401


def test_create_paper_success(auth_client):
    payload = {"title": "T", "publication": "P", "description": "D", "tags": ["a"], "link": "http://x"}
    mock_item = {"id": "p1", **payload}
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_paper = AsyncMock(return_value=mock_item)
        resp = auth_client.post("/admin/research_papers", json=payload)
        assert resp.status_code == 200


def test_update_paper_success(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_paper = AsyncMock(return_value={"id": "p1", "title": "new", "publication": "P", "description": "D", "tags": ["a"], "link": "http://x"})
        resp = auth_client.put("/admin/research_papers/p1", json={"title": "new"})
        assert resp.status_code == 200


def test_update_paper_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_paper = AsyncMock(return_value=None)
        resp = auth_client.put("/admin/research_papers/p1", json={"title": "new"})
        assert resp.status_code == 404


def test_delete_paper_success(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_paper = AsyncMock(return_value=True)
        resp = auth_client.request("DELETE", "/admin/research_papers/p1")
        assert resp.status_code == 200


def test_delete_paper_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_paper = AsyncMock(return_value=False)
        resp = auth_client.request("DELETE", "/admin/research_papers/p1")
        assert resp.status_code == 404


def test_create_achievement_success(auth_client):
    payload = {"title": "A", "description": "D"}
    mock_item = {"id": "a1", **payload}
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_achievement = AsyncMock(return_value=mock_item)
        resp = auth_client.post("/admin/achievements", json=payload)
        assert resp.status_code == 200


def test_update_achievement_success(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_achievement = AsyncMock(return_value={"id": "a1", "title": "new", "description": "D"})
        resp = auth_client.put("/admin/achievements/a1", json={"title": "new"})
        assert resp.status_code == 200


def test_update_achievement_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_achievement = AsyncMock(return_value=None)
        resp = auth_client.put("/admin/achievements/a1", json={"title": "new"})
        assert resp.status_code == 404


def test_delete_achievement_success(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_achievement = AsyncMock(return_value=True)
        resp = auth_client.request("DELETE", "/admin/achievements/a1")
        assert resp.status_code == 200


def test_delete_achievement_not_found(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_achievement = AsyncMock(return_value=False)
        resp = auth_client.request("DELETE", "/admin/achievements/a1")
        assert resp.status_code == 404


def test_update_bio_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_bio = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.put("/admin/bio", json={"summary": "S", "highlights": [], "about_intro": "i", "story": "s"})
        assert resp.status_code == 401


def test_update_bio_failed(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_bio = AsyncMock(return_value=False)
        resp = auth_client.put("/admin/bio", json={"summary": "S", "highlights": [], "about_intro": "i", "story": "s"})
        assert resp.status_code == 500


def test_create_paper_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_paper = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.post("/admin/research_papers", json={
            "title": "T", "publication": "P", "description": "D", "tags": ["a"], "link": "http://x"
        })
        assert resp.status_code == 401


def test_update_paper_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_paper = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.put("/admin/research_papers/p1", json={"title": "new"})
        assert resp.status_code == 401


def test_delete_paper_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_paper = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.request("DELETE", "/admin/research_papers/p1")
        assert resp.status_code == 401


def test_create_achievement_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.create_achievement = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.post("/admin/achievements", json={"title": "A", "description": "D"})
        assert resp.status_code == 401


def test_update_achievement_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.update_achievement = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.put("/admin/achievements/a1", json={"title": "new"})
        assert resp.status_code == 401


def test_delete_achievement_value_error(auth_client):
    with patch("app.api.admin.profile.ProfileRepo") as MockRepo:
        mock_instance = MockRepo.return_value
        mock_instance.delete_achievement = AsyncMock(side_effect=ValueError("nope"))
        resp = auth_client.request("DELETE", "/admin/achievements/a1")
        assert resp.status_code == 401


def test_admin_profile_requires_auth(client):
    assert client.post("/admin/experience", json={}).status_code == 401
    assert client.post("/admin/research_papers", json={}).status_code == 401
    assert client.post("/admin/achievements", json={}).status_code == 401