'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SignOutFormProps {
  bookingId: string
  clientName: string
}

export function SignOutForm({ bookingId, clientName }: SignOutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (formData.rating === 0) {
      setError('Please rate the session')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/counsellor/bookings/${bookingId}/sign-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: formData.rating,
          feedback: formData.feedback,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to submit feedback')
        setLoading(false)
        return
      }

      router.push(`/counsellor/bookings/${bookingId}`)
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
          <label className="block font-semibold text-charcoal mb-4">
            How helpful was today&apos;s session? <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className={`text-5xl transition ${
                  star <= formData.rating ? 'text-amber-400' : 'text-sage-200'
                } hover:scale-110`}
              >
                ⭐
              </button>
            ))}
          </div>
          {formData.rating > 0 && (
            <div className="text-center mt-2 text-charcoal font-semibold">
              {formData.rating === 1 && 'Not helpful'}
              {formData.rating === 2 && 'Slightly helpful'}
              {formData.rating === 3 && 'Moderately helpful'}
              {formData.rating === 4 && 'Very helpful'}
              {formData.rating === 5 && 'Extremely helpful'}
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            What was most helpful today?
          </label>
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            rows={4}
            placeholder="Optional: Share what worked well or what you found most valuable..."
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || formData.rating === 0}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Submitting...' : 'Complete Session'}
        </button>
      </div>
    </form>
  )
}