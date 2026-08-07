import asyncio

from unittest.mock import MagicMock, patch
import pytest

from botocore.exceptions import ClientError


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


class TestBlogRepo:
    def test_init_sets_table(self, mocker):
        tbl = MagicMock()
        mocker.patch("app.repositories.blog_repo.blogs_table", return_value=tbl)
        from app.repositories.blog_repo import BlogRepo
        repo = BlogRepo()
        assert repo.table is tbl

    def test_list_blogs_filters_drafts(self, mocker):
        tbl = MagicMock()
        mocker.patch("app.repositories.blog_repo.blogs_table", return_value=tbl)
        from app.repositories.blog_repo import BlogRepo
        tbl.query.return_value = {
            "Items": [
                {"id": "1", "title": "pub", "is_draft": False},
                {"id": "2", "title": "draft", "is_draft": True},
                {"id": "3", "title": "default"},
            ]
        }
        items = run(BlogRepo().list_blogs())
        ids = [i["id"] for i in items]
        assert ids == ["1", "3"]

    def test_list_blogs_includes_drafts(self, mocker):
        tbl = MagicMock()
        mocker.patch("app.repositories.blog_repo.blogs_table", return_value=tbl)
        from app.repositories.blog_repo import BlogRepo
        tbl.query.return_value = {"Items": [{"id": "1", "is_draft": True}]}
        items = run(BlogRepo().list_blogs(include_drafts=True))
        assert [i["id"] for i in items] == ["1"]

    def test_list_blogs_not_found_returns_empty(self, mocker):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("ResourceNotFoundException")
            assert run(BlogRepo().list_blogs()) == []

    def test_list_blogs_other_error_raises(self, mocker):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(BlogRepo().list_blogs())

    def test_list_blogs_adds_slug_from_id(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "abc"}]}
            items = run(BlogRepo().list_blogs())
            assert items[0]["slug"] == "abc"

    def test_get_blog_by_id(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "1", "title": "x"}}
            item = run(BlogRepo().get_blog("1"))
            assert item == {"id": "1", "title": "x"}

    def test_get_blog_by_slug(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": [{"id": "1", "slug": "my-slug"}]}
            item = run(BlogRepo().get_blog("my-slug"))
            assert item["slug"] == "my-slug"

    def test_get_blog_by_slug_empty(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": []}
            assert run(BlogRepo().get_blog("nope")) is None

    def test_get_blog_resource_not_found(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("ResourceNotFoundException")
            assert run(BlogRepo().get_blog("x")) is None

    def test_get_blog_other_error_raises(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(BlogRepo().get_blog("x"))

    def test_get_blog_by_slug_query_resource_not_found(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.side_effect = _client_error("ResourceNotFoundException")
            assert run(BlogRepo().get_blog("my-slug")) is None

    def test_get_blog_by_slug_query_other_error_raises(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.side_effect = _client_error("SomeError")
            with pytest.raises(ClientError):
                run(BlogRepo().get_blog("my-slug"))

    def test_create_blog(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory, \
             patch("app.repositories.blog_repo.uuid7", return_value="uuid123"):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            data = {
                "title": "T", "slug": "s", "excerpt": "e", "author": "a",
                "date": "d", "readtime": "r", "image": "i", "tags": ["t"], "content": "c",
            }
            item = run(BlogRepo().create_blog(data, "admin@x"))
            assert item["id"] == "uuid123"
            assert item["is_draft"] is False
            assert item["gallery"] == []
            tbl.put_item.assert_called_once()

    def test_update_blog_resolves_slug_to_id(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "real-id", "title": "old"}}
            tbl.update_item.return_value = {"Attributes": {"id": "real-id", "title": "new"}}
            got = run(BlogRepo().update_blog("some-slug", {"title": "new"}, "a@x"))
            assert got["title"] == "new"

    def test_update_blog_not_found(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            tbl.query.return_value = {"Items": []}
            assert run(BlogRepo().update_blog("nope", {"title": "x"}, "a@x")) is None

    def test_update_blog(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {"Item": {"id": "1", "title": "cur"}}
            tbl.update_item.return_value = {"Attributes": {"id": "1", "title": "new"}}
            got = run(BlogRepo().update_blog("1", {"title": "new"}, "a@x"))
            assert got["title"] == "new"

    def test_delete_blog_success(self):
        from app.repositories.blog_repo import BlogRepo
        with patch("app.repositories.blog_repo.blogs_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.return_value = {}
            assert run(BlogRepo().delete_blog("1", "a@x")) is True