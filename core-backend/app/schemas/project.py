from pydantic import BaseModel
from typing import List, Optional

class TechItem(BaseModel):
    name: str
    purpose: Optional[str] = None

class StatItem(BaseModel):
    label: str
    value: str

class ProjectSummary(BaseModel):
    id: str = "unknown"
    slug: str = ""
    name: str = "Untitled"
    shortDesc: str = ""
    coverImage: str = ""
    color: str = ""
    tech: List[TechItem] = []

class ProjectSummaryAdmin(ProjectSummary):
    is_draft: bool = False

class ProjectDetail(BaseModel):
    id: str = "unknown"
    slug: str = ""
    name: str = "Untitled"
    subtitle: str = ""
    shortDesc: str = ""
    fullDesc: str = ""
    stats: List[StatItem] = []
    problem: str = ""
    solution: str = ""
    outcome: str = ""
    architecture: List[str] = []
    architectureImage: Optional[str] = None
    challenges: List[str] = []
    learnings: List[str] = []
    future: List[str] = []
    tech: List[TechItem] = []
    coverImage: str = ""
    color: str = ""
    github: str = ""
    live: str = ""
    document: str = ""
    features: List[str] = []
    screenshots: List[str] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class ProjectDetailAdmin(ProjectDetail):
    is_draft: bool = False

class ProjectCreate(BaseModel):
    slug: str
    name: str
    subtitle: str
    shortDesc: str
    fullDesc: str
    stats: List[StatItem]
    problem: str
    solution: str
    outcome: str
    architecture: List[str]
    architectureImage: Optional[str] = None
    challenges: List[str]
    learnings: List[str]
    future: List[str]
    tech: List[TechItem]
    coverImage: str
    color: str
    github: str
    live: str
    document: str
    features: List[str]
    screenshots: List[str]
    is_draft: bool = False

class ProjectUpdate(BaseModel):
    slug: Optional[str] = None
    name: Optional[str] = None
    subtitle: Optional[str] = None
    shortDesc: Optional[str] = None
    fullDesc: Optional[str] = None
    stats: Optional[List[StatItem]] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    outcome: Optional[str] = None
    architecture: Optional[List[str]] = None
    architectureImage: Optional[str] = None
    challenges: Optional[List[str]] = None
    learnings: Optional[List[str]] = None
    future: Optional[List[str]] = None
    tech: Optional[List[TechItem]] = None
    coverImage: Optional[str] = None
    color: Optional[str] = None
    github: Optional[str] = None
    live: Optional[str] = None
    document: Optional[str] = None
    features: Optional[List[str]] = None
    screenshots: Optional[List[str]] = None
    is_draft: Optional[bool] = None

class ProjectDelete(BaseModel):
    id: str
