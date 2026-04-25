from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import countries, skills, opportunities

app = FastAPI(title="SkillPath API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(countries.router)
app.include_router(skills.router)
app.include_router(opportunities.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "modules": ["skills_signal_engine", "opportunity_matching"]}
