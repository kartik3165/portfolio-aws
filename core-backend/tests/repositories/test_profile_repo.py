import asyncio

from unittest.mock import MagicMock, patch
import pytest

from botocore.exceptions import ClientError


def run(coro):
    return asyncio.run(coro)


def _client_error(code):
    return ClientError({"Error": {"Code": code, "Message": "boom"}}, "op")


BASE = "app.repositories.profile_repo"


class TestProfileRepo:
    # ---- Experience ----
    def test_list_experience(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "e1", "role": "R"}]}
            items = run(ProfileRepo().list_experience())
            assert items == [{"id": "e1", "role": "R"}]

    def test_list_experience_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("ResourceNotFoundException")
            assert run(ProfileRepo().list_experience()) == []

    def test_list_experience_other_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeOtherCode")
            assert run(ProfileRepo().list_experience()) == []

    def test_create_experience(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory, \
             patch(f"{BASE}.uuid7", return_value="uuid1"):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            item = run(ProfileRepo().create_experience({"role": "R"}, "a@x"))
            assert item["id"] == "uuid1"
            assert item["role"] == "R"

    def test_update_experience(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "e1", "role": "new"}}
            got = run(ProfileRepo().update_experience("e1", {"role": "new"}, "a@x"))
            assert got["role"] == "new"

    def test_update_experience_with_all_none_updates(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "e1", "role": "new"}}
            got = run(ProfileRepo().update_experience("e1", {"role": None, "company": None}, "a@x"))
            assert got["role"] == "new"

    def test_update_experience_not_found(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.side_effect = _client_error("ConditionalCheckFailedException")
            got = run(ProfileRepo().update_experience("e1", {"role": "r"}, "a@x"))
            assert got is None

    def test_delete_experience_success(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.return_value = {}
            assert run(ProfileRepo().delete_experience("e1", "a@x")) is True

    def test_delete_experience_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.side_effect = _client_error("SomeError")
            assert run(ProfileRepo().delete_experience("e1", "a@x")) is False

    # ---- Papers ----
    def test_list_papers(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "p1"}]}
            assert run(ProfileRepo().list_papers()) == [{"id": "p1"}]

    def test_list_papers_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("ResourceNotFoundException")
            assert run(ProfileRepo().list_papers()) == []

    def test_list_papers_other_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeOtherCode")
            assert run(ProfileRepo().list_papers()) == []

    def test_create_paper(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory, \
             patch(f"{BASE}.uuid7", return_value="uuid2"):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            item = run(ProfileRepo().create_paper({"title": "T"}, "a@x"))
            assert item["id"] == "uuid2"

    def test_update_paper(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "p1", "title": "new"}}
            got = run(ProfileRepo().update_paper("p1", {"title": "new"}, "a@x"))
            assert got["title"] == "new"

    def test_update_paper_with_all_none_updates(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "p1", "title": "new"}}
            got = run(ProfileRepo().update_paper("p1", {"title": None}, "a@x"))
            assert got["title"] == "new"

    def test_update_paper_not_found(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.side_effect = _client_error("ConditionalCheckFailedException")
            assert run(ProfileRepo().update_paper("p1", {"title": "t"}, "a@x")) is None

    def test_delete_paper(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.return_value = {}
            assert run(ProfileRepo().delete_paper("p1", "a@x")) is True
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.side_effect = _client_error("SomeError")
            assert run(ProfileRepo().delete_paper("p1", "a@x")) is False

    # ---- Achievements ----
    def test_list_achievements(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.return_value = {"Items": [{"id": "a1"}]}
            assert run(ProfileRepo().list_achievements()) == [{"id": "a1"}]

    def test_list_achievements_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("ResourceNotFoundException")
            assert run(ProfileRepo().list_achievements()) == []

    def test_list_achievements_other_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.query.side_effect = _client_error("SomeOtherCode")
            assert run(ProfileRepo().list_achievements()) == []

    def test_create_achievement(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory, \
             patch(f"{BASE}.uuid7", return_value="uuid3"):
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            item = run(ProfileRepo().create_achievement({"title": "A"}, "a@x"))
            assert item["id"] == "uuid3"

    def test_update_achievement(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "a1", "title": "new"}}
            got = run(ProfileRepo().update_achievement("a1", {"title": "new"}, "a@x"))
            assert got["title"] == "new"

    def test_update_achievement_with_all_none_updates(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.return_value = {"Attributes": {"id": "a1", "title": "new"}}
            got = run(ProfileRepo().update_achievement("a1", {"title": None}, "a@x"))
            assert got["title"] == "new"

    def test_update_achievement_not_found(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.update_item.side_effect = _client_error("ConditionalCheckFailedException")
            assert run(ProfileRepo().update_achievement("a1", {"title": "t"}, "a@x")) is None

    def test_delete_achievement(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.return_value = {}
            assert run(ProfileRepo().delete_achievement("a1", "a@x")) is True
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.delete_item.side_effect = _client_error("SomeError")
            assert run(ProfileRepo().delete_achievement("a1", "a@x")) is False

    # ---- Bio ----
    def test_get_bio_strips_internal_keys(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {
                "Item": {"PK": "METADATA#BIO", "SK": "PROFILE", "summary": "Sum", "hero_image": "h.webp"}
            }
            bio = run(ProfileRepo().get_bio())
            assert bio == {"summary": "Sum", "hero_image": "h.webp"}

    def test_get_bio_empty(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.return_value = {}
            assert run(ProfileRepo().get_bio()) == {}

    def test_get_bio_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("ResourceNotFoundException")
            assert run(ProfileRepo().get_bio()) == {}

    def test_get_bio_other_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.get_item.side_effect = _client_error("SomeOtherCode")
            assert run(ProfileRepo().get_bio()) == {}

    def test_update_bio_success(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.put_item.return_value = {}
            assert run(ProfileRepo().update_bio({"summary": "S"}, "a@x")) is True

    def test_update_bio_error(self):
        from app.repositories.profile_repo import ProfileRepo
        with patch(f"{BASE}.profile_table") as tbl_factory:
            tbl = tbl_factory.return_value
            tbl.put_item.side_effect = _client_error("SomeError")
            assert run(ProfileRepo().update_bio({"summary": "S"}, "a@x")) is False