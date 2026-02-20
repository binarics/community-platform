'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  name: string
  capacity: number
  facilities?: string
}

interface Client {
  id: string
  name: string
  email: string
}

interface RoomBookingFormProps {
  counsellorId: string
  rooms: Room[]
  clients: Client[]
  preSelectedDate?: string
  preSelectedTime?: string
}

export function RoomBookingForm({
  counsellorId,
  rooms,
  clients,
  preSelectedDate,
  preSelectedTime,
}: RoomBookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  
  const [formData, setFormData] = useState({
    date: preSelectedDate || '',
    startTime: preSelectedTime || '',
    duration: '60',
    roomId: '',
    clientId: '',
    purpose: '',
  })

  // Check availability when date/time changes
  useEffect(() => {
    if (formData.date && formData.startTime && formData.duration) {
      checkAvailability()
    }
  }, [formData.date, formData.startTime, formData.duration])

  async function checkAvailability() {
    setCheckingAvailability(true)
    setError('')

    try {
      const response = await fetch(
        `/api/counsellor/rooms/available?date=${formData.date}&startTime=${formData.startTime}&duration=${formData.duration}`
      )

      const data = await response.json()

      if (response.ok) {
        setAvailableRooms(data.rooms)
      } else {
        setError('Failed to check availability')
      }
    } catch (error) {
      setError('Failed to check availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!formData.roomId) {
      setError('Please select a room')
      return
    }

    setLoading(true)

    try {
      // Calculate end time
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000)

      const response = await fetch('/api/counsellor/rooms/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          roomId: formData.roomId,
          clientId: formData.clientId || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          purpose: formData.purpose,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to book room')
        setLoading(false)
        return
      }

      // Success - redirect to my bookings or booking detail
      if (data.bookingId) {
        router.push(`/counsellor/bookings/${data.bookingId}`)
      } else {
        router.push('/counsellor/rooms/my-bookings')
      }
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Date & Time Selection */}
      <div className="mb-8">
        <h3 className="font-display text-xl font-bold text-charcoal mb-4">
          When do you need the room?
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value, roomId: '' })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
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
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value, roomId: '' })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value, roomId: '' })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Available Rooms */}
      {formData.date && formData.startTime && (
        <div className="mb-8">
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">
            Available Rooms
          </h3>

          {checkingAvailability ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">⏳</div>
              <div className="text-slate">Checking availability...</div>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="card p-8 text-center bg-amber-50 border-amber-200">
              <div className="text-4xl mb-2">🚫</div>
              <div className="font-semibold text-charcoal mb-1">No Rooms Available</div>
              <div className="text-sm text-slate">
                All rooms are booked for this time. Try a different time.
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {availableRooms.map((room) => (
                <label
                  key={room.id}
                  className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                    formData.roomId === room.id
                      ? 'border-sage-500 bg-sage-50'
                      : 'border-sage-100 hover:border-sage-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="roomId"
                      value={room.id}
                      checked={formData.roomId === room.id}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="w-5 h-5 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-charcoal">{room.name}</div>
                        <span className="badge bg-green-100 text-green-700">Available</span>
                      </div>
                      <div className="text-sm text-slate">
                        Capacity: {room.capacity} people
                      </div>
                      {room.facilities && (
                        <div className="text-sm text-slate mt-1">{room.facilities}</div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optional: Link to Client */}
      {formData.roomId && clients.length > 0 && (
        <div className="mb-8">
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">
            Link to Client (Optional)
          </h3>
          <select
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
          >
            <option value="">None - Just booking the room</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} - {client.email}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Purpose */}
      {formData.roomId && (
        <div className="mb-8">
          <label className="block font-semibold text-charcoal mb-2">
            Purpose (Optional)
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            rows={3}
            placeholder="What will you use the room for?"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          />
        </div>
      )}

      {/* Submit */}
      {formData.roomId && (
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? 'Booking Room...' : 'Confirm Booking'}
        </button>
      )}
    </form>
  )
}