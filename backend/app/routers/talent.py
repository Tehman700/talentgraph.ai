import json
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from ..auth import get_optional_user
from ..database import get_db
from ..services.talent_extractor import (
    extract_from_github,
    extract_from_bio,
    extract_from_cv,
    extract_from_linkedin,
    synthesize_profile,
)
from ..services.claude import generate_ats_resume

router = APIRouter(prefix="/api/talent", tags=["talent"])

SEED_FILE = Path(__file__).parent.parent.parent / "data" / "seed_talent.json"

NICHE_COLORS: dict[str, str] = {
    "Frontend Development": "#61DAFB",
    "Backend Engineering": "#00d4ff",
    "Mobile Development": "#a855f7",
    "DevOps & Cloud": "#f97316",
    "Data Science & ML": "#6366f1",
    "UX & Design": "#ec4899",
    "Security": "#ef4444",
    "Blockchain": "#eab308",
    "Game Development": "#84cc16",
    "Agriculture": "#8DC651",
    "Healthcare": "#0ea5e9",
    "Education": "#f59e0b",
    "Finance": "#10b981",
    "Construction": "#78716c",
    "Retail": "#e879f9",
    "Hospitality": "#fb923c",
    "Manufacturing": "#94a3b8",
}


def _load_seed() -> list[dict]:
    if SEED_FILE.exists():
        with open(SEED_FILE) as f:
            return json.load(f)
    return []


def _colorize(points: list[dict]) -> list[dict]:
    for p in points:
        p["color"] = NICHE_COLORS.get(p.get("niche", ""), "#6b6458")
    return points


@router.get("/globe")
async def globe_data(
    niche: str | None = None,
    role_type: str | None = None,
    country_code: str | None = None,
    location: str | None = None,
    profession: str | None = None,
    skill: str | None = None,
    experience_level: str | None = None,
    db=Depends(get_db),
):
    """Return talent points for the globe visualization."""
    points: list[dict] = []
    try:
        query = db.table("talent_profiles").select(
            "id,name,role_type,niche,profession,skills,experience_years,experience_level,city,state,country,country_code,lat,lng,bio,github_username,linkedin_url,photo_url,resume_url,verify_github,verify_linkedin"
        )
        if niche:
            query = query.eq("niche", niche)
        if profession:
            query = query.ilike("profession", f"%{profession}%")
        if role_type:
            query = query.eq("role_type", role_type)
        if country_code:
            query = query.eq("country_code", country_code.upper())
        if location:
            query = query.or_(f"city.ilike.%{location}%,state.ilike.%{location}%,country.ilike.%{location}%")
        if experience_level:
            query = query.eq("experience_level", experience_level)
        if skill:
            query = query.contains("skills", [skill])
        result = query.limit(500).execute()
        points = result.data or []
    except Exception:
        pass

    # Fallback to local seed JSON if DB is empty (before seeding)
    if not points:
        seed = _load_seed()
        for p in seed:
            if niche and p.get("niche") != niche:
                continue
            if role_type and p.get("role_type") != role_type:
                continue
            if country_code and p.get("country_code") != country_code.upper():
                continue
            if location:
                loc_value = f"{p.get('city', '')} {p.get('state', '')} {p.get('country', '')}".lower()
                if location.lower() not in loc_value:
                    continue
            if profession and profession.lower() not in (p.get("profession") or p.get("niche", "")).lower():
                continue
            if experience_level and p.get("experience_level") != experience_level:
                continue
            if skill:
                skill_set = [s.lower() for s in (p.get("skills") or [])]
                if skill.lower() not in skill_set:
                    continue
            points.append(p)

    return {"points": _colorize(points), "total": len(points)}


@router.get("/niches")
def list_niches():
    return {"niches": list(NICHE_COLORS.keys())}


@router.post("/extract/github")
async def extract_github(payload: dict):
    username = payload.get("username", "").strip().lstrip("@").lstrip("https://github.com/")
    if not username:
        raise HTTPException(status_code=422, detail="GitHub username required")
    return await extract_from_github(username)


@router.post("/extract/bio")
async def extract_bio(payload: dict):
    bio_text = payload.get("bio", "").strip()
    if len(bio_text) < 30:
        raise HTTPException(status_code=422, detail="Bio text must be at least 30 characters")
    return await extract_from_bio(bio_text)


@router.post("/extract/linkedin")
async def extract_linkedin(payload: dict):
    profile_url = payload.get("profile_url", "").strip()
    if not profile_url:
        raise HTTPException(status_code=422, detail="LinkedIn profile URL required")
    return await extract_from_linkedin(profile_url)


@router.post("/extract/synthesize")
async def extract_synthesize(payload: dict):
    return await synthesize_profile(payload)


@router.post("/extract/cv")
async def extract_cv_endpoint(file: UploadFile = File(...)):
    fname = file.filename or ""
    if not fname.lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Only PDF files are supported")
    pdf_bytes = await file.read()
    if len(pdf_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=422, detail="PDF too large (max 10 MB)")
    return await extract_from_cv(pdf_bytes)


