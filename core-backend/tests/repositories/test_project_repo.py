import asyncio

from unittest.mock import MagicMock, patch
import pytest

from botocore.exceptions import ClientError


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


class TestProjectRepo:
    def test_list_projects_filters_drafts(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {
                "Items": [
                    {"id": "p1", "is_draft": False},
                    {"id": "p2", "is_draft": True},
                ]
            }
            items = run(ProjectRepo().list_projects())
            assert [i["id"] for i in items] == ["p1"]

    def test_list_projects_include_drafts(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "p2", "is_draft": True}]}
            items = run(ProjectRepo().list_projects(include_drafts=True))
            assert [i["id"] for i in items] == ["p2"]

    def test_list_projects_error(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeError")
            assert run(ProjectRepo().list_projects()) == []

    def test_get_project_error(self):
        from app.repositories.project_repo import ProjectRepo
        from app.repositories.project_repo import ClientError
        from app.repositories.project_repo import Key, Attr
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("SomeError")
            assert run(ProjectRepo().get_project("p1")) is None

    def test_get_project_by_id(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "p1", "name": "x"}}
            item = run(ProjectRepo().get_project("p1"))
            assert item["name"] == "x"

    def test_get_project_by_slug(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": [{"id": "p1", "slug": "my-proj"}]}
            item = run(ProjectRepo().get_project("my-proj"))
            assert item["slug"] == "my-proj"

    def test_get_project_missing(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": []}
            assert run(ProjectRepo().get_project("nope")) is None

    def test_create_project(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory, \
             patch("app.repositories.project_repo.uuid7", return_value="uuid123"):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            item = run(ProjectRepo().create_project({"name": "Proj"}, "a@x"))
            assert item["id"] == "uuid123"
            assert item["name"] == "Proj"
            tbl.put_item.assert_called_once()

    def test_create_project_error_raises(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.put_item.side_effect = _client_error("ConditionalCheckFailedException")
            with pytest.raises(ClientError):
                run(ProjectRepo().create_project({"name": "Proj"}, "a@x"))

    def test_update_project_skips_none(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "real", "name": "old"}}
            tbl.update_item.return_value = {"Attributes": {"id": "real", "name": "new"}}
            got = run(ProjectRepo().update_project("real", {"name": "new", "subtitle": None}, "a@x"))
            assert got["name"] == "new"

    def test_update_project_empty_updates_returns_current(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "real", "name": "cur"}}
            got = run(ProjectRepo().update_project("real", {}, "a@x"))
            assert got["name"] == "cur"

    def test_update_project_not_found(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": []}
            assert run(ProjectRepo().update_project("nope", {"name": "x"}, "a@x")) is None

    def test_update_project_error_raises(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "real", "name": "old"}}
            tbl.update_item.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(ProjectRepo().update_project("real", {"name": "x"}, "a@x"))

    def test_delete_project_success(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.return_value = {}
            assert run(ProjectRepo().delete_project("p1", "a@x")) is True

    def test_delete_project_error_raises(self):
        from app.repositories.project_repo import ProjectRepo
        with patch("app.repositories.project_repo.projects_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(ProjectRepo().delete_project("p1", "a@x"))