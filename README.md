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

### Root Configuration Files

```
talentgraph.ai/
├── README.md                                    # This file — project overview & setup
├── .gitignore                                   # Git ignore rules
├── ESCO Skills Taxonomy Dataset.json            # ILO ILOSTAT indicators (1,880 records)
├── EMP_TEMP_SEX_AGE_ECO_NB_A-20260425T2020.csv # ILO employment data export
├── EAR_EMTA_SEX_ECO_CUR_NB_A-20260425T2023.csv # ILO earnings data export
├── supabase_migration_v3.sql                    # DB schema: hiring forms, notifications, responses
├── supabase_migration_v4.sql                    # DB schema: extended talent profiles (photo, resume URLs)
├── supabase_migration_v2.sql                    # DB schema: base talent profiles, jobs
├── supabase_migration.sql                       # Initial DB schema (legacy)
```

### Backend (FastAPI + Python 3.12)

```
backend/
├── main.py                                      # FastAPI entry point, CORS config, router registration
├── .env.example                                 # Template for environment variables (GEMINI_API_KEY, SUPABASE_URL, etc.)
├── .python-version                              # Python 3.12 version pin
├── pyproject.toml                               # UV dependency manifest (fastapi, pydantic, httpx, playwright, pdfplumber)
├── uv.lock                                      # Locked dependencies (reproducible builds)
├── README.md                                    # Backend-specific setup guide
│
├── app/
│   ├── __init__.py                              # Package marker
│   ├── config.py                                # Pydantic BaseSettings (env var loading, validation)
│   ├── database.py                              # Supabase client initialization + connection pooling
│   ├── auth.py                                  # JWT token validation middleware, RLS token generation
│   │
│   ├── models/                                  # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── talent.py                            # TalentCreate, TalentUpdate, TalentProfile, SkillItem, ProfileLinks
│   │   ├── org.py                               # Organization, OrgCreate schemas
│   │   ├── job.py                               # JobPosting, JobCreate schemas
│   │   └── connection.py                        # Connection tracking schemas
│   │
│   ├── routers/                                 # API endpoint handlers
│   │   ├── __init__.py
│   │   ├── talent.py                            # GET /api/talent/globe, POST /api/talent/save, /extract/*, /me, /verify-social
│   │   ├── hiring.py                            # POST /api/hiring/forms, GET /api/hiring/forms/{id}, POST /forms/{id}/respond, /responses, /export.csv, /notifications
│   │   ├── jobs.py                              # POST /api/jobs/post, GET /api/jobs/globe/{id}
│   │   ├── countries.py                         # GET /api/countries, /api/countries/{code}, /signals
│   │   ├── skills.py                            # POST /api/skills/analyze, GET /api/skills/occupations/{country}
│   │   ├── profile.py                           # User profile management endpoints
│   │   ├── opportunities.py                     # POST /api/opportunities/match, GET /api/opportunities/policy/{code}
│   │   └── (other specialized routers as needed)
│   │
│   └── services/                                # Business logic & integrations
│       ├── __init__.py
│       ├── claude.py                            # GPT-4o-mini + Claude API fallback for LLM tasks (skill analysis, opportunity matching)
│       ├── talent_extractor.py                  # LinkedIn profile extraction (Playwright), GitHub user data fetch, CV parsing (pdfplumber)
│       ├── data_loader.py                       # Load & cache: countries/*.json, esco_seed.json, ilo_signals.json
│       └── matching.py                          # Skill overlap scoring, opportunity ranking by match_score
│
├── scripts/
│   ├── __init__.py
│   ├── seed_talent.py                           # Load seed_talent.json into Supabase talent_profiles table
│   └── process_ilo_data.py                      # Parse ILO CSV exports → ilo_signals.json
│
└── data/
    ├── seed_talent.json                         # 600+ worker profiles (name, niche, country, skills, experience_years, bio, photo_url, linkedin_url, etc.)
    ├── esco_seed.json                           # 15 ESCO occupations (occupation_title, isco_code, description, durable_skills)
    ├── ilo_signals.json                         # Country-level ILO indicators (informal_employment_pct, avg_monthly_wage_usd, working_poverty_rate, youth_unemployment_pct)
    └── countries/
        ├── uga.json                             # Uganda config: geo bounds, ILO signals, sector breakdown
        └── bgd.json                             # Bangladesh config: geo bounds, ILO signals, sector breakdown
```

### Frontend (React 19 + TypeScript + Vite)

