import asyncio

from unittest.mock import MagicMock, patch
import pytest

from botocore.exceptions import ClientError


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


class TestCommentRepo:
    def test_list_comments(self):
        from app.repositories.comment_repo import CommentRepo
        with patch("app.repositories.comment_repo.comments_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "c1"}]}
            from uuid import UUID
            items = run(CommentRepo().list_comments(UUID(int=1)))
            assert items == [{"id": "c1"}]

    def test_create_comment(self):
        from app.repositories.comment_repo import CommentRepo
        from uuid import UUID
        mock_uuid = UUID("cafe0000-0000-0000-0000-000000000000")
        with patch("app.repositories.comment_repo.comments_table") as tbl_factory, \
             patch("app.repositories.comment_repo.uuid7", return_value=mock_uuid):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            item = run(CommentRepo().create_comment(UUID(int=1), "Bob", "hello"))
            assert item["name"] == "Bob"
            assert item["body"] == "hello"
            assert item["id"] == "cafe0000-0000-0000-0000-000000000000"
            tbl.put_item.assert_called_once()

    def test_delete_comment_success(self):
        from app.repositories.comment_repo import CommentRepo
        with patch("app.repositories.comment_repo.comments_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {
                "Items": [{"PK": "BLOG#1", "SK": "TIME#1", "id": "c1"}]
            }
            tbl.delete_item.return_value = {}
            assert run(CommentRepo().delete_comment("1", "c1", "a@x")) is True

    def test_delete_comment_not_found(self):
        from app.repositories.comment_repo import CommentRepo
        with patch("app.repositories.comment_repo.comments_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": []}
            assert run(CommentRepo().delete_comment("1", "c1", "a@x")) is False

    def test_delete_comment_error(self):
        from app.repositories.comment_repo import CommentRepo
        with patch("app.repositories.comment_repo.comments_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeError")
            assert run(CommentRepo().delete_comment("1", "c1", "a@x")) is False