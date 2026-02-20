'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SessionNotesFormProps {
  bookingId: string
  counsellorId: string
}

export function SessionNotesForm({ bookingId, counsellorId }: SessionNotesFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.subjective.trim() || !formData.objective.trim() || 
        !formData.assessment.trim() || !formData.plan.trim()) {
      setError('All SOAP fields are required')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/counsellor/bookings/${bookingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          counsellorId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to save notes')
        setLoading(false)
        return
      }

      // Clear form and refresh
      setFormData({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      })
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6 mb-8">
        <div>
          <label className="block font-semibold text-charcoal mb-2">
            <span className="badge bg-sage-500 text-white mr-2">S</span>
            Subjective <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.subjective}
            onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
            rows={4}
            placeholder="What did the client report? (their words, feelings, experiences)"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
            required
          />
          <p className="text-xs text-slate mt-1">
            {formData.subjective.length} characters
          </p>
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            <span className="badge bg-sage-500 text-white mr-2">O</span>
            Objective <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            rows={4}
            placeholder="What did you observe? (behavior, appearance, affect, mood)"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
            required
          />
          <p className="text-xs text-slate mt-1">
            {formData.objective.length} characters
          </p>
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            <span className="badge bg-sage-500 text-white mr-2">A</span>
            Assessment <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.assessment}
            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
            rows={4}
            placeholder="Your clinical analysis and impressions"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
            required
          />
          <p className="text-xs text-slate mt-1">
            {formData.assessment.length} characters
          </p>
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            <span className="badge bg-sage-500 text-white mr-2">P</span>
            Plan <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.plan}
            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            rows={4}
            placeholder="Next steps, homework, follow-up actions, treatment adjustments"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
            required
          />
          <p className="text-xs text-slate mt-1">
            {formData.plan.length} characters
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Saving Notes...' : 'Save Session Notes'}
      </button>
    </form>
  )
}