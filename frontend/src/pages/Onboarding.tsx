import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { api } from '../lib/api'
import type { EducationLevel, OnboardingData } from '../types'

const STEPS = ['Country', 'Background', 'Your Work', 'Review']

const COUNTRIES = [
  { code: 'UGA', flag: '🇺🇬', name: 'Uganda', region: 'Sub-Saharan Africa' },
  { code: 'BGD', flag: '🇧🇩', name: 'Bangladesh', region: 'South Asia' },
]

const EDU_LEVELS: { value: EducationLevel; label: string; desc: string }[] = [
  { value: 'none', label: 'No formal schooling', desc: 'Self-taught or informal learning' },
  { value: 'primary', label: 'Primary school', desc: 'Some or completed primary' },
  { value: 'secondary', label: 'Secondary school', desc: 'Some or completed secondary' },
  { value: 'vocational', label: 'Vocational / TVET', desc: 'Trade or technical training' },
  { value: 'tertiary', label: 'University / College', desc: 'Degree or diploma' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { setOnboardingData, setSkillsProfile, setStep: setStoreStep } = useAppStore()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Partial<OnboardingData>>({
    country_code: '',
    education_level: 'primary',
    experience_years: 1,
    work_description: '',
    competencies: [],
  })
  const [skillInput, setSkillInput] = useState('')

  const update = (patch: Partial<OnboardingData>) => setForm((f) => ({ ...f, ...patch }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !(form.competencies || []).includes(s)) {
      update({ competencies: [...(form.competencies || []), s] })
    }
    setSkillInput('')
  }

  const removeSkill = (s: string) =>
    update({ competencies: (form.competencies || []).filter((c) => c !== s) })

  const canProceed = () => {
    if (step === 0) return !!form.country_code
    if (step === 1) return !!form.education_level && (form.experience_years ?? 0) >= 0
    if (step === 2) return (form.work_description?.length ?? 0) > 20
    return true
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      const data = form as OnboardingData
      setOnboardingData(data)
      const profile = await api.analyzeSkills(data)
      setSkillsProfile(profile)
      setStoreStep(1)
      navigate('/profile')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  const mono = { fontFamily: 'var(--font-mono)' }
  const serif = { fontFamily: 'var(--font-serif)' }

  return (
    <div style={{ background: '#f6f4ef', ...mono }} className="min-h-screen pt-20 pb-32 px-6">
      <div className="max-w-xl mx-auto">

        {/* Step indicator */}
        <div className="flex gap-2 mb-12 mt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                style={{
                  width: 28, height: 28, borderRadius: 4,
                  background: i === step ? '#1710E6' : i < step ? '#8DC651' : '#fff',
                  color: i <= step ? '#f6f4ef' : '#0e0e12',
                  border: i > step ? '1.5px solid #d9d3c6' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                {i < step ? '✓' : String(i + 1).padStart(2, '0')}
              </div>
              <span className="text-xs" style={{ color: i === step ? '#0e0e12' : '#6b6458' }}>{s}</span>
              {i < STEPS.length - 1 && <span className="text-xs text-gray-300 ml-1">—</span>}
            </div>
          ))}
        </div>

        {/* Step 0: Country */}
        {step === 0 && (
          <div>
            <h1 style={{ ...serif, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em' }} className="text-ink mb-4 font-normal m-0">
              Where are you?
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6458' }}>
              Your country determines which labor market signals we use.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => update({ country_code: c.code })}
                  style={{
                    background: form.country_code === c.code ? '#1710E6' : '#fff',
                    color: form.country_code === c.code ? '#f6f4ef' : '#0e0e12',
                    border: form.country_code === c.code ? 'none' : '1.5px solid #d9d3c6',
                    borderRadius: 8, padding: '20px 16px', cursor: 'pointer',
                    textAlign: 'left', ...mono,
                  }}
                >
                  <div className="text-3xl mb-2">{c.flag}</div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs mt-0.5 opacity-70">{c.region}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Background */}
        {step === 1 && (
          <div>
            <h1 style={{ ...serif, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em' }} className="text-ink mb-4 font-normal m-0">
              Your background
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6458' }}>
              No certificates needed. We work with what you have.
            </p>

            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>
                Highest education level
              </label>
              <div className="space-y-2">
                {EDU_LEVELS.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => update({ education_level: e.value })}
                    style={{
                      background: form.education_level === e.value ? '#0e0e12' : '#fff',
                      color: form.education_level === e.value ? '#f6f4ef' : '#0e0e12',
                      border: '1.5px solid',
                      borderColor: form.education_level === e.value ? '#0e0e12' : '#d9d3c6',
                      borderRadius: 6, padding: '12px 16px', cursor: 'pointer',
                      textAlign: 'left', width: '100%', ...mono,
                    }}
                  >
                    <span className="font-medium text-sm">{e.label}</span>
                    <span className="ml-3 text-xs opacity-60">{e.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>
                Years of work experience
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={0} max={40}
                  value={form.experience_years ?? 1}
                  onChange={(e) => update({ experience_years: Number(e.target.value) })}
                  className="flex-1 accent-blue"
                />
                <span className="text-2xl font-semibold w-12 text-right" style={serif}>
                  {form.experience_years}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Work description */}
        {step === 2 && (
          <div>
            <h1 style={{ ...serif, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em' }} className="text-ink mb-4 font-normal m-0">
              What do you do?
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6458' }}>
              Describe your work in your own words. Informal jobs count — YouTube tutorials count. Don't undersell yourself.
            </p>
            <textarea
              value={form.work_description}
              onChange={(e) => update({ work_description: e.target.value })}
              placeholder="e.g. I grow maize and cassava on 2 acres, sell at the market, and have been doing this for 8 years. I also know how to repair mobile phones..."
              style={{
                width: '100%', minHeight: 160, padding: '16px',
                border: '1.5px solid #d9d3c6', borderRadius: 8,
                background: '#fff', color: '#0e0e12', resize: 'vertical',
                ...mono, fontSize: 14, lineHeight: 1.6,
              }}
              className="focus:outline-none focus:border-blue"
            />
            <div className="text-xs mt-2" style={{ color: '#6b6458' }}>
              {form.work_description?.length ?? 0} chars · Minimum 20
            </div>

            <div className="mt-6">
              <label className="block text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>
                Add specific skills (optional)
              </label>
              <div className="flex gap-2">
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="e.g. mobile repair, crop rotation..."
                  style={{
                    flex: 1, padding: '10px 14px',
                    border: '1.5px solid #d9d3c6', borderRadius: 6,
                    background: '#fff', ...mono, fontSize: 13,
                  }}
                  className="focus:outline-none focus:border-blue"
                />
                <button
                  onClick={addSkill}
                  style={{ background: '#0e0e12', color: '#f6f4ef', ...mono }}
                  className="px-4 py-2 rounded text-sm cursor-pointer border-none"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(form.competencies || []).map((s) => (
                  <span
                    key={s}
                    style={{ background: '#0e0e12', color: '#f6f4ef', ...mono }}
                    className="px-3 py-1 rounded-full text-xs flex items-center gap-2"
                  >
                    {s}
                    <button onClick={() => removeSkill(s)} className="opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none text-paper">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h1 style={{ ...serif, fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.02em' }} className="text-ink mb-4 font-normal m-0">
              Ready to analyze
            </h1>
            <p className="text-sm mb-8" style={{ color: '#6b6458' }}>
              Claude AI will map your experience to the ESCO skills framework.
            </p>
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 8, padding: 20 }} className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Country</span>
                <span className="font-medium">{COUNTRIES.find(c => c.code === form.country_code)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Education</span>
                <span className="font-medium">{EDU_LEVELS.find(e => e.value === form.education_level)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Experience</span>
                <span className="font-medium">{form.experience_years} years</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#6b6458' }}>Skills added</span>
                <span className="font-medium">{(form.competencies || []).length}</span>
              </div>
            </div>
            {error && (
              <p style={{ background: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: 12 }}
                className="text-sm mt-4 text-red-700">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ ...mono, background: '#fff', border: '1.5px solid #d9d3c6', color: '#0e0e12' }}
            className="px-6 py-2.5 rounded text-sm cursor-pointer disabled:opacity-30"
          >
            ← Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              style={{ ...mono, background: '#1710E6', color: '#f6f4ef' }}
              className="px-6 py-2.5 rounded text-sm cursor-pointer border-none disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={loading}
              style={{ ...mono, background: '#8DC651', color: '#0e0e12' }}
              className="px-8 py-2.5 rounded text-sm cursor-pointer border-none font-semibold disabled:opacity-50"
            >
              {loading ? 'Analyzing with Claude AI...' : 'Analyze my skills →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
