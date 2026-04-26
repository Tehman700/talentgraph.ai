export type EducationLevel = 'none' | 'primary' | 'secondary' | 'vocational' | 'tertiary'
export type UserType = 'worker' | 'policy'
export type OpportunityType = 'formal_employment' | 'self_employment' | 'gig' | 'training' | 'cooperative' | 'piece_rate'
export type RoleType = 'tech' | 'non_tech'
export type FlowType = 'professional' | 'org'

export interface Skill {
  label: string
  level: 'basic' | 'intermediate' | 'advanced'
  is_durable: boolean
  category: 'technical' | 'transferable' | 'foundational'
}

export interface SkillsProfile {
  occupation_title: string
  isco_code: string
  occupation_summary: string
  skills: Skill[]
  strengths: string[]
  skill_gaps: string[]
  profile_summary: string
  country_code: string
  saved_id?: string
}

export interface Opportunity {
  title: string
  type: OpportunityType
  sector: string
  match_score: number
  match_reasons: string[]
  realistic: boolean
  wage_range_usd: { min: number; max: number }
  sector_growth_pct: number
  next_steps: string[]
}

export interface EconometricSignals {
  informal_employment_pct: number
  avg_monthly_wage_usd: number
  working_poverty_rate: number
  youth_unemployment_pct: number
  data_source: string
}

export interface MatchResult {
  opportunities: Opportunity[]
  econometric_signals: EconometricSignals
  recommendations: string[]
  country_code: string
  country_name: string
}

export interface CountrySummary {
  code: string
  name: string
  region: string
  context: string
}

export interface CountryConfig extends CountrySummary {
  signals: {
    informal_employment_pct: number
    youth_unemployment_pct: number
    working_poverty_rate: number
    avg_monthly_wage_usd: number
    population_millions?: number
    gdp_growth_pct: number
    data_year: number
    data_source: string
    total_employed_thousands?: number
  }
  sectors: {
    name: string
    employment_pct: number
    employment_thousands?: number
    growth_rate_pct: number
    avg_wage_usd: number
    opportunity_types: OpportunityType[]
    informal_dominant: boolean
  }[]
  local_realities: string[]
  automation_risk_note: string
}

export interface OnboardingData {
  country_code: string
  education_level: EducationLevel
  experience_years: number
  work_description: string
  competencies: string[]
}

export interface AuthUser {
  id: string
  email: string | undefined
}

export interface SavedProfile {
  id: string
  country_code: string
  occupation_title: string
  isco_code: string
  profile_summary: string
  education_level: string
  experience_years: number
  work_description: string
  created_at: string
}

// ── Talent Platform ──────────────────────────────────────────────────────────

export interface TalentPoint {
  id?: string
  name: string
  role_type: RoleType
  niche: string
  profession?: string
  similarity?: number
  skills: string[]
  experience_years: number
  experience_level?: 'junior' | 'mid' | 'senior'
  city: string
  state?: string
  country: string
  country_code?: string
  lat: number
  lng: number
  bio: string
  color?: string
  match_score?: number
  github_username?: string
  linkedin_url?: string
  photo_url?: string
  resume_url?: string
  verify_github?: boolean
  verify_linkedin?: boolean
}

export interface ExtractedProfile {
  name: string
  niche: string
  role_type: RoleType
  skills: string[]
  experience_years: number
  bio: string
  detected_location: string
  github_username?: string
  linkedin_url?: string
  raw_github_location?: string
  education_level?: EducationLevel
  sources?: {
    github?: boolean
    linkedin?: boolean
    bio?: boolean
  }
}

export interface JobPosting {
  id: string
  title: string
  org_name: string
  description: string
  required_skills: string[]
  city: string
  country: string
  country_code: string
  lat: number | null
  lng: number | null
  summary?: string
}

export interface LocationInfo {
  city: string
  country: string
  country_code: string
  lat: number | null
  lng: number | null
}

export const TECH_NICHES = [
  'Frontend Development',
  'Backend Engineering',
  'Mobile Development',
  'DevOps & Cloud',
  'Data Science & ML',
  'UX & Design',
  'Security',
  'Blockchain',
  'Game Development',
] as const

export const NON_TECH_NICHES = [
  'Agriculture',
  'Healthcare',
  'Education',
  'Finance',
  'Construction',
  'Retail',
  'Hospitality',
  'Manufacturing',
] as const

export const ALL_NICHES = [...TECH_NICHES, ...NON_TECH_NICHES] as const

export const NICHE_COLORS: Record<string, string> = {
  'Frontend Development': '#61DAFB',
  'Backend Engineering': '#00d4ff',
  'Mobile Development': '#a855f7',
  'DevOps & Cloud': '#f97316',
  'Data Science & ML': '#6366f1',
  'UX & Design': '#ec4899',
  'Security': '#ef4444',
  'Blockchain': '#eab308',
  'Game Development': '#84cc16',
  'Agriculture': '#8DC651',
  'Healthcare': '#0ea5e9',
  'Education': '#f59e0b',
  'Finance': '#10b981',
  'Construction': '#78716c',
  'Retail': '#e879f9',
  'Hospitality': '#fb923c',
  'Manufacturing': '#94a3b8',
}
