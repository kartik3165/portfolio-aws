from pydantic import BaseModel
from typing import List, Optional

class Experience(BaseModel):
    id: str
    role: str
    company: str
    period: str
    location: str
    description: List[str]

class ExperienceCreate(BaseModel):
    role: str
    company: str
    period: str
    location: str
    description: List[str]

class ExperienceUpdate(BaseModel):
    role: Optional[str] = None
    company: Optional[str] = None
    period: Optional[str] = None
    location: Optional[str] = None
    description: Optional[List[str]] = None

class ExperienceResponse(BaseModel):
    experience: List[Experience]

class ResearchPaper(BaseModel):
    id: str
    title: str
    publication: str
    description: str
    tags: List[str]
    link: str

class ResearchPaperCreate(BaseModel):
    title: str
    publication: str
    description: str
    tags: List[str]
    link: str

class ResearchPaperUpdate(BaseModel):
    title: Optional[str] = None
    publication: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    link: Optional[str] = None

class ResearchPaperResponse(BaseModel):
    research_papers: List[ResearchPaper]

class Achievement(BaseModel):
    id: str
    title: str
    description: str

class AchievementCreate(BaseModel):
    title: str
    description: str

class AchievementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class AchievementResponse(BaseModel):
    achievements: List[Achievement]


class Bio(BaseModel):
    summary: str
    highlights: List[str]
    about_intro: str
    story: str
    hero_image: Optional[str] = None  # Hero/landing page image URL
    about_image: Optional[str] = None  # About page image URL


class BioUpdate(BaseModel):
    summary: str
    highlights: List[str]
    about_intro: str
    story: str
    hero_image: Optional[str] = None  # Hero/landing page image URL
    about_image: Optional[str] = None  # About page image URL
