import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function OrgForms() {
  const [forms, setForms] = useState<any[]>([])
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingResponses, setLoadingResponses] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      const res = await api.listOrgForms()
      setForms(res.forms || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const viewResponses = async (form: any) => {
    setSelectedForm(form)
    setLoadingResponses(true)
    try {
      const res = await api.getFormResponses(form.id)
      setResponses(res.responses || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingResponses(false)
    }
  }

  if (loading) return <div className="p-10 text-center font-mono">Loading forms...</div>

  return (
    <div className="min-h-screen bg-[#f6f4ef] pt-20 pb-20 px-6 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-2">Hiring Dashboards</h1>
          <p className="text-[#6b6458]">Manage your active talent forms and candidate responses.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form List */}
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-[#6b6458]">Active Forms</h2>
            {forms.length === 0 && <div className="p-4 bg-white border border-[#d9d3c6] rounded-lg text-sm italic">No forms created yet.</div>}
            {forms.map(f => (
              <button
                key={f.id}
                onClick={() => viewResponses(f)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedForm?.id === f.id ? 'border-[#0e0e12] bg-white shadow-md' : 'border-[#d9d3c6] bg-white hover:border-[#aaa]'}`}
              >
                <div className="font-bold text-[#0e0e12]">{f.job_title}</div>
                <div className="text-xs text-[#6b6458] mt-1">{new Date(f.created_at).toLocaleDateString()} · {f.response_count || 0} responses</div>
              </button>
            ))}
          </div>

          {/* Response View */}
          <div className="lg:col-span-2">
            {!selectedForm ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-[#d9d3c6] rounded-2xl p-10 text-center">
                <div className="text-[#6b6458]">Select a form on the left to view candidate responses</div>
              </div>
            ) : (
              <div className="bg-white border border-[#d9d3c6] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#f0ede8] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-serif">{selectedForm.job_title}</h2>
                    <p className="text-xs text-[#6b6458]">{selectedForm.company} · {responses.length} total responses</p>
                  </div>
                  <a 
                    href={`/api/hiring/forms/${selectedForm.id}/export.csv`}
                    className="px-4 py-2 bg-[#0e0e12] text-white text-xs font-bold rounded-lg hover:opacity-80"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Export CSV
                  </a>
                </div>

                <div className="p-0 overflow-x-auto">
                  {loadingResponses ? (
                    <div className="p-10 text-center">Loading responses...</div>
                  ) : responses.length === 0 ? (
                    <div className="p-10 text-center italic text-[#6b6458]">No candidates have applied yet.</div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fcfbf9] text-[#6b6458] text-[10px] uppercase tracking-wider">
                          <th className="p-4 border-b border-[#f0ede8]">Candidate</th>
                          <th className="p-4 border-b border-[#f0ede8]">Answers</th>
                          <th className="p-4 border-b border-[#f0ede8]">Date</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {responses.map(r => (
                          <tr key={r.id} className="hover:bg-[#f6f4ef]">
                            <td className="p-4 border-b border-[#f0ede8]">
                              <div className="font-bold">{r.candidate_name || 'Talent User'}</div>
                              <div className="text-xs text-[#6b6458]">{r.candidate_email}</div>
                            </td>
                            <td className="p-4 border-b border-[#f0ede8]">
                              <div className="space-y-1">
                                {r.answers?.slice(0, 2).map((a: any) => (
                                  <div key={a.question_id} className="text-xs">
                                    <span className="text-[#999]">Q:</span> {a.answer?.substring(0, 50)}...
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 border-b border-[#f0ede8] text-xs text-[#6b6458]">
                              {new Date(r.submitted_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
