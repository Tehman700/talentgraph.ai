import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { signOut } from '../lib/supabase'
import { AuthModal } from './AuthModal'

export function TopBar() {
  const [time, setTime] = useState(new Date())
  const [showAuth, setShowAuth] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { authUser, authLoading } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const hh = String(time.getHours()).padStart(2, '0')
  const mm = String(time.getMinutes()).padStart(2, '0')
  const ss = String(time.getSeconds()).padStart(2, '0')

  const handleSignOut = async () => {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const shortEmail = authUser?.email
    ? authUser.email.length > 22 ? authUser.email.slice(0, 20) + '…' : authUser.email
    : ''

  return (
    <>
      <div
        style={{ fontFamily: 'var(--font-mono)', background: '#f6f4ef', borderBottom: '1px solid #e8e3db' }}
        className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-7 text-sm tracking-widest uppercase"
      >
        {/* Brand */}
        <span
          style={{ cursor: 'pointer' }}
          className="text-ink font-medium"
          onClick={() => navigate('/')}
        >
          SkillPath
        </span>

        {/* Center status pill */}
        <div className="flex items-center gap-2 bg-white border border-ink px-4 py-1.5 rounded-full text-xs normal-case tracking-normal">
          <span className="w-2 h-2 rounded-full bg-blue inline-block" />
          <span>Live</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5 text-xs normal-case tracking-normal">
          <span className="text-blue tabular-nums hidden sm:inline">{hh} {mm} {ss}</span>

          {!authLoading && (
            authUser ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  style={{
                    background: '#0e0e12',
                    color: '#f6f4ef',
                    border: 'none',
                    borderRadius: 999,
                    padding: '6px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8DC651', flexShrink: 0 }} />
                  {shortEmail}
                </button>
                {menuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    background: '#fff',
                    border: '1px solid #e8e3db',
                    borderRadius: 8,
                    minWidth: 160,
                    boxShadow: '0 8px 24px rgba(14,14,18,0.12)',
                    overflow: 'hidden',
                    zIndex: 50,
                  }}>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/dashboard') }}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#0e0e12', cursor: 'pointer' }}
                    >
                      My Profiles
                    </button>
                    <div style={{ height: 1, background: '#e8e3db' }} />
                    <button
                      onClick={handleSignOut}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#c62828', cursor: 'pointer' }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  background: 'transparent',
                  color: '#0e0e12',
                  border: '1.5px solid #0e0e12',
                  borderRadius: 999,
                  padding: '5px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            )
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
