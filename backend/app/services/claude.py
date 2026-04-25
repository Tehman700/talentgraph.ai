import json
import re
import anthropic
from ..config import settings

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.claude_api_key)
    return _client


async def parse_cv(cv_text: str) -> dict:
    client = get_client()
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=2048,
        system="You are a CV parser. Always respond with valid JSON only, no markdown fences.",
        messages=[{
            "role": "user",
            "content": f"""Parse this CV and return a JSON object with exactly these fields:
{{
  "name": "full name",
  "headline": "professional title (1 line)",
  "bio": "professional summary (2-3 sentences)",
  "location": "city, country",
  "skills": [{{"skill": "name", "level": "beginner|intermediate|expert", "category": "frontend|backend|devops|design|other"}}],
  "links": {{"github": null, "portfolio": null, "behance": null, "dribbble": null}}
}}

CV text:
{cv_text}""",
        }],
    )
    raw = response.content[0].text.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


async def extract_job_skills(title: str, description: str) -> list[str]:
    client = get_client()
    response = client.messages.create(
        model="claude-opus-4-7",
        max_tokens=512,
        system="You are a job analyzer. Always respond with valid JSON only, no markdown fences.",
        messages=[{
            "role": "user",
            "content": f"""Extract required technical skills from this job posting.
Return a JSON array of skill name strings only. Max 15 skills.

Job title: {title}
Description: {description}

Return format: ["skill1", "skill2", ...]""",
        }],
    )
    raw = response.content[0].text.strip()
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)
