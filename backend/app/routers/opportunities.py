from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from ..services.claude import match_opportunities
from ..services.data_loader import get_country
from ..auth import get_optional_user
from ..database import get_db

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


class MatchRequest(BaseModel):
    country_code: str
    skills_profile: dict
    skill_profile_id: str | None = None


@router.post("/match")
async def match(
    data: MatchRequest,
    user=Depends(get_optional_user),
    db=Depends(get_db),
):
    country = get_country(data.country_code.upper())
    if not country:
        raise HTTPException(404, f"Country '{data.country_code}' not configured. Use UGA or BGD.")

    result = await match_opportunities(data.skills_profile, country)
    response = {**result, "country_code": data.country_code.upper(), "country_name": country["name"]}

    if user:
        try:
            row = {
                "user_id": str(user.id),
                "skill_profile_id": data.skill_profile_id,
                "country_code": data.country_code.upper(),
                "opportunities": result.get("opportunities", []),
                "econometric_signals": result.get("econometric_signals", {}),
                "recommendations": result.get("recommendations", []),
            }
            db.table("opportunity_matches").insert(row).execute()
        except Exception:
            pass

    return response


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
