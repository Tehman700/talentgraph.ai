from fastapi import APIRouter, HTTPException, Depends
from ..auth import get_current_user
from ..database import get_db

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email}


@router.get("")
async def list_profiles(user=Depends(get_current_user), db=Depends(get_db)):
    result = (
        db.table("skill_profiles")
        .select("id, country_code, occupation_title, isco_code, profile_summary, education_level, experience_years, work_description, created_at")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"profiles": result.data}


@router.get("/{profile_id}")
async def get_profile(profile_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    result = (
        db.table("skill_profiles")
        .select("*")
        .eq("id", profile_id)
        .eq("user_id", str(user.id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Profile not found")
    return result.data


@router.delete("/{profile_id}", status_code=204)
async def delete_profile(profile_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    db.table("skill_profiles").delete().eq("id", profile_id).eq("user_id", str(user.id)).execute()
    db.table("opportunity_matches").delete().eq("skill_profile_id", profile_id).execute()


@router.get("/{profile_id}/matches")
async def get_matches(profile_id: str, user=Depends(get_current_user), db=Depends(get_db)):
    result = (
        db.table("opportunity_matches")
        .select("*")
        .eq("skill_profile_id", profile_id)
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"matches": result.data}
