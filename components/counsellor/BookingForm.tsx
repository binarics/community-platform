'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
}

interface Room {
  id: string
  name: string
  capacity: number
  facilities?: string
}

interface BookingFormProps {
  counsellorId: string
  clients: Client[]
  rooms: Room[]
  preSelectedClientId?: string
}

const SESSION_TYPES = ['INDIVIDUAL', 'COUPLES', 'GROUP', 'ASSESSMENT']

export function BookingForm({ counsellorId, clients, rooms, preSelectedClientId }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    date: '',
    startTime: '',
    duration: '60',
    roomId: '',
    sessionType: 'INDIVIDUAL',
    notes: '',
  })

  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  async function checkRoomAvailability() {
    if (!formData.date || !formData.startTime || !formData.duration) {
      return
    }

    setCheckingAvailability(true)

    try {
      const response = await fetch(
        `/api/counsellor/rooms/available?date=${formData.date}&startTime=${formData.startTime}&duration=${formData.duration}`
      )

      const data = await response.json()

      if (response.ok) {
        setAvailableRooms(data.rooms)
      } else {
        setError('Failed to check room availability')
      }
    } catch (error) {
      console.error('Availability check error:', error)
      setError('Failed to check availability')
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

    if (!formData.date || !formData.startTime) {
      setError('Please select date and time')
      return
    }

    if (!formData.roomId) {
      setError('Please select a room')
      return
    }

    setLoading(true)

    try {
      // Calculate end time
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000)

      const response = await fetch('/api/counsellor/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          clientId: formData.clientId,
          roomId: formData.roomId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          sessionType: formData.sessionType,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create booking')
        setLoading(false)
        return
      }

      // Success - redirect to booking detail
      router.push(`/counsellor/bookings/${data.booking.id}`)
      router.refresh()
    } catch (error) {
      console.error('Booking creation error:', error)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  function handleNext() {
    if (step === 1 && !formData.clientId) {
      setError('Please select a client')
      return
    }

    if (step === 2 && (!formData.date || !formData.startTime)) {
      setError('Please select date and time')
      return
    }

    if (step === 2) {
      checkRoomAvailability()
    }

    setError('')
    setStep(step + 1)
  }

  function handleBack() {
    setError('')
    setStep(step - 1)
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)

  return (
    <form onSubmit={handleSubmit}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s === step ? 'bg-sage-500 text-white' :
                s < step ? 'bg-sage-300 text-white' :
                'bg-sage-100 text-slate'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  s < step ? 'bg-sage-300' : 'bg-sage-100'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={step === 1 ? 'font-semibold text-charcoal' : 'text-slate'}>Client</span>
          <span className={step === 2 ? 'font-semibold text-charcoal' : 'text-slate'}>Date & Time</span>
          <span className={step === 3 ? 'font-semibold text-charcoal' : 'text-slate'}>Room</span>
          <span className={step === 4 ? 'font-semibold text-charcoal' : 'text-slate'}>Details</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Client */}
      {step === 1 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Select Client
          </h3>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                No Clients Yet
              </h3>
              <p className="text-slate mb-6">
                You need to onboard a client before booking a session
              </p>
              <Link href="/counsellor/clients/onboard" className="btn btn-primary">
                + Onboard First Client
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-8">
                {clients.map((client) => (
                  <label
                    key={client.id}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                      formData.clientId === client.id
                        ? 'border-sage-500 bg-sage-50'
                        : 'border-sage-100 hover:border-sage-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="clientId"
                        value={client.id}
                        checked={formData.clientId === client.id}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-5 h-5"
                      />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-lg font-bold text-terracotta-600">
                        {client.name?.[0] || 'C'}
                      </div>
                      <div>
                        <div className="font-semibold text-charcoal">{client.name}</div>
                        <div className="text-sm text-slate">{client.email}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  href="/counsellor/clients/onboard" 
                  className="text-sm text-sage-500 hover:text-sage-600 font-semibold"
                >
                  + Add New Client
                </Link>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.clientId}
                  className="btn btn-primary"
                >
                  Continue to Date & Time →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Select Date & Time
          </h3>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
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

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-outline"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={!formData.date || !formData.startTime}
              className="btn btn-primary flex-1"
            >
              Continue to Room Selection →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Room */}
      {step === 3 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Select Room
          </h3>

          {checkingAvailability ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <div className="text-slate">Checking room availability...</div>
            </div>
          ) : availableRooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚫</div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                No Rooms Available
              </h3>
              <p className="text-slate mb-6">
                All rooms are booked for this time slot
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="btn btn-primary"
              >
                Choose Different Time
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-8">
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
                        <div className="font-semibold text-charcoal mb-1">{room.name}</div>
                        <div className="text-sm text-slate">
                          Capacity: {room.capacity} people
                        </div>

                        {room.facilities && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold uppercase text-slate mb-2">
                               Facilities
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(room.facilities).map((facility: string, i: number) => (
                                <span key={i} className="text-xs px-2 py-1 bg-sage-50 text-sage-700 rounded-full">
                                  {facility}
                                </span>
                              ))}
                            </div>
                          </div>
                )}
                      </div>
                      <span className="badge bg-green-100 text-green-700">
                        Available
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-outline"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.roomId}
                  className="btn btn-primary flex-1"
                >
                  Continue to Details →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Session Details */}
      {step === 4 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Session Details
          </h3>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Session Type
              </label>
              <select
                value={formData.sessionType}
                onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              >
                {SESSION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Any additional notes for this session..."
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="p-6 bg-sage-50 rounded-xl mb-8">
            <div className="font-semibold text-charcoal mb-4">Booking Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">Client:</span>
                <span className="font-semibold text-charcoal">{selectedClient?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Date:</span>
                <span className="font-semibold text-charcoal">
                  {new Date(formData.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Time:</span>
                <span className="font-semibold text-charcoal">{formData.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Duration:</span>
                <span className="font-semibold text-charcoal">{formData.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Room:</span>
                <span className="font-semibold text-charcoal">
                  {availableRooms.find(r => r.id === formData.roomId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Type:</span>
                <span className="font-semibold text-charcoal">{formData.sessionType}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-outline"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}