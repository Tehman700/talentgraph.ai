def score_talent(
    talent_skills: list[dict], required_skills: list[str]
) -> tuple[float, list[str]]:
    if not required_skills:
        return 0.0, []
    required_lower = {s.lower() for s in required_skills}
    talent_names = {s["skill"].lower() for s in talent_skills}
    matched = [s for s in required_skills if s.lower() in talent_names]
    score = round(len(matched) / len(required_skills), 3)
    return score, matched


def rank_talents(talents: list[dict], required_skills: list[str]) -> list[dict]:
    results = []
    for t in talents:
        score, matched = score_talent(t.get("skills") or [], required_skills)
        if score > 0:
            results.append({**t, "match_score": score, "matched_skills": matched})
    return sorted(results, key=lambda x: x["match_score"], reverse=True)
