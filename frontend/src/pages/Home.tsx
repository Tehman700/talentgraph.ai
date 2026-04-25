import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

const CHIPS = [
  { text: '94.7% informal', x: '6%', y: '22%', rotate: '-7deg', bg: '#1710E6', color: '#f6f4ef' },
  { text: 'normalize ✓', x: '80%', y: '18%', rotate: '5deg', bg: '#fff', color: '#0e0e12', border: true },
  { text: '1,880 ILO signals', x: '5%', y: '68%', rotate: '4deg', bg: '#8DC651', color: '#0e0e12' },
  { text: 'ESCO mapped ✓', x: '78%', y: '70%', rotate: '-4deg', bg: '#0e0e12', color: '#f6f4ef' },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()
  const setUserType = useAppStore((s) => s.setUserType)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(id)
  }, [])

  const reveal = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 800ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
  })

  const handleCTA = (type: 'worker' | 'policy') => {
    setUserType(type)
    navigate(type === 'worker' ? '/onboarding' : '/policy')
  }

  return (
    <section
      style={{ background: '#f6f4ef', fontFamily: 'var(--font-mono)' }}
      className="min-h-screen relative flex flex-col items-center justify-center px-10 pt-20 pb-32"
    >
      {/* Kicker */}
      <div
        style={{ ...reveal(100), color: '#6b6458', letterSpacing: '0.3em' }}
        className="text-xs uppercase mb-12"
      >
        — SkillPath · Module 01 + 03 —
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(40px, 5.5vw, 76px)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          ...reveal(200),
        }}
        className="text-center text-ink m-0 max-w-4xl"
      >
        Know your skills.{' '}
        <em
          style={{
            fontStyle: 'italic',
            color: '#8DC651',
            position: 'relative',
          }}
        >
          Find your path
          <svg
            viewBox="0 0 300 14"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: 0,
              bottom: -4,
              width: '100%',
              height: 10,
              opacity: mounted ? 1 : 0,
              transition: 'opacity 600ms 1200ms',
            }}
          >
            <path d="M2 8 Q 75 2 150 7 T 298 5" stroke="#8DC651" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
        </em>
        <span style={{ color: '#1710E6' }}>.</span>
      </h1>

      {/* Subtext */}
      <p
        style={{ ...reveal(500), color: '#4a453d', maxWidth: 600, lineHeight: 1.65 }}
        className="text-base text-center mt-16 normal-case tracking-normal"
      >
        For workers in the informal economy — in Uganda, Bangladesh, and beyond.
        Upload your experience, get a standardized skills profile, and see{' '}
        <strong style={{ color: '#0e0e12' }}>real, reachable opportunities</strong> backed by ILO data.
      </p>

      {/* CTAs */}
      <div style={reveal(700)} className="flex gap-4 mt-12">
        <button
          onClick={() => handleCTA('worker')}
          style={{ background: '#0e0e12', color: '#f6f4ef', fontFamily: 'var(--font-mono)' }}
          className="px-7 py-3.5 rounded text-sm cursor-pointer border-none hover:bg-blue transition-colors normal-case tracking-normal"
        >
          I'm a Worker →
        </button>
        <button
          onClick={() => handleCTA('policy')}
          style={{ background: '#fff', color: '#0e0e12', border: '1.5px solid #0e0e12', fontFamily: 'var(--font-mono)' }}
          className="px-7 py-3.5 rounded text-sm cursor-pointer hover:bg-paper transition-colors normal-case tracking-normal"
        >
          I'm a Policymaker
        </button>
      </div>

      {/* Floating chips */}
      {CHIPS.map((chip, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: chip.x,
            top: chip.y,
            background: chip.bg,
            color: chip.color,
            border: chip.border ? '1.5px solid #0e0e12' : 'none',
            padding: '9px 16px',
            borderRadius: 999,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            transform: `rotate(${chip.rotate})`,
            boxShadow: '0 10px 30px rgba(14,14,18,0.1)',
            opacity: mounted ? 1 : 0,
            transition: `opacity 700ms ${600 + i * 200}ms`,
            pointerEvents: 'none',
          }}
        >
          {chip.text}
        </div>
      ))}

      {/* Country pills */}
      <div style={{ ...reveal(900) }} className="flex gap-3 mt-10">
        {['🇺🇬 Uganda', '🇧🇩 Bangladesh'].map((c) => (
          <span
            key={c}
            style={{ background: '#fff', border: '1px solid #d9d3c6', fontFamily: 'var(--font-mono)' }}
            className="px-4 py-1.5 rounded-full text-xs text-ink normal-case tracking-normal"
          >
            {c}
          </span>
        ))}
        <span
          style={{ background: '#fff', border: '1px dashed #d9d3c6', fontFamily: 'var(--font-mono)' }}
          className="px-4 py-1.5 rounded-full text-xs text-ink normal-case tracking-normal opacity-60"
        >
          + more coming
        </span>
      </div>
    </section>
  )
}
