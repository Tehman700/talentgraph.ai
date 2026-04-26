import type {
  OnboardingData, SkillsProfile, MatchResult, CountrySummary, CountryConfig, SavedProfile,
  TalentPoint, ExtractedProfile, JobPosting,
} from '../types'
import { useAppStore } from '../store'

const BASE = '/api'

function getToken(): string | null {
  return useAppStore.getState().authToken
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

async function upload<T>(path: string, file: File): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload failed')
  }
  return res.json()
}

export const api = {
  // Countries
  getCountries: () => request<CountrySummary[]>('GET', '/countries'),
  getCountry: (code: string) => request<CountryConfig>('GET', `/countries/${code}`),
  getCountrySignals: (code: string) => request<unknown>('GET', `/countries/${code}/signals`),

  // Legacy skills / opportunities
  analyzeSkills: (data: OnboardingData) =>
    request<SkillsProfile>('POST', '/skills/analyze', data),
  matchOpportunities: (country_code: string, skills_profile: SkillsProfile) =>
    request<MatchResult>('POST', '/opportunities/match', { country_code, skills_profile }),
  getPolicyView: (country_code: string) =>
    request<unknown>('GET', `/opportunities/policy/${country_code}`),

  // Legacy auth-gated profiles
  getMe: () => request<{ id: string; email: string }>('GET', '/profiles/me'),
  listProfiles: () => request<{ profiles: SavedProfile[] }>('GET', '/profiles'),
  getProfile: (id: string) => request<SkillsProfile>('GET', `/profiles/${id}`),
  deleteProfile: (id: string) => request<void>('DELETE', `/profiles/${id}`),
  getProfileMatches: (id: string) => request<{ matches: MatchResult[] }>('GET', `/profiles/${id}/matches`),

  // Talent platform — globe
  getTalentGlobe: (params?: {
    niche?: string
    role_type?: string
    country_code?: string
    location?: string
    profession?: string
    skill?: string
    experience_level?: 'junior' | 'mid' | 'senior'
  }) => {
    const qs = new URLSearchParams()
    if (params?.niche) qs.set('niche', params.niche)
    if (params?.role_type) qs.set('role_type', params.role_type)
    if (params?.country_code) qs.set('country_code', params.country_code)
    if (params?.location) qs.set('location', params.location)
    if (params?.profession) qs.set('profession', params.profession)
    if (params?.skill) qs.set('skill', params.skill)
    if (params?.experience_level) qs.set('experience_level', params.experience_level)
    const q = qs.toString()
    return request<{ points: TalentPoint[]; total: number }>('GET', `/talent/globe${q ? '?' + q : ''}`)
  },
  getTalentNiches: () => request<{ niches: string[] }>('GET', '/talent/niches'),

  // Talent extraction
  extractFromGitHub: (username: string) =>
    request<ExtractedProfile>('POST', '/talent/extract/github', { username }),
  extractFromLinkedIn: (profile_url: string) =>
    request<ExtractedProfile>('POST', '/talent/extract/linkedin', { profile_url }),
  extractFromBio: (bio: string) =>
    request<ExtractedProfile>('POST', '/talent/extract/bio', { bio }),
  synthesizeProfile: (data: {
    role_type?: 'tech' | 'non_tech'
    github_username?: string
    linkedin_url?: string
    bio?: string
  }) => request<ExtractedProfile>('POST', '/talent/extract/synthesize', data),
  extractFromCV: (file: File) =>
    upload<ExtractedProfile>('/talent/extract/cv', file),

  // Save profile
  saveTalentProfile: (data: Omit<Partial<TalentPoint>, 'lat' | 'lng'> & {
    lat?: number | null
    lng?: number | null
    github_username?: string
    linkedin_url?: string
    photo_url?: string
    resume_url?: string
    verify_github?: boolean
    verify_linkedin?: boolean
    profession?: string
    state?: string
  }) =>
    request<{ id: string; saved: boolean }>('POST', '/talent/save', data),
  verifySocial: (data: { github_username?: string; linkedin_url?: string }) =>
    request<{ github_verified: boolean; linkedin_verified: boolean; verified: boolean }>('POST', '/talent/verify-social', data),
  getMyTalentProfile: () => request<TalentPoint>('GET', '/talent/me'),

  // Jobs
  postJob: (data: {
    title: string; description: string; org_name?: string
    city?: string; country?: string; country_code?: string
    lat?: number | null; lng?: number | null
  }) => request<{ id: string; required_skills: string[]; summary: string; niche: string }>('POST', '/jobs/post', data),
  getJobGlobe: (jobId: string) =>
    request<{ job: Partial<JobPosting>; points: TalentPoint[]; total: number; top_matches: TalentPoint[] }>(
      'GET', `/jobs/globe/${jobId}`
    ),

  // Hiring Forms
  createHiringForm: (data: {
    job_title: string
    job_description?: string
    company?: string
    questions: any[]
    target_user_ids: string[]
  }) => request<{ form_id: string; notified_count: number }>('POST', '/hiring/forms', data),
  
  listOrgForms: () => request<{ forms: any[] }>('GET', '/hiring/forms'),
  
  getFormDetail: (id: string) => request<any>('GET', `/hiring/forms/${id}`),
  
  submitFormResponse: (id: string, data: any) => 
    request<{ response_id: string; submitted: boolean }>('POST', `/hiring/forms/${id}/respond`, data),
  
  getFormResponses: (id: string) => request<{ responses: any[] }>('GET', `/hiring/forms/${id}/responses`),

  listNotifications: () => request<{ notifications: any[] }>('GET', '/hiring/notifications'),
}
