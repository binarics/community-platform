'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string | null
  category: string | null
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  location: string | null
  requiresRSVP: boolean
  maxAttendees: number | null
  isPublic: boolean
  status: string
  image: string | null
  slug: string | null
  _count: { rsvps: number; comments: number }
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function MasjidEventDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  // We need the masjid ID — read from the URL segment above this page
  // Route: /masjid/events/[id] — the masjid is determined server-side
  // We use the events API under /api/masjid/[masjidId]/events/[eventId]
  // Since we don't have masjidId client-side easily, we load via a thin wrapper
  const [event, setEvent] = useState<Event | null>(null)
  const [masjidId, setMasjidId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<Partial<Event>>({})

  useEffect(() => {
    async function load() {
      // Fetch the event via a lightweight API that resolves active masjid
      const res = await fetch(`/api/masjid/event-lookup/${params.id}`)
      if (!res.ok) {
        setError('Event not found or access denied.')
        setLoading(false)
        return
      }
      const data = await res.json()
      setEvent(data.event)
      setMasjidId(data.masjidId)
      setFormData({
        title: data.event.title,
        description: data.event.description,
        category: data.event.category,
        startDate: data.event.startDate?.split('T')[0],
        startTime: data.event.startTime,
        endTime: data.event.endTime,
        location: data.event.location,
        requiresRSVP: data.event.requiresRSVP,
        maxAttendees: data.event.maxAttendees,
        isPublic: data.event.isPublic,
        status: data.event.status,
        image: data.event.image,
      })
      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!masjidId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/masjid/${masjidId}/events/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Failed to save event')
      } else {
        router.push('/masjid/events')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!masjidId || !confirm('Delete this event? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/masjid/${masjidId}/events/${params.id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/masjid/events')
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to delete event')
        setDeleting(false)
      }
    } catch {
      setError('Something went wrong')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="card p-12 text-center">
          <div className="text-2xl animate-pulse text-slate">Loading event…</div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-4">{error}</h1>
          <Link href="/masjid/events" className="btn btn-outline">Back to Events</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <Link href="/masjid/events" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
          ← Back to Events
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-charcoal mb-2">{event?.title}</h1>
            <div className="flex items-center gap-3">
              {event?.status && (
                <span className={`badge text-xs ${STATUS_COLORS[event.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {event.status}
                </span>
              )}
              {event?.slug && (
                <Link href={`/events/${event.slug}`} target="_blank" className="text-sm text-sage-500 hover:text-sage-600">
                  View public page →
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate">
            <span>👥 {event?._count.rsvps} RSVPs</span>
            <span>💬 {event?._count.comments} comments</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">{error}</div>
      )}

      <form onSubmit={handleSave} className="card p-8 space-y-6">
        <div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">Event Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-charcoal mb-2">Event Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title ?? ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal mb-2">Description</label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                rows={5}
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal mb-2">Category</label>
              <select
                value={formData.category ?? ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              >
                <option value="JUMMAH">Jummah</option>
                <option value="LECTURE">Lecture</option>
                <option value="WORKSHOP">Workshop</option>
                <option value="FUNDRAISER">Fundraiser</option>
                <option value="SOCIAL">Social</option>
                <option value="YOUTH">Youth Event</option>
                <option value="WOMEN">Women&apos;s Event</option>
                <option value="FAMILY">Family Event</option>
                <option value="EDUCATIONAL">Educational</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">Date & Time</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-charcoal mb-2">Date</label>
              <input
                type="date"
                value={formData.startDate ?? ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal mb-2">Start Time</label>
              <input
                type="time"
                value={formData.startTime ?? ''}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-charcoal mb-2">End Time</label>
              <input
                type="time"
                value={formData.endTime ?? ''}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">Location</label>
          <input
            type="text"
            value={formData.location ?? ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            placeholder="Main prayer hall"
          />
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">Cover Image URL</label>
          <input
            type="url"
            value={formData.image ?? ''}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">Registration & Publishing</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.requiresRSVP ?? false}
                onChange={(e) => setFormData({ ...formData, requiresRSVP: e.target.checked })}
                className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
              />
              <div>
                <div className="font-semibold text-charcoal">Require RSVP</div>
                <div className="text-sm text-slate">Track who&apos;s attending</div>
              </div>
            </label>

            {formData.requiresRSVP && (
              <div>
                <label className="block font-semibold text-charcoal mb-2">Max Attendees</label>
                <input
                  type="number"
                  value={formData.maxAttendees ?? ''}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            )}

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.isPublic ?? true}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
              />
              <div>
                <div className="font-semibold text-charcoal">Public Event</div>
                <div className="text-sm text-slate">Visible to all users</div>
              </div>
            </label>

            <div>
              <label className="block font-semibold text-charcoal mb-2">Status</label>
              <select
                value={formData.status ?? 'DRAFT'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Submit for Approval</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-sage-100">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-sm text-red-600 border-red-200 hover:bg-red-50"
          >
            {deleting ? 'Deleting…' : 'Delete Event'}
          </button>
          <div className="flex gap-3">
            <Link href="/masjid/events" className="btn btn-outline">Cancel</Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
