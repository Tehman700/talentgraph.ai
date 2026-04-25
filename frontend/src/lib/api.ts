import type { OnboardingData, SkillsProfile, MatchResult, CountrySummary, CountryConfig } from '../types'

const BASE = '/api'

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export const api = {
  getCountries: () => request<CountrySummary[]>('GET', '/countries'),
  getCountry: (code: string) => request<CountryConfig>('GET', `/countries/${code}`),
  getCountrySignals: (code: string) => request<unknown>('GET', `/countries/${code}/signals`),

  analyzeSkills: (data: OnboardingData) =>
    request<SkillsProfile>('POST', '/skills/analyze', data),

  matchOpportunities: (country_code: string, skills_profile: SkillsProfile) =>
    request<MatchResult>('POST', '/opportunities/match', { country_code, skills_profile }),

  getPolicyView: (country_code: string) =>
    request<unknown>('GET', `/opportunities/policy/${country_code}`),
}
