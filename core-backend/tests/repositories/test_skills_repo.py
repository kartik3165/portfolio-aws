import asyncio

from unittest.mock import MagicMock, patch
import pytest

from botocore.exceptions import ClientError


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


class TestSkillsRepo:
    def test_get_skills_with_items(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"skills": ["Python", "AWS"]}}
            assert run(SkillsRepo().get_skills()) == {"skills": ["Python", "AWS"]}

    def test_get_skills_empty_item(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            assert run(SkillsRepo().get_skills()) == {"skills": []}

    def test_get_skills_item_no_skills_key(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {}}
            assert run(SkillsRepo().get_skills()) == {"skills": []}

    def test_get_skills_not_found(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("ResourceNotFoundException")
            assert run(SkillsRepo().get_skills()) == {"skills": []}

    def test_get_skills_other_error_raises(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(SkillsRepo().get_skills())

    def test_add_skill(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {}
            # get_skills called after add
            tbl.get_item.return_value = {"Item": {"skills": ["Python"]}}
            assert run(SkillsRepo().add_skill("Python", "a@x")) == {"skills": ["Python"]}

    def test_remove_skill(self):
        from app.repositories.skills_repo import SkillsRepo
        with patch("app.repositories.skills_repo.skills_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {}
            tbl.get_item.return_value = {"Item": {"skills": ["Python", "AWS"]}}
            got = run(SkillsRepo().remove_skill("Python", "a@x"))
            assert got == {"skills": ["AWS"]}