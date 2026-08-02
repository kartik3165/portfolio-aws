from pydantic import BaseModel
from typing import List


class SkillsResponse(BaseModel):
    skills: List[str]

class SkillAdd(BaseModel):
    skill: str

class SkillRemove(BaseModel):
    skill: str