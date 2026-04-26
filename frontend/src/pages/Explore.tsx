import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TalentGlobe } from '../components/TalentGlobe'
import { useAppStore } from '../store'
import { api } from '../lib/api'
import type { TalentPoint } from '../types'

function scoreOverlap(a: string[], b: string[]) {
  const left = new Set((a || []).map((x) => x.toLowerCase().trim()))
  const right = new Set((b || []).map((x) => x.toLowerCase().trim()))
  if (!left.size || !right.size) return 0
  let common = 0
  for (const key of left) {
    if (right.has(key)) common += 1
  }
  return common / Math.max(left.size, right.size)
}

export default function Explore() {
  const navigate = useNavigate()
  const { extractedProfile, talentRoleType, talentNiche, location, savedTalentId } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [points, setPoints] = useState<TalentPoint[]>([])
  const [selectedPoint, setSelectedPoint] = useState<TalentPoint | null>(null)
  const [filters, setFilters] = useState({
    niche: talentNiche || '',
    role_type: talentRoleType || '',
    country_code: location?.country_code || '',
    minExp: 0,
  })

  useEffect(() => {
    if (!savedTalentId && !extractedProfile) {
      navigate('/onboard')
      return
    }

    let mounted = true
    setLoading(true)
    setError('')
    api.getTalentGlobe({
      niche: filters.niche || undefined,
      role_type: filters.role_type || undefined,
      country_code: filters.country_code || undefined,
    })
      .then((res) => {
        if (mounted) setPoints(res.points || [])
      })
      .catch((e) => {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load talent globe')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [filters.niche, filters.role_type, filters.country_code, savedTalentId, extractedProfile, navigate])

  const filteredPoints = useMemo(
    () => points.filter((p) => (p.experience_years || 0) >= filters.minExp),
    [points, filters.minExp],
  )

  const myPoint: TalentPoint | null = useMemo(() => {
    const existing = filteredPoints.find((p) => p.id === savedTalentId)
    if (existing) {
      return {
        ...existing,
        name: existing.name ? `${existing.name} (You)` : 'You',
        color: '#1710E6',
      }
    }
    if (!extractedProfile || !location) return null
    return {
      name: extractedProfile.name || 'You',
      role_type: extractedProfile.role_type,
      niche: talentNiche || extractedProfile.niche,
      skills: extractedProfile.skills || [],
      experience_years: extractedProfile.experience_years || 0,
      city: location.city || 'Unknown',
      country: location.country || 'Unknown',
      country_code: location.country_code || '',
      lat: location.lat ?? 0,
      lng: location.lng ?? 0,
      bio: extractedProfile.bio || '',
      color: '#1710E6',
    }
  }, [filteredPoints, savedTalentId, extractedProfile, location, talentNiche])

  const globePoints = useMemo(() => {
    if (!myPoint) return filteredPoints
    const others = filteredPoints.filter((p) => p.id !== savedTalentId)
    return [myPoint, ...others]
  }, [filteredPoints, myPoint, savedTalentId])

  const suggestions = useMemo(() => {
    if (!extractedProfile) return []
    return filteredPoints
      .filter((p) => p.id !== savedTalentId)
      .map((p) => ({
        ...p,
        similarity: scoreOverlap(extractedProfile.skills || [], p.skills || []),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8)
  }, [filteredPoints, extractedProfile, savedTalentId])

  return (
    <div style={{ background: '#f6f4ef', minHeight: '100svh', fontFamily: 'var(--font-mono)' }} className="pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-80 w-full">
            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16 }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Your network filters</div>

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Niche</label>
              <input
                value={filters.niche}
                onChange={(e) => setFilters((f) => ({ ...f, niche: e.target.value }))}
                placeholder="e.g. Backend Engineering"
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d9d3c6', borderRadius: 6, marginBottom: 10 }}
              />

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Role type</label>
              <select
                value={filters.role_type}
                onChange={(e) => setFilters((f) => ({ ...f, role_type: e.target.value }))}
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d9d3c6', borderRadius: 6, marginBottom: 10 }}
              >
                <option value="">All</option>
                <option value="tech">Tech</option>
                <option value="non_tech">Non-tech</option>
              </select>

              <label className="block text-xs mb-1" style={{ color: '#6b6458' }}>Country code</label>
              <input
                value={filters.country_code}
                onChange={(e) => setFilters((f) => ({ ...f, country_code: e.target.value.toUpperCase() }))}
                placeholder="e.g. UG"
                style={{ width: '100%', padding: '9px 10px', border: '1px solid #d9d3c6', borderRadius: 6, marginBottom: 12 }}
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

              <button
                onClick={() => setFilters({ niche: '', role_type: '', country_code: '', minExp: 0 })}
                style={{ marginTop: 12, width: '100%', background: '#0e0e12', color: '#f6f4ef', border: 'none', borderRadius: 6, padding: '9px 0', cursor: 'pointer' }}
              >
                Reset filters
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16, marginTop: 14 }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: '#6b6458' }}>Suggested connections</div>
              <div className="space-y-2">
                {suggestions.length === 0 && (
                  <div className="text-xs" style={{ color: '#6b6458' }}>No matches yet. Try broadening filters.</div>
                )}
                {suggestions.map((p) => (
                  <button
                    key={`${p.id || p.name}-${p.lat}-${p.lng}`}
                    onClick={() => setSelectedPoint(p)}
                    style={{ width: '100%', textAlign: 'left', border: '1px solid #ede9e1', background: '#fff', borderRadius: 6, padding: '8px 10px', cursor: 'pointer' }}
                  >
                    <div className="text-sm" style={{ color: '#0e0e12' }}>{p.name}</div>
                    <div className="text-xs" style={{ color: '#6b6458' }}>{p.niche} · {Math.round((p.similarity || 0) * 100)}% overlap</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="mb-3">
              <div className="text-xs uppercase tracking-widest" style={{ color: '#6b6458' }}>Talent network map</div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(30px,4vw,52px)', margin: 0, lineHeight: 1.08 }}>
                You are here. Your niche is everywhere.
              </h1>
            </div>

            {loading && <div style={{ color: '#6b6458' }}>Loading globe...</div>}
            {error && <div style={{ color: '#b71c1c' }}>{error}</div>}

            {!loading && !error && (
              <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 14 }}>
                <TalentGlobe size={760} showLegend points={globePoints} mode="explore" onPointClick={setSelectedPoint} />
              </div>
            )}

            {selectedPoint && (
              <div style={{ background: '#fff', border: '1px solid #d9d3c6', borderRadius: 10, padding: 16, marginTop: 14 }}>
                <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b6458' }}>Selected talent</div>
                <div className="text-lg" style={{ color: '#0e0e12' }}>{selectedPoint.name}</div>
                <div className="text-sm" style={{ color: '#6b6458' }}>{selectedPoint.city}, {selectedPoint.country}</div>
                <div className="text-sm mt-2" style={{ color: '#4a453d' }}>{selectedPoint.bio || 'No bio available.'}</div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
