import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TalentGlobe } from '../components/TalentGlobe'
import { api } from '../lib/api'
import type { JobPosting, TalentPoint } from '../types'

export default function OrgMatches() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [job, setJob] = useState<Partial<JobPosting> | null>(null)
  const [points, setPoints] = useState<TalentPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<TalentPoint | null>(null)
  const [filters, setFilters] = useState({
    score: 0.25,
    role_type: '',
    niche: '',
    minExp: 0,
  })

  useEffect(() => {
    if (!id) {
      navigate('/onboard-org')
      return
    }

    let mounted = true
    setLoading(true)
    setError('')
    api.getJobGlobe(id)
      .then((res) => {
        if (!mounted) return
        setJob(res.job)
        setPoints(res.points || [])
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load job matches')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [id, navigate])

  const filteredPoints = useMemo(
    () => points.filter((p) => {
      const scoreOk = (p.match_score || 0) >= filters.score
      const roleOk = !filters.role_type || p.role_type === filters.role_type
      const nicheOk = !filters.niche || p.niche.toLowerCase().includes(filters.niche.toLowerCase())
      const expOk = (p.experience_years || 0) >= filters.minExp
      return scoreOk && roleOk && nicheOk && expOk
    }),
    [points, filters],
  )

  const topMatches = useMemo(
    () => [...filteredPoints].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).slice(0, 10),
    [filteredPoints],
  )

  return (
    <div style={{ background: '#f6f4ef', minHeight: '100svh', fontFamily: 'var(--font-mono)' }} className="pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <div className="text-xs uppercase tracking-widest" style={{ color: '#6b6458' }}>Organization match view</div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(30px,4vw,52px)', margin: 0, lineHeight: 1.08 }}>
            {job?.title || 'Job'} talent matches
          </h1>
          <div className="text-sm" style={{ color: '#6b6458' }}>{job?.org_name || 'Organization'} · Red markers are strongest matches</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4">
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16 }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Matching filters</div>

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>
                Minimum match score: {Math.round(filters.score * 100)}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(filters.score * 100)}
                onChange={(e) => setFilters((f) => ({ ...f, score: Number(e.target.value) / 100 }))}
                className="w-full"
              />

              <label className="block text-xs mb-1 mt-3" style={{ color: '#6b6458' }}>Role type</label>
              <select
                value={filters.role_type}
                onChange={(e) => setFilters((f) => ({ ...f, role_type: e.target.value }))}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d9d3c6', borderRadius: 6, marginBottom: 10 }}
              >
                <option value="">All</option>
                <option value="tech">Tech</option>
                <option value="non_tech">Non-tech</option>
              </select>

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Niche contains</label>
              <input
                value={filters.niche}
                onChange={(e) => setFilters((f) => ({ ...f, niche: e.target.value }))}
                placeholder="e.g. Backend"
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d9d3c6', borderRadius: 6, marginBottom: 10 }}
              />

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Minimum experience: {filters.minExp} years</label>
              <input
                type="range"
                min={0}
                max={20}
                value={filters.minExp}
                onChange={(e) => setFilters((f) => ({ ...f, minExp: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16, marginTop: 14 }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Top recommended talent</div>
              <div className="space-y-2">
                {topMatches.map((p) => (
                  <button
                    key={`${p.id || p.name}-${p.lat}-${p.lng}`}
                    onClick={() => setSelectedPoint(p)}
                    style={{ width: '100%', textAlign: 'left', border: '1px solid #ede9e1', background: '#fff', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}
                  >
                    <div className="text-sm" style={{ color: '#0e0e12' }}>{p.name}</div>
                    <div className="text-xs" style={{ color: '#6b6458' }}>
                      {p.niche} · {Math.round((p.match_score || 0) * 100)}% match
                    </div>
                  </button>
                ))}
                {topMatches.length === 0 && <div className="text-xs" style={{ color: '#6b6458' }}>No candidates for this filter set.</div>}
              </div>
            </div>
          </aside>

          <main className="lg:col-span-8">
            {loading && <div style={{ color: '#6b6458' }}>Loading job matches...</div>}
            {error && <div style={{ color: '#b71c1c' }}>{error}</div>}
            {!loading && !error && (
              <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 14 }}>
                <TalentGlobe size={860} showLegend points={filteredPoints} mode="match" onPointClick={setSelectedPoint} />
              </div>
            )}

            {selectedPoint && (
              <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16, marginTop: 14 }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Candidate detail</div>
                <div className="text-lg" style={{ color: '#0e0e12' }}>{selectedPoint.name}</div>
                <div className="text-sm" style={{ color: '#6b6458' }}>
                  {selectedPoint.city}, {selectedPoint.country} · {selectedPoint.experience_years} years
                </div>
                <div className="text-sm mt-2" style={{ color: '#4a453d' }}>{selectedPoint.bio || 'No bio available.'}</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
