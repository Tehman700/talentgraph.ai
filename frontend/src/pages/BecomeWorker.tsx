import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { RoleType } from '../types'

const COUNTRY_LIST = [
  { code: 'US', name: 'United States', lat: 37.09, lng: -95.71 },
  { code: 'GB', name: 'United Kingdom', lat: 51.5, lng: -0.13 },
  { code: 'IN', name: 'India', lat: 20.59, lng: 78.96 },
  { code: 'NG', name: 'Nigeria', lat: 9.08, lng: 8.67 },
  { code: 'KE', name: 'Kenya', lat: -0.02, lng: 37.91 },
  { code: 'UG', name: 'Uganda', lat: 1.37, lng: 32.29 },
  { code: 'BD', name: 'Bangladesh', lat: 23.68, lng: 90.35 },
  { code: 'PK', name: 'Pakistan', lat: 30.38, lng: 69.35 },
  { code: 'DE', name: 'Germany', lat: 51.17, lng: 10.45 },
  { code: 'FR', name: 'France', lat: 46.23, lng: 2.21 },
  { code: 'BR', name: 'Brazil', lat: -14.24, lng: -51.93 },
  { code: 'ZA', name: 'South Africa', lat: -30.56, lng: 22.94 },
  { code: 'OTHER', name: 'Other', lat: 0, lng: 0 },
]

export default function BecomeWorker() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    name: '',
    role_type: 'tech' as RoleType,
    profession: '',
    niche: '',
    bio: '',
    city: '',
    state: '',
    country_code: '',
    experience_years: 0,
    experience_level: 'junior' as 'junior' | 'mid' | 'senior',
    skills: '',
    github_username: '',
    linkedin_url: '',
    photo_url: '',
    resume_url: '',
    verify_github: false,
    verify_linkedin: false,
  })

  const country = useMemo(() => COUNTRY_LIST.find((c) => c.code === form.country_code), [form.country_code])

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const runVerification = async () => {
    setVerifying(true)
    setError('')
    try {
      const result = await api.verifySocial({
        github_username: form.github_username,
        linkedin_url: form.linkedin_url,
      })
      update('verify_github', result.github_verified)
      update('verify_linkedin', result.linkedin_verified)
      if (result.verified) setSuccess('Social profile check passed. Your profile will show verification badges.')
      else setError('Verification failed. Please check your GitHub username or LinkedIn URL.')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.profession || !form.country_code || !form.skills.trim()) {
      setError('Please complete name, profession, country, and at least one skill.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await api.saveTalentProfile({
        name: form.name,
        role_type: form.role_type,
        profession: form.profession,
        niche: form.niche || form.profession,
        bio: form.bio,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experience_years: Number(form.experience_years) || 0,
        experience_level: form.experience_level,
        city: form.city,
        state: form.state,
        country: country?.name || '',
        country_code: form.country_code,
        lat: country?.lat || 0,
        lng: country?.lng || 0,
        github_username: form.github_username || undefined,
        linkedin_url: form.linkedin_url || undefined,
        photo_url: form.photo_url || undefined,
        resume_url: form.resume_url || undefined,
        verify_github: form.verify_github,
        verify_linkedin: form.verify_linkedin,
      })
      setSuccess('Profile created successfully. You are now visible on the globe.')
      setTimeout(() => navigate('/explore'), 900)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background: '#f6f4ef', minHeight: '100svh', fontFamily: 'var(--font-mono)' }} className="pt-20 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Become a worker</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(30px,4vw,48px)', lineHeight: 1.08, margin: 0 }}>
            Join the live global talent globe
          </h1>
          <p className="text-sm mt-2" style={{ color: '#6b6458' }}>
            Add your profile details, skills, social links, and optional verification.
          </p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 12, padding: 20 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Role type</label>
            <select value={form.role_type} onChange={(e) => update('role_type', e.target.value as RoleType)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }}>
              <option value="tech">Tech</option>
              <option value="non_tech">Non-tech</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Profession</label>
            <input value={form.profession} onChange={(e) => update('profession', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Niche (optional)</label>
            <input value={form.niche} onChange={(e) => update('niche', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>City</label>
            <input value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>State / Region</label>
            <input value={form.state} onChange={(e) => update('state', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Country</label>
            <select value={form.country_code} onChange={(e) => update('country_code', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }}>
              <option value="">Select country</option>
              {COUNTRY_LIST.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Experience level</label>
            <select value={form.experience_level} onChange={(e) => update('experience_level', e.target.value as 'junior' | 'mid' | 'senior')} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }}>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </select>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Experience (years)</label>
            <input type="number" min={0} value={form.experience_years} onChange={(e) => update('experience_years', Number(e.target.value))} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Skills (comma separated)</label>
            <input value={form.skills} onChange={(e) => update('skills', e.target.value)} placeholder="JavaScript, React, Python" className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Profile summary</label>
            <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} className="w-full" style={{ minHeight: 90, padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>GitHub username</label>
            <input value={form.github_username} onChange={(e) => update('github_username', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>LinkedIn URL</label>
            <input value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Photo URL</label>
            <input value={form.photo_url} onChange={(e) => update('photo_url', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Resume URL</label>
            <input value={form.resume_url} onChange={(e) => update('resume_url', e.target.value)} className="w-full" style={{ padding: '10px', border: '1px solid #d9d3c6', borderRadius: 7 }} />
          </div>
        </div>

        {error && <div className="mt-3 text-sm" style={{ color: '#b71c1c' }}>{error}</div>}
        {success && <div className="mt-3 text-sm" style={{ color: '#2e7d32' }}>{success}</div>}

        <div className="mt-4 flex gap-3 flex-wrap">
          <button
            onClick={runVerification}
            disabled={verifying}
            style={{ background: '#fff', border: '1px solid #d9d3c6', color: '#0e0e12', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
          >
            {verifying ? 'Verifying...' : 'Verify Social Profiles'}
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ background: '#1710E6', border: 'none', color: '#f6f4ef', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}
          >
            {saving ? 'Saving profile...' : 'Go Live on Globe'}
          </button>

          <button
            onClick={() => navigate('/explore')}
            style={{ background: 'transparent', border: 'none', color: '#6b6458', cursor: 'pointer' }}
          >
            Back to Browse
          </button>
        </div>
      </div>
    </div>
  )
}
