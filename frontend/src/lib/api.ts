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
  getTalentGlobe: (params?: { niche?: string; role_type?: string; country_code?: string }) => {
    const qs = new URLSearchParams()
    if (params?.niche) qs.set('niche', params.niche)
    if (params?.role_type) qs.set('role_type', params.role_type)
    if (params?.country_code) qs.set('country_code', params.country_code)
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
  saveTalentProfile: (data: Partial<TalentPoint> & { github_username?: string }) =>
    request<{ id: string; saved: boolean }>('POST', '/talent/save', data),
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
}
