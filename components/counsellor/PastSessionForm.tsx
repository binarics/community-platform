'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PastSessionFormProps {
  counsellorId: string
  clients: { id: string; name: string | null; email: string }[]
  rooms: { id: string; name: string }[]
}

export function PastSessionForm({ counsellorId, clients, rooms }: PastSessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    roomId: '',
    sessionType: 'INDIVIDUAL',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate date is in the past
      const sessionDate = new Date(`${formData.date}T${formData.startTime}`)
      if (sessionDate > new Date()) {
        setError('Session date must be in the past')
        setLoading(false)
        return
      }

      // Create booking
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

      const response = await fetch('/api/counsellor/bookings/past', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          clientId: formData.clientId,
          roomId: formData.roomId || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          sessionType: formData.sessionType,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create session')
        setLoading(false)
        return
      }

      // Success - redirect to calendar
      router.push('/counsellor/calendar?success=past-session-added')
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
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

      {/* Client Selection */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">
          Client <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
          required
        >
          <option value="">Select client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.email})
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">
          Session Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
          required
        />
        <p className="text-xs text-slate mt-1">Must be a past date</p>
      </div>

      {/* Time */}
      <div className="grid md:grid-cols-2 gap-6">
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
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            required
          />
        </div>
      </div>

      {/* Session Type */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">
          Session Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.sessionType}
          onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
          required
        >
          <option value="INDIVIDUAL">Individual</option>
          <option value="COUPLES">Couples</option>
          <option value="FAMILY">Family</option>
          <option value="GROUP">Group</option>
          <option value="ASSESSMENT">Assessment</option>
        </select>
      </div>

      {/* Room */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">Room (Optional)</label>
        <select
          value={formData.roomId}
          onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
        >
          <option value="">No room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block font-semibold text-charcoal mb-2">Session Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          placeholder="Add any notes about this session..."
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-6 border-t border-sage-100">
        <button type="submit" disabled={loading} className="btn btn-primary flex-1">
          {loading ? 'Adding Session...' : 'Add Past Session'}
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
  )
}
