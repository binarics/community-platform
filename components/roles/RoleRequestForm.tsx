'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AVAILABLE_ROLES = [
  {
    value: 'CLIENT',
    label: 'Client',
    description: 'Book and manage counselling sessions',
    requirements: 'Verified email, basic profile completed',
    difficulty: 'easy',
  },
  {
    value: 'ORGANISER',
    label: 'Organiser',
    description: 'Create and manage community events',
    requirements: 'Active community member, verified email, clear event plans',
    difficulty: 'medium',
  },
  {
    value: 'COUNSELLOR',
    label: 'Counsellor',
    description: 'Provide professional counselling services',
    requirements: 'Professional qualifications, certifications, background check, interview',
    difficulty: 'high',
  },
  {
    value: 'MASJID_ADMIN',
    label: 'Masjid Admin',
    description: 'Manage Masjid profile and approve events',
    requirements: 'Official representative of a Masjid, verification documents required',
    difficulty: 'high',
  },
]

export function RoleRequestForm({ userId, currentRole }: { userId: string, currentRole: string }) {
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

    if (!formData.reason || formData.reason.length < 50) {
      setError('Please provide a detailed reason (at least 50 characters)')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/role-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requestedRole: formData.requestedRole,
          currentRole,
          reason: formData.reason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit request')
        setLoading(false)
        return
      }

      // Success - redirect to show pending status
      router.push('/request-role?submitted=true')
      router.refresh()
    } catch (error) {
      console.error('Request error:', error)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const selectedRole = AVAILABLE_ROLES.find(r => r.value === formData.requestedRole)

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Role Selection */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-4">
          Select Role to Request <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {AVAILABLE_ROLES.map(role => (
            <label
              key={role.value}
              className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                formData.requestedRole === role.value
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-sage-100 hover:border-sage-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="requestedRole"
                  value={role.value}
                  checked={formData.requestedRole === role.value}
                  onChange={(e) => setFormData({ ...formData, requestedRole: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-charcoal">{role.label}</span>
                    <span className={`badge text-xs ${
                      role.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      role.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {role.difficulty === 'easy' ? 'Easy Approval' :
                       role.difficulty === 'medium' ? 'Requires Review' :
                       'High Trust'}
                    </span>
                  </div>
                  <p className="text-sm text-slate mb-2">{role.description}</p>
                  <p className="text-xs text-slate">
                    <strong>Requirements:</strong> {role.requirements}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Selected Role Details */}
      {selectedRole && (
        <div className="mb-8 p-6 bg-sage-50 rounded-xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✨</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Why request {selectedRole.label}?
              </div>
              <p className="text-sm text-slate mb-3">
                This role will give you access to:
              </p>
              <ul className="text-sm text-slate space-y-1">
                {selectedRole.value === 'CLIENT' && (
                  <>
                    <li>• Book counselling sessions</li>
                    <li>• Manage your bookings</li>
                    <li>• View session history</li>
                    <li>• Provide feedback</li>
                  </>
                )}
                {selectedRole.value === 'ORGANISER' && (
                  <>
                    <li>• Create community events</li>
                    <li>• Manage event attendees</li>
                    <li>• View event analytics</li>
                    <li>• Access organiser dashboard</li>
                  </>
                )}
                {selectedRole.value === 'COUNSELLOR' && (
                  <>
                    <li>• Accept client bookings</li>
                    <li>• Manage your calendar</li>
                    <li>• Track client sessions</li>
                    <li>• Access counsellor tools</li>
                  </>
                )}
                {selectedRole.value === 'MASJID_ADMIN' && (
                  <>
                    <li>• Manage Masjid profile</li>
                    <li>• Approve/reject events</li>
                    <li>• Add organisers to Masjid</li>
                    <li>• View Masjid analytics</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Why do you want this role? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={6}
          placeholder="Please provide a detailed explanation of why you're requesting this role and how you plan to use it..."
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          required
        />
        <p className="text-xs text-slate mt-1">
          {formData.reason.length} / 50 characters minimum
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.requestedRole || formData.reason.length < 50}
        className="btn btn-primary w-full"
      >
        {loading ? 'Submitting Request...' : 'Submit Role Request'}
      </button>
    </form>
  )
}
