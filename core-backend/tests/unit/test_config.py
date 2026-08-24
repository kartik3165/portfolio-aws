import os
from unittest.mock import MagicMock, patch

import pytest

from app.core import config


def test_local_mode_does_not_call_ssm():
    with patch("boto3.client", side_effect=AssertionError("boto3 should not be called")):
        config.load_secrets_from_ssm(config.Settings())


def test_loads_and_mirrors_secrets():
    s = config.Settings()
    s.JWT_SECRET_PARAM = "/portfolio/JWT_SECRET"
    s.ADMIN_EMAIL_PARAM = "/portfolio/ADMIN_EMAIL"
    mock_ssm = MagicMock()
    mock_ssm.get_parameters.return_value = {
        "Parameters": [
            {"Name": "/portfolio/JWT_SECRET", "Value": "jwt-val"},
            {"Name": "/portfolio/ADMIN_EMAIL", "Value": "admin@example.com"},
        ],
        "InvalidParameters": [],
    }
    with patch("boto3.client", return_value=mock_ssm) as mock_client, patch.dict(
        os.environ, {}, clear=False
    ):
        config.load_secrets_from_ssm(s)
        assert os.environ["JWT_SECRET"] == "jwt-val"
        assert os.environ["ADMIN_EMAIL"] == "admin@example.com"

    mock_client.assert_called_once()
    mock_ssm.get_parameters.assert_called_once_with(
        Names=["/portfolio/JWT_SECRET", "/portfolio/ADMIN_EMAIL"],
        WithDecryption=True,
    )
    assert s.JWT_SECRET == "jwt-val"
    assert s.ADMIN_EMAIL == "admin@example.com"
    assert s.TOTP_ENCRYPTION_KEY == ""


def test_missing_parameters_raise_without_values():
    s = config.Settings()
    s.JWT_SECRET_PARAM = "/portfolio/JWT_SECRET"
    mock_ssm = MagicMock()
    mock_ssm.get_parameters.return_value = {
        "Parameters": [],
        "InvalidParameters": ["/portfolio/JWT_SECRET"],
    }
    with patch("boto3.client", return_value=mock_ssm), pytest.raises(
        RuntimeError, match="/portfolio/JWT_SECRET"
    ):
        config.load_secrets_from_ssm(s)
