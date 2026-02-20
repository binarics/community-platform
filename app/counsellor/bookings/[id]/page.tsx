import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get booking with all details
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

  // Calculate duration
  const duration = Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60))
  
  // Check if session is in the past
  const isPast = new Date(booking.startTime) < new Date()
  const isToday = new Date(booking.startTime).toDateString() === new Date().toDateString()
  const isFuture = new Date(booking.startTime) > new Date()

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/counsellor-dashboard" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Session Details
              </h1>
              <p className="text-xl text-slate">
                {new Date(booking.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <span className={`badge text-lg ${
                booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                booking.status === 'NO_SHOW' ? 'bg-amber-100 text-amber-700' :
                'bg-sage-100 text-sage-700'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Information */}
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Session Information
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Date & Time
                  </div>
                  <div className="text-lg font-semibold text-charcoal mb-1">
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
                  <div className="text-sm text-slate">
                    Duration: {duration} minutes
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Session Type
                  </div>
                  <div className="text-lg font-semibold text-charcoal">
                    {booking.sessionType || 'Individual'}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Room
                  </div>
                  <div className="text-lg font-semibold text-charcoal">
                    {booking.room?.name || 'No room assigned'}
                  </div>
                  {booking.room && (
                    <div className="text-sm text-slate">
                      Capacity: {booking.room.capacity}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Payment Status
                  </div>
                  <span className={`badge ${
                    booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                    booking.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-6 p-4 bg-sage-50 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Booking Notes
                  </div>
                  <div className="text-slate">{booking.notes}</div>
                </div>
              )}
            </div>

            {/* Client Sign-In/Out Status */}
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Session Status
              </h2>

              <div className="space-y-4">
                {/* Sign-In Status */}
                <div className="flex items-start gap-4 p-4 bg-sage-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    booking.signedIn ? 'bg-green-500 text-white' : 'bg-sage-200 text-slate'
                  }`}>
                    {booking.signedIn ? '✓' : '○'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-charcoal mb-1">
                      Client Check-In
                    </div>
                    {booking.signedIn ? (
                      <div className="text-sm text-slate">
                        <div>Checked in at {new Date(booking.signInTime!).toLocaleTimeString()}</div>
                        {booking.signInMood && (
                          <div className="mt-2">
                            <span className="font-semibold">Mood:</span> {booking.signInMood}/10
                          </div>
                        )}
                        {booking.signInConcerns && (
                          <div className="mt-1">
                            <span className="font-semibold">Concerns:</span> {booking.signInConcerns}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate">
                        Not checked in yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Notes */}
                <div className="flex items-start gap-4 p-4 bg-sage-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    booking.sessionNotes.length > 0 ? 'bg-green-500 text-white' : 'bg-sage-200 text-slate'
                  }`}>
                    {booking.sessionNotes.length > 0 ? '✓' : '○'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-charcoal mb-1">
                      Session Notes
                    </div>
                    <div className="text-sm text-slate">
                      {booking.sessionNotes.length > 0 ? (
                        <div>
                          {booking.sessionNotes.length} note{booking.sessionNotes.length > 1 ? 's' : ''} added
                        </div>
                      ) : (
                        'No notes yet'
                      )}
                    </div>
                  </div>
                </div>

                {/* Sign-Out Status */}
                <div className="flex items-start gap-4 p-4 bg-sage-50 rounded-xl">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    booking.signedOut ? 'bg-green-500 text-white' : 'bg-sage-200 text-slate'
                  }`}>
                    {booking.signedOut ? '✓' : '○'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-charcoal mb-1">
                      Client Feedback
                    </div>
                    {booking.signedOut ? (
                      <div className="text-sm text-slate">
                        <div>Completed at {new Date(booking.signOutTime!).toLocaleTimeString()}</div>
                        {booking.signOutRating && (
                          <div className="mt-2">
                            <span className="font-semibold">Rating:</span> {'⭐'.repeat(booking.signOutRating)} ({booking.signOutRating}/5)
                          </div>
                        )}
                        {booking.signOutFeedback && (
                          <div className="mt-1">
                            <span className="font-semibold">Feedback:</span> {booking.signOutFeedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate">
                        No feedback yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Actions
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {booking.status === 'SCHEDULED' && (
                  <Link 
                    href={`/counsellor/bookings/${booking.id}/sign-in`}
                    className="btn btn-primary"
                  >
                    ✓ Check In Client
                  </Link>
                )}

                {booking.status === 'SCHEDULED' && (
                  <>
                    <Link 
                      href={`/counsellor/bookings/${booking.id}/notes`}
                      className="btn btn-primary"
                    >
                      📝 Add Session Notes
                    </Link>
                    <Link 
                      href={`/counsellor/bookings/${booking.id}/sign-out`}
                      className="btn btn-primary"
                    >
                      ✓ Complete Session
                    </Link>
                  </>
                )}

                {booking.sessionNotes.length > 0 && (
                  <Link 
                    href={`/counsellor/bookings/${booking.id}/notes`}
                    className="btn btn-outline"
                  >
                    📖 View Session Notes
                  </Link>
                )}

                {booking.status === 'SCHEDULED' && isFuture && (
                  <button className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50">
                    ✕ Cancel Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Client
              </h3>
              <Link 
                href={`/counsellor/clients/${booking.client.id}`}
                className="flex items-center gap-3 p-3 hover:bg-sage-50 rounded-xl transition"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-xl font-bold text-terracotta-600">
                  {booking.client.name?.[0] || 'C'}
                </div>
                <div>
                  <div className="font-semibold text-charcoal">
                    {booking.client.name}
                  </div>
                  <div className="text-sm text-slate">
                    {booking.client.email}
                  </div>
                </div>
              </Link>

              <div className="mt-4">
                <Link 
                  href={`/counsellor/clients/${booking.client.id}`}
                  className="btn btn-outline w-full justify-center text-sm"
                >
                  View Client Profile
                </Link>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Timeline
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sage-500 mt-2"></div>
                  <div>
                    <div className="font-semibold text-charcoal">Booking Created</div>
                    <div className="text-slate">
                      {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                      {new Date(booking.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {booking.reminderSent && booking.reminderSentAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-sage-500 mt-2"></div>
                    <div>
                      <div className="font-semibold text-charcoal">Reminder Sent</div>
                      <div className="text-slate">
                        {new Date(booking.reminderSentAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}

                {booking.signInTime && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <div className="font-semibold text-charcoal">Client Checked In</div>
                      <div className="text-slate">
                        {new Date(booking.signInTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}

                {booking.signOutTime && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                    <div>
                      <div className="font-semibold text-charcoal">Session Completed</div>
                      <div className="text-slate">
                        {new Date(booking.signOutTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
