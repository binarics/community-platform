import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CounsellorDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (!['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  let counsellorProfile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
    include: {
      user: true,
    },
  })

  // If SUPER_ADMIN and no profile, get first counsellor profile for demo
  if (!counsellorProfile && session.user.role === 'SUPER_ADMIN') {
    counsellorProfile = await prisma.counsellorProfile.findFirst({
      include: {
        user: true,
      },
    })
  }

  if (!counsellorProfile) {
    // Redirect to setup if no profile exists
    if (session.user.role === 'SUPER_ADMIN') {
      return (
        <>
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
                No Counsellors Yet
              </h1>
              <p className="text-slate mb-6">
                There are no counsellor profiles in the system yet.
              </p>
              <Link href="/" className="btn btn-primary">
                Return Home
              </Link>
            </div>
          </div>
        </>
      )
    }
    redirect('/counsellor/setup')
  }

  // Get today's bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayBookings = await prisma.booking.findMany({
    where: {
      counsellorId: counsellorProfile.id,
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  })

  // Get upcoming sessions (next 7 days, excluding today)
  const nextWeek = new Date(tomorrow)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      counsellorId: counsellorProfile.id,
      startTime: {
        gte: tomorrow,
        lt: nextWeek,
      },
      status: { not: 'CANCELLED' },
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 5,
  })

  // Get stats
  const stats = await prisma.booking.aggregate({
    where: {
      counsellorId: counsellorProfile.id,
    },
    _count: true,
  })

  const completedSessions = await prisma.booking.count({
    where: {
      counsellorId: counsellorProfile.id,
      status: 'COMPLETED',
    },
  })

  const unpaidBookings = await prisma.booking.count({
    where: {
      counsellorId: counsellorProfile.id,
      paymentStatus: 'UNPAID',
      status: 'COMPLETED',
    },
  })

  // Get total active clients
  const activeClients = await prisma.clientCounsellor.count({
    where: {
      counsellorId: counsellorProfile.id,
      isActive: true,
    },
  })

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Counsellor Dashboard
              </h1>
              <p className="text-xl text-slate">
                Welcome back, {counsellorProfile.user.name}
              </p>
            </div>
            <div className="text-right">
              {counsellorProfile.verified ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-sage-50 rounded-full text-sage-600 font-semibold">
                  <span>✓</span>
                  <span>Verified Counsellor</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full text-amber-600 font-semibold">
                  <span>⚠</span>
                  <span>Pending Verification</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate mb-2">
              Today&apos;s Sessions
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {todayBookings.length}
            </div>
            <div className="text-sm text-sage-500">
              {todayBookings.filter((b) => b.status === 'COMPLETED').length} completed
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate mb-2">
              Active Clients
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {activeClients}
            </div>
            <div className="text-sm text-sage-500">
              <Link href="/counsellor/clients" className="hover:text-sage-600 hover:underline">
                View all clients →
              </Link>
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate mb-2">
              Total Sessions
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats._count}
            </div>
            <div className="text-sm text-sage-500">{completedSessions} completed</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate mb-2">
              Pending Payment
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {unpaidBookings}
            </div>
            <div className="text-sm text-terracotta-500">
              {unpaidBookings > 0 ? 'Requires attention' : 'All settled'}
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">
              Today&apos;s Schedule
            </h2>
            <Link
              href="/counsellor/calendar"
              className="text-sage-500 hover:text-sage-600 font-semibold text-sm"
            >
              View Full Calendar →
            </Link>
          </div>

          {todayBookings.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                No Sessions Today
              </h3>
              <p className="text-slate mb-6">You have a clear schedule today.</p>
              <Link href="/counsellor/bookings/new" className="btn btn-primary">
                Schedule a Session
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {todayBookings.map((booking) => {
                const startTime = new Date(booking.startTime)
                const endTime = new Date(booking.endTime)
                const isNow =
                  new Date() >= startTime && new Date() <= endTime
                const isPast = new Date() > endTime

                return (
                  <Link
                    key={booking.id}
                    href={`/counsellor/bookings/${booking.id}`}
                    className="card p-6 hover:-translate-y-1 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-display text-xl font-bold text-charcoal">
                            {booking.client.name}
                          </div>
                          {isNow && (
                            <span className="px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-full animate-pulse">
                              NOW
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate">
                          <span>
                            🕐{' '}
                            {startTime.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {endTime.toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {booking.room && <span>🏠 {booking.room.name}</span>}
                          <span>
                            {booking.sessionType === 'INDIVIDUAL'
                              ? '👤 Individual'
                              : booking.sessionType === 'COUPLES'
                              ? '👥 Couples'
                              : '👨‍👩‍👧‍👦 Group'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'SCHEDULED'
                              ? 'bg-sage-100 text-sage-700'
                              : booking.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Upcoming Sessions Preview */}
        {upcomingBookings.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-3xl font-bold text-charcoal">
                Upcoming This Week
              </h2>
              <Link
                href="/counsellor/bookings"
                className="text-sage-500 hover:text-sage-600 font-semibold text-sm"
              >
                View All Bookings →
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking) => {
                const startTime = new Date(booking.startTime)
                return (
                  <Link
                    key={booking.id}
                    href={`/counsellor/bookings/${booking.id}`}
                    className="card p-4 hover:-translate-y-1 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-charcoal mb-1">
                          {booking.client.name}
                        </div>
                        <div className="text-sm text-slate">
                          {startTime.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {startTime.toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {booking.room && (
                        <div className="text-sm text-slate">
                          🏠 {booking.room.name}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Link
            href="/counsellor/clients"
            className="card p-8 text-center hover:-translate-y-1 transition group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              👥
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Client Management
            </h3>
            <p className="text-slate">Manage clients and view history</p>
          </Link>

          <Link
            href="/counsellor/bookings/new"
            className="card p-8 text-center hover:-translate-y-1 transition group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              📅
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              New Booking
            </h3>
            <p className="text-slate">Schedule a counselling session</p>
          </Link>

          <Link
            href="/counsellor/calendar"
            className="card p-8 text-center hover:-translate-y-1 transition group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              📆
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Calendar
            </h3>
            <p className="text-slate">View your schedule and availability</p>
          </Link>

          <Link
            href="/counsellor/settings"
            className="card p-8 text-center hover:-translate-y-1 transition group"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              ⚙️
            </div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Settings
            </h3>
            <p className="text-slate">Configure your profile and availability</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
