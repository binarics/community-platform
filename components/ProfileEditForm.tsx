'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileEditFormProps {
  user: {
    id: string
    name: string | null
    email: string
  }
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update profile')
        setLoading(false)
        return
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      router.refresh()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="btn btn-primary"
      >
        Edit Profile
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-sage-100 pt-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-slate mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false)
            setFormData({ name: user.name || '', email: user.email })
            setError('')
          }}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
