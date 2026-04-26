import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { api } from '../lib/api'

const COUNTRY_LIST = [
  { code: 'US', name: 'United States', lat: 37.09, lng: -95.71 },
  { code: 'GB', name: 'United Kingdom', lat: 51.50, lng: -0.13 },
  { code: 'DE', name: 'Germany', lat: 51.17, lng: 10.45 },
  { code: 'FR', name: 'France', lat: 46.23, lng: 2.21 },
  { code: 'IN', name: 'India', lat: 20.59, lng: 78.96 },
  { code: 'SG', name: 'Singapore', lat: 1.35, lng: 103.82 },
  { code: 'AU', name: 'Australia', lat: -25.27, lng: 133.78 },
  { code: 'CA', name: 'Canada', lat: 56.13, lng: -106.35 },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.67 },
  { code: 'KE', name: 'Kenya', lat: -0.02, lng: 37.91 },
  { code: 'ZA', name: 'South Africa', lat: -30.56, lng: 22.94 },
  { code: 'BR', name: 'Brazil', lat: -14.24, lng: -51.93 },
  { code: 'AE', name: 'UAE', lat: 23.42, lng: 53.85 },
  { code: 'IL', name: 'Israel', lat: 31.05, lng: 34.85 },
  { code: 'NL', name: 'Netherlands', lat: 52.13, lng: 5.29 },
  { code: 'SE', name: 'Sweden', lat: 60.13, lng: 18.64 },
  { code: 'PL', name: 'Poland', lat: 51.92, lng: 19.15 },
  { code: 'UA', name: 'Ukraine', lat: 48.38, lng: 31.17 },
  { code: 'JP', name: 'Japan', lat: 36.20, lng: 138.25 },
  { code: 'KR', name: 'South Korea', lat: 35.91, lng: 127.77 },
  { code: 'OTHER', name: 'Other / Remote', lat: 0, lng: 0 },
]

const STEPS = ['Company', 'Job Details', 'Review']

export default function OnboardOrg() {
  const navigate = useNavigate()
  const { setJobPosting } = useAppStore()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgName, setOrgName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [city, setCity] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [description, setDescription] = useState('')

  const mono = { fontFamily: 'var(--font-mono)' }
  const serif = { fontFamily: 'var(--font-serif)' }

  const countryObj = COUNTRY_LIST.find(c => c.code === countryCode)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api.postJob({
        title: jobTitle.trim(),
        description: description.trim(),
        org_name: orgName.trim(),
        city: city.trim(),
        country: countryObj?.name || '',
        country_code: countryCode,
        lat: countryObj?.lat || null,
        lng: countryObj?.lng || null,
      })
      setJobPosting({
        id: result.id,
        title: jobTitle,
        org_name: orgName,
        description,
        required_skills: result.required_skills,
        city, country: countryObj?.name || '',
        country_code: countryCode,
        lat: countryObj?.lat || null,
        lng: countryObj?.lng || null,
        summary: result.summary,
      })
      navigate(`/org/${result.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 0) return !!orgName.trim() && !!jobTitle.trim()
    if (step === 1) return description.trim().length >= 30
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

        {/* Step 0: Company info */}
        {step === 0 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Your organization
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-8">Tell us about the role you're hiring for.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Company / Organization name</label>
                <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. Acme Corp"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d9d3c6', borderRadius: 8, background: '#fff', ...mono, fontSize: 14, color: '#0e0e12' }}
                  className="focus:outline-none focus:border-blue" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Job title</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior React Developer"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d9d3c6', borderRadius: 8, background: '#fff', ...mono, fontSize: 14, color: '#0e0e12' }}
                  className="focus:outline-none focus:border-blue" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>City (optional)</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Berlin"
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d9d3c6', borderRadius: 8, background: '#fff', ...mono, fontSize: 13, color: '#0e0e12' }}
                    className="focus:outline-none focus:border-blue" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Country</label>
                  <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #d9d3c6', borderRadius: 8, background: '#fff', ...mono, fontSize: 12, color: '#0e0e12' }}
                    className="focus:outline-none focus:border-blue">
                    <option value="">Select…</option>
                    {COUNTRY_LIST.map(c => <option key={c.code + c.name} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Job description */}
        {step === 1 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              The role
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-6">
              Paste your job description. Our AI extracts the required skills and maps matching talent globally.
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste your full job description here — requirements, responsibilities, tech stack, etc. The more detail, the better the talent matching."
              style={{
                width: '100%', minHeight: 240, padding: '16px',
                border: '1.5px solid #d9d3c6', borderRadius: 8, background: '#fff',
                ...mono, fontSize: 13, lineHeight: 1.6, color: '#0e0e12', resize: 'vertical',
              }}
              className="focus:outline-none focus:border-blue"
            />
            <div className="text-xs mt-2" style={{ color: '#9a8f82' }}>{description.length} chars · Minimum 30</div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <div>
            <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, color: '#0e0e12' }} className="m-0 mb-4 font-normal">
              Ready to search
            </h1>
            <p style={{ color: '#6b6458' }} className="text-sm mb-6">
              AI will extract required skills and map matching talent on the globe — red dots = strongest matches.
            </p>
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 20 }} className="space-y-3 text-sm">
              <div className="flex justify-between"><span style={{ color: '#6b6458' }}>Company</span><span className="font-medium">{orgName}</span></div>
              <div className="flex justify-between"><span style={{ color: '#6b6458' }}>Role</span><span className="font-medium">{jobTitle}</span></div>
              <div className="flex justify-between"><span style={{ color: '#6b6458' }}>Location</span><span className="font-medium">{[city, countryObj?.name].filter(Boolean).join(', ') || 'Remote / Global'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#6b6458' }}>Description</span><span className="font-medium">{description.length} chars</span></div>
            </div>
            {error && <div style={{ color: '#b71c1c', fontSize: 12, marginTop: 10, background: '#fff3f3', padding: '10px 14px', borderRadius: 6 }}>{error}</div>}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button onClick={() => step === 0 ? navigate('/') : setStep(s => s - 1)}
            style={{ ...mono, background: '#fff', border: '1.5px solid #d9d3c6', color: '#0e0e12' }}
            className="px-6 py-2.5 rounded text-sm cursor-pointer">← Back</button>

          {step < 2 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              style={{ ...mono, background: '#1710E6', color: '#f6f4ef' }}
              className="px-6 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-40">Continue →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              style={{ ...mono, background: '#1710E6', color: '#f6f4ef', fontWeight: 700 }}
              className="px-8 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-50">
              {loading ? 'Analyzing with AI…' : 'Find Matching Talent →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
