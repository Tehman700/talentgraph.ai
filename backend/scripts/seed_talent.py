"""Seed 90 talent profiles into the talent_profiles table.

Usage:
  cd backend
  python -m scripts.seed_talent          # insert (skip if already seeded)
  python -m scripts.seed_talent --force  # delete existing seeds and re-insert
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from app.config import settings
from supabase import create_client

SEED_FILE = ROOT / "data" / "seed_talent.json"


def main() -> None:
    if not SEED_FILE.exists():
        print(f"[ERROR] Seed file not found: {SEED_FILE}")
        sys.exit(1)

    with open(SEED_FILE) as f:
        profiles: list[dict] = json.load(f)

    db = create_client(settings.supabase_url, settings.supabase_service_key)

    existing = db.table("talent_profiles").select("id", count="exact").eq("source", "seed").execute()
    count = existing.count or len(existing.data or [])

    if count > 0 and "--force" not in sys.argv:
        print(f"Already seeded ({count} seed records). Run with --force to re-seed.")
        return

    if count > 0:
        db.table("talent_profiles").delete().eq("source", "seed").execute()
        print(f"Deleted {count} existing seed records.")

    rows = [
        {
            "source": "seed",
            "name": p["name"],
            "role_type": p["role_type"],
            "niche": p["niche"],
            "skills": p.get("skills", []),
            "experience_years": p.get("experience_years", 0),
            "city": p.get("city", ""),
            "country": p.get("country", ""),
            "country_code": p.get("country_code", ""),
            "lat": p.get("lat"),
            "lng": p.get("lng"),
            "bio": p.get("bio", ""),
            "github_username": p.get("github_username"),
        }
        for p in profiles
    ]

    total = 0
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        result = db.table("talent_profiles").insert(batch).execute()
        n = len(result.data or [])
        total += n
        print(f"  Batch {i // batch_size + 1}: inserted {n} rows")

    print(f"\nDone — {total} seed profiles in talent_profiles.")


if __name__ == "__main__":
    main()
