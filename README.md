# SkillPath — Know Your Skills. Find Your Path.

> **Hackathon Project** — Skills Signal Engine + Opportunity Matching for informal economy workers in LMICs.

SkillPath is a two-module AI tool that helps informal economy workers (like Amara — a self-taught coder in Kampala with no formal certificates) understand their skills in standardized terms and discover **real, reachable labor market opportunities** backed by ILO econometric data.

---

## The Problem

- **94.7%** of Uganda's workforce is in the informal economy
- Most workers have no formal credentials — their skills are invisible to systems
- Generic career tools assume formal employment and high-speed internet
- Automation risk is **different** in Kampala vs. Kuala Lumpur — most tools ignore this

---

## What We Built

### Module 01 — Skills Signal Engine
Takes a worker's informal experience (in plain language) and maps it to a **standardized, portable skills profile** using the ESCO skills taxonomy.

```
Input:  "I grow maize, sell at market, repair phones on the side"
        + Education level + Country + Years of experience

Output: Occupation title (ESCO mapped)
        ISCO code
        Skills list with levels (basic / intermediate / advanced)
        Durable skills (automation-resilient) marked
        Plain-language profile summary Amara can read and share
        Skill gaps to fill
```

### Module 03 — Opportunity Matching & Econometric Dashboard
Takes the skills profile + country context and surfaces **real, reachable opportunities** with visible ILO econometric signals.

```
Input:  Skills profile + Country

Output: Ranked opportunities (formal, self-employment, gig, cooperative)
        Match score per opportunity
        Sector growth rate (ILO data) — visible, not buried
        Wage range per opportunity (ILO earnings data)
        Next concrete steps per opportunity
        2+ econometric signals prominently displayed
        Policymaker aggregate dashboard
```

---

## Demo Countries

| Country | Context | Informal Employment | Avg Wage |
|---------|---------|---------------------|----------|
| 🇺🇬 Uganda | Urban informal, Sub-Saharan Africa | 94.7% | $145/mo |
| 🇧🇩 Bangladesh | Mixed formal/informal, South Asia | 85.1% | $180/mo |

Switch between them in the UI — no code changes needed. This demonstrates the **country-agnostic design** requirement.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS v4 |
| Backend | FastAPI (Python 3.12) + UV package manager |
| AI / LLM | Google Gemini 2.0 Flash |
| Data | ILO ILOSTAT (1,880 indicators) + ESCO v1.2 seed |
| State | Zustand |
| Routing | React Router v6 |

---

## Real Data Sources

| Source | What We Use |
|--------|-------------|
| **ILO ILOSTAT** | Working poverty rate, informal employment %, unemployment rate, avg earnings by sector — 1,880 indicators |
| **ESCO v1.2** | Occupation taxonomy, skill labels, reusability tags, durable skill markers |
| **World Bank WDI** | GDP growth, population, human capital index |

All econometric signals shown in the UI are sourced from real ILO data — not synthetic.

---

## Project Structure

```
talentgraph.ai/
├── backend/
│   ├── main.py                          # FastAPI app + router registration
│   ├── .env.example                     # Required env vars
│   ├── pyproject.toml                   # UV dependencies
│   ├── data/
│   │   ├── esco_seed.json               # 15 ESCO occupations for LMIC contexts
│   │   └── countries/
│   │       ├── uga.json                 # Uganda config + ILO signals
│   │       └── bgd.json                 # Bangladesh config + ILO signals
│   └── app/
│       ├── config.py                    # Pydantic settings (env vars)
│       ├── database.py                  # Supabase client
│       ├── auth.py                      # JWT middleware
│       ├── models/                      # Pydantic request/response schemas
│       │   ├── talent.py
│       │   ├── org.py
│       │   ├── job.py
│       │   └── connection.py
│       ├── routers/
│       │   ├── countries.py             # GET /api/countries, /api/countries/{code}
│       │   ├── skills.py                # POST /api/skills/analyze (Module 01)
│       │   └── opportunities.py        # POST /api/opportunities/match (Module 03)
│       └── services/
│           ├── claude.py               # Gemini 2.0 Flash integration
│           ├── data_loader.py          # Country config + ILO + ESCO loader
│           └── matching.py            # Skill overlap scoring
│
├── frontend/
│   └── src/
│       ├── types/index.ts              # All TypeScript interfaces
│       ├── lib/api.ts                  # Fetch wrapper (proxy to :8000)
│       ├── store/index.ts              # Zustand app state
│       ├── components/
│       │   ├── TopBar.tsx              # Fixed top bar (brand + status + clock)
│       │   └── BottomNav.tsx           # Fixed bottom navigation
│       └── pages/
│           ├── Home.tsx                # Landing page
│           ├── Onboarding.tsx          # 4-step skills input wizard
│           ├── SkillsProfile.tsx       # Module 01 output
│           ├── Opportunities.tsx       # Module 03 output (worker view)
│           └── PolicyDashboard.tsx     # Module 03 output (policymaker view)
│
├── ESCO Skills Taxonomy Dataset.json   # ILO ILOSTAT indicators catalog (1,880 records)
└── Design Files/                       # UI reference designs
```

---

## Setup & Run

