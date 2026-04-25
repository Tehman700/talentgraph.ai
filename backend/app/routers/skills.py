from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..services.claude import analyze_skills
from ..services.data_loader import get_country, get_esco_seed
from ..auth import get_optional_user
from ..database import get_db

router = APIRouter(prefix="/api/skills", tags=["skills"])


class SkillsInput(BaseModel):
    country_code: str
    education_level: str
    experience_years: int
    work_description: str
    competencies: list[str] = []


@router.post("/analyze")
async def analyze(
    data: SkillsInput,
    user=Depends(get_optional_user),
    db=Depends(get_db),
):
    country = get_country(data.country_code.upper())
    if not country:
        raise HTTPException(404, f"Country '{data.country_code}' not configured. Use UGA or BGD.")

    profile = await analyze_skills(data.model_dump(), country)
    result = {**profile, "country_code": data.country_code.upper()}

    if user:
        try:
            row = {
                "user_id": str(user.id),
                "country_code": data.country_code.upper(),
                "occupation_title": profile.get("occupation_title"),
                "isco_code": profile.get("isco_code"),
                "occupation_summary": profile.get("occupation_summary"),
                "skills": profile.get("skills", []),
                "strengths": profile.get("strengths", []),
                "skill_gaps": profile.get("skill_gaps", []),
                "profile_summary": profile.get("profile_summary"),
                "education_level": data.education_level,
                "experience_years": data.experience_years,
                "work_description": data.work_description,
            }
            saved = db.table("skill_profiles").insert(row).execute()
            if saved.data:
                result["saved_id"] = saved.data[0]["id"]
        except Exception:
            pass  # DB save is best-effort; never fail the main response

    return result


@router.get("/occupations/{country_code}")
def get_occupations(country_code: str):
    seed = get_esco_seed()
    code = country_code.upper()
    relevant = [
        occ for occ in seed["occupations"]
        if code in occ.get("relevant_countries", [])
    ]
    return {"country_code": code, "occupations": relevant}
