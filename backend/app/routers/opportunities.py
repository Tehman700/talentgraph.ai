from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.claude import match_opportunities
from ..services.data_loader import get_country

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


class MatchRequest(BaseModel):
    country_code: str
    skills_profile: dict


@router.post("/match")
async def match(data: MatchRequest):
    country = get_country(data.country_code.upper())
    if not country:
        raise HTTPException(404, f"Country '{data.country_code}' not configured. Use UGA or BGD.")
    result = await match_opportunities(data.skills_profile, country)
    return {**result, "country_code": data.country_code.upper(), "country_name": country["name"]}


@router.get("/policy/{country_code}")
def policy_view(country_code: str):
    country = get_country(country_code.upper())
    if not country:
        raise HTTPException(404, "Country not found")
    return {
        "country": country["name"],
        "region": country["region"],
        "signals": country["signals"],
        "sectors": country["sectors"],
        "local_realities": country.get("local_realities", []),
        "automation_risk_note": country.get("automation_risk_note", ""),
    }
