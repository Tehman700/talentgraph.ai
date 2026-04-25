from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class JobCreate(BaseModel):
    title: str
    description: str
    required_skills: list[str] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[list[str]] = None
    is_active: Optional[bool] = None


class JobPost(JobCreate):
    id: uuid.UUID
    org_id: uuid.UUID
    is_active: bool = True
    created_at: datetime


class MatchResult(BaseModel):
    talent_id: uuid.UUID
    profile_slug: str
    name: str
    profession: str
    location: str
    lat: float
    lng: float
    skills: list[dict]
    match_score: float
    matched_skills: list[str]
