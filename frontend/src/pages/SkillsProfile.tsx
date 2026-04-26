import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { api } from '../lib/api'
import type { Skill } from '../types'

const LEVEL_COLOR: Record<string, string> = {
  advanced: '#8DC651',
  intermediate: '#1710E6',
  basic: '#d9d3c6',
}

const LEVEL_TEXT: Record<string, string> = {
  advanced: '#0e0e12',
  intermediate: '#f6f4ef',
  basic: '#0e0e12',
}

function SkillTag({ skill }: { skill: Skill }) {
  return (
    <div
      style={{
        background: LEVEL_COLOR[skill.level] ?? '#d9d3c6',
        color: LEVEL_TEXT[skill.level] ?? '#0e0e12',
        fontFamily: 'var(--font-mono)',
        borderRadius: 6,
        padding: '8px 12px',
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span className="text-sm font-medium">{skill.label}</span>
      <span className="text-xs opacity-70 flex items-center gap-1">
        {skill.level}
        {skill.is_durable && <span title="Durable skill">· ◆</span>}
      </span>
    </div>
  )
}

export default function SkillsProfile() {
  const navigate = useNavigate()
  const { skillsProfile, onboardingData, setMatchResult } = useAppStore()

  useEffect(() => {
    if (!skillsProfile) navigate('/onboarding')
  }, [skillsProfile, navigate])

  if (!skillsProfile) return null

  const handleFindOpportunities = async () => {
    try {
      const result = await api.matchOpportunities(
        onboardingData.country_code ?? 'UGA',
        skillsProfile,
      )
      setMatchResult(result)
      navigate('/opportunities')
    } catch (e) {
      console.error(e)
    }
  }

  const durable = skillsProfile.skills.filter((s) => s.is_durable)

  return (
    <div style={{ background: '#f6f4ef', fontFamily: 'var(--font-mono)' }} className="min-h-screen pt-20 pb-32 px-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mt-4 mb-10">
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>
            Module 01 — Skills Signal Engine
          </div>
          <h1
            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            className="text-ink font-normal m-0"
          >
            {skillsProfile.occupation_title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <span
              style={{ background: '#0e0e12', color: '#f6f4ef', borderRadius: 4, padding: '4px 10px', fontSize: 12 }}
            >
              ISCO {skillsProfile.isco_code}
            </span>
            <span
              style={{ background: '#8DC651', color: '#0e0e12', borderRadius: 4, padding: '4px 10px', fontSize: 12 }}
            >
              ESCO Mapped ✓
            </span>
          </div>
        </div>

        {/* Plain language summary */}
        <div
          style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 8, padding: 20, marginBottom: 24 }}
        >
          <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>What this means for you</div>
          <p style={{ lineHeight: 1.7, color: '#0e0e12' }} className="text-sm m-0 normal-case tracking-normal">
            {skillsProfile.profile_summary}
          </p>
        </div>

        {/* Skills grid */}
        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b6458' }}>
            Your skills ({skillsProfile.skills.length} identified · {durable.length} durable ◆)
          </div>
          <div className="flex flex-wrap gap-2">
            {skillsProfile.skills.map((s) => (
              <SkillTag key={s.label} skill={s} />
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs" style={{ color: '#6b6458' }}>
            <span><span style={{ background: '#8DC651', borderRadius: 2, padding: '2px 6px', color: '#0e0e12' }}>■</span> advanced</span>
            <span><span style={{ background: '#1710E6', borderRadius: 2, padding: '2px 6px', color: '#f6f4ef' }}>■</span> intermediate</span>
            <span><span style={{ background: '#d9d3c6', borderRadius: 2, padding: '2px 6px', color: '#0e0e12' }}>■</span> basic</span>
            <span>◆ = durable (automation-resilient)</span>
          </div>
        </div>

        {/* Two columns: Strengths + Gaps */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div style={{ background: '#0e0e12', borderRadius: 8, padding: 20 }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8DC651' }}>Your Strengths</div>
            <ul className="space-y-2 m-0 p-0 list-none">
              {skillsProfile.strengths.map((s) => (
                <li key={s} className="text-sm flex items-start gap-2 normal-case tracking-normal" style={{ color: '#f6f4ef' }}>
                  <span style={{ color: '#8DC651' }}>→</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#fff', border: '1.5px dashed #d9d3c6', borderRadius: 8, padding: 20 }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Skill Gaps to Fill</div>
            <ul className="space-y-2 m-0 p-0 list-none">
              {skillsProfile.skill_gaps.map((s) => (
                <li key={s} className="text-sm flex items-start gap-2 normal-case tracking-normal" style={{ color: '#0e0e12' }}>
                  <span style={{ color: '#1710E6' }}>+</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleFindOpportunities}
          style={{ background: '#1710E6', color: '#f6f4ef', fontFamily: 'var(--font-mono)', width: '100%' }}
          className="py-4 rounded text-base font-medium cursor-pointer border-none hover:bg-ink transition-colors normal-case tracking-normal"
        >
          Find matching opportunities →
        </button>
        <p className="text-xs text-center mt-3" style={{ color: '#6b6458' }}>
          Backed by ILO ILOSTAT econometric signals
        </p>
      </div>
    </div>
  )
}
