import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  const profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Get client with full details
  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      clientBookings: {
        where: { counsellorId: profile.id },
        include: {
          room: true,
          sessionNotes: true,
        },
        orderBy: { startTime: 'desc' },
      },
    },
  })

  // In /app/counsellor/clients/[id]/page.tsx
// After: const client = await prisma.user.findUnique(...)

if (!client) {
  redirect('/counsellor/clients')
}

// NEW: Check if this client is assigned to this counsellor
const hasAccess = await prisma.clientCounsellor.findUnique({
  where: {
    clientId_counsellorId: {
      clientId: client.id,
      counsellorId: profile.id,
    },
  },
})

if (!hasAccess) {
  redirect('/counsellor/clients') // Can't view clients not assigned to you
}

// Rest of your existing code...

  if (!client) {
    redirect('/counsellor/clients')
  }

  // Calculate stats
  const totalSessions = client.clientBookings.length
  const completedSessions = client.clientBookings.filter(b => b.status === 'COMPLETED').length
  const upcomingSessions = client.clientBookings.filter(
    b => b.status === 'SCHEDULED' && new Date(b.startTime) > new Date()
  ).length
  
  const lastSession = client.clientBookings.find(b => b.status === 'COMPLETED')
  const nextSession = client.clientBookings.find(
    b => b.status === 'SCHEDULED' && new Date(b.startTime) > new Date()
  )

  // Separate past and upcoming bookings
  const now = new Date()
  const upcomingBookings = client.clientBookings.filter(b => new Date(b.startTime) > now)
  const pastBookings = client.clientBookings.filter(b => new Date(b.startTime) <= now)

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
            ← Back to All Clients
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-3xl font-bold text-terracotta-600">
                {client.name?.[0] || 'C'}
              </div>
              <div>
                <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                  {client.name || 'Unnamed Client'}
                </h1>
                <div className="flex items-center gap-3 text-slate">
                  <span>{client.email}</span>
                  <span className="badge bg-sage-100 text-sage-700">
                    {client.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href={`/counsellor/bookings/new?clientId=${client.id}`} className="btn btn-primary">
                📅 Book Session
              </Link>
              <button className="btn btn-outline">
                ✉️ Send Email
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Sessions
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {totalSessions}
            </div>
            <div className="text-sm text-slate">
              {completedSessions} completed
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Upcoming
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {upcomingSessions}
            </div>
            <div className="text-sm text-sage-500">
              Sessions scheduled
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Last Session
            </div>
            <div className="font-display text-2xl font-bold text-charcoal mb-1">
              {lastSession ? new Date(lastSession.startTime).toLocaleDateString() : 'None'}
            </div>
            <div className="text-sm text-slate">
              {lastSession ? lastSession.sessionType : 'No sessions yet'}
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Next Session
            </div>
            <div className="font-display text-2xl font-bold text-charcoal mb-1">
              {nextSession ? new Date(nextSession.startTime).toLocaleDateString() : 'None'}
            </div>
            <div className="text-sm text-slate">
              {nextSession ? new Date(nextSession.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Not scheduled'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Session History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Sessions */}
            {upcomingBookings.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                  Upcoming Sessions
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/counsellor/bookings/${booking.id}`}
                      className="block p-4 bg-sage-50 hover:bg-sage-100 rounded-xl transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-charcoal mb-1">
                            {new Date(booking.startTime).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-slate">
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
                        <div className="text-right">
                          <span className="badge bg-sage-500 text-white mb-2">
                            {booking.status}
                          </span>
                          <div className="text-sm text-slate">
                            {booking.room?.name || 'No room'}
                          </div>
                        </div>
                      </div>
                      {booking.notes && (
                        <div className="text-sm text-slate mt-2">
                          {booking.notes}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Session History
              </h2>
              {pastBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    No sessions yet
                  </h3>
                  <p className="text-slate mb-6">
                    Book the first session with this client
                  </p>
                  <Link href={`/counsellor/bookings/new?clientId=${client.id}`} className="btn btn-primary">
                    Book First Session
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/counsellor/bookings/${booking.id}`}
                      className="block p-4 border-2 border-sage-100 hover:border-sage-300 rounded-xl transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-charcoal mb-1">
                            {new Date(booking.startTime).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-slate">
                            {booking.sessionType} • {booking.room?.name || 'No room'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${
                            booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.sessionNotes.length > 0 && (
                            <div className="text-xs text-sage-600 mt-1">
                              📝 {booking.sessionNotes.length} note{booking.sessionNotes.length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      {booking.signedIn && (
                        <div className="flex items-center gap-2 text-xs text-slate mt-2">
                          <span>✓ Signed in</span>
                          {booking.signedOut && <span>✓ Signed out</span>}
                          {booking.signOutRating && (
                            <span>⭐ {booking.signOutRating}/5</span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Client Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Email
                  </div>
                  <div className="text-charcoal">{client.email}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Member Since
                  </div>
                  <div className="text-charcoal">
                    {new Date(client.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
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
                  href={`/counsellor/bookings/new?clientId=${client.id}`}
                  className="btn btn-primary w-full justify-center"
                >
                  📅 Book Session
                </Link>
                <button className="btn btn-outline w-full justify-center">
                  ✉️ Send Email
                </button>
                <button className="btn btn-outline w-full justify-center">
                  ✏️ Edit Profile
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate">Attendance Rate</span>
                  <span className="font-semibold text-charcoal">
                    {totalSessions > 0
                      ? Math.round((completedSessions / totalSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate">Total Hours</span>
                  <span className="font-semibold text-charcoal">
                    {completedSessions} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate">With Notes</span>
                  <span className="font-semibold text-charcoal">
                    {client.clientBookings.filter(b => b.sessionNotes.length > 0).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
