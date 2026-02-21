'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminEventFormProps {
  event: any
  masjids: { id: string; name: string; city: string }[]
}

export function AdminEventForm({ event, masjids }: AdminEventFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
    endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
    startTime: event.startTime || '',
    endTime: event.endTime || '',
    location: event.location || '',
    masjidId: event.masjidId || '',
    category: event.category || '',
    imageUrl: event.imageUrl || '',
    registrationUrl: event.registrationUrl || '',
    capacity: event.capacity?.toString() || '',
    status: event.status,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update event')
        setLoading(false)
        return
      }

      router.push('/admin/events')
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/events/${event.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update status')
        setLoading(false)
        return
      }

      setFormData({ ...formData, status: newStatus })
      router.refresh()
      setLoading(false)
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete event')
        setLoading(false)
        return
      }

      router.push('/admin/events')
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Status Actions */}
      <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-charcoal mb-1">Current Status</div>
            <div className="text-sm text-slate">
              This event is currently{' '}
              <span
                className={`font-semibold ${
                  formData.status === 'APPROVED'
                    ? 'text-green-600'
                    : formData.status === 'PENDING'
                    ? 'text-amber-600'
                    : formData.status === 'REJECTED'
                    ? 'text-red-600'
                    : 'text-slate'
                }`}
              >
                {formData.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {formData.status !== 'APPROVED' && (
              <button
                onClick={() => handleStatusChange('APPROVED')}
                disabled={loading}
                className="btn bg-green-500 hover:bg-green-600 text-white"
              >
                ✓ Approve
              </button>
            )}
            {formData.status !== 'REJECTED' && (
              <button
                onClick={() => handleStatusChange('REJECTED')}
                disabled={loading}
                className="btn bg-red-500 hover:bg-red-600 text-white"
              >
                ✗ Reject
              </button>
            )}
            {formData.status !== 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('DRAFT')}
                disabled={loading}
                className="btn btn-outline"
              >
                Set as Draft
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block font-semibold text-charcoal mb-2">
            Event Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
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
            rows={5}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            required
          />
        </div>

        {/* Date & Time */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-charcoal mb-2">Start Time</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">End Time</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
        </div>

        {/* Location & Masjid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-charcoal mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="e.g., Main Prayer Hall"
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">Masjid</label>
            <select
              value={formData.masjidId}
              onChange={(e) => setFormData({ ...formData, masjidId: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="">No Masjid</option>
              {masjids.map((masjid) => (
                <option key={masjid.id} value={masjid.id}>
                  {masjid.name} ({masjid.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category & Capacity */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold text-charcoal mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="">Select category...</option>
              <option value="Educational">Educational</option>
              <option value="Social">Social</option>
              <option value="Religious">Religious</option>
              <option value="Youth">Youth</option>
              <option value="Community">Community</option>
              <option value="Charity">Charity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              placeholder="Leave empty for unlimited"
              min="0"
            />
          </div>
        </div>

        {/* URLs */}
        <div>
          <label className="block font-semibold text-charcoal mb-2">Image URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">Registration URL</label>
          <input
            type="url"
            value={formData.registrationUrl}
            onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            placeholder="https://example.com/register"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-sage-100">
          <button type="submit" disabled={loading} className="btn btn-primary flex-1">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Delete Section */}
      <div className="mt-8 pt-8 border-t-2 border-red-100">
        <div className="p-6 bg-red-50 border border-red-100 rounded-xl">
          <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-700 mb-4">
            Deleting this event will permanently remove all associated RSVPs and comments. This action cannot be
            undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Event
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={loading} className="btn bg-red-600 hover:bg-red-700 text-white">
                {loading ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-outline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
