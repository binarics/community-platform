import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { SessionNotesForm } from '@/components/counsellor/SessionNotesForm'
import Link from 'next/link'

export default async function SessionNotesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  const profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  if (!profile && session.user.role !== 'SUPER_ADMIN') {
    redirect('/counsellor/setup')
  }

  // Get booking with details
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      room: true,
      counsellor: {
        include: {
          user: true,
        },
      },
      sessionNotes: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!booking) {
    redirect('/counsellor-dashboard')
  }

  // Check authorization
  if (session.user.role !== 'SUPER_ADMIN' && booking.counsellor.userId !== session.user.id) {
    redirect('/counsellor-dashboard')
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/counsellor/bookings/${booking.id}`}
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Booking
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Session Notes
          </h1>
          <p className="text-xl text-slate">
            {booking.client.name} • {new Date(booking.startTime).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Add New Note */}
          <div className="lg:col-span-2 space-y-8">
            {/* SOAP Format Guide */}
            <div className="card p-6 bg-sage-50 border border-sage-100">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📋</div>
                <div>
                  <div className="font-semibold text-charcoal mb-2">
                    SOAP Format Guide
                  </div>
                  <p className="text-sm text-slate mb-3">
                    The SOAP format is the professional standard for clinical notes. It ensures comprehensive documentation.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong className="text-charcoal">S</strong> - <span className="text-slate">Subjective: What the client reports (their words, feelings, experiences)</span>
                    </div>
                    <div>
                      <strong className="text-charcoal">O</strong> - <span className="text-slate">Objective: What you observe (behavior, appearance, mood)</span>
                    </div>
                    <div>
                      <strong className="text-charcoal">A</strong> - <span className="text-slate">Assessment: Your clinical analysis and impressions</span>
                    </div>
                    <div>
                      <strong className="text-charcoal">P</strong> - <span className="text-slate">Plan: Next steps, homework, follow-up actions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Note Form */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                {booking.sessionNotes.length > 0 ? 'Add Another Note' : 'Add Session Note'}
              </h2>
              <SessionNotesForm 
                bookingId={booking.id} 
                counsellorId={profile?.id || booking.counsellorId}
              />
            </div>

            {/* Previous Notes */}
            {booking.sessionNotes.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                  Previous Notes ({booking.sessionNotes.length})
                </h2>
                <div className="space-y-6">
                  {booking.sessionNotes.map((note) => (
                    <div key={note.id} className="p-6 bg-sage-50 rounded-xl border border-sage-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-slate">
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' at '}
                          {new Date(note.createdAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="badge bg-green-100 text-green-700">
                          🔒 Private
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-bold uppercase text-sage-600 mb-1">
                            Subjective
                          </div>
                          <p className="text-slate text-sm whitespace-pre-wrap">{note.subjective}</p>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase text-sage-600 mb-1">
                            Objective
                          </div>
                          <p className="text-slate text-sm whitespace-pre-wrap">{note.objective}</p>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase text-sage-600 mb-1">
                            Assessment
                          </div>
                          <p className="text-slate text-sm whitespace-pre-wrap">{note.assessment}</p>
                        </div>

                        <div>
                          <div className="text-xs font-bold uppercase text-sage-600 mb-1">
                            Plan
                          </div>
                          <p className="text-slate text-sm whitespace-pre-wrap">{note.plan}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Info */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Session Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Date & Time
                  </div>
                  <div className="text-charcoal">
                    {new Date(booking.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {new Date(booking.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Type
                  </div>
                  <div className="text-charcoal">{booking.sessionType}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Room
                  </div>
                  <div className="text-charcoal">{booking.room?.name || 'No room'}</div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Status
                  </div>
                  <span className={`badge ${
                    booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-sage-100 text-sage-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Client Check-In Info */}
            {booking.signedIn && (
              <div className="card p-6">
                <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                  Pre-Session Check-In
                </h3>
                {booking.signInMood && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase text-slate mb-1">
                      Mood Rating
                    </div>
                    <div className="text-2xl font-bold text-charcoal">
                      {booking.signInMood}/10
                    </div>
                  </div>
                )}
                {booking.signInConcerns && (
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate mb-1">
                      Concerns
                    </div>
                    <div className="text-sm text-slate">{booking.signInConcerns}</div>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Notice */}
            <div className="card p-6 bg-terracotta-50 border border-terracotta-100">
              <div className="flex items-start gap-2">
                <div className="text-lg">🔒</div>
                <div>
                  <div className="font-semibold text-charcoal mb-1 text-sm">
                    Private & Secure
                  </div>
                  <p className="text-xs text-slate">
                    These notes are private and can only be viewed by you and authorized administrators. They are stored securely and comply with professional standards.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link 
                  href={`/counsellor/bookings/${booking.id}`}
                  className="btn btn-outline w-full justify-center text-sm"
                >
                  View Booking
                </Link>
                <Link 
                  href={`/counsellor/clients/${booking.client.id}`}
                  className="btn btn-outline w-full justify-center text-sm"
                >
                  View Client Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
