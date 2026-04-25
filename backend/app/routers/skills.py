from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.claude import analyze_skills
from ..services.data_loader import get_country, get_esco_seed

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillsInput(BaseModel):
    country_code: str
    education_level: str  # none | primary | secondary | vocational | tertiary
    experience_years: int
    work_description: str
    competencies: list[str] = []


@router.post("/analyze")
async def analyze(data: SkillsInput):
    country = get_country(data.country_code.upper())
    if not country:
        raise HTTPException(404, f"Country '{data.country_code}' not configured. Use UGA or BGD.")
    profile = await analyze_skills(data.model_dump(), country)
    return {**profile, "country_code": data.country_code.upper()}


@router.get("/occupations/{country_code}")
def get_occupations(country_code: str):
    seed = get_esco_seed()
    code = country_code.upper()
    relevant = [
        occ for occ in seed["occupations"]
        if code in occ.get("relevant_countries", [])
    ]
    return {"country_code": code, "occupations": relevant}
