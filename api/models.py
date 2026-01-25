from pydantic import BaseModel
from typing import Optional, List
import uuid

class CoachProfile(BaseModel):
    name: str
    position: str
    email: Optional[str] = None
    phone: Optional[str] = None
    twitter: Optional[str] = None
    school: str
    sport: str
    school_logo_url: Optional[str] = None

    @validator("school_logo_url")
    def ensure_logo_fallback(cls, v):
        # If scraper fails or returns None, use a generic placeholder
        if not v:
            return "https://upload.wikimedia.org/wikipedia/commons/3/38/Solid_white_bordered.png"
        return v

class SearchRequest(BaseModel):
    school_name: str
    sport_name: str

class Job(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    status: str
    payload: dict
    error_message: Optional[str] = None
    results: Optional[List[CoachProfile]] = None
    created_at: str
    updated_at: str

class JobResponse(BaseModel):
    job_id: uuid.UUID
    status: str
