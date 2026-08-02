
import pytest
from unittest.mock import MagicMock
from app.repositories.blog_repo import BlogRepo
from app.repositories.project_repo import ProjectRepo

@pytest.mark.asyncio
async def test_blog_repo_filters_drafts(mocker):
    # Mock the table
    mock_table = MagicMock()
    mocker.patch("app.repositories.blog_repo.blogs_table", return_value=mock_table)
    
    # Mock return data
    mock_table.query.return_value = {
        "Items": [
            {"id": "1", "title": "Published", "is_draft": False},
            {"id": "2", "title": "Draft", "is_draft": True},
            {"id": "3", "title": "Default (Published)", "is_draft": False} # Missing field implies False usually, or need to check repo logic
        ]
    }
    
    repo = BlogRepo()
    
    # helper to mock uuid7 so we don't worry about it
    mocker.patch("app.repositories.blog_repo.uuid7", return_value="uuid")

    # Test default behavior (should hide drafts)
    items = await repo.list_blogs(include_drafts=False)
    ids = [i["id"] for i in items]
    assert "1" in ids
    assert "2" not in ids
    assert "3" in ids
    
    # Test admin behavior (should show everything)
    items_all = await repo.list_blogs(include_drafts=True)
    ids_all = [i["id"] for i in items_all]
    assert "1" in ids_all
    assert "2" in ids_all
    assert "3" in ids_all

def test_project_repo_filters_drafts(mocker):
    # Mock the table
    mock_table = MagicMock()
    mocker.patch("app.repositories.project_repo.projects_table", return_value=mock_table)
    
    # Mock return data
    mock_table.query.return_value = {
        "Items": [
            {"id": "p1", "name": "Published Project", "is_draft": False},
            {"id": "p2", "name": "Draft Project", "is_draft": True}
        ]
    }
    
    repo = ProjectRepo()
    
    # Test default behavior
    items = repo.list_projects(include_drafts=False)
    ids = [i["id"] for i in items]
    assert "p1" in ids
    assert "p2" not in ids
    
    # Test admin behavior
    items_all = repo.list_projects(include_drafts=True)
    ids_all = [i["id"] for i in items_all]
    assert "p1" in ids_all
    assert "p2" in ids_all
