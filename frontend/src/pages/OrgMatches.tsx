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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [formConfig, setFormConfig] = useState({
    questions: [
      { id: 'q1', text: 'Why are you interested in this role?', type: 'text', required: true },
      { id: 'q2', text: 'What is your expected salary (USD/mo)?', type: 'text', required: false },
    ]
  })
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPoints.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredPoints.map(p => p.id || '')))
    }
  }

  const handleSendForm = async () => {
    if (selectedIds.size === 0) return
    setSending(true)
    setError('')
    try {
      await api.createHiringForm({
        job_title: job?.title || 'Applied Position',
        job_description: job?.description || '',
        company: job?.org_name || '',
        questions: formConfig.questions,
        target_user_ids: Array.from(selectedIds).filter(Boolean),
      })
      setSuccessMsg(`Successfully sent to ${selectedIds.size} candidates!`)
      setSelectedIds(new Set())
      setShowApplyModal(false)
      setTimeout(() => setSuccessMsg(''), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

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

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg animate-fade-in flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-lg">&times;</button>
          </div>
        )}

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
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-widest" style={{ color: '#6b6458' }}>Top recommended talent</div>
                <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#6b6458' }}>
                  <input 
                    type="checkbox" 
                    checked={filteredPoints.length > 0 && selectedIds.size === filteredPoints.length}
                    onChange={toggleSelectAll}
                  />
                  Select All
                </label>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {topMatches.map((p) => (
                  <div 
                    key={`${p.id || p.name}-${p.lat}-${p.lng}`}
                    className="flex items-center gap-3 p-2 border border-[#ede9e1] bg-white rounded-md"
                  >
                    <input 
                      type="checkbox"
                      checked={selectedIds.has(p.id || '')}
                      onChange={() => toggleSelect(p.id || '')}
                    />
                    <button
                      onClick={() => setSelectedPoint(p)}
                      className="flex-1 text-left"
                    >
                      <div className="text-sm" style={{ color: '#0e0e12' }}>{p.name}</div>
                      <div className="text-xs" style={{ color: '#6b6458' }}>
                        {p.niche} · {Math.round((p.match_score || 0) * 100)}% match
                      </div>
                    </button>
                  </div>
                ))}
                {topMatches.length === 0 && <div className="text-xs" style={{ color: '#6b6458' }}>No candidates for this filter set.</div>}
              </div>

              {selectedIds.size > 0 && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full mt-4 py-3 bg-[#e43] text-white rounded-lg text-sm font-bold shadow-lg hover:bg-[#d32] transition-colors"
                >
                  Apply to {selectedIds.size} candidates
                </button>
              )}
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

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-6">
          <div className="bg-[#f6f4ef] border border-[#d9d3c6] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#d9d3c6] flex justify-between items-center bg-white">
              <h2 className="text-xl font-serif">Send One-Click Apply Form</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-2xl hover:opacity-60">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="text-xs uppercase tracking-widest text-[#6b6458]">Recruiting {selectedIds.size} candidates for:</div>
              <div className="p-3 bg-white border border-[#d9d3c6] rounded-lg">
                <div className="font-bold text-[#0e0e12]">{job?.title}</div>
                <div className="text-sm text-[#6b6458]">{job?.org_name}</div>
              </div>

              <div className="text-xs uppercase tracking-widest text-[#6b6458]">Form Questions</div>
              <div className="space-y-3">
                {formConfig.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-white border border-[#d9d3c6] rounded-lg relative">
                    <div className="text-xs text-[#6b6458] mb-1">Question {idx + 1} ({q.required ? 'Required' : 'Optional'})</div>
                    <input 
                      className="w-full text-sm outline-none font-bold" 
                      value={q.text}
                      onChange={(e) => {
                        const next = [...formConfig.questions]
                        next[idx].text = e.target.value
                        setFormConfig({ ...formConfig, questions: next })
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="text-xs text-[#6b6458] italic">
                Candidates will receive this form in their dashboard. Once submitted, roles will be automatically processed.
              </div>
            </div>

            <div className="p-6 border-t border-[#d9d3c6] bg-white flex justify-end gap-3">
              <button 
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 text-sm text-[#6b6458] hover:underline"
              >
                Cancel
              </button>
              <button 
                disabled={sending}
                onClick={handleSendForm}
                className="px-6 py-2 bg-[#0e0e12] text-white rounded-lg text-sm font-bold shadow-md hover:opacity-80 disabled:opacity-50"
              >
                {sending ? 'Sending...' : `Send to ${selectedIds.size} Selected`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
