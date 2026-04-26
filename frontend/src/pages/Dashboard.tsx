import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { api } from '../lib/api'
import type { SavedProfile } from '../types'

const COUNTRY_FLAGS: Record<string, string> = { UGA: '🇺🇬', BGD: '🇧🇩' }
const EDU_LABELS: Record<string, string> = {
  none: 'No formal education',
  primary: 'Primary school',
  secondary: 'Secondary school',
  vocational: 'Vocational training',
  tertiary: 'University / College',
}

export default function Dashboard() {
  const { authUser } = useAppStore()
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authUser) { navigate('/'); return }
    load()
  }, [authUser])

  const load = async () => {
    try {
      const [{ profiles }, { notifications }] = await Promise.all([
        api.listProfiles(),
        api.listNotifications().catch(() => ({ notifications: [] }))
      ])
      setProfiles(profiles)
      setNotifications(notifications)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile?')) return
    setDeleting(id)
    try {
      await api.deleteProfile(id)
      setProfiles((prev) => prev.filter((p) => p.id !== id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  const handleLoad = async (profile: SavedProfile) => {
    try {
      const full = await api.getProfile(profile.id)
      useAppStore.getState().setSkillsProfile(full)
      navigate('/profile')
    } catch (e: any) {
      setError(e.message)
    }
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' }

  return (
    <section style={{ background: '#f6f4ef', minHeight: '100svh', ...mono }} className="pt-20 pb-28 px-6 md:px-12">
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ color: '#6b6458', fontSize: 11, letterSpacing: '0.28em', marginBottom: 12 }} className="uppercase">
            — My Profiles —
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', color: '#0e0e12', margin: 0, fontStyle: 'italic', lineHeight: 1.1 }}>
            Saved skill analyses
          </h1>
          <p style={{ color: '#6b6458', fontSize: 13, marginTop: 10 }}>
            {authUser?.email} · {profiles.length} profile{profiles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div style={{ background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: 8, padding: '12px 16px', color: '#c62828', fontSize: 13, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div style={{ marginBottom: 40, background: '#fff', border: '1px solid #d9d3c6', borderRadius: 12, padding: 20 }}>
            <div style={{ color: '#6b6458', fontSize: 11, letterSpacing: '0.2em', marginBottom: 15 }} className="uppercase">
              🔔 Pending Applications
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #f0ede8', borderRadius: 8, background: n.status === 'pending' ? '#fff9eb' : '#fff' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0e0e12' }}>
                      Apply to: {n.hiring_forms?.job_title}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6458' }}>
                      From: {n.hiring_forms?.company}
                    </div>
                  </div>
                  {n.status === 'responded' ? (
                    <span style={{ fontSize: 11, color: '#2e7d32', fontStyle: 'italic', background: '#e8f5e9', padding: '4px 8px', borderRadius: 4 }}>
                      Submitted
                    </span>
                  ) : (
                    <button 
                      onClick={() => navigate(`/apply/${n.form_id}`)}
                      style={{ background: '#0e0e12', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                    >
                      Fill out form →
                    </button>
                  )
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 100, background: '#e8e3db', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            border: '2px dashed #d9d3c6',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ color: '#0e0e12', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No profiles yet</div>
            <div style={{ color: '#6b6458', fontSize: 13, marginBottom: 24 }}>
              Complete the onboarding to create your first skills profile.
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                background: '#1710E6', color: '#f6f4ef', border: 'none',
                borderRadius: 6, padding: '10px 24px', cursor: 'pointer', ...mono, fontSize: 13,
              }}
            >
              Start onboarding →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profiles.map((p) => (
              <div
                key={p.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e8e3db',
                  borderRadius: 12,
                  padding: '20px 24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 16,
                  alignItems: 'start',
                }}
              >
                <div>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 20 }}>{COUNTRY_FLAGS[p.country_code] || '🌍'}</span>
                    <span style={{ color: '#0e0e12', fontSize: 15, fontWeight: 700 }}>{p.occupation_title}</span>
                    <span style={{
                      background: '#f6f4ef', border: '1px solid #d9d3c6',
                      borderRadius: 999, padding: '2px 10px', fontSize: 11, color: '#6b6458',
                    }}>
                      ISCO {p.isco_code}
                    </span>
                  </div>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#9a8f82' }}>
                      {EDU_LABELS[p.education_level] || p.education_level}
                    </span>
                    <span style={{ fontSize: 11, color: '#9a8f82' }}>
                      {p.experience_years} yr{p.experience_years !== 1 ? 's' : ''} experience
                    </span>
                    <span style={{ fontSize: 11, color: '#9a8f82' }}>
                      {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Summary */}
                  {p.profile_summary && (
                    <p style={{ fontSize: 12, color: '#4a453d', lineHeight: 1.6, margin: 0, maxWidth: 560 }}>
                      {p.profile_summary.length > 160 ? p.profile_summary.slice(0, 157) + '…' : p.profile_summary}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleLoad(p)}
                    style={{
                      background: '#0e0e12', color: '#f6f4ef',
                      border: 'none', borderRadius: 6, padding: '8px 16px',
                      cursor: 'pointer', ...mono, fontSize: 12, whiteSpace: 'nowrap',
                    }}
                  >
                    View →
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    style={{
                      background: 'none', color: '#c62828',
                      border: '1px solid #ffcdd2', borderRadius: 6, padding: '7px 16px',
                      cursor: deleting === p.id ? 'not-allowed' : 'pointer', ...mono, fontSize: 12,
                    }}
                  >
                    {deleting === p.id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New profile CTA */}
        {profiles.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <button
              onClick={() => navigate('/onboarding')}
              style={{
                background: 'transparent', color: '#1710E6',
                border: '1.5px solid #1710E6', borderRadius: 6,
                padding: '10px 24px', cursor: 'pointer', ...mono, fontSize: 13,
              }}
            >
              + Create new profile
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
