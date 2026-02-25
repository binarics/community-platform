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

interface RoomBooking {
  id: string
  startTime: string
  endTime: string
  status: string
  sessionType: string
  counsellor: { user: { name: string | null } }
}

interface BookingFormProps {
  counsellorId: string
  clients: Client[]
  rooms: Room[]
  preSelectedClientId?: string
}

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED:   'bg-sage-100 text-sage-800 border-sage-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED:   'bg-green-100 text-green-800 border-green-200',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
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

  // Room schedule state
  const [roomSchedule, setRoomSchedule] = useState<RoomBooking[] | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState('')

  async function fetchRoomSchedule(roomId: string, date: string) {
    if (!roomId || !date) return
    setScheduleLoading(true)
    setScheduleError('')
    setRoomSchedule(null)
    try {
      const res = await fetch(
        `/api/counsellor/rooms/${roomId}/schedule?date=${date}`
      )
      if (!res.ok) throw new Error('Failed to load schedule')
      const data = await res.json()
      setRoomSchedule(data.bookings)
    } catch {
      setScheduleError('Could not load room schedule')
    } finally {
      setScheduleLoading(false)
    }
  }

  function handleRoomSelect(roomId: string) {
    setFormData((prev) => ({ ...prev, roomId }))
    if (roomId) {
      fetchRoomSchedule(roomId, formData.date)
    } else {
      setRoomSchedule(null)
    }
  }

  // When the user goes back and changes the date, clear the loaded schedule
  function handleDateChange(date: string) {
    setFormData((prev) => ({ ...prev, date }))
    setRoomSchedule(null)
  }

  // Conflict detection
  const proposedStart = formData.date && formData.time
    ? new Date(`${formData.date}T${formData.time}`)
    : null
  const proposedEnd = proposedStart
    ? new Date(proposedStart.getTime() + parseInt(formData.duration) * 60_000)
    : null

  const conflicts = roomSchedule?.filter((b) => {
    const bStart = new Date(b.startTime)
    const bEnd = new Date(b.endTime)
    return proposedStart && proposedEnd && bStart < proposedEnd && bEnd > proposedStart
  }) ?? []

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
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return formData.clientId
    if (step === 2) return formData.date && formData.time
    if (step === 3) return true
    return true
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center gap-4 text-sm">
        {[['Client', 1], ['Date & Time', 2], ['Room', 3], ['Details', 4]].map(([label, s], i, arr) => (
          <div key={s} className="flex items-center gap-4">
            <span className={step === s ? 'font-semibold text-charcoal' : 'text-slate'}>{label}</span>
            {i < arr.length - 1 && <span className="text-sage-300">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Step 1: Client ── */}
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
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="btn btn-primary w-full"
              >
                Next: Date & Time →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Step 2: Date & Time ── */}
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
                onChange={(e) => handleDateChange(e.target.value)}
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

      {/* ── Step 3: Room Selection ── */}
      {step === 3 && (
        <div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-2">Select Room (Optional)</h3>
          {formData.date && (
            <p className="text-sm text-slate mb-6">
              Showing availability for{' '}
              <span className="font-semibold text-charcoal">
                {new Date(formData.date).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </span>
            </p>
          )}

          <div className="space-y-3 mb-6">
            {/* No room option */}
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
                  onChange={() => handleRoomSelect('')}
                  className="w-5 h-5"
                />
                <div>
                  <div className="font-semibold text-charcoal">No Room Required</div>
                  <div className="text-sm text-slate">Online or off-site session</div>
                </div>
              </div>
            </label>

            {/* Room options */}
            {rooms.map((room) => {
              const isSelected = formData.roomId === room.id
              return (
                <div
                  key={room.id}
                  className={`rounded-xl border-2 transition ${
                    isSelected
                      ? 'border-sage-500'
                      : 'border-sage-100 hover:border-sage-300'
                  }`}
                >
                  {/* Room selector row */}
                  <label className={`block p-4 cursor-pointer ${isSelected ? 'bg-sage-50 rounded-t-xl' : 'rounded-xl'}`}>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="roomId"
                        value={room.id}
                        checked={isSelected}
                        onChange={() => handleRoomSelect(room.id)}
                        className="w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-charcoal">{room.name}</div>
                        <div className="text-sm text-slate">Capacity: {room.capacity} people</div>
                      </div>
                      {/* Conflict badge visible before expanding */}
                      {!isSelected && (
                        <span className="text-xs text-slate/60">Select to check availability</span>
                      )}
                    </div>
                  </label>

                  {/* Schedule panel — shown when this room is selected */}
                  {isSelected && (
                    <div className="px-4 pb-4 border-t border-sage-100">
                      <div className="pt-3">
                        {/* Conflict warning banner */}
                        {conflicts.length > 0 && (
                          <div className="flex items-start gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-xl text-sm">
                            <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
                            <div>
                              <span className="font-semibold text-red-700">Time conflict — </span>
                              <span className="text-red-600">
                                your slot ({formData.time}–{proposedEnd?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}) overlaps with an existing booking.
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Free slot confirmation */}
                        {!scheduleLoading && roomSchedule !== null && conflicts.length === 0 && (
                          <div className="flex items-center gap-2 p-3 mb-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                            <span>✓</span>
                            <span className="font-semibold">
                              {roomSchedule.length === 0
                                ? 'No bookings on this day — room is fully free'
                                : 'Your chosen time slot is available'}
                            </span>
                          </div>
                        )}

                        {/* Loading */}
                        {scheduleLoading && (
                          <div className="flex items-center gap-2 py-3 text-sm text-slate">
                            <svg className="animate-spin w-4 h-4 text-sage-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Loading schedule…
                          </div>
                        )}

                        {/* Error */}
                        {scheduleError && (
                          <p className="text-sm text-red-600 py-2">{scheduleError}</p>
                        )}

                        {/* Booking list */}
                        {!scheduleLoading && roomSchedule && roomSchedule.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-slate mb-2 tracking-wide">
                              Bookings on this day
                            </p>
                            <div className="space-y-1.5">
                              {roomSchedule.map((b) => {
                                const isConflict = conflicts.some((c) => c.id === b.id)
                                const colour = isConflict
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : STATUS_COLOURS[b.status] ?? STATUS_COLOURS.SCHEDULED
                                return (
                                  <div
                                    key={b.id}
                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${colour}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isConflict && <span className="text-red-500 shrink-0">⚠</span>}
                                      <span className="font-semibold tabular-nums">
                                        {fmt(b.startTime)} – {fmt(b.endTime)}
                                      </span>
                                    </div>
                                    <span className="text-xs opacity-75 truncate ml-3">
                                      {b.counsellor.user.name}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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

      {/* ── Step 4: Session Details ── */}
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
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
                  {formData.roomId ? rooms.find((r) => r.id === formData.roomId)?.name : 'No room'}
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
