import json
import re
from openai import AsyncOpenAI
from fastapi import HTTPException
from ..config import settings

_client: AsyncOpenAI | None = None
MODEL = "gpt-4o-mini"


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


def _parse_json(text: str) -> dict | list:
    text = text.strip()
    text = re.sub(r"^```json\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def _ask(system: str, prompt: str) -> str:
    client = get_client()
    try:
        response = await client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return response.choices[0].message.content or "{}"
    except Exception as e:
        msg = str(e)
        if "quota" in msg.lower() or "rate" in msg.lower() or "429" in msg:
            raise HTTPException(status_code=429, detail=f"OpenAI quota/rate limit hit: {msg}")
        raise HTTPException(status_code=502, detail=f"OpenAI error: {msg}")


async def analyze_skills(input_data: dict, country: dict) -> dict:
    """Module 01 — maps informal experience to a standardized ESCO skills profile."""
    competencies = ", ".join(input_data.get("competencies", [])) or "none specified"
    result = await _ask(
        system="You are a skills analyst for informal economy workers in LMICs. Respond with valid JSON only.",
        prompt=f"""Analyze this worker's background and return a standardized skills profile.

Country: {country['name']} ({country['region']})
Education level: {input_data.get('education_level', 'unknown')}
Years of experience: {input_data.get('experience_years', 0)}
What they do: {input_data.get('work_description', '')}
Self-reported skills: {competencies}

Return this exact JSON structure:
{{
  "occupation_title": "closest ESCO occupation title",
  "isco_code": "4-digit ISCO code string",
  "occupation_summary": "1-2 plain sentences the worker would understand",
  "skills": [
    {{
      "label": "skill name",
      "level": "basic|intermediate|advanced",
      "is_durable": true,
      "category": "technical|transferable|foundational"
    }}
  ],
  "strengths": ["3 key strengths in plain language"],
  "skill_gaps": ["2-3 skills that would expand opportunities"],
  "profile_summary": "2-3 sentence plain-language summary the worker can read and share"
}}""",
    )
    return _parse_json(result)


async def match_opportunities(skills_profile: dict, country: dict) -> dict:
    """Module 03 — matches skills profile to real reachable opportunities with econometric signals."""
    signals = country.get("signals", {})
    sectors_summary = [
        {"sector": s["name"], "growth_pct": s["growth_rate_pct"], "avg_wage_usd": s["avg_wage_usd"]}
        for s in country.get("sectors", [])
    ]
    result = await _ask(
        system="You are a labor market analyst specializing in LMICs. Be honest about local realities. Respond with valid JSON only.",
        prompt=f"""Match this skills profile to real, reachable opportunities.

Worker:
- Occupation: {skills_profile.get('occupation_title')}
- ISCO: {skills_profile.get('isco_code')}
- Skills: {[s['label'] for s in skills_profile.get('skills', [])]}
- Strengths: {skills_profile.get('strengths', [])}

Country: {country['name']} — {country['region']}
Informal employment: {signals.get('informal_employment_pct')}%
Average monthly wage: ${signals.get('avg_monthly_wage_usd')}
Working poverty rate: {signals.get('working_poverty_rate')}%
Sector data: {json.dumps(sectors_summary)}
Local realities: {country.get('local_realities', [])}

Return this exact JSON structure:
{{
  "opportunities": [
    {{
      "title": "opportunity title",
      "type": "formal_employment|self_employment|gig|training|cooperative",
      "sector": "sector name",
      "match_score": 0.85,
      "match_reasons": ["reason 1", "reason 2"],
      "realistic": true,
      "wage_range_usd": {{"min": 80, "max": 150}},
      "sector_growth_pct": 3.2,
      "next_steps": ["concrete action 1", "concrete action 2"]
    }}
  ],
  "econometric_signals": {{
    "informal_employment_pct": {signals.get('informal_employment_pct', 0)},
    "avg_monthly_wage_usd": {signals.get('avg_monthly_wage_usd', 0)},
    "working_poverty_rate": {signals.get('working_poverty_rate', 0)},
    "youth_unemployment_pct": {signals.get('youth_unemployment_pct', 0)},
    "data_source": "{signals.get('data_source', 'ILO ILOSTAT')}"
  }},
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}}""",
    )
    return _parse_json(result)


async def extract_job_skills(title: str, description: str) -> list[str]:
    result = await _ask(
        system="You are a job analyzer. Respond with valid JSON only.",
        prompt=f"""Extract required technical skills from this job posting.
Return a JSON array of skill name strings only. Max 15 skills.

Job title: {title}
Description: {description}

Return format: {{"skills": ["skill1", "skill2", ...]}}""",
    )
    parsed = _parse_json(result)
    return parsed.get("skills", parsed) if isinstance(parsed, dict) else parsed
