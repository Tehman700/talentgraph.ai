import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { api } from '../lib/api'
import type { ExtractedProfile, LocationInfo } from '../types'
import { TECH_NICHES, NICHE_COLORS } from '../types'

const COUNTRY_LIST = [
  { code: 'US', name: 'United States', lat: 37.09, lng: -95.71 },
  { code: 'GB', name: 'United Kingdom', lat: 51.50, lng: -0.13 },
  { code: 'IN', name: 'India', lat: 20.59, lng: 78.96 },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.67 },
  { code: 'KE', name: 'Kenya', lat: -0.02, lng: 37.91 },
  { code: 'UG', name: 'Uganda', lat: 1.37, lng: 32.29 },
  { code: 'BD', name: 'Bangladesh', lat: 23.68, lng: 90.35 },
  { code: 'PK', name: 'Pakistan', lat: 30.38, lng: 69.35 },
  { code: 'CN', name: 'China', lat: 35.86, lng: 104.19 },
  { code: 'JP', name: 'Japan', lat: 36.20, lng: 138.25 },
  { code: 'KR', name: 'South Korea', lat: 35.91, lng: 127.77 },
  { code: 'SG', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { code: 'ID', name: 'Indonesia', lat: -0.79, lng: 113.92 },
  { code: 'PH', name: 'Philippines', lat: 12.88, lng: 121.77 },
  { code: 'VN', name: 'Vietnam', lat: 14.06, lng: 108.28 },
  { code: 'TH', name: 'Thailand', lat: 15.87, lng: 100.99 },
  { code: 'MY', name: 'Malaysia', lat: 4.21, lng: 101.97 },
  { code: 'DE', name: 'Germany', lat: 51.17, lng: 10.45 },
  { code: 'FR', name: 'France', lat: 46.23, lng: 2.21 },
  { code: 'NL', name: 'Netherlands', lat: 52.13, lng: 5.29 },
  { code: 'SE', name: 'Sweden', lat: 60.13, lng: 18.64 },
  { code: 'CA', name: 'Canada', lat: 56.13, lng: -106.35 },
  { code: 'AU', name: 'Australia', lat: -25.27, lng: 133.78 },
  { code: 'BR', name: 'Brazil', lat: -14.24, lng: -51.93 },
  { code: 'MX', name: 'Mexico', lat: 23.63, lng: -102.55 },
  { code: 'AR', name: 'Argentina', lat: -38.42, lng: -63.62 },
  { code: 'CO', name: 'Colombia', lat: 4.57, lng: -74.30 },
  { code: 'EG', name: 'Egypt', lat: 26.82, lng: 30.80 },
  { code: 'ZA', name: 'South Africa', lat: -30.56, lng: 22.94 },
  { code: 'GH', name: 'Ghana', lat: 7.95, lng: -1.02 },
  { code: 'ET', name: 'Ethiopia', lat: 9.14, lng: 40.49 },
  { code: 'TR', name: 'Turkey', lat: 38.96, lng: 35.24 },
  { code: 'PL', name: 'Poland', lat: 51.92, lng: 19.15 },
  { code: 'UA', name: 'Ukraine', lat: 48.38, lng: 31.17 },
  { code: 'RO', name: 'Romania', lat: 45.94, lng: 24.97 },
  { code: 'RU', name: 'Russia', lat: 61.52, lng: 105.32 },
  { code: 'IL', name: 'Israel', lat: 31.05, lng: 34.85 },
  { code: 'AE', name: 'UAE', lat: 23.42, lng: 53.85 },
  { code: 'SA', name: 'Saudi Arabia', lat: 23.89, lng: 45.08 },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.67 },
  { code: 'TZ', name: 'Tanzania', lat: -6.37, lng: 34.89 },
  { code: 'NZ', name: 'New Zealand', lat: -40.90, lng: 174.89 },
  { code: 'CL', name: 'Chile', lat: -35.68, lng: -71.54 },
  { code: 'PE', name: 'Peru', lat: -9.19, lng: -75.02 },
  { code: 'BO', name: 'Bolivia', lat: -16.29, lng: -63.59 },
  { code: 'OTHER', name: 'Other', lat: 0, lng: 0 },
]

const STEPS = ['Your Role', 'Experience', 'Location', 'Review']

type InputMode = 'github' | 'bio'

