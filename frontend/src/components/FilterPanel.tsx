import { ALL_NICHES, NICHE_COLORS } from '../types'

interface Filters {
  niche: string
  role_type: string
  country_code: string
}

interface Props {
  filters: Filters
  total: number
  onChange: (f: Filters) => void
}

export function FilterPanel({ filters, total, onChange }: Props) {
  const mono = { fontFamily: 'var(--font-mono)' }

  return (
    <div style={{
      background: 'rgba(14,14,18,0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(246,244,239,0.1)',
      borderRadius: 12,
      padding: '20px 16px',
      width: 260,
      color: '#f6f4ef',
      ...mono,
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#8DC651', marginBottom: 16 }}>
        FILTERS
      </div>

      {/* Total count */}
      <div style={{
        background: 'rgba(246,244,239,0.07)', borderRadius: 6,
        padding: '8px 12px', marginBottom: 16, fontSize: 12,
      }}>
        <span style={{ color: '#1710E6', fontSize: 18, fontWeight: 700 }}>{total}</span>
        <span style={{ color: '#9a8f82', marginLeft: 6 }}>profiles visible</span>
      </div>

      {/* Role type toggle */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, color: '#6b6458', letterSpacing: '0.15em', marginBottom: 8 }}>
          ROLE TYPE
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { value: '', label: 'All' },
            { value: 'tech', label: 'Tech' },
            { value: 'non_tech', label: 'Non-Tech' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, niche: value === filters.role_type ? '' : '', role_type: value })}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 5, cursor: 'pointer',
                background: filters.role_type === value ? '#1710E6' : 'rgba(246,244,239,0.08)',
                color: filters.role_type === value ? '#f6f4ef' : '#9a8f82',
                border: 'none', fontSize: 11, ...mono,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Niche picker */}
      <div>
        <div style={{ fontSize: 10, color: '#6b6458', letterSpacing: '0.15em', marginBottom: 8 }}>
          NICHE
        </div>
        <button
          onClick={() => onChange({ ...filters, niche: '' })}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '5px 8px', borderRadius: 5, cursor: 'pointer', marginBottom: 3,
            background: filters.niche === '' ? 'rgba(246,244,239,0.15)' : 'transparent',
            color: filters.niche === '' ? '#f6f4ef' : '#6b6458',
            border: 'none', fontSize: 11, ...mono,
          }}
        >
          All niches
        </button>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {ALL_NICHES.map((n) => {
            const color = NICHE_COLORS[n] || '#6b6458'
            const active = filters.niche === n
            return (
              <button
                key={n}
                onClick={() => onChange({ ...filters, niche: active ? '' : n })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                  textAlign: 'left', padding: '5px 8px', borderRadius: 5, cursor: 'pointer',
                  background: active ? 'rgba(246,244,239,0.12)' : 'transparent',
                  color: active ? '#f6f4ef' : '#9a8f82',
                  border: active ? `1px solid ${color}30` : 'none',
                  fontSize: 11, marginBottom: 1, ...mono,
                }}
              >
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: color, boxShadow: active ? `0 0 6px ${color}` : 'none',
                  flexShrink: 0,
                }} />
                {n}
              </button>
            )
          })}
        </div>
      </div>

      {/* Clear filters */}
      {(filters.niche || filters.role_type) && (
        <button
          onClick={() => onChange({ niche: '', role_type: '', country_code: '' })}
          style={{
            marginTop: 14, width: '100%', padding: '7px 0', borderRadius: 5,
            background: 'transparent', border: '1px solid rgba(246,244,239,0.15)',
            color: '#9a8f82', cursor: 'pointer', fontSize: 11, ...mono,
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
