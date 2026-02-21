import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // If SUPER_ADMIN and no own profile, use first available counsellor profile
  if (!profile && session.user.role === 'SUPER_ADMIN') {
    profile = await prisma.counsellorProfile.findFirst()
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Get client with all related data
  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      clientBookings: {
        where: {
          counsellorId: profile?.id,
        },
        include: {
          room: true,
          sessionNotes: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
      },
    },
  })

  if (!client) {
    notFound()
  }

  // Calculate statistics
  const totalSessions = client.clientBookings.length
  const completedSessions = client.clientBookings.filter((b) => b.status === 'COMPLETED').length
  const upcomingSessions = client.clientBookings.filter(
    (b) => b.status === 'SCHEDULED' && new Date(b.startTime) > new Date()
  ).length
  const totalNotes = client.clientBookings.reduce((sum, b) => sum + b.sessionNotes.length, 0)

  // Average session feedback
  const sessionsWithFeedback = client.clientBookings.filter((b) => b.signOutRating !== null)
  const avgRating =
    sessionsWithFeedback.length > 0
      ? (
          sessionsWithFeedback.reduce((sum, b) => sum + (b.signOutRating || 0), 0) /
          sessionsWithFeedback.length
        ).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/counsellor/clients"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Clients
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                {client.name}
              </h1>
              <p className="text-xl text-slate">{client.email}</p>
            </div>
            <div className="flex gap-3">
              <Link href={`/counsellor/clients/${client.id}/notes`} className="btn btn-outline">
                📝 View All Notes
              </Link>
              <Link href={`/counsellor/bookings/new?clientId=${client.id}`} className="btn btn-primary">
                + New Session
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Sessions</div>
            <div className="font-display text-4xl font-bold text-charcoal">{totalSessions}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Completed</div>
            <div className="font-display text-4xl font-bold text-green-600">{completedSessions}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Upcoming</div>
            <div className="font-display text-4xl font-bold text-sage-600">{upcomingSessions}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Avg Rating</div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {avgRating ? `${avgRating}/5` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Sessions Timeline */}
        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-charcoal">Session History</h2>
            <div className="text-sm text-slate">{totalSessions} total sessions</div>
          </div>

          {client.clientBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-slate mb-4">No sessions yet</p>
              <Link href={`/counsellor/bookings/new?clientId=${client.id}`} className="btn btn-primary">
                Schedule First Session
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {client.clientBookings.map((booking) => {
                const startDate = new Date(booking.startTime)
                const isPast = startDate < new Date()
                const isFuture = !isPast

                return (
                  <div
                    key={booking.id}
                    className="border-l-4 border-sage-200 pl-6 pb-6 last:pb-0 relative"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-sage-500 border-4 border-cream" />

                    <div className="card p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="font-display text-xl font-bold text-charcoal mb-1">
                            {startDate.toLocaleDateString('en-GB', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-sage-600 font-semibold">
                            {startDate.toLocaleTimeString('en-GB', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {new Date(booking.endTime).toLocaleTimeString('en-GB', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`badge ${
                              booking.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : booking.status === 'SCHEDULED'
                                ? 'bg-sage-100 text-sage-700'
                                : booking.status === 'IN_PROGRESS'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {booking.status}
                          </span>
                          {isFuture && (
                            <Link
                              href={`/counsellor/bookings/${booking.id}`}
                              className="text-sage-500 hover:text-sage-600 font-semibold text-sm"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid md:grid-cols-3 gap-6 mb-4 text-sm">
                        <div>
                          <div className="text-xs font-semibold uppercase text-slate mb-1">
                            Session Type
                          </div>
                          <div className="text-charcoal">{booking.sessionType}</div>
                        </div>
                        {booking.room && (
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate mb-1">Room</div>
                            <div className="text-charcoal">{booking.room.name}</div>
                          </div>
                        )}
                        {booking.paymentStatus && (
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate mb-1">
                              Payment
                            </div>
                            <div className="text-charcoal">{booking.paymentStatus}</div>
                          </div>
                        )}
                      </div>

                      {/* Sign In/Out Data */}
                      {(booking.signInMood || booking.signOutRating) && (
                        <div className="grid md:grid-cols-2 gap-6 p-4 bg-sage-50 rounded-xl mb-4">
                          {booking.signInMood && (
                            <div>
                              <div className="text-xs font-semibold uppercase text-slate mb-1">
                                Mood at Check-In
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-display text-2xl font-bold text-sage-600">
                                  {booking.signInMood}/10
                                </div>
                                {booking.signInConcerns && (
                                  <div className="text-xs text-slate">
                                    {booking.signInConcerns}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {booking.signOutRating && (
                            <div>
                              <div className="text-xs font-semibold uppercase text-slate mb-1">
                                Session Rating
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="font-display text-2xl font-bold text-green-600">
                                  {booking.signOutRating}/5
                                </div>
                                <div className="text-amber-500">
                                  {'⭐'.repeat(booking.signOutRating)}
                                </div>
                              </div>
                              {booking.signOutMostHelpful && (
                                <div className="text-xs text-slate mt-1">
                                  Most helpful: {booking.signOutMostHelpful}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Session Notes */}
                      {booking.sessionNotes.length > 0 && (
                        <div className="border-t border-sage-100 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-sm font-semibold text-charcoal">
                              📝 Session Notes ({booking.sessionNotes.length})
                            </div>
                            <Link
                              href={`/counsellor/bookings/${booking.id}/notes`}
                              className="text-xs text-sage-500 hover:text-sage-600 font-semibold"
                            >
                              View All →
                            </Link>
                          </div>
                          <div className="space-y-3">
                            {booking.sessionNotes.slice(0, 1).map((note) => (
                              <div
                                key={note.id}
                                className="p-3 bg-terracotta-50 rounded-lg border border-terracotta-100"
                              >
                                <div className="text-xs text-slate mb-1">
                                  {new Date(note.createdAt).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="text-sm text-charcoal line-clamp-3">
                                  {note.content}
                                </div>
                              </div>
                            ))}
                            {booking.sessionNotes.length > 1 && (
                              <div className="text-xs text-slate">
                                +{booking.sessionNotes.length - 1} more note
                                {booking.sessionNotes.length > 2 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      {isPast && booking.status === 'COMPLETED' && (
                        <div className="mt-4 pt-4 border-t border-sage-100">
                          <Link
                            href={`/counsellor/bookings/${booking.id}/notes`}
                            className="btn btn-outline text-sm"
                          >
                            View Full Session Details
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary Section */}
        {totalNotes > 0 && (
          <div className="card p-6 mt-8">
            <h3 className="font-display text-xl font-bold text-charcoal mb-4">Clinical Summary</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">
                  Total Clinical Notes
                </div>
                <div className="font-display text-2xl font-bold text-charcoal">{totalNotes}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">
                  Sessions with Feedback
                </div>
                <div className="font-display text-2xl font-bold text-charcoal">
                  {sessionsWithFeedback.length}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">Last Session</div>
                <div className="text-charcoal">
                  {client.clientBookings[0] &&
                    new Date(client.clientBookings[0].startTime).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
