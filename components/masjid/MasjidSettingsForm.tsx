'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Masjid {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  state: string | null
  country: string
  postalCode: string | null
  phone: string | null
  email: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  twitter: string | null
  youtube: string | null
  capacity: number | null
  isPublic: boolean
  allowEvents: boolean
  requiresApproval: boolean
  logo: string | null
  coverImage: string | null
  primaryColor: string | null
}

interface Props {
  masjid: Masjid
}

export function MasjidSettingsForm({ masjid }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: masjid.name,
    description: masjid.description ?? '',
    address: masjid.address ?? '',
    city: masjid.city,
    state: masjid.state ?? '',
    country: masjid.country,
    postalCode: masjid.postalCode ?? '',
    phone: masjid.phone ?? '',
    email: masjid.email ?? '',
    website: masjid.website ?? '',
    facebook: masjid.facebook ?? '',
    instagram: masjid.instagram ?? '',
    twitter: masjid.twitter ?? '',
    youtube: masjid.youtube ?? '',
    capacity: masjid.capacity?.toString() ?? '',
    isPublic: masjid.isPublic,
    allowEvents: masjid.allowEvents,
    requiresApproval: masjid.requiresApproval,
    logo: masjid.logo ?? '',
    coverImage: masjid.coverImage ?? '',
    primaryColor: masjid.primaryColor ?? '#4A7C59',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch(`/api/masjid/${masjid.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      if (res.ok) {
        setSuccess(true)
        router.refresh()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to save settings')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const set = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
          Settings saved successfully.
        </div>
      )}

      {/* Basic Info */}
      <div className="card p-6">
        <h3 className="font-display text-xl font-bold text-charcoal mb-5">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">Masjid Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              rows={4}
              placeholder="A brief description of your masjid..."
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-charcoal mb-2">Logo URL</label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => set('logo', e.target.value)}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal mb-2">Cover Image URL</label>
              <input
                type="url"
                value={formData.coverImage}
                onChange={(e) => set('coverImage', e.target.value)}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card p-6">
        <h3 className="font-display text-xl font-bold text-charcoal mb-5">Location</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-semibold text-charcoal mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => set('address', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">City <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => set('city', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">State / County</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">Country <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => set('country', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">Postal Code</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6">
        <h3 className="font-display text-xl font-bold text-charcoal mb-5">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div>
            <label className="block font-semibold text-charcoal mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block font-semibold text-charcoal mb-2">Website</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => set('website', e.target.value)}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="card p-6">
        <h3 className="font-display text-xl font-bold text-charcoal mb-5">Social Media</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { field: 'facebook', label: 'Facebook URL' },
            { field: 'instagram', label: 'Instagram URL' },
            { field: 'twitter', label: 'X / Twitter URL' },
            { field: 'youtube', label: 'YouTube URL' },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block font-semibold text-charcoal mb-2">{label}</label>
              <input
                type="url"
                value={formData[field as keyof typeof formData] as string}
                onChange={(e) => set(field, e.target.value)}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                placeholder="https://..."
              />
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="card p-6">
        <h3 className="font-display text-xl font-bold text-charcoal mb-5">Privacy & Settings</h3>
        <div className="space-y-4">
          {[
            {
              field: 'isPublic',
              label: 'Public Visibility',
              desc: 'Make this masjid visible to all users on the platform',
            },
            {
              field: 'allowEvents',
              label: 'Allow Events',
              desc: 'Enable event creation and management for this masjid',
            },
            {
              field: 'requiresApproval',
              label: 'Require Member Approval',
              desc: 'New members must be approved by an admin before joining',
            },
          ].map(({ field, label, desc }) => (
            <label key={field} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData[field as keyof typeof formData] as boolean}
                onChange={(e) => set(field, e.target.checked)}
                className="w-5 h-5 mt-0.5 text-sage-500 rounded focus:ring-sage-500"
              />
              <div>
                <div className="font-semibold text-charcoal">{label}</div>
                <div className="text-sm text-slate">{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn btn-primary flex-1">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