```
frontend/
├── package.json                                 # Dependencies: react, vite, tailwind, zustand, react-router, react-globe.gl, shadcn/ui
├── package-lock.json                            # Locked dependencies
├── vite.config.ts                               # Vite build config, dev server proxy to localhost:8000
├── tsconfig.json                                # TypeScript compiler options (strict mode, jsx react-jsx)
├── tsconfig.app.json                            # Frontend-specific TypeScript config
├── tsconfig.node.json                           # Node tooling TypeScript config (Vite)
├── eslint.config.js                             # ESLint rules
├── .env.example                                 # Frontend env template (VITE_API_URL, SUPABASE_ANON_KEY)
├── .gitignore                                   # Git ignore rules
├── index.html                                   # HTML entry point
├── README.md                                    # Frontend-specific setup guide
├── generate_seed.cjs                            # Script to generate seed profile data
│
├── public/
│   ├── favicon.svg                              # App icon
│   └── icons.svg                                # SVG icon sprite
│
└── src/
    ├── main.tsx                                 # React entry point, mount to #root
    ├── App.tsx                                  # App wrapper component
    ├── App.css                                  # Global styles
    ├── index.css                                # Tailwind + custom fonts (mono, serif)
    ├── router.tsx                               # React Router config (all routes + lazy loading)
    │
    ├── types/
    │   └── index.ts                             # TypeScript interfaces: TalentPoint, ExtractedProfile, JobPosting, HiringForm, FormResponse, TECH_NICHES, NON_TECH_NICHES, NICHE_COLORS
    │
    ├── lib/
    │   ├── api.ts                               # Fetch wrapper with all API methods (getTalentGlobe, saveTalentProfile, createHiringForm, listOrgForms, submitFormResponse, etc.)
    │   ├── supabase.ts                          # Supabase client initialization
    │   └── location.ts                          # Parse country/city from free-text location string
    │
    ├── store/
    │   └── index.ts                             # Zustand global state (authUser, authToken, extractedProfile, location, savedTalentId, jobPosting, notifications)
    │
    ├── components/                              # Reusable UI components
    │   ├── TalentGlobe.tsx                      # Interactive 3D globe (react-globe.gl) with country polygons, worker points, filters, auto-rotate control, green land + light blue sea
    │   ├── TopBar.tsx                           # Fixed top bar: brand logo, time, auth status, menu (Browse Globe, Become a Worker, My Profiles, Sign out)
    │   ├── AuthModal.tsx                        # Sign up / Sign in modal (Supabase magic link or email/password)
    │   ├── FilterPanel.tsx                      # Filter UI: location, profession, skills, role_type, experience (used in Explore)
    │   └── BottomNav.tsx                        # Bottom navigation (legacy, mostly unused)
    │
    ├── pages/                                   # Full-page route components
    │   ├── Home.tsx                             # Landing page: hero section, CTA buttons (Browse Workers, Become a Worker, We're Hiring), globe with niche chips overlay
    │   ├── Explore.tsx                          # Browse-first worker discovery (no auth required), real-time filters, worker cards, globe view
    │   ├── BecomeWorker.tsx                     # Multi-step profile creation: name, profession, niche, location, skills, bio, photo/resume URLs, social links, verification
    │   ├── OrgMatches.tsx                       # Organization hiring dashboard: globe + filtered candidates, "Apply to X candidates" button, form builder modal
    │   ├── ApplyForm.tsx                        # Candidate-facing form submission UI with dynamic question rendering
    │   ├── OrgForms.tsx                         # Organization response dashboard: list forms, view responses, export CSV
    │   ├── Dashboard.tsx                        # User profile list + pending applications notification section
    │   ├── Onboarding.tsx                       # Legacy: 4-step skills input wizard
    │   ├── Onboard.tsx                          # Legacy entry point
    │   ├── OnboardTech.tsx                      # Legacy: tech worker onboarding flow
    │   ├── OnboardNonTech.tsx                   # Legacy: non-tech worker onboarding flow
    │   ├── OnboardOrg.tsx                       # Legacy: organization onboarding flow
    │   ├── SkillsProfile.tsx                    # Legacy: Module 01 output (skills analysis)
    │   ├── Opportunities.tsx                    # Legacy: Module 03 output (opportunity matching)
    │   └── PolicyDashboard.tsx                  # Legacy: Module 03 policymaker view
    │
    └── assets/
        ├── hero.png                             # Hero section background image
        ├── vite.svg                             # Vite logo
        └── react.svg                            # React logo
```

### Dashboard Theme Design (Reference UI Library)

