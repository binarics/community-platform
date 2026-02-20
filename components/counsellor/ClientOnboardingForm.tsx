'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClientOnboardingFormProps {
  counsellorId: string
}

export function ClientOnboardingForm({ counsellorId }: ClientOnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    createAccount: true, // Toggle between creating new user or linking existing
    existingUserId: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/counsellor/clients/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to the new client's page
        router.push(`/counsellor/clients/${data.clientId}`)
      } else {
        setError(data.error || 'Failed to onboard client')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Mode Toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.createAccount}
            onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
            className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
          />
          <div>
            <div className="font-semibold text-charcoal">Create New Client Account</div>
            <div className="text-sm text-slate">
              {formData.createAccount 
                ? 'Will create a new user account for this client' 
                : 'Link an existing user as your client'}
            </div>
          </div>
        </label>
      </div>

      {formData.createAccount ? (
        <>
          {/* Create New Client */}
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="John Smith"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="john@example.com"
              required
            />
            <p className="text-sm text-slate mt-1">
              A temporary password will be generated and sent to this email
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Link Existing User */}
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Existing User Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="existing@example.com"
              required
            />
            <p className="text-sm text-slate mt-1">
              Will link this existing user to your client list
            </p>
          </div>
        </>
      )}

      {/* Notes */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">
          Initial Notes (Optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
          rows={4}
          placeholder="Any initial observations or intake notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Creating...' : formData.createAccount ? 'Create & Onboard Client' : 'Link Client'}
        </button>
      </div>
    </form>
  )
}