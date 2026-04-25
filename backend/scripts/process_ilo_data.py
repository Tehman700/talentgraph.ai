"""
Extract Uganda + Bangladesh signals from ILO Dataset 01 (earnings) and Dataset 02 (employment).
Outputs backend/data/ilo_signals.json for use by the API.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
DATA_DIR = Path(__file__).parent.parent / "data"

COUNTRIES = {"Uganda": "UGA", "Bangladesh": "BGD"}

SECTOR_MAP = {
    "Economic activity (Broad sector): Total": "total",
    "Economic activity (Broad sector): Agriculture": "agriculture",
    "Economic activity (Broad sector): Industry": "industry",
    "Economic activity (Broad sector): Services": "services",
    "Economic activity (Broad sector): Non-agriculture": "non_agriculture",
}


def extract_earnings(filepath: Path) -> dict:
    out: dict = {}
    with open(filepath, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            country = row["ref_area.label"]
            if country not in COUNTRIES:
                continue
            if row["classif2.label"] != "Currency: U.S. dollars":
                continue
            if row["sex.label"] != "Total":
                continue
            sector = SECTOR_MAP.get(row["classif1.label"])
            if not sector:
                continue
            try:
                year = int(row["time"])
                value = float(row["obs_value"])
            except (ValueError, TypeError):
                continue

            code = COUNTRIES[country]
            out.setdefault(code, {})
            key = f"{sector}_wage_usd"
            yr_key = f"{sector}_wage_year"
            if key not in out[code] or year > out[code].get(yr_key, 0):
                out[code][key] = round(value, 2)
                out[code][yr_key] = year
    return out


def extract_employment(filepath: Path) -> dict:
    out: dict = {}
    with open(filepath, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            country = row["ref_area.label"]
            if country not in COUNTRIES:
                continue
            if row["sex.label"] != "Total":
                continue
            if row["classif1.label"] != "Age (Youth, adults): 15+":
                continue
            sector = SECTOR_MAP.get(row["classif2.label"])
            if not sector:
                continue
            try:
                year = int(row["time"])
                value = float(row["obs_value"])
            except (ValueError, TypeError):
                continue

            code = COUNTRIES[country]
            out.setdefault(code, {})
            key = f"{sector}_emp_k"
            yr_key = "emp_year"
            if key not in out[code] or year > out[code].get(yr_key, 0):
                out[code][key] = round(value, 1)
                out[code][yr_key] = year
    return out


def compute_percentages(signals: dict) -> None:
    for data in signals.values():
        total = data.get("total_emp_k", 0)
        if total > 0:
            for sector in ("agriculture", "industry", "services"):
                k = f"{sector}_emp_k"
                if k in data:
                    data[f"{sector}_emp_pct"] = round(data[k] / total * 100, 1)


if __name__ == "__main__":
    print("Processing ILO Dataset 01 (earnings)…")
    earnings = extract_earnings(ROOT / "ILO Dataset 01.csv")

    print("Processing ILO Dataset 02 (employment)…")
    employment = extract_employment(ROOT / "ILO Dataset 02.csv")

    signals: dict = {}
    for code in set(list(earnings) + list(employment)):
        signals[code] = {**earnings.get(code, {}), **employment.get(code, {})}

    compute_percentages(signals)

    out_path = DATA_DIR / "ilo_signals.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(signals, f, indent=2)

    print(f"\nSaved to {out_path}\n")
    for code, data in signals.items():
        print(f"{code}:")
        for k, v in sorted(data.items()):
            print(f"  {k}: {v}")
