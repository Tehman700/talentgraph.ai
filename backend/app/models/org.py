from pydantic import BaseModel
from typing import Optional
import uuid


class OrgCreate(BaseModel):
    org_name: str
    industry: str
    location: str
    lat: float
    lng: float
    website: Optional[str] = None


class OrgUpdate(BaseModel):
    org_name: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    website: Optional[str] = None


class OrgProfile(OrgCreate):
    id: uuid.UUID
    user_id: uuid.UUID
