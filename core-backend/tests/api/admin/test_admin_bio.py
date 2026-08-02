from unittest.mock import patch


def test_update_bio_success(auth_client, mock_dynamo_table):
    mock_dynamo_table.put_item.return_value = {}

    payload = {
        "summary": "Sum",
        "highlights": ["H1"],
        "about_intro": "Intro",
        "story": "Story",
    }

    response = auth_client.put("/admin/bio", json=payload)
    assert response.status_code == 200
    assert response.json()["status"] == "success"


def test_update_bio_unauthorized(client, mock_dynamo_table):
    payload = {
        "summary": "Sum",
        "highlights": ["H1"],
        "about_intro": "Intro",
        "story": "Story",
    }

    response = client.put("/admin/bio", json=payload)
    assert response.status_code == 401
