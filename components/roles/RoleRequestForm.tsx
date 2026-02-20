'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_ROLES = [
  {
    value: 'ORGANISER',
    label: 'Organiser',
    description: 'Create and manage events for your organization',
  },
  {
    value: 'MASJID_ADMIN',
    label: 'Masjid Admin',
    description: 'Full administrative access to manage a masjid',
  },
  {
    value: 'COUNSELLOR',
    label: 'Counsellor',
    description: 'Provide counselling services and manage client bookings',
  },
]

export function RoleRequestForm({ currentRole }: { currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    requestedRole: '',
    reason: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.requestedRole) {
      setError('Please select a role')
      return
    }

    if (formData.reason.trim().length < 20) {
      setError('Please provide a detailed reason (at least 20 characters)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/role-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedRole: formData.requestedRole,
          reason: formData.reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit request')
        setLoading(false)
        return
      }

      router.refresh()
    } catch (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-8 mb-8">
      <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
        Submit Role Request
      </h3>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-3">
            Requested Role <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {AVAILABLE_ROLES.filter(role => role.value !== currentRole).map((role) => (
              <label
                key={role.value}
                className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                  formData.requestedRole === role.value
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-sage-100 hover:border-sage-300'
                }`}
              >
                <input
                  type="radio"
                  name="requestedRole"
                  value={role.value}
                  checked={formData.requestedRole === role.value}
                  onChange={(e) =>
                    setFormData({ ...formData, requestedRole: e.target.value })
                  }
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      formData.requestedRole === role.value
                        ? 'border-sage-500 bg-sage-500'
                        : 'border-sage-300'
                    }`}
                  >
                    {formData.requestedRole === role.value && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-charcoal mb-1">
                      {role.label}
                    </div>
                    <div className="text-sm text-slate">{role.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Why are you requesting this role? <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={6}
            placeholder="Please explain why you need this role and how you plan to use it. Include relevant experience, qualifications, or organizational affiliations."
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
            required
          />
          <p className="text-xs text-slate mt-1">
            {formData.reason.length} characters (minimum 20)
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Submitting Request...' : 'Submit Request'}
        </button>
      </div>
    </form>
  )
}
