import json
import re
import io
import httpx
import pdfplumber
from fastapi import HTTPException
from openai import AsyncOpenAI
from ..config import settings

try:
    from playwright.async_api import async_playwright
except Exception:  # pragma: no cover - optional dependency at runtime
    async_playwright = None

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.llm_api_key:
            raise HTTPException(status_code=500, detail="Missing OPENAI_API_KEY (or CLAUDE_API_KEY fallback) in backend .env")
        _client = AsyncOpenAI(api_key=settings.llm_api_key)
    return _client


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def _ask(system: str, prompt: str) -> str:
    client = get_client()
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        return response.choices[0].message.content or "{}"
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")


async def extract_from_github(username: str) -> dict:
    """Fetch GitHub profile + repos and extract a structured skills profile."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        user_resp = await client.get(
            f"https://api.github.com/users/{username}",
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        if user_resp.status_code == 404:
            raise HTTPException(status_code=404, detail=f"GitHub user '{username}' not found")
        if not user_resp.is_success:
            raise HTTPException(status_code=502, detail="GitHub API error")
        user = user_resp.json()

        repos_resp = await client.get(
            f"https://api.github.com/users/{username}/repos",
            params={"sort": "stars", "per_page": 20},
            headers={"Accept": "application/vnd.github.v3+json"},
        )
        repos = repos_resp.json() if repos_resp.is_success else []

    languages: dict[str, int] = {}
    topics: list[str] = []
    repo_names: list[str] = []
    for repo in repos:
        if not isinstance(repo, dict):
            continue
        lang = repo.get("language")
        if lang:
            languages[lang] = languages.get(lang, 0) + 1
        topics.extend(repo.get("topics", []))
        repo_names.append(repo.get("name", ""))

    top_languages = sorted(languages, key=lambda x: -languages[x])[:8]
    top_topics = list(set(topics))[:10]

    result = await _ask(
        system="You are a technical recruiter. Extract structured talent profiles from GitHub data. Respond with valid JSON only.",
        prompt=f"""Extract a talent profile from this GitHub data.

Name: {user.get("name") or username}
Bio: {user.get("bio") or ""}
Company: {user.get("company") or ""}
Location: {user.get("location") or ""}
Top languages: {", ".join(top_languages)}
Topics/technologies: {", ".join(top_topics)}
Recent repos: {", ".join(repo_names[:10])}

Return this exact JSON:
{{
  "name": "full name or username",
  "niche": "most specific tech niche — one of: Frontend Development, Backend Engineering, Mobile Development, DevOps & Cloud, Data Science & ML, UX & Design, Security, Blockchain, Game Development",
  "role_type": "tech",
  "skills": ["skill1", "skill2", ... up to 12],
  "experience_years": estimated years as integer,
  "bio": "2-sentence professional summary",
  "detected_location": "city, country or empty string"
}}""",
    )
    parsed = _parse_json(result)
    parsed["github_username"] = username
    parsed["raw_github_location"] = user.get("location") or ""
    return parsed


async def extract_from_bio(bio_text: str) -> dict:
    """Extract a structured profile from a pasted LinkedIn bio or any professional text."""
    result = await _ask(
        system="You are a talent analyst. Extract structured professional profiles. Respond with valid JSON only.",
        prompt=f"""Extract a talent profile from this professional bio.

Bio:
{bio_text[:3000]}

Return this exact JSON:
{{
  "name": "full name if found, else empty string",
  "niche": "most specific niche — one of: Frontend Development, Backend Engineering, Mobile Development, DevOps & Cloud, Data Science & ML, UX & Design, Security, Blockchain, Game Development, Agriculture, Healthcare, Education, Finance, Construction, Retail, Hospitality, Manufacturing",
  "role_type": "tech or non_tech",
  "skills": ["skill1", "skill2", ... up to 12 most relevant],
  "experience_years": estimated years as integer,
  "bio": "2-sentence professional summary",
  "detected_location": "city, country or empty string"
}}""",
    )
    return _parse_json(result)


async def _fetch_linkedin_text(profile_url: str) -> str:
    """Try Playwright first (for dynamic pages), then fall back to plain HTTP fetch."""
    snippets: list[str] = []

    if async_playwright is not None:
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(profile_url, wait_until="domcontentloaded", timeout=15000)
                body_text = await page.locator("body").inner_text(timeout=5000)
                if body_text:
                    snippets.append(body_text)
                await browser.close()
        except Exception:
            pass

    if not snippets:
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(
                    profile_url,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
                    },
                )
                if resp.is_success:
                    html = re.sub(r"<script[\\s\\S]*?</script>", " ", resp.text, flags=re.I)
                    html = re.sub(r"<style[\\s\\S]*?</style>", " ", html, flags=re.I)
                    text = re.sub(r"<[^>]+>", " ", html)
                    text = re.sub(r"\\s+", " ", text).strip()
                    if text:
                        snippets.append(text)
        except Exception:
            pass

    return "\n".join(snippets)[:6000]


def _guess_name_from_linkedin_url(profile_url: str) -> str:
    # Example: https://www.linkedin.com/in/jane-doe-123/ -> Jane Doe
    match = re.search(r"linkedin\\.com/in/([^/?#]+)", profile_url, flags=re.I)
    if not match:
        return ""
    slug = match.group(1)
    slug = re.sub(r"-\\d+$", "", slug)
    name = " ".join(part.capitalize() for part in slug.split("-") if part)
    return name[:80]


async def extract_from_linkedin(profile_url: str) -> dict:
    """Extract a structured profile from a public LinkedIn profile URL."""
    if "linkedin.com/" not in profile_url.lower():
        raise HTTPException(status_code=422, detail="Please provide a valid LinkedIn profile URL")

    fetched_text = await _fetch_linkedin_text(profile_url)
    if len(fetched_text) < 80:
        raise HTTPException(
            status_code=422,
            detail="Could not extract enough public LinkedIn profile text. Please paste your bio instead.",
        )

    guessed_name = _guess_name_from_linkedin_url(profile_url)
    result = await _ask(
        system="You are a talent analyst. Extract structured professional profiles. Respond with valid JSON only.",
        prompt=f"""Extract a talent profile from this public LinkedIn page text.