@router.post("/save")
async def save_talent(payload: dict, user=Depends(get_optional_user), db=Depends(get_db)):
    """Save a talent profile to the DB. Works without auth (anonymous profiles)."""
    row = {
        "source": "user",
        "name": (payload.get("name") or "Anonymous").strip(),
        "role_type": payload.get("role_type") or "tech",
        "niche": payload.get("niche") or "",
        "profession": payload.get("profession") or payload.get("niche") or "",
        "skills": payload.get("skills") or [],
        "experience_years": int(payload.get("experience_years") or 0),
        "experience_level": payload.get("experience_level") or "mid",
        "city": payload.get("city") or "",
        "state": payload.get("state") or "",
        "country": payload.get("country") or "",
        "country_code": (payload.get("country_code") or "").upper(),
        "lat": payload.get("lat"),
        "lng": payload.get("lng"),
        "bio": payload.get("bio") or "",
        "github_username": payload.get("github_username"),
        "linkedin_url": payload.get("linkedin_url") or "",
        "photo_url": payload.get("photo_url") or "",
        "resume_url": payload.get("resume_url") or "",
        "verify_github": bool(payload.get("verify_github", False)),
        "verify_linkedin": bool(payload.get("verify_linkedin", False)),
    }
    if user:
        row["user_id"] = str(user.id)
    try:
        result = db.table("talent_profiles").insert(row).execute()
        return {"id": result.data[0]["id"], "saved": True}
    except Exception as e:
        msg = str(e)
        if "PGRST205" in msg or "Could not find the table 'public.talent_profiles'" in msg:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Save failed: missing Supabase table public.talent_profiles. "
                    "Run backend/supabase_migration_v2.sql in Supabase SQL Editor, then retry."
                ),
            )
        raise HTTPException(status_code=500, detail=f"Save failed: {msg}")


@router.post("/verify-social")
async def verify_social(payload: dict):
    """Basic social verification check for profile trust signals."""
    github_username = (payload.get("github_username") or "").strip()
    linkedin_url = (payload.get("linkedin_url") or "").strip()

    github_verified = bool(github_username) and len(github_username) >= 3 and " " not in github_username
    linkedin_verified = bool(linkedin_url) and linkedin_url.startswith("https://") and "linkedin.com/" in linkedin_url

    return {
        "github_verified": github_verified,
        "linkedin_verified": linkedin_verified,
        "verified": github_verified or linkedin_verified,
    }


@router.post("/generate-resume")
async def generate_resume_endpoint(payload: dict, user=Depends(get_optional_user), db=Depends(get_db)):
    """Generate an ATS-optimized LaTeX resume from a talent profile + pre-filtered CV sections."""
    profile_id = payload.get("profile_id")
    profile    = payload.get("profile") or {}
    sections   = payload.get("sections") or {}

    # If a profile_id is given, fetch the saved talent profile from DB
    if profile_id and not profile.get("name"):
        try:
            query = db.table("talent_profiles").select("*").eq("id", str(profile_id))
            if user:
                query = query.eq("user_id", str(user.id))
            result = query.single().execute()
            if result.data:
                saved = result.data
                profile = {
                    "name":             saved.get("name", ""),
                    "tagline":          saved.get("bio", ""),
                    "profession":       saved.get("niche", ""),
                    "niche":            saved.get("niche", ""),
                    "location":         saved.get("city", "") + (", " + saved.get("country", "") if saved.get("country") else ""),
                    "experience_years": saved.get("experience_years", 0),
                    "skills":           saved.get("skills", []),
                    "linkedin_url":     "",
                    "github_username":  saved.get("github_username", ""),
                }
        except Exception:
            pass

    if not profile.get("name"):
        raise HTTPException(status_code=422, detail="Profile name is required. Provide 'profile' object or valid 'profile_id'.")

    # Generate the LaTeX resume via LLM
    result = await generate_ats_resume(profile, sections or None)

    # Persist the generated resume if user is authenticated
    slug = None
    if user:
        try:
            slug = str(uuid.uuid4())
            db.table("generated_resumes").insert({
                "user_id":    str(user.id),
                "profile_id": str(profile_id) if profile_id else None,
                "slug":       slug,
                "latex":      result.get("latex", ""),
                "profile":    profile,
            }).execute()
        except Exception:
            pass  # Table may not exist yet — resume still returned to client

    resume_url = f"/resume/{slug}" if slug else None

    return {
        "latex":       result.get("latex", ""),
        "summary":     result.get("summary", ""),
        "key_skills":  result.get("key_skills", []),
        "ats_keywords": result.get("ats_keywords", []),
        "resume_url":  resume_url,
        "profile_id":  str(profile_id) if profile_id else None,
        "slug":        slug,
    }


@router.get("/resume/{slug}")
async def get_resume_by_slug(slug: str, db=Depends(get_db)):
    """Retrieve a generated resume by its shareable slug."""
    try:
        result = (
            db.table("generated_resumes")
            .select("slug, latex, profile, created_at")
            .eq("slug", slug)
            .single()
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Resume not found.")
        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail="Resume not found.")


@router.get("/me")
async def get_my_profile(user=Depends(get_optional_user), db=Depends(get_db)):
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    result = (
        db.table("talent_profiles")
        .select("*")
        .eq("user_id", str(user.id))
        .eq("source", "user")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No profile found")
    return result.data[0]
