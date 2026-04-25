import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { CountryConfig } from '../types'

const COUNTRIES = [
  { code: 'UGA', flag: '🇺🇬', name: 'Uganda' },
  { code: 'BGD', flag: '🇧🇩', name: 'Bangladesh' },
]

function SectorBar({ name, pct, growth, wage }: { name: string; pct: number; growth: number; wage: number }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)' }}>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink font-medium">{name}</span>
        <span style={{ color: '#6b6458' }}>{pct}% employment</span>
      </div>
      <div style={{ height: 6, background: '#ede9e1', borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: growth >= 5 ? '#8DC651' : '#1710E6', borderRadius: 3 }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: '#6b6458' }}>
        <span>+{growth}%/yr growth</span>
        <span>avg ${wage}/mo</span>
      </div>
    </div>
  )
}

export default function PolicyDashboard() {
  const [selectedCode, setSelectedCode] = useState('UGA')
  const [country, setCountry] = useState<CountryConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getCountry(selectedCode)
      .then(setCountry)
      .finally(() => setLoading(false))
  }, [selectedCode])

  return (
    <div style={{ background: '#f6f4ef', fontFamily: 'var(--font-mono)' }} className="min-h-screen pt-20 pb-32 px-6">
      <div className="max-w-3xl mx-auto">

        <div className="mt-4 mb-8 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>
              Module 03 — Policymaker View
            </div>
            <h1
              style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.05, letterSpacing: '-0.02em' }}
              className="text-ink font-normal m-0"
            >
              Labor Market Dashboard
            </h1>
          </div>

          {/* Country switcher */}
          <div className="flex gap-2 mt-4">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelectedCode(c.code)}
                style={{
                  background: selectedCode === c.code ? '#0e0e12' : '#fff',
                  color: selectedCode === c.code ? '#f6f4ef' : '#0e0e12',
                  border: '1.5px solid',
                  borderColor: selectedCode === c.code ? '#0e0e12' : '#d9d3c6',
                  borderRadius: 6, padding: '8px 14px', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 13,
                }}
              >
                {c.flag} {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center py-20 text-sm" style={{ color: '#6b6458' }}>Loading data...</div>
        )}

        {!loading && country && (
          <>
            {/* Key signals grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Informal employment', value: `${country.signals.informal_employment_pct}%`, sub: 'of total workforce', highlight: true },
                { label: 'Working poverty rate', value: `${country.signals.working_poverty_rate}%`, sub: `< $3.20 PPP/day` },
                { label: 'Youth unemployment', value: `${country.signals.youth_unemployment_pct}%`, sub: 'ages 15–24' },
                { label: 'Avg monthly wage', value: `$${country.signals.avg_monthly_wage_usd}`, sub: 'across all sectors' },
                { label: 'GDP growth', value: `${country.signals.gdp_growth_pct}%`, sub: 'annual rate' },
                { label: 'Population', value: `${country.signals.population_millions}M`, sub: 'total' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: s.highlight ? '#0e0e12' : '#fff',
                    border: s.highlight ? 'none' : '1px solid #d9d3c6',
                    borderRadius: 8, padding: 16,
                  }}
                >
                  <div className="text-xs uppercase tracking-widest mb-1" style={{ color: s.highlight ? 'rgba(246,244,239,0.5)' : '#6b6458' }}>
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 32, lineHeight: 1,
                      color: s.highlight ? '#8DC651' : '#0e0e12',
                    }}
                  >
                    {s.value}
                  </div>
                  <div className="text-xs mt-1 normal-case tracking-normal" style={{ color: s.highlight ? 'rgba(246,244,239,0.5)' : '#6b6458' }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Sector breakdown */}
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div className="text-xs uppercase tracking-widest mb-5" style={{ color: '#6b6458' }}>
                Sector employment distribution
              </div>
              <div className="space-y-5">
                {country.sectors.map((s) => (
                  <SectorBar
                    key={s.name}
                    name={s.name}
                    pct={s.employment_pct}
                    growth={s.growth_rate_pct}
                    wage={s.avg_wage_usd}
                  />
                ))}
              </div>
              <div className="text-xs mt-4 flex gap-4" style={{ color: '#6b6458' }}>
                <span><span style={{ background: '#8DC651', borderRadius: 2, padding: '2px 6px', color: '#0e0e12' }}>■</span> ≥5% growth</span>
                <span><span style={{ background: '#1710E6', borderRadius: 2, padding: '2px 6px', color: '#f6f4ef' }}>■</span> &lt;5% growth</span>
              </div>
            </div>

            {/* Local realities */}
            <div style={{ background: '#0e0e12', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <div className="text-xs uppercase tracking-widest mb-4" style={{ color: 'rgba(246,244,239,0.5)' }}>
                Local realities — {country.name}
              </div>
              <ul className="m-0 p-0 list-none space-y-2">
                {country.local_realities.map((r) => (
                  <li key={r} className="text-sm flex items-start gap-3 normal-case tracking-normal" style={{ color: '#f6f4ef' }}>
                    <span style={{ color: '#8DC651', flexShrink: 0 }}>→</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Automation risk note */}
            <div style={{ background: '#fff', border: '1.5px dashed #d9d3c6', borderRadius: 8, padding: 16 }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Automation risk context</div>
              <p className="text-sm m-0 normal-case tracking-normal text-ink" style={{ lineHeight: 1.6 }}>
                {country.automation_risk_note}
              </p>
            </div>

            <div className="text-xs text-center mt-6" style={{ color: '#6b6458' }}>
              Data source: {country.signals.data_source} · Year: {country.signals.data_year}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