Profile URL: {profile_url}
Possible name: {guessed_name}
Captured text:
{fetched_text}

Return this exact JSON:
{{
  "name": "full name if found, else possible name",
  "niche": "most specific niche — one of: Frontend Development, Backend Engineering, Mobile Development, DevOps & Cloud, Data Science & ML, UX & Design, Security, Blockchain, Game Development, Agriculture, Healthcare, Education, Finance, Construction, Retail, Hospitality, Manufacturing",
  "role_type": "tech or non_tech",
  "skills": ["skill1", "skill2", ... up to 12],
  "experience_years": estimated years as integer,
  "bio": "2-sentence professional summary",
  "detected_location": "city, country or empty string"
}}""",
    )
    parsed = _parse_json(result)
    if not parsed.get("name") and guessed_name:
        parsed["name"] = guessed_name
    parsed["linkedin_url"] = profile_url
    return parsed


async def synthesize_profile(payload: dict) -> dict:
    """Combine multiple sources into one normalized profile."""
    role_type = payload.get("role_type")
    github_username = (payload.get("github_username") or "").strip()
    linkedin_url = (payload.get("linkedin_url") or "").strip()
    bio = (payload.get("bio") or "").strip()

    candidates: list[dict] = []

    if github_username:
        try:
            candidates.append(await extract_from_github(github_username))
        except Exception:
            pass
    if linkedin_url:
        try:
            candidates.append(await extract_from_linkedin(linkedin_url))
        except Exception:
            pass
    if len(bio) >= 30:
        try:
            candidates.append(await extract_from_bio(bio))
        except Exception:
            pass

    if not candidates:
        raise HTTPException(status_code=422, detail="No valid source found. Provide GitHub, LinkedIn, or bio text.")

    # Prefer the richest profile (most skills + longest bio)
    candidates.sort(key=lambda x: (len(x.get("skills") or []), len(x.get("bio") or "")), reverse=True)
    profile = candidates[0]

    if role_type in {"tech", "non_tech"}:
        profile["role_type"] = role_type

    # Keep source attribution for downstream UX.
    profile["sources"] = {
        "github": bool(github_username),
        "linkedin": bool(linkedin_url),
        "bio": len(bio) >= 30,
    }
    return profile


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages[:6]:
            text = page.extract_text()
            if text:
                parts.append(text)
    return "\n".join(parts)


async def extract_from_cv(pdf_bytes: bytes) -> dict:
    """Extract a structured profile from a CV/resume PDF."""
    cv_text = _extract_pdf_text(pdf_bytes)
    if not cv_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from PDF. Please use a text-based PDF (not a scanned image).",
        )
    result = await _ask(
        system="You are an expert HR analyst. Extract comprehensive talent profiles from CVs. Respond with valid JSON only.",
        prompt=f"""Extract a talent profile from this CV/resume.

CV:
{cv_text[:4000]}

Return this exact JSON:
{{
  "name": "candidate full name",
  "niche": "most specific professional niche",
  "role_type": "tech or non_tech",
  "skills": ["skill1", "skill2", ... up to 15 most relevant],
  "experience_years": total years as integer,
  "bio": "2-3 sentence professional summary",
  "detected_location": "most recent city, country or empty string",
  "education_level": "primary|secondary|vocational|tertiary"
}}""",
    )
    return _parse_json(result)


async def extract_job_skills(title: str, description: str) -> dict:
    """Extract required skills and metadata from a job posting."""
    result = await _ask(
        system="You are a job analyst. Extract structured requirements from job postings. Respond with valid JSON only.",
        prompt=f"""Extract requirements from this job posting.

Title: {title}
Description:
{description[:3000]}

Return this exact JSON:
{{
  "required_skills": ["skill1", "skill2", ... up to 15],
  "preferred_skills": ["skill1", "skill2", ... up to 8],
  "niche": "most specific niche this role falls under",
  "role_type": "tech or non_tech",
  "experience_min_years": minimum required experience as integer,
  "summary": "2-sentence summary of what this role does"
}}""",
    )
    return _parse_json(result)
