'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Room {
  id: string
  name: string
  capacity: number
}

interface ClientOnboardingFormProps {
  counsellorId: string
  rooms: Room[]
}

export function ClientOnboardingForm({ counsellorId, rooms }: ClientOnboardingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    createAccount: true,
    notes: '',
  })

  const [consultationMode, setConsultationMode] = useState<'book' | 'bypass'>('book')
  const [consultationData, setConsultationData] = useState({
    date: '',
    time: '09:00',
    duration: '60',
    roomId: '',
  })
  const [bypassData, setBypassData] = useState({
    reason: 'Consultation already completed prior to onboarding',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload: Record<string, unknown> = {
        counsellorId,
        ...clientData,
      }

      if (consultationMode === 'bypass') {
        payload.consultationBypassed = true
        payload.consultationBypassReason = bypassData.reason
      } else {
        payload.consultationDate = consultationData.date
        payload.consultationTime = consultationData.time
        payload.consultationDuration = consultationData.duration
        payload.consultationRoomId = consultationData.roomId || null
      }

      const response = await fetch('/api/counsellor/clients/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/counsellor/clients/${data.clientId}`)
      } else {
        setError(data.error || 'Failed to onboard client')
        // Go back to consultation step if it's a time conflict
        if (data.error?.includes('time') || data.error?.includes('room')) {
          setStep(2)
        }
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = clientData.createAccount
    ? clientData.name.trim() && clientData.email.trim()
    : clientData.email.trim()

  const canProceedStep2 =
    consultationMode === 'bypass' ||
    (consultationData.date && consultationData.time)

  return (
    <div>
      {/* Step Progress */}
      <div className="flex items-center gap-4 text-sm mb-8">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-charcoal font-semibold' : 'text-slate'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 1 ? 'bg-sage-500 text-white' : step > 1 ? 'bg-green-500 text-white' : 'bg-sage-100 text-slate'}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          Client Details
        </div>
        <div className="h-px flex-1 bg-sage-200" />
        <div className={`flex items-center gap-2 ${step === 2 ? 'text-charcoal font-semibold' : 'text-slate'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === 2 ? 'bg-sage-500 text-white' : 'bg-sage-100 text-slate'}`}>
            2
          </div>
          Consultation
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Step 1: Client Details ─────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={clientData.createAccount}
                onChange={(e) => setClientData({ ...clientData, createAccount: e.target.checked })}
                className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
              />
              <div>
                <div className="font-semibold text-charcoal">Create New Client Account</div>
                <div className="text-sm text-slate">
                  {clientData.createAccount
                    ? 'Will create a new user account for this client'
                    : 'Link an existing user as your client'}
                </div>
              </div>
            </label>
          </div>

          {clientData.createAccount ? (
            <>
              <div>
                <label className="block font-semibold text-charcoal mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  placeholder="John Smith"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientData.email}
                  onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  placeholder="john@example.com"
                  required
                />
                <p className="text-sm text-slate mt-1">
                  A temporary password will be generated and sent to this email
                </p>
              </div>
            </>
          ) : (
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Existing User Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={clientData.email}
                onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                placeholder="existing@example.com"
                required
              />
              <p className="text-sm text-slate mt-1">
                Will link this existing user to your client list
              </p>
            </div>
          )}

          {/* Initial Notes */}
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Initial Notes (Optional)
            </label>
            <textarea
              value={clientData.notes}
              onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              rows={3}
              placeholder="Any initial observations or intake notes..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="btn btn-primary flex-1"
            >
              Next: Book Consultation →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Consultation Booking ───────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Consultation info banner */}
          <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <div className="font-semibold text-charcoal mb-1">Why a Consultation?</div>
                <p className="text-sm text-slate">
                  A consultation session must take place before any counselling sessions. It helps the
                  counsellor understand the client&apos;s situation, explains the therapy process, and
                  covers important safeguarding questions.
                </p>
              </div>
            </div>
          </div>

          {/* Mode: Book now vs Already done */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setConsultationMode('book')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                consultationMode === 'book'
                  ? 'border-sage-500 bg-sage-50'
                  : 'border-sage-100 hover:border-sage-300'
              }`}
            >
              <div className="text-xl mb-1">📅</div>
              <div className="font-semibold text-charcoal text-sm">Book Consultation Now</div>
              <div className="text-xs text-slate mt-1">Schedule the initial consultation</div>
            </button>

            <button
              type="button"
              onClick={() => setConsultationMode('bypass')}
              className={`p-4 rounded-xl border-2 text-left transition ${
                consultationMode === 'bypass'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-sage-100 hover:border-sage-300'
              }`}
            >
              <div className="text-xl mb-1">✅</div>
              <div className="font-semibold text-charcoal text-sm">Already Completed</div>
              <div className="text-xs text-slate mt-1">Client added retrospectively</div>
            </button>
          </div>

          {/* Book Consultation Fields */}
          {consultationMode === 'book' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-charcoal mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={consultationData.date}
                    onChange={(e) => setConsultationData({ ...consultationData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                    required={consultationMode === 'book'}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={consultationData.time}
                    onChange={(e) => setConsultationData({ ...consultationData, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                    required={consultationMode === 'book'}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-2">Duration</label>
                <select
                  value={consultationData.duration}
                  onChange={(e) => setConsultationData({ ...consultationData, duration: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour (recommended)</option>
                  <option value="90">1.5 hours</option>
                </select>
              </div>

              {/* Room selection */}
              {rooms.length > 0 && (
                <div>
                  <label className="block font-semibold text-charcoal mb-2">
                    Room (Optional)
                  </label>
                  <select
                    value={consultationData.roomId}
                    onChange={(e) => setConsultationData({ ...consultationData, roomId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  >
                    <option value="">No room / Online</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} (capacity: {room.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Safeguarding reminder */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <div className="font-semibold text-amber-800 mb-1">Safeguarding Reminder</div>
                <p className="text-amber-700">
                  During the consultation, remember to cover safeguarding questions, explain confidentiality
                  limits, and document any identified risks using session notes after the meeting.
                </p>
              </div>
            </div>
          )}

          {/* Bypass / Already Completed Fields */}
          {consultationMode === 'bypass' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-semibold text-amber-800 mb-1">Retrospective Bypass</div>
                <p className="text-sm text-amber-700">
                  Use this only when adding a client who has already had their consultation outside
                  of the system. The consultation status will be marked as completed.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-2">
                  Reason / Notes
                </label>
                <textarea
                  value={bypassData.reason}
                  onChange={(e) => setBypassData({ reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  rows={3}
                  placeholder="e.g. Consultation completed on DD/MM/YYYY before system was set up"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-sage-50 rounded-xl border border-sage-100 text-sm">
            <div className="font-semibold text-charcoal mb-2">Onboarding Summary</div>
            <div className="space-y-1 text-slate">
              <div>
                <span className="font-medium">Client: </span>
                {clientData.createAccount ? clientData.name : clientData.email}
              </div>
              <div>
                <span className="font-medium">Consultation: </span>
                {consultationMode === 'bypass'
                  ? 'Marked as already completed'
                  : consultationData.date && consultationData.time
                  ? `Booked for ${consultationData.date} at ${consultationData.time}`
                  : 'Date/time required'}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-outline"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading || !canProceedStep2}
              className="btn btn-primary flex-1"
            >
              {loading
                ? 'Creating...'
                : consultationMode === 'bypass'
                ? 'Onboard Client (Consultation Bypassed)'
                : 'Onboard Client & Book Consultation'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
