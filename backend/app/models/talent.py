from pydantic import BaseModel
from typing import Optional
import uuid


class SkillItem(BaseModel):
    skill: str
    level: str  # 'beginner' | 'intermediate' | 'expert'
    category: str


class ProfileLinks(BaseModel):
    github: Optional[str] = None
    behance: Optional[str] = None
    dribbble: Optional[str] = None
    portfolio: Optional[str] = None


class TalentCreate(BaseModel):
    name: str
    profession: str
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: str
    lat: float
    lng: float
    skills: list[SkillItem] = []
    links: Optional[ProfileLinks] = None
    profile_slug: str


class TalentUpdate(BaseModel):
    name: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    skills: Optional[list[SkillItem]] = None
    links: Optional[ProfileLinks] = None
    is_public: Optional[bool] = None


class TalentProfile(TalentCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    is_public: bool = True
    cv_raw_text: Optional[str] = None
