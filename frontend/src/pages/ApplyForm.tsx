import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

export default function ApplyForm() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!formId) return
    api.getFormDetail(formId)
      .then(setForm)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [formId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formId) return
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        answers: Object.entries(answers).map(([qid, ans]) => ({ question_id: qid, answer: ans })),
        candidate_name: '', // Optional
        candidate_email: '' // Optional
      }
      await api.submitFormResponse(formId, payload)
      // Clear specific notification local cache or trigger reload if needed
      setSubmitted(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center font-mono" style={{ background: '#f6f4ef', minHeight: '100svh' }}>Loading form...</div>
  
  if (submitted) {
    return (
      <div style={{ background: '#f6f4ef', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="max-w-xl w-full p-10 bg-white border border-[#d9d3c6] rounded-xl text-center shadow-lg font-mono">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-serif mb-2">Application Submitted!</h2>
          <p className="text-[#6b6458] mb-8">Thank you for applying to {form?.company}. They will review your profile shortly.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-[#0e0e12] text-white rounded-lg text-sm font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (error || !form) {
    return (
      <div style={{ background: '#f6f4ef', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="max-w-xl w-full p-10 bg-white border border-red-100 rounded-xl text-center shadow-lg font-mono">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-serif mb-2 text-red-600">Error</h2>
          <p className="text-[#6b6458] mb-8">{error || 'Form not found or has been closed.'}</p>
          <button onClick={() => navigate('/dashboard')} className="text-sm underline">Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] pt-20 pb-20 px-6 font-mono">
      <div className="max-w-2xl mx-auto bg-white border border-[#d9d3c6] rounded-xl shadow-xl overflow-hidden">
        <div className="p-8 border-b border-[#f0ede8]">
          <div className="text-xs uppercase tracking-widest text-[#6b6458] mb-2">{form.company}</div>
          <h1 className="text-3xl font-serif text-[#0e0e12] leading-tight mb-2">Apply for {form.job_title}</h1>
          <p className="text-sm text-[#6b6458] leading-relaxed">{form.job_description}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {form.questions?.map((q: any) => (
            <div key={q.id} className="space-y-3">
              <label className="block text-sm font-bold text-[#0e0e12]">
                {q.text} {q.required && <span className="text-red-500">*</span>}
              </label>
              {q.type === 'text' && (
                <textarea
                  required={q.required}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Your answer..."
                  className="w-full p-4 bg-[#fcfbf9] border border-[#d9d3c6] rounded-lg text-sm focus:border-[#0e0e12] outline-none min-h-[120px]"
                />
              )}
              {/* Add more types if needed (multiselect etc) */}
            </div>
          ))}

          <div className="pt-4 border-t border-[#f0ede8] flex items-center justify-between">
            <button 
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-sm text-[#6b6458] hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-10 py-3 bg-[#1710E6] text-white rounded-lg text-sm font-bold shadow-lg hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
