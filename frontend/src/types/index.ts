export type EducationLevel = 'none' | 'primary' | 'secondary' | 'vocational' | 'tertiary'
export type UserType = 'worker' | 'policy'
export type OpportunityType = 'formal_employment' | 'self_employment' | 'gig' | 'training' | 'cooperative' | 'piece_rate'

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
    gdp_growth_pct: number
    data_year: number
    data_source: string
  }
  sectors: {
    name: string
    employment_pct: number
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
