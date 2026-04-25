import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

interface Props {
  onClose: () => void
}

export function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
        onClose()
      } else {
        await signUp(email, password)
        setDone(true)
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#f6f4ef',
    border: '1.5px solid #d9d3c6',
    borderRadius: 6,
    padding: '10px 14px',
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    color: '#0e0e12',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,14,18,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 24px 64px rgba(14,14,18,0.2)',
        fontFamily: 'var(--font-mono)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: '#0e0e12', fontStyle: 'italic' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </div>
            <div style={{ fontSize: 11, color: '#9a8f82', marginTop: 4, letterSpacing: '0.1em' }}>
              {mode === 'login' ? 'Sign in to save your profiles' : 'Save and revisit your skill profiles'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a8f82', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ color: '#0e0e12', fontSize: 14, fontWeight: 600 }}>Check your email</div>
            <div style={{ color: '#6b6458', fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
              We sent a confirmation link to <strong>{email}</strong>.<br />
              Click it to activate your account.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 24, background: '#0e0e12', color: '#f6f4ef',
                border: 'none', borderRadius: 6, padding: '10px 24px',
                fontFamily: 'var(--font-mono)', fontSize: 13, cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#6b6458', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#6b6458', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  style={inputStyle}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
              </div>
            </div>

            {error && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: 6, fontSize: 12, color: '#c62828' }}>
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading || !email || !password}
              style={{
                marginTop: 20,
                width: '100%',
                background: loading ? '#d9d3c6' : '#1710E6',
                color: '#f6f4ef',
                border: 'none',
                borderRadius: 6,
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 200ms',
              }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9a8f82' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#1710E6', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 0 }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
