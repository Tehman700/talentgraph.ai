import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import type { Opportunity } from '../types'

const TYPE_LABELS: Record<string, string> = {
  formal_employment: 'Formal job',
  self_employment: 'Self-employed',
  gig: 'Gig / freelance',
  training: 'Training pathway',
  cooperative: 'Cooperative',
  piece_rate: 'Piece-rate work',
}

const TYPE_COLORS: Record<string, string> = {
  formal_employment: '#1710E6',
  self_employment: '#8DC651',
  gig: '#0e0e12',
  training: '#6b6458',
  cooperative: '#8DC651',
  piece_rate: '#0e0e12',
}

function MatchBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div style={{ flex: 1, height: 4, background: '#ede9e1', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.round(score * 100)}%`,
            height: '100%',
            background: score >= 0.7 ? '#8DC651' : score >= 0.4 ? '#1710E6' : '#d9d3c6',
            borderRadius: 2,
          }}
        />
      </div>
      <span className="text-xs font-semibold" style={{ minWidth: 32 }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  )
}

function OpportunityCard({ opp, rank }: { opp: Opportunity; rank: number }) {
  return (
    <div
      style={{
        background: '#fff',
        border: rank === 0 ? '2px solid #8DC651' : '1px solid #d9d3c6',
        borderRadius: 10,
        padding: 20,
        position: 'relative',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {rank === 0 && (
        <div
          style={{ position: 'absolute', top: -1, right: 16, background: '#8DC651', color: '#0e0e12', fontSize: 11, padding: '3px 10px', borderRadius: '0 0 6px 6px', fontWeight: 600 }}
        >
          Best match
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold m-0 normal-case tracking-normal text-ink">{opp.title}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              style={{ background: TYPE_COLORS[opp.type] ?? '#0e0e12', color: '#f6f4ef', fontSize: 11, padding: '2px 8px', borderRadius: 3 }}
            >
              {TYPE_LABELS[opp.type] ?? opp.type}
            </span>
            <span className="text-xs" style={{ color: '#6b6458' }}>{opp.sector}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-ink">
            ${opp.wage_range_usd.min}–${opp.wage_range_usd.max}
          </div>
          <div className="text-xs" style={{ color: '#6b6458' }}>/month</div>
        </div>
      </div>

      <MatchBar score={opp.match_score} />

      {/* Econometric signal: sector growth */}
      <div
        style={{ background: '#f6f4ef', borderRadius: 6, padding: '8px 12px', marginTop: 12, display: 'flex', justifyContent: 'space-between' }}
        className="text-xs"
      >
        <span style={{ color: '#6b6458' }}>Sector growth rate</span>
        <span style={{ color: opp.sector_growth_pct >= 5 ? '#8DC651' : '#0e0e12', fontWeight: 600 }}>
          +{opp.sector_growth_pct}% / yr
        </span>
      </div>

      <div className="mt-3">
        <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6458' }}>Why this fits you</div>
        <ul className="m-0 p-0 list-none space-y-1">
          {opp.match_reasons.slice(0, 2).map((r) => (
            <li key={r} className="text-xs flex items-start gap-1.5 normal-case tracking-normal text-ink">
              <span style={{ color: '#8DC651' }}>·</span> {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #ede9e1' }}>
        <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: '#6b6458' }}>Next steps</div>
        {opp.next_steps.map((s) => (
          <div key={s} className="text-xs flex items-start gap-1.5 normal-case tracking-normal text-ink">
            <span style={{ color: '#1710E6' }}>→</span> {s}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Opportunities() {
  const navigate = useNavigate()
  const { matchResult, skillsProfile } = useAppStore()

  useEffect(() => {
    if (!matchResult) navigate('/onboarding')
  }, [matchResult, navigate])

  if (!matchResult) return null

  const signals = matchResult.econometric_signals
  const sorted = [...matchResult.opportunities].sort((a, b) => b.match_score - a.match_score)

  return (
    <div style={{ background: '#f6f4ef', fontFamily: 'var(--font-mono)' }} className="min-h-screen pt-20 pb-32 px-6">
      <div className="max-w-2xl mx-auto">

        <div className="mt-4 mb-8">
          <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>
            Module 03 — Opportunity Matching · {matchResult.country_name}
          </div>
          <h1
            style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
            className="text-ink font-normal m-0"
          >
            {sorted.length} opportunities found
          </h1>
          <p className="text-sm mt-2 normal-case tracking-normal" style={{ color: '#6b6458' }}>
            For: <strong className="text-ink">{skillsProfile?.occupation_title}</strong>
          </p>
        </div>

        {/* ── Econometric signals banner — VISIBLE, not buried ── */}
        <div
          style={{ background: '#0e0e12', borderRadius: 10, padding: 20, marginBottom: 24 }}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(246,244,239,0.5)' }}>
              Signal 01 · Informal employment
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: '#8DC651', lineHeight: 1 }}>
              {signals.informal_employment_pct}%
            </div>
            <div className="text-xs mt-1 normal-case tracking-normal" style={{ color: 'rgba(246,244,239,0.6)' }}>
              of workers are in the informal economy
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(246,244,239,0.5)' }}>
              Signal 02 · Avg monthly wage
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: '#f6f4ef', lineHeight: 1 }}>
              ${signals.avg_monthly_wage_usd}
            </div>
            <div className="text-xs mt-1 normal-case tracking-normal" style={{ color: 'rgba(246,244,239,0.6)' }}>
              average across all sectors
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(246,244,239,0.5)' }}>
              Working poverty rate
            </div>
            <div style={{ fontSize: 20, color: '#f6f4ef', fontWeight: 600 }}>
              {signals.working_poverty_rate}%
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(246,244,239,0.5)' }}>
              Youth unemployment
            </div>
            <div style={{ fontSize: 20, color: '#f6f4ef', fontWeight: 600 }}>
              {signals.youth_unemployment_pct}%
            </div>
          </div>
          <div className="col-span-2 text-xs pt-2" style={{ borderTop: '1px solid rgba(246,244,239,0.15)', color: 'rgba(246,244,239,0.4)' }}>
            Source: {signals.data_source}
          </div>
        </div>

        {/* Opportunities */}
        <div className="space-y-4 mb-8">
          {sorted.map((opp, i) => (
            <OpportunityCard key={opp.title} opp={opp} rank={i} />
          ))}
        </div>

        {/* Recommendations */}
        <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 8, padding: 20, marginBottom: 8 }}>
          <div className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b6458' }}>Recommendations for you</div>
          <ol className="m-0 p-0 list-none space-y-3">
            {matchResult.recommendations.map((r, i) => (
              <li key={r} className="flex items-start gap-3 text-sm normal-case tracking-normal text-ink">
                <span
                  style={{ background: '#1710E6', color: '#f6f4ef', width: 22, height: 22, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}
                >
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </div>

        <button
          onClick={() => navigate('/policy')}
          style={{ fontFamily: 'var(--font-mono)', color: '#6b6458', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%' }}
          className="text-xs py-2 underline text-center normal-case tracking-normal"
        >
          View policymaker dashboard →
        </button>
      </div>
    </div>
  )
}
