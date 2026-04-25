import json
from pathlib import Path
from functools import lru_cache

DATA_DIR = Path(__file__).parent.parent.parent / "data"
ROOT_DIR = Path(__file__).parent.parent.parent.parent


@lru_cache(maxsize=None)
def get_country(code: str) -> dict | None:
    path = DATA_DIR / "countries" / f"{code.lower()}.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def list_countries() -> list[dict]:
    result = []
    for path in sorted((DATA_DIR / "countries").glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        result.append({
            "code": data["code"],
            "name": data["name"],
            "region": data["region"],
            "context": data["context"],
        })
    return result


@lru_cache(maxsize=1)
def get_esco_seed() -> dict:
    path = DATA_DIR / "esco_seed.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def get_ilo_catalog() -> list[dict]:
    path = ROOT_DIR / "ESCO Skills Taxonomy Dataset.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def get_ilo_signals_for_country(country_code: str) -> list[dict]:
    """Return ILO catalog entries that are relevant labor market signals."""
    signal_subjects = {"EMP", "EAR", "UNE", "POV", "SKL", "STW"}
    catalog = get_ilo_catalog()
    return [
        {
            "indicator_id": item["indicator"],
            "label": item.get("indicator.label", ""),
            "subject": item.get("subject", ""),
            "countries_covered": item.get("n.ref_area", 0),
            "years": f"{item.get('data.start')}–{item.get('data.end')}",
        }
        for item in catalog
        if item.get("subject") in signal_subjects
    ]