```
Dashboard Theme Design (2)/
├── vite.config.ts                              # Vite config for theme design project
├── package.json                                # Dependencies: react, vite, tailwind, shadcn/ui, react-globe.gl
├── index.html                                  # HTML entry point
├── pnpm-workspace.yaml                         # Workspace config
├── postcss.config.mjs                          # PostCSS + Tailwind processor
├── README.md                                   # Project documentation
├── ATTRIBUTIONS.md                             # Component attribution (shadcn/ui)
├── default_shadcn_theme.css                    # Default shadcn/ui theme variables
├── globe_visualization.js                      # Globe utility functions (PROFESSION_COLORS, assignUserTags, profileToPoint, groupByCountry, etc.)
│
├── src/
│   ├── main.tsx                                # Entry point
│   ├── app/
│   │   ├── App.tsx                             # App wrapper
│   │   ├── components/
│   │   │   ├── InteractiveGlobe.tsx            # Full-featured globe component (polygons, worker tooltips, filters, stats panel) — used in main TalentGlobe.tsx
│   │   │   ├── MainDashboard.tsx               # Dashboard layout container
│   │   │   ├── Navbar.tsx                      # Top navigation bar
│   │   │   ├── Sidebar.tsx                     # Left sidebar navigation
│   │   │   ├── ChatPanel.tsx                   # Chat/messaging panel
│   │   │   ├── DataVisualization.tsx           # Data chart components
│   │   │   ├── VersionControl.tsx              # Version control UI
│   │   │   └── figma/
│   │   │       └── ImageWithFallback.tsx       # Image loading component
│   │   └── components/ui/                      # 50+ shadcn/ui components
│   │       ├── button.tsx, card.tsx, dialog.tsx, dropdown-menu.tsx, form.tsx
│   │       ├── input.tsx, label.tsx, textarea.tsx, select.tsx
│   │       ├── checkbox.tsx, radio-group.tsx, toggle.tsx, switch.tsx
│   │       ├── tabs.tsx, accordion.tsx, collapsible.tsx
│   │       ├── alert.tsx, toast.tsx (via sonner.tsx)
│   │       ├── modal/alert-dialog.tsx, sheet.tsx, drawer.tsx
│   │       ├── table.tsx, pagination.tsx
│   │       ├── chart.tsx, progress.tsx, slider.tsx, skeleton.tsx
│   │       ├── badge.tsx, breadcrumb.tsx, avatar.tsx, tooltip.tsx
│   │       ├── popover.tsx, hover-card.tsx, context-menu.tsx, navigation-menu.tsx
│   │       ├── separator.tsx, scroll-area.tsx, resizable.tsx
│   │       ├── carousel.tsx, aspect-ratio.tsx, calendar.tsx
│   │       ├── input-otp.tsx, menubar.tsx, command.tsx
│   │       └── use-mobile.ts, utils.ts (helpers)
│   │
│   ├── styles/
│   │   ├── index.css                           # Main stylesheet entry
│   │   ├── theme.css                           # Theme variables (colors, spacing, shadows)
│   │   ├── tailwind.css                        # Tailwind CSS directives
│   │   └── fonts.css                           # Custom font definitions
│   │
│   ├── imports/
│   │   └── pasted_text/
│   │       └── skillpath-project-overview.md   # Project context document
│   │
│   └── organization_dashboard/
│       ├── organization_dashboard.js           # Org hiring dashboard UI
│       └── hiring_form.js                      # Form builder component
│
├── user_profile_creation/
│   ├── profile_form.js                         # Profile creation form
│   └── profile_card.js                         # Profile display card
│
├── user_resume_generation/
│   ├── resume_generation.js                    # Resume generation logic
│   └── ats_resume_formatter.js                 # ATS-optimized resume formatting
│
├── resources/
│   ├── latex_resume_template.tex               # LaTeX resume template
│   └── preferred_platforms.json                # Platform recommendations per profession
```

### Resources & Utilities

```
resources/
├── latex_resume.txt                            # LaTeX resume template text
└── prefered_platform_per_profession.txt        # Platform recommendations (GitHub, LinkedIn, Portfolio, etc.)

Design Files/
├── package.json                                # Figma-inspired design project config
├── site.jsx                                    # Design site wrapper
├── intro.jsx                                   # Intro component
├── animations.jsx                              # Animation library
├── Datapilot AI.html                           # Design reference HTML
└── uploads/                                    # Design screenshots & mockups
    ├── Screenshot 2026-04-23 015809.png
    ├── Screenshot 2026-04-23 015723.png
    └── pasted-*.png (various design assets)
```

### Database Migrations (Supabase PostgreSQL)

```
supabase_migration.sql              # ✓ Base schema: talent_profiles, job_postings, basic indexes
supabase_migration_v2.sql           # ✓ Extended: connections, social signals
supabase_migration_v3.sql           # ✓ NEW: hiring_forms, form_responses, form_notifications (One-Click Apply)
supabase_migration_v4.sql           # ✓ NEW: Extended talent_profiles (photo_url, resume_url, linkedin_url, github_username, profession, state, experience_level, verify_github, verify_linkedin)
```

**Key Tables:**
- `talent_profiles` — Worker profiles (id, name, niche, country, skills[], experience_years, bio, photo_url, resume_url, social links, verification badges)
- `job_postings` — Job posts (id, title, org_id, description, required_skills[], location, match_score)
- `hiring_forms` — Forms created by organizations (id, org_id, title, questions[], created_at)
- `form_responses` — Candidate responses (id, form_id, talent_id, answers[], submitted_at)
- `form_notifications` — Notifications for form recipients (id, form_id, recipient_count, status)
- `connections` — Social connections between users (id, from_user_id, to_user_id, type, status)

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
