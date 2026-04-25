from fastapi import APIRouter, HTTPException, Depends
from ..auth import get_optional_user
from ..database import get_db
from ..services.talent_extractor import extract_job_skills

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _match_score(talent_skills: list[str], required_skills: list[str]) -> float:
    if not required_skills:
        return 0.0
    t = {s.lower().strip() for s in talent_skills}
    r = {s.lower().strip() for s in required_skills}
    if not r:
        return 0.0
    intersection = len(t & r)
    union = len(t | r)
    return round(intersection / union, 3) if union else 0.0


def _match_color(score: float) -> str:
    if score >= 0.55:
        return "#ef4444"   # red — strong match
    if score >= 0.25:
        return "#f59e0b"   # amber — moderate match
    return "#374151"        # dark — weak match


@router.post("/post")
async def post_job(payload: dict, user=Depends(get_optional_user), db=Depends(get_db)):
    title = (payload.get("title") or "").strip()
    description = (payload.get("description") or "").strip()
    if not title:
        raise HTTPException(status_code=422, detail="Job title is required")
    if len(description) < 30:
        raise HTTPException(status_code=422, detail="Job description must be at least 30 characters")

    extracted = await extract_job_skills(title, description)
    required_skills = extracted.get("required_skills", [])
    preferred_skills = extracted.get("preferred_skills", [])
    all_skills = list({*required_skills, *preferred_skills})

    row = {
        "org_name": (payload.get("org_name") or "").strip(),
        "title": title,
        "description": description,
        "required_skills": all_skills,
        "city": payload.get("city") or "",
        "country": payload.get("country") or "",
        "country_code": (payload.get("country_code") or "").upper(),
        "lat": payload.get("lat"),
        "lng": payload.get("lng"),
    }
    if user:
        row["user_id"] = str(user.id)

    try:
        result = db.table("job_postings").insert(row).execute()
        job_id = result.data[0]["id"]
        return {
            "id": job_id,
            "required_skills": all_skills,
            "summary": extracted.get("summary", ""),
            "niche": extracted.get("niche", ""),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")


@router.get("/globe/{job_id}")
async def job_globe(job_id: str, db=Depends(get_db)):
    """Return talent points with match scores for a specific job posting."""
    job_res = db.table("job_postings").select("*").eq("id", job_id).execute()
    if not job_res.data:
        raise HTTPException(status_code=404, detail="Job posting not found")
    job = job_res.data[0]
    required_skills: list[str] = job.get("required_skills") or []

    talent_res = (
        db.table("talent_profiles")
        .select("id,name,role_type,niche,skills,experience_years,city,country,country_code,lat,lng,bio")
        .limit(500)
        .execute()
    )
    points: list[dict] = talent_res.data or []

    for p in points:
        score = _match_score(p.get("skills") or [], required_skills)
        p["match_score"] = score
        p["color"] = _match_color(score)

    points.sort(key=lambda x: x.get("match_score", 0), reverse=True)

    return {
        "job": {
            "id": job_id,
            "title": job.get("title"),
            "org_name": job.get("org_name"),
            "required_skills": required_skills,
        },
        "points": points,
        "total": len(points),
        "top_matches": points[:10],
    }
