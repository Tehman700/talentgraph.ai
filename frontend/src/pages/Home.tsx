import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { TalentGlobe } from '../components/TalentGlobe'
import { NICHE_COLORS } from '../types'

const NICHE_CHIPS = Object.entries(NICHE_COLORS).slice(0, 8).map(([label, color]) => ({ label, color }))

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [globeSize, setGlobeSize] = useState(500)
  const rightColRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!rightColRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setGlobeSize(Math.min(entry.contentRect.width - 16, 620))
    })
    ro.observe(rightColRef.current)
    return () => ro.disconnect()
  }, [])

  const reveal = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(18px)',
    transition: `opacity 700ms ease ${delay}ms, transform 700ms ease ${delay}ms`,
  })

  const mono = { fontFamily: 'var(--font-mono)' }
  const serif = { fontFamily: 'var(--font-serif)' }

  return (
    <section
      style={{ background: '#f6f4ef', ...mono, minHeight: '100svh' }}
      className="flex flex-col md:flex-row items-stretch pt-16 overflow-hidden"
    >
      {/* Left column */}
      <div className="flex flex-col justify-center px-8 md:px-14 lg:px-18 py-12 md:py-0 md:w-5/12 flex-shrink-0">
        <div style={{ ...reveal(60), color: '#6b6458', letterSpacing: '0.25em' }} className="text-xs uppercase mb-8">
          — TalentGraph · Global Talent Network —
        </div>

        <h1
          style={{
            ...serif,
            fontSize: 'clamp(34px, 3.8vw, 56px)',
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            color: '#0e0e12',
            ...reveal(160),
          }}
          className="m-0"
        >
          Global talent,{' '}
          <em style={{ fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
            mapped
            <svg
              viewBox="0 0 140 10"
              preserveAspectRatio="none"
              style={{
                position: 'absolute', left: 0, bottom: -3,
                width: '100%', height: 8,
                opacity: mounted ? 1 : 0,
                transition: 'opacity 500ms 1000ms',
              }}
            >
              <path d="M2 6 Q 35 2 70 5 T 138 3" stroke="#8DC651" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </em>
          <span style={{ color: '#1710E6' }}>.</span>
        </h1>

        <p style={{ ...reveal(360), color: '#4a453d', lineHeight: 1.65, maxWidth: 370 }} className="text-sm mt-5 mb-0">
          Whether you're a developer with GitHub repos, a farmer with 20 years of experience,
          or a company looking to hire — TalentGraph puts real skills on the map.
        </p>

        {/* Stats */}
        <div style={reveal(500)} className="flex gap-6 mt-7">
          {[
            { value: '90+', label: 'Profiles' },
            { value: '40+', label: 'Countries' },
            { value: '17', label: 'Niches' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div style={{ color: '#1710E6', ...serif, fontSize: 22, fontWeight: 700, fontStyle: 'italic' }}>
                {value}
              </div>
              <div style={{ color: '#9a8f82', fontSize: 10, letterSpacing: '0.1em' }} className="uppercase mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={reveal(640)} className="flex gap-3 mt-8 flex-wrap">
          <button
            onClick={() => navigate('/explore')}
            style={{ background: '#0e0e12', color: '#f6f4ef', ...mono }}
            className="px-7 py-3 rounded text-sm cursor-pointer border-none"
          >
            Browse Workers →
          </button>
          <button
            onClick={() => navigate('/become-worker')}
            style={{ background: '#8DC651', color: '#0e0e12', ...mono }}
            className="px-7 py-3 rounded text-sm cursor-pointer border-none"
          >
            Become a Worker →
          </button>
          <button
            onClick={() => navigate('/onboard-org')}
            style={{ background: '#1710E6', color: '#f6f4ef', ...mono }}
            className="px-7 py-3 rounded text-sm cursor-pointer border-none"
          >
            We're Hiring →
          </button>
        </div>

        {/* Explore link */}
        <div style={reveal(780)} className="mt-5">
          <button
            onClick={() => navigate('/explore')}
            style={{ background: 'transparent', border: 'none', color: '#6b6458', ...mono, cursor: 'pointer' }}
            className="text-xs underline underline-offset-4"
          >
            Browse the talent globe →
          </button>
        </div>
      </div>

      {/* Right column — Globe */}
      <div
        ref={rightColRef}
        className="flex-1 flex flex-col items-center justify-center relative py-8 md:py-0"
        style={{ minHeight: 400 }}
      >
        <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1200ms 200ms', position: 'relative' }}>
          <TalentGlobe size={globeSize} showLegend={false} visualStyle="classic" />

          {/* Floating niche chips */}
          {NICHE_CHIPS.map((chip, i) => {
            const positions = [
              { top: '6%', left: '4%' }, { top: '10%', right: '6%' },
              { top: '78%', left: '2%' }, { top: '82%', right: '4%' },
              { top: '40%', left: '-2%' }, { top: '36%', right: '-2%' },
              { top: '55%', left: '6%' }, { top: '60%', right: '5%' },
            ]
            const pos = positions[i] || { top: `${10 + i * 10}%`, left: '0%' }
            return (
              <div
                key={chip.label}
                style={{
                  position: 'absolute',
                  ...pos,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(14,14,18,0.85)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid ${chip.color}40`,
                  padding: '5px 11px', borderRadius: 999,
                  ...mono, fontSize: 10, color: '#f6f4ef',
                  opacity: mounted ? 1 : 0,
                  transition: `opacity 600ms ${800 + i * 120}ms`,
                  pointerEvents: 'none', whiteSpace: 'nowrap',
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, boxShadow: `0 0 5px ${chip.color}` }} />
                {chip.label}
              </div>
            )
          })}
        </div>

        {/* Live indicator */}
        <div style={{
          position: 'absolute', bottom: 28, right: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          ...mono, fontSize: 10, color: '#9a8f82', letterSpacing: '0.15em',
          opacity: mounted ? 1 : 0, transition: 'opacity 600ms 1400ms',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#8DC651', boxShadow: '0 0 8px #8DC651',
          }} />
          LIVE TALENT MAP
        </div>
      </div>
    </section>
  )
}