export default function OnboardTech() {
  const navigate = useNavigate()
  const { setExtractedProfile, setTalentNiche, setTalentRoleType, setLocation, setSavedTalentId } = useAppStore()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [niche, setNiche] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('github')
  const [githubInput, setGithubInput] = useState('')
  const [bioInput, setBioInput] = useState('')
  const [profile, setProfile] = useState<ExtractedProfile | null>(null)
  const [city, setCity] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [locating, setLocating] = useState(false)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  const mono = { fontFamily: 'var(--font-mono)' }
  const serif = { fontFamily: 'var(--font-serif)' }

  const handleExtract = async () => {
    setLoading(true)
    setError('')
    try {
      let result: ExtractedProfile
      if (inputMode === 'github') {
        result = await api.extractFromGitHub(githubInput.trim())
      } else {
        result = await api.extractFromBio(bioInput.trim())
      }
      setProfile(result)
      if (result.detected_location && !city) {
        const parts = result.detected_location.split(',')
        if (parts[0]) setCity(parts[0].trim())
      }
      setStep(2)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocating(false)
      },
      () => setLocating(false),
    )
  }

  const handleCountryChange = (code: string) => {
    setCountryCode(code)
    const country = COUNTRY_LIST.find(c => c.code === code)
    if (country && lat === null) {
      setLat(country.lat)
      setLng(country.lng)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setLoading(true)
    setError('')
    const finalProfile = { ...profile, niche: niche || profile.niche, role_type: 'tech' as const }
    const countryObj = COUNTRY_LIST.find(c => c.code === countryCode)
    const locationData: LocationInfo = {
      city, country: countryObj?.name || '', country_code: countryCode,
      lat: lat || countryObj?.lat || null,
      lng: lng || countryObj?.lng || null,
    }
    try {
      setExtractedProfile(finalProfile)
      setTalentNiche(finalProfile.niche)
      setTalentRoleType('tech')
      setLocation(locationData)
      const saved = await api.saveTalentProfile({
        name: finalProfile.name || 'Anonymous',
        role_type: 'tech',
        niche: finalProfile.niche,
        skills: finalProfile.skills,
        experience_years: finalProfile.experience_years,
        bio: finalProfile.bio,
        city: locationData.city,
        country: locationData.country,
        country_code: locationData.country_code,
        lat: locationData.lat,
        lng: locationData.lng,
        github_username: finalProfile.github_username,
      })
      setSavedTalentId(saved.id)
      navigate('/explore')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!niche
    if (step === 1) return inputMode === 'github' ? githubInput.trim().length > 0 : bioInput.trim().length >= 30
    if (step === 2) return !!countryCode
    return true
  }

  return (
    <div style={{ background: '#f6f4ef', minHeight: '100svh', ...mono }} className="pt-20 pb-32 px-6">
      <div className="max-w-xl mx-auto">
        {/* Step indicator */}
        <div className="flex gap-2 mb-12 mt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div style={{
                width: 28, height: 28, borderRadius: 4,
                background: i === step ? '#1710E6' : i < step ? '#8DC651' : '#fff',
                color: i <= step ? '#f6f4ef' : '#0e0e12',
                border: i > step ? '1.5px solid #d9d3c6' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600,
              }}>
                {i < step ? '✓' : String(i + 1).padStart(2, '0')}
              </div>
              <span className="text-xs" style={{ color: i === step ? '#0e0e12' : '#6b6458' }}>{s}</span>
              {i < STEPS.length - 1 && <span className="text-xs text-gray-300 ml-1">—</span>}
            </div>
          ))}
        </div>

        {/* Step 0: Pick niche */}
        {step === 0 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Your tech focus
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-8">Pick the niche that best describes your work.</p>
            <div className="grid grid-cols-2 gap-3">
              {TECH_NICHES.map((n) => {
                const color = NICHE_COLORS[n]
                return (
                  <button
                    key={n}
                    onClick={() => setNiche(n)}
                    style={{
                      background: niche === n ? '#0e0e12' : '#fff',
                      color: niche === n ? '#f6f4ef' : '#0e0e12',
                      border: niche === n ? 'none' : '1.5px solid #d9d3c6',
                      borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
                      textAlign: 'left', ...mono,
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginBottom: 8, boxShadow: niche === n ? `0 0 8px ${color}` : 'none' }} />
                    <div className="text-sm font-medium">{n}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 1: GitHub or bio */}
        {step === 1 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Your experience
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-6">
              Connect GitHub or paste your LinkedIn bio — our AI extracts your skills profile.
            </p>

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
              {(['github', 'bio'] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setInputMode(m)}
                  style={{
                    padding: '8px 20px', borderRadius: 6, cursor: 'pointer', ...mono,
                    background: inputMode === m ? '#0e0e12' : '#fff',
                    color: inputMode === m ? '#f6f4ef' : '#6b6458',
                    border: inputMode === m ? 'none' : '1.5px solid #d9d3c6',
                    fontWeight: inputMode === m ? 600 : 400,
                  }}
                >
                  {m === 'github' ? '◆ GitHub' : '≡ LinkedIn Bio'}
                </button>
              ))}
            </div>

            {inputMode === 'github' ? (
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>GitHub username</label>
                <input
                  value={githubInput}
                  onChange={(e) => setGithubInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleExtract()}
                  placeholder="e.g. torvalds"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid #d9d3c6', borderRadius: 8,
                    background: '#fff', ...mono, fontSize: 14, color: '#0e0e12',
                  }}
                  className="focus:outline-none focus:border-blue"
                />
                <div className="text-xs mt-2" style={{ color: '#9a8f82' }}>We fetch your public repos, languages, and bio — no OAuth required.</div>
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Paste LinkedIn bio or professional summary</label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Paste your LinkedIn 'About' section, resume summary, or any professional description..."
                  style={{
                    width: '100%', minHeight: 180, padding: '14px',
                    border: '1.5px solid #d9d3c6', borderRadius: 8,
                    background: '#fff', ...mono, fontSize: 13, lineHeight: 1.6,
                    color: '#0e0e12', resize: 'vertical',
                  }}
                  className="focus:outline-none focus:border-blue"
                />
                <div className="text-xs mt-2" style={{ color: '#9a8f82' }}>{bioInput.length} chars · Minimum 30</div>
              </div>
            )}

            {error && <div style={{ color: '#b71c1c', fontSize: 12, marginTop: 8, background: '#fff3f3', padding: '10px 14px', borderRadius: 6 }}>{error}</div>}

            <button
              onClick={handleExtract}
              disabled={!canProceed() || loading}
              style={{
                marginTop: 16, background: '#1710E6', color: '#f6f4ef',
                border: 'none', borderRadius: 8, padding: '12px 24px',
                cursor: 'pointer', ...mono, fontWeight: 600,
              }}
              className="disabled:opacity-40"
            >
              {loading ? 'Extracting with AI…' : 'Extract Profile →'}
            </button>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Where are you?
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-8">
              Your location is shown on the talent globe.
              {profile?.detected_location && (
                <span> We detected: <strong style={{ color: '#0e0e12' }}>{profile.detected_location}</strong></span>
              )}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>City</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Nairobi"
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #d9d3c6', borderRadius: 8,
                    background: '#fff', ...mono, fontSize: 14, color: '#0e0e12',
                  }}
                  className="focus:outline-none focus:border-blue"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  style={{
                    width: '100%', padding: '11px 14px',
                    border: '1.5px solid #d9d3c6', borderRadius: 8,
                    background: '#fff', ...mono, fontSize: 13, color: '#0e0e12',
                  }}
                  className="focus:outline-none focus:border-blue"
                >
                  <option value="">Select country…</option>
                  {COUNTRY_LIST.map(c => (
                    <option key={c.code + c.name} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={detectLocation}
                disabled={locating}
                style={{
                  background: '#fff', border: '1.5px solid #d9d3c6', color: '#0e0e12',
                  borderRadius: 8, padding: '10px 16px', cursor: 'pointer', ...mono, fontSize: 12,
                }}
              >
                {locating ? '⌛ Locating…' : '⊕ Use browser location'}
              </button>
              {lat !== null && (
                <div className="text-xs" style={{ color: '#8DC651' }}>
                  ✓ Coordinates set ({lat.toFixed(2)}, {lng?.toFixed(2)})
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && profile && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Looking good
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-6">Review your extracted profile before going live on the globe.</p>

            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 20, marginBottom: 12 }} className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Name</span>
                <span className="font-medium">{profile.name || 'Anonymous'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Niche</span>
                <span className="font-medium">{niche || profile.niche}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Experience</span>
                <span className="font-medium">{profile.experience_years} years</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Location</span>
                <span className="font-medium">{[city, COUNTRY_LIST.find(c => c.code === countryCode)?.name].filter(Boolean).join(', ') || '—'}</span>
              </div>
            </div>

            {/* Skills */}
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 20 }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Extracted Skills</div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 12).map((s) => (
                  <span key={s} style={{ background: '#0e0e12', color: '#f6f4ef', ...mono }} className="px-3 py-1 rounded-full text-xs">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 20, marginTop: 12 }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Bio</div>
              <p className="text-sm" style={{ color: '#4a453d', lineHeight: 1.6, margin: 0 }}>{profile.bio}</p>
            </div>

            {error && <div style={{ color: '#b71c1c', fontSize: 12, marginTop: 10, background: '#fff3f3', padding: '10px 14px', borderRadius: 6 }}>{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button
            onClick={() => step === 0 ? navigate('/onboard') : setStep(s => s - 1)}
            style={{ ...mono, background: '#fff', border: '1.5px solid #d9d3c6', color: '#0e0e12' }}
            className="px-6 py-2.5 rounded text-sm cursor-pointer"
          >
            ← Back
          </button>

          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              disabled={!niche}
              style={{ ...mono, background: '#1710E6', color: '#f6f4ef' }}
              className="px-6 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-40"
            >
              Continue →
            </button>
          )}

          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={!countryCode}
              style={{ ...mono, background: '#1710E6', color: '#f6f4ef' }}
              className="px-6 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-40"
            >
              Continue →
            </button>
          )}

          {step === 3 && (
            <button
              onClick={handleSave}
              disabled={loading}
              style={{ ...mono, background: '#8DC651', color: '#0e0e12', fontWeight: 700 }}
              className="px-8 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Go Live on Globe →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
