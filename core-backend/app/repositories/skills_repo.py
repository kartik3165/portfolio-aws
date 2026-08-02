from datetime import datetime

from app.db.dynamo import skills_table

class SkillsRepo:
    def __init__(self):
        self.table = skills_table()

    async def get_skills(self):
        res = self.table.get_item(
            Key={
                "SKILLS": "SKILLS",
                "METADATA": "METADATA"
            }
        )
        item = res.get("Item")
        return {"skills": item.get("skills", [])} if item else {"skills": []}

    async def add_skill(self, skill: str, email: str):
        self.table.update_item(
            Key={
                "SKILLS": "SKILLS",
                "METADATA": "METADATA"
            },
            UpdateExpression=(
                "SET skills = list_append(if_not_exists(skills, :empty), :new), "
                "updated_by = :email, updated_at = :now"
            ),
            ExpressionAttributeValues={
                ":empty": [],
                ":new": [skill],
                ":email": email,
                ":now": datetime.now().isoformat(),
            },
        )
        return await self.get_skills()

    async def remove_skill(self, skill: str, email: str):
        current = (await self.get_skills())["skills"]
        updated = [s for s in current if s != skill] # type: ignore

        self.table.update_item(
            Key={
                "SKILLS": "SKILLS",
                "METADATA": "METADATA"
            },
            UpdateExpression="SET skills = :skills, updated_by = :email, updated_at = :now",
            ExpressionAttributeValues={
                ":skills": updated,
                ":email": email,
                ":now": datetime.now().isoformat(),
            },
        )
        return {"skills": updated}