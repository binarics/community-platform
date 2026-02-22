'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SearchableClientSelect } from './SearchableClientSelect'

interface Client {
  id: string
  name: string | null
  email: string
}

interface Room {
  id: string
  name: string
  capacity: number
}

interface BookingFormProps {
  counsellorId: string
  clients: Client[]
  rooms: Room[]
  preSelectedClientId?: string
}

export function BookingForm({ counsellorId, clients, rooms, preSelectedClientId }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    date: '',
    time: '09:00',
    duration: '60',
    roomId: '',
    sessionType: 'INDIVIDUAL',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`)
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000)

      const response = await fetch('/api/counsellor/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          clientId: formData.clientId,
          roomId: formData.roomId || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          sessionType: formData.sessionType,
          status: 'SCHEDULED',
          paymentStatus: 'UNPAID',
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create booking')
        setLoading(false)
        return
      }

      router.push('/counsellor/calendar?success=booking-created')
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.clientId
    if (step === 2) return formData.date && formData.time
    if (step === 3) return true // Room is optional
    return true
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className={step === 1 ? 'font-semibold text-charcoal' : 'text-slate'}>Client</span>
          <span className="text-sage-300">→</span>
          <span className={step === 2 ? 'font-semibold text-charcoal' : 'text-slate'}>Date & Time</span>
          <span className="text-sage-300">→</span>
          <span className={step === 3 ? 'font-semibold text-charcoal' : 'text-slate'}>Room</span>
          <span className="text-sage-300">→</span>
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
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">Select Client</h3>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">No Clients Yet</h3>
              <p className="text-slate mb-6">You need to onboard a client before booking a session</p>
              <Link href="/counsellor/clients/onboard" className="btn btn-primary">
                + Onboard First Client
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block font-semibold text-charcoal mb-2">
                  Search and Select Client <span className="text-red-500">*</span>
                </label>
                <SearchableClientSelect
                  clients={clients}
                  value={formData.clientId}
                  onChange={(id) => setFormData({ ...formData, clientId: id })}
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="btn btn-primary flex-1"
                >
                  Next: Date & Time →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">Date & Time</h3>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
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
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-charcoal mb-2">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(1)} className="btn btn-outline flex-1">
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceed()}
              className="btn btn-primary flex-1"
            >
              Next: Room →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Room Selection */}
      {step === 3 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">Select Room (Optional)</h3>

          <div className="space-y-3 mb-6">
            <label
              className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                formData.roomId === ''
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-sage-100 hover:border-sage-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="roomId"
                  value=""
                  checked={formData.roomId === ''}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-5 h-5"
                />
                <div>
                  <div className="font-semibold text-charcoal">No Room Required</div>
                  <div className="text-sm text-slate">Online or off-site session</div>
                </div>
              </div>
            </label>

            {rooms.map((room) => (
              <label
                key={room.id}
                className={`block p-4 rounded-xl border-2 cursor-pointer transition ${
                  formData.roomId === room.id
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-sage-100 hover:border-sage-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="roomId"
                    value={room.id}
                    checked={formData.roomId === room.id}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-semibold text-charcoal">{room.name}</div>
                    <div className="text-sm text-slate">Capacity: {room.capacity} people</div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(2)} className="btn btn-outline flex-1">
              ← Back
            </button>
            <button type="button" onClick={() => setStep(4)} className="btn btn-primary flex-1">
              Next: Details →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Session Details */}
      {step === 4 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">Session Details</h3>

          <div className="mb-6">
            <label className="block font-semibold text-charcoal mb-2">Session Type</label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData({ ...formData, sessionType: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="INDIVIDUAL">Individual Therapy</option>
              <option value="COUPLES">Couples Therapy</option>
              <option value="FAMILY">Family Therapy</option>
              <option value="GROUP">Group Therapy</option>
              <option value="ASSESSMENT">Initial Assessment</option>
              <option value="CONSULTATION">Initial Consultation</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block font-semibold text-charcoal mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Add any notes about this session..."
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-6 bg-sage-50 rounded-xl border border-sage-100 mb-6">
            <div className="font-semibold text-charcoal mb-3">Booking Summary</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">Client:</span>
                <span className="font-semibold text-charcoal">
                  {clients.find((c) => c.id === formData.clientId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Date:</span>
                <span className="font-semibold text-charcoal">
                  {formData.date &&
                    new Date(formData.date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Time:</span>
                <span className="font-semibold text-charcoal">
                  {formData.time} ({formData.duration} mins)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Room:</span>
                <span className="font-semibold text-charcoal">
                  {formData.roomId
                    ? rooms.find((r) => r.id === formData.roomId)?.name
                    : 'No room'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Type:</span>
                <span className="font-semibold text-charcoal">{formData.sessionType}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(3)} className="btn btn-outline flex-1">
              ← Back
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Creating Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
