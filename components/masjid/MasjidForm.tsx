'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MasjidForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    country: '',
    address: '',
    state: '',
    postalCode: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    capacity: '',
    isPublic: true,
    allowEvents: true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create slug from name
      const slug = formData.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const response = await fetch('/api/admin/masjid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/masjid/${data.masjid.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create masjid')
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

      {/* Basic Information */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Masjid Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="Central Masjid"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              rows={4}
              placeholder="Brief description of your masjid..."
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Location
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="London"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              State/Province
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="England"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="United Kingdom"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="SW1A 1AA"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Capacity
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="500"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Contact Information
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="+44 20 1234 5678"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="info@masjid.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-charcoal mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="https://masjid.com"
            />
          </div>
        </div>
      </div>

      {/* Settings */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Settings
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
            />
            <div>
              <div className="font-semibold text-charcoal">Public Visibility</div>
              <div className="text-sm text-slate">Make this masjid visible to all users</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.allowEvents}
              onChange={(e) => setFormData({ ...formData, allowEvents: e.target.checked })}
              className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
            />
            <div>
              <div className="font-semibold text-charcoal">Allow Events</div>
              <div className="text-sm text-slate">Enable event creation for this masjid</div>
            </div>
          </label>
        </div>
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
          {loading ? 'Creating...' : 'Create Masjid'}
        </button>
      </div>
    </form>
  )
}