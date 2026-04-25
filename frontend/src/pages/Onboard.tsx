import { useNavigate } from 'react-router-dom'

export default function Onboard() {
  const navigate = useNavigate()
  const mono = { fontFamily: 'var(--font-mono)' }
  const serif = { fontFamily: 'var(--font-serif)' }

  return (
    <div style={{ background: '#f6f4ef', minHeight: '100svh', ...mono }} className="pt-20 pb-32 px-6">
      <div className="max-w-lg mx-auto">
        <div style={{ color: '#6b6458', letterSpacing: '0.2em', fontSize: 11 }} className="uppercase mb-8">
          — Step 1 of 4 —
        </div>

        <h1 style={{ ...serif, fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em', color: '#0e0e12' }} className="m-0 mb-4 font-normal">
          What describes you?
        </h1>
        <p style={{ color: '#6b6458' }} className="text-sm mb-10">
          We'll tailor the experience to your background.
        </p>

        <div className="space-y-4">
          {/* Tech Professional */}
          <button
            onClick={() => navigate('/onboard-tech')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: '#fff', border: '1.5px solid #d9d3c6',
              borderRadius: 10, padding: '20px 22px', cursor: 'pointer', ...mono,
            }}
            className="hover:border-blue transition-colors"
          >
            <div style={{ color: '#61DAFB', fontSize: 28, marginBottom: 6 }}>{'</>'}</div>
            <div style={{ fontWeight: 700, color: '#0e0e12', fontSize: 15, marginBottom: 4 }}>
              Tech Professional
            </div>
            <div style={{ color: '#6b6458', fontSize: 12, lineHeight: 1.5 }}>
              Developer, designer, data scientist, DevOps, etc. Connect your GitHub or paste your LinkedIn bio.
            </div>
          </button>

          {/* Non-Tech Professional */}
          <button
            onClick={() => navigate('/onboard-non-tech')}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: '#fff', border: '1.5px solid #d9d3c6',
              borderRadius: 10, padding: '20px 22px', cursor: 'pointer', ...mono,
            }}
            className="hover:border-blue transition-colors"
          >
            <div style={{ color: '#8DC651', fontSize: 26, marginBottom: 6 }}>◆</div>
            <div style={{ fontWeight: 700, color: '#0e0e12', fontSize: 15, marginBottom: 4 }}>
              Non-Tech Professional
            </div>
            <div style={{ color: '#6b6458', fontSize: 12, lineHeight: 1.5 }}>
              Agriculture, healthcare, finance, education, construction & more. Upload your CV or describe your experience.
            </div>
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{ background: 'transparent', border: 'none', color: '#6b6458', cursor: 'pointer', ...mono }}
          className="text-sm mt-8"
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
