from botocore.exceptions import ClientError


def test_get_bio_empty(client, mock_dynamo_table):
    # Mock get_item to return empty
    mock_dynamo_table.get_item.return_value = {}
    
    response = client.get("/public/bio")
    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "bio": {}
        }
    }

def test_get_bio_exists(client, mock_dynamo_table):
    mock_data = {
        "summary": "Sum",
        "highlights": ["H1"],
        "about_intro": "Intro",
        "story": "Story",
        "PK": "METADATA#BIO",
        "SK": "PROFILE"
    }
    mock_dynamo_table.get_item.return_value = {"Item": mock_data}
    
    response = client.get("/public/bio")
    assert response.status_code == 200
    data = response.json()["data"]["bio"]
    assert data["summary"] == "Sum"
    assert "PK" not in data # Should be removed by repo


def test_get_bio_missing_table_returns_empty(client, mock_dynamo_table):
    mock_dynamo_table.get_item.side_effect = ClientError(
        {
            "Error": {
                "Code": "ResourceNotFoundException",
                "Message": "Cannot do operations on a non-existent table",
            }
        },
        "GetItem",
    )

    response = client.get("/public/bio")

    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "bio": {}
        }
    }
