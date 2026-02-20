'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventFormProps {
  masjidId: string
  masjidName: string
  organizerId: string
}

export function EventForm({ masjidId, masjidName, organizerId }: EventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'LECTURE',
    date: '',
    startTime: '19:00',
    endTime: '21:00',
    location: '',
    requiresRSVP: false,
    maxAttendees: '',
    isPublic: true,
    status: 'DRAFT',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const slug = formData.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      const dateValue = new Date(formData.date)
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          masjidId,
          organizerId,
          startDate: dateValue.toISOString(),
          endDate: dateValue.toISOString(),
          maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/masjid/${masjidId}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create event')
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

      {/* Masjid Badge */}
      <div className="p-4 bg-sage-50 rounded-xl">
        <div className="text-sm text-slate mb-1">Publishing to:</div>
        <div className="font-semibold text-charcoal">🕌 {masjidName}</div>
      </div>

      {/* Basic Info */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Event Details
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="Friday Lecture: Understanding Ramadan"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              rows={6}
              placeholder="Detailed description of the event..."
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            >
              <option value="JUMMAH">Jummah</option>
              <option value="LECTURE">Lecture</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="FUNDRAISER">Fundraiser</option>
              <option value="SOCIAL">Social</option>
              <option value="YOUTH">Youth Event</option>
              <option value="WOMEN">Women's Event</option>
              <option value="FAMILY">Family Event</option>
              <option value="EDUCATIONAL">Educational</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Date & Time
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
          placeholder="Main prayer hall"
        />
        <p className="text-sm text-slate mt-1">
          Specific location within the masjid
        </p>
      </div>

      {/* Registration */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Registration
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.requiresRSVP}
              onChange={(e) => setFormData({ ...formData, requiresRSVP: e.target.checked })}
              className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
            />
            <div>
              <div className="font-semibold text-charcoal">Require RSVP</div>
              <div className="text-sm text-slate">Track who's attending</div>
            </div>
          </label>

          {formData.requiresRSVP && (
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Maximum Attendees (Optional)
              </label>
              <input
                type="number"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                placeholder="100"
                min="1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Publishing Options */}
      <div>
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          Publishing
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
              <div className="font-semibold text-charcoal">Public Event</div>
              <div className="text-sm text-slate">Visible to all members</div>
            </div>
          </label>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="DRAFT">Draft (not visible)</option>
              <option value="PUBLISHED">Published (live)</option>
            </select>
          </div>
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
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}