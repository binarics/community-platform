'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

interface Counsellor {
  id: string
  bio: string
  hourlyRate: number
  specializations: string[]
  user: { name: string; email: string }
}

const SESSION_TYPES = [
  { value: 'INDIVIDUAL', label: 'Individual (1-to-1)' },
  { value: 'COUPLES', label: 'Couples / Family' },
  { value: 'ASSESSMENT', label: 'Initial Assessment' },
]

export default function BookCounsellingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCounsellorId = searchParams.get('counsellor')

  const [counsellors, setCounsellors] = useState<Counsellor[]>([])
  const [loading, setLoading] = useState(true)

  const [counsellorId, setCounsellorId] = useState(preselectedCounsellorId || '')
  const [sessionType, setSessionType] = useState('INDIVIDUAL')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/counselling/counsellors')
      .then(r => r.json())
      .then(data => {
        setCounsellors(data.counsellors || [])
        if (preselectedCounsellorId) setCounsellorId(preselectedCounsellorId)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [preselectedCounsellorId])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-slate">Loading…</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-xl mx-auto px-8 py-24 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">Sign In to Book</h1>
          <p className="text-slate mb-8">
            You need an account to request a counselling session.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login?callbackUrl=/counselling/book" className="btn btn-primary">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-outline">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-xl mx-auto px-8 py-24 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">You&apos;re a Counsellor</h1>
          <p className="text-slate mb-8">
            To schedule sessions, use the Counsellor Dashboard instead.
          </p>
          <Link href="/counsellor/bookings/new" className="btn btn-primary">
            Go to Counsellor Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-xl mx-auto px-8 py-24 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">Request Sent!</h1>
          <p className="text-slate mb-8">
            Your counselling request has been submitted. A counsellor will review your request and be in touch shortly to confirm your session.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/counselling" className="btn btn-outline">
              Back to Counselling
            </Link>
            <Link href="/my-rsvps" className="btn btn-primary">
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const selected = counsellors.find(c => c.id === counsellorId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!counsellorId) { setError('Please select a counsellor.'); return }
    if (!preferredDate) { setError('Please choose a preferred date.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/counselling/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counsellorId, sessionType, preferredDate, preferredTime, notes }),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Min date = tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/counselling" className="text-sm text-sage-500 hover:text-sage-600 mb-2 inline-block">
            ← Back to Counselling
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Book a Session</h1>
          <p className="text-xl text-slate">Request a counselling session — we&apos;ll confirm the time with you.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
            {/* Counsellor Selection */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">Choose a Counsellor</h2>
              {counsellors.length === 0 ? (
                <p className="text-slate">No counsellors available at this time. Please check back soon.</p>
              ) : (
                <div className="grid gap-4">
                  {counsellors.map(c => (
                    <label
                      key={c.id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                        counsellorId === c.id
                          ? 'border-sage-500 bg-sage-50'
                          : 'border-sage-100 hover:border-sage-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="counsellor"
                        value={c.id}
                        checked={counsellorId === c.id}
                        onChange={() => setCounsellorId(c.id)}
                        className="mt-1 accent-sage-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center font-bold text-sage-600 flex-shrink-0">
                            {c.user.name?.[0] || 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-charcoal">{c.user.name}</div>
                            <div className="text-sm text-sage-500">£{c.hourlyRate}/hour</div>
                          </div>
                        </div>
                        <p className="text-sm text-slate line-clamp-2 mb-2">{c.bio}</p>
                        {c.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {c.specializations.slice(0, 3).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-terracotta-50 text-terracotta-600 rounded-full text-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Session Details */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">Session Details</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Session Type</label>
                  <select
                    value={sessionType}
                    onChange={e => setSessionType(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                  >
                    {SESSION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">Preferred Date *</label>
                    <input
                      type="date"
                      value={preferredDate}
                      min={minDateStr}
                      onChange={e => setPreferredDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-charcoal mb-2">Preferred Time</label>
                    <select
                      value={preferredTime}
                      onChange={e => setPreferredTime(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                    >
                      <option value="">Any time</option>
                      <option value="morning">Morning (9am–12pm)</option>
                      <option value="afternoon">Afternoon (12pm–5pm)</option>
                      <option value="evening">Evening (5pm–8pm)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">
                    What would you like to discuss? <span className="text-slate font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe what brings you to counselling. This helps us match you with the most suitable counsellor and session type."
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
                  />
                  <p className="text-xs text-slate mt-1">This is kept confidential and shared only with your counsellor.</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || counsellors.length === 0}
              className="btn btn-primary w-full text-lg py-4 disabled:opacity-50"
            >
              {submitting ? 'Sending Request…' : 'Submit Booking Request'}
            </button>

            <p className="text-xs text-center text-slate">
              By submitting you agree to our confidentiality policy. Your information is kept private and secure.
            </p>
          </form>

          {/* Sidebar */}
          <div className="space-y-6">
            {selected && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-bold text-charcoal mb-4">Selected Counsellor</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center font-bold text-sage-600">
                    {selected.user.name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-charcoal">{selected.user.name}</div>
                    <div className="text-sm text-sage-500">£{selected.hourlyRate}/hour</div>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6 bg-sage-50">
              <h3 className="font-display text-lg font-bold text-charcoal mb-3">How it works</h3>
              <ol className="space-y-3 text-sm text-slate">
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                  Submit this request form
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                  Your counsellor reviews and confirms
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                  You receive a confirmation email
                </li>
                <li className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">4</span>
                  Attend your session in person or online
                </li>
              </ol>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-charcoal mb-2">🔒 Confidential</h3>
              <p className="text-sm text-slate">
                Everything shared in your sessions is kept strictly confidential in line with professional counselling standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
