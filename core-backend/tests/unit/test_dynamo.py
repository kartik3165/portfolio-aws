import os
from unittest.mock import patch, MagicMock

import pytest

from app.db import dynamo


def test_get_region_default():
    assert dynamo.get_region() == "ap-south-1"


def test_get_dynamodb_creates_client():
    with patch.dict(os.environ, {"AWS_REGION": "us-east-1"}, clear=False), \
         patch.object(dynamo, "_dynamodb", None), \
         patch("app.db.dynamo.boto3.resource") as mock_res:
        mock_res.return_value = "dynamo-ref"
        assert dynamo.get_dynamodb() == "dynamo-ref"
        mock_res.assert_called_once()


def test_get_dynamodb_loads_endpoint():
    with patch.dict(os.environ, {"DYNAMODB_ENDPOINT": "http://localhost:8000", "AWS_REGION": "eu"}, clear=False), \
         patch.object(dynamo, "_dynamodb", None), \
         patch("app.db.dynamo.boto3.resource") as mock_res:
        dynamo.get_dynamodb()
        mock_res.assert_called_once()
        assert mock_res.call_args.kwargs["endpoint_url"] == "http://localhost:8000"


def test_get_table_missing_env_raises():
    with patch.dict(os.environ, {}, clear=False), \
         patch.object(dynamo, "_dynamodb", "dummy"), \
         patch("app.db.dynamo.get_dynamodb"):
        with pytest.raises(RuntimeError):
            dynamo.get_table("FAKE_TABLE_NOT_SET")


def test_get_table_returns_table():
    with patch.dict(os.environ, {"FAKE_TABLE_ENV": "MyTable"}, clear=False), \
         patch("app.db.dynamo.get_dynamodb") as mock_ddb:
        mock_ddb.return_value.Table.return_value = "table-ref"
        assert dynamo.get_table("FAKE_TABLE_ENV") == "table-ref"
        mock_ddb.return_value.Table.assert_called_once_with("MyTable")


@pytest.mark.parametrize("fn,env", [
    (dynamo.blogs_table, "BLOG_TABLE"),
    (dynamo.comments_table, "COMMENTS_TABLE"),
    (dynamo.skills_table, "SKILL_TABLE"),
    (dynamo.projects_table, "PROJECTS_TABLE"),
    (dynamo.profile_table, "PROFILE_TABLE"),
])
def test_table_getters(fn, env):
    with patch.dict(os.environ, {env: "TableX"}, clear=False), \
         patch("app.db.dynamo.get_table", return_value="tbl") as mock_get:
        assert fn() == "tbl"
        mock_get.assert_called_once_with(env)