### Prerequisites
- Python 3.12+
- Node.js 18+
- [UV](https://docs.astral.sh/uv/) — `pip install uv`
- Google Gemini API key — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Backend

```bash
cd backend

# Install dependencies
uv install

# Create .env from example
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Run
uv run uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## API Endpoints

### Countries (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/countries` | List available countries |
| GET | `/api/countries/{code}` | Full country config + ILO signals |
| GET | `/api/countries/{code}/signals` | Econometric signals + ILO catalog |

### Module 01 — Skills Signal Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/skills/analyze` | Analyze worker background → ESCO profile |
| GET | `/api/skills/occupations/{country}` | List ESCO occupations for country |

**Example request:**
```json
POST /api/skills/analyze
{
  "country_code": "UGA",
  "education_level": "primary",
  "experience_years": 8,
  "work_description": "I grow maize and cassava on 2 acres, sell at the local market every Tuesday, and repair mobile phones on the side.",
  "competencies": ["crop rotation", "phone screen replacement"]
}
```

**Example response:**
```json
{
  "occupation_title": "Market Stall / Street Vendor",
  "isco_code": "5221",
  "occupation_summary": "You run a market business selling agricultural products...",
  "skills": [
    { "label": "inventory management", "level": "intermediate", "is_durable": true, "category": "transferable" },
    { "label": "crop cultivation", "level": "advanced", "is_durable": true, "category": "technical" }
  ],
  "strengths": ["Entrepreneurial mindset", "Multi-skilled across sectors", "Customer-facing experience"],
  "skill_gaps": ["Basic digital literacy", "Record-keeping and accounting"],
  "profile_summary": "You are a self-employed agricultural trader with 8 years of hands-on experience..."
}
```

### Module 03 — Opportunity Matching

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/opportunities/match` | Match skills profile → ranked opportunities |
| GET | `/api/opportunities/policy/{code}` | Policymaker data view |

**Example request:**
```json
POST /api/opportunities/match
{
  "country_code": "UGA",
  "skills_profile": { ...output from /skills/analyze... }
}
```

**Example response:**
```json
{
  "opportunities": [
    {
      "title": "Cooperative Market Trader",
      "type": "cooperative",
      "sector": "Wholesale & Retail Trade",
      "match_score": 0.91,
      "realistic": true,
      "wage_range_usd": { "min": 120, "max": 200 },
      "sector_growth_pct": 4.1,
      "next_steps": ["Join local SACCO", "Register with district market authority"]
    }
  ],
  "econometric_signals": {
    "informal_employment_pct": 94.7,
    "avg_monthly_wage_usd": 145,
    "working_poverty_rate": 58.2,
    "youth_unemployment_pct": 13.4,
    "data_source": "ILO ILOSTAT, World Bank WDI 2023"
  },
  "recommendations": ["Focus on cooperative entry...", "Digital skills open ICT sector..."]
}
```

---

## Frontend Pages

### `/` — Landing Page
Editorial-style hero with floating data chips. Two entry points: Worker flow and Policymaker flow.

### `/onboarding` — Skills Input Wizard
4-step form:
1. **Country** — Uganda or Bangladesh (configurable, no hardcoding)
2. **Background** — Education level + years of experience (no certificates required)
3. **Your Work** — Free-text description of what they do + optional explicit skills
4. **Review** — Confirm and trigger Gemini analysis

### `/profile` — Skills Profile (Module 01 Output)
- Occupation title mapped to ESCO + ISCO code
- Full skills grid with levels (basic / intermediate / advanced)
- Durable skills marked (◆) — automation-resilient
- Strengths vs. skill gaps side by side
- Plain-language summary the worker can read and share

### `/opportunities` — Opportunity Matching (Module 03 Worker View)
- **2 ILO econometric signals shown prominently** (not buried):
  - Informal employment %
  - Average monthly wage
  - Working poverty rate
  - Youth unemployment %
- Ranked opportunity cards with match score bar
- Sector growth rate per opportunity (ILO data)
- Wage range per opportunity
- Concrete next steps

### `/policy` — Policymaker Dashboard (Module 03 Policy View)
- Country switcher (Uganda ↔ Bangladesh — live, no page reload)
- 6-metric signal grid (all real ILO data)
- Sector employment breakdown with growth bars
- Local realities for that country context
- Automation risk calibrated to LMIC (not generic)

---

## Evaluation Criteria Coverage

| Requirement | Status |
|-------------|--------|
| 2+ modules built | ✅ Module 01 + 03 |
| Real econometric data | ✅ ILO ILOSTAT (1,880 indicators) |
| 2+ visible signals | ✅ 4 signals shown on Opportunities page |
| Country-agnostic | ✅ Config-driven, demo Uganda ↔ Bangladesh |
| Human-readable output | ✅ Plain language throughout |
| Designed for constraints | ✅ Low bandwidth (no heavy assets), no login required to browse |
| Automation calibrated to LMICs | ✅ Per-country automation risk note |
| Dual interface (worker + policy) | ✅ `/opportunities` vs `/policy` |

---

## Environment Variables

```bash
# backend/.env
GEMINI_API_KEY=AIza...          # Required — Google AI Studio
SUPABASE_URL=                   # Optional — for auth + persistence
SUPABASE_SERVICE_KEY=           # Optional
SUPABASE_ANON_KEY=              # Optional
RESEND_API_KEY=                 # Optional — for connection emails
MAPBOX_TOKEN=                   # Optional — for map features
```

---

## Design

UI design language inspired by editorial data tools — JetBrains Mono + Instrument Serif, electric blue `#1710E6` + lime `#8DC651` accent on off-white `#f6f4ef` paper.

---

Built for the **Skills & Opportunity Hackathon** · April 2026
