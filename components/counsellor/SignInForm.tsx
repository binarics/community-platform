'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SignInFormProps {
  bookingId: string
  clientName: string
}

export function SignInForm({ bookingId, clientName }: SignInFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    mood: '5',
    concerns: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/counsellor/bookings/${bookingId}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: formData.mood,
          concerns: formData.concerns,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to check in')
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
            How is {clientName} feeling today? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate">😔 1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="flex-1"
            />
            <span className="text-sm text-slate">10 😊</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-4xl font-bold text-charcoal">{formData.mood}</span>
            <span className="text-slate"> / 10</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            Any specific concerns or topics to discuss today?
          </label>
          <textarea
            value={formData.concerns}
            onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
            rows={4}
            placeholder="Optional: What would you like to focus on in today's session?"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          />
          <p className="text-xs text-slate mt-1">
            This helps your counsellor prepare for the session
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading ? 'Checking In...' : 'Complete Check-In'}
      </button>
    </form>
  )
}