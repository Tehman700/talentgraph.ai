import { useNavigate, useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Home', path: '/' },
  { label: 'My Skills', path: '/onboarding' },
  { label: 'Opportunities', path: '/opportunities' },
  { label: 'Policy', path: '/policy' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div
      style={{ fontFamily: 'var(--font-mono)' }}
      className="fixed bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 z-40"
    >
      <button
        onClick={() => navigate('/')}
        className="w-10 h-10 rounded-full bg-ink text-paper border-none cursor-pointer flex items-center justify-center text-base hover:bg-blue transition-colors"
      >
        ×
      </button>
      {NAV.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className="px-4 py-2.5 rounded text-sm cursor-pointer border-none transition-colors normal-case tracking-normal"
          style={{
            background: pathname === item.path ? '#1710E6' : '#0e0e12',
            color: '#f6f4ef',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
