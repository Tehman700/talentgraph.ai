from fastapi import APIRouter, HTTPException
from ..services.data_loader import get_country, list_countries, get_ilo_signals_for_country

router = APIRouter(prefix="/api/countries", tags=["countries"])


@router.get("/")
def get_countries():
    return list_countries()


@router.get("/{code}")
def get_country_config(code: str):
    country = get_country(code.upper())
    if not country:
        raise HTTPException(404, f"Country '{code}' not configured. Available: UGA, BGD")
    return country


@router.get("/{code}/signals")
def get_country_signals(code: str):
    country = get_country(code.upper())
    if not country:
        raise HTTPException(404, f"Country '{code}' not found")
    ilo_signals = get_ilo_signals_for_country(code.upper())
    return {
        "country": code.upper(),
        "quantitative_signals": country["signals"],
        "sectors": country["sectors"],
        "ilo_catalog_entries": ilo_signals[:20],
    }
