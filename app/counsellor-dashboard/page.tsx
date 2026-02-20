import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { CalendarView } from '@/components/counsellor/CalendarView'
import { UpcomingBookings } from '@/components/counsellor/UpcomingBookings'
import { QuickActions } from '@/components/counsellor/QuickActions'

export default async function CounsellorDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // ✅ FIXED: Allow SUPER_ADMIN access
  if (!['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile (or create one for SUPER_ADMIN if viewing)
  let counsellorProfile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
    include: {
      user: true,
      bookings: {
        where: {
          startTime: { gte: new Date() },
        },
        include: {
          client: true,
          room: true,
        },
        orderBy: { startTime: 'asc' },
        take: 10,
      },
    },
  })

  // If SUPER_ADMIN and no profile, get first counsellor profile or show all
  if (!counsellorProfile && session.user.role === 'SUPER_ADMIN') {
    counsellorProfile = await prisma.counsellorProfile.findFirst({
      include: {
        user: true,
        bookings: {
          where: {
            startTime: { gte: new Date() },
          },
          include: {
            client: true,
            room: true,
          },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
      },
    })
  }

  if (!counsellorProfile) {
    // Show empty state for SUPER_ADMIN
    if (session.user.role === 'SUPER_ADMIN') {
      return (
        <div className="min-h-screen bg-cream">
          <Navigation />
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
                No Counsellors Yet
              </h1>
              <p className="text-slate mb-6">
                There are no counsellor profiles in the system yet.
              </p>
              <Link href="/admin/users" className="btn btn-primary">
                Go to User Management
              </Link>
            </div>
          </div>
        </div>
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
    },
    include: {
      client: true,
      room: true,
    },
    orderBy: { startTime: 'asc' },
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

  const upcomingSessions = await prisma.booking.count({
    where: {
      counsellorId: counsellorProfile.id,
      status: 'SCHEDULED',
      startTime: { gte: new Date() },
    },
  })

  const unpaidBookings = await prisma.booking.count({
    where: {
      counsellorId: counsellorProfile.id,
      paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between">
            <div>
              {session.user.role === 'SUPER_ADMIN' && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-semibold mb-4">
                  <span>👑</span>
                  <span>SUPER ADMIN VIEW - Viewing {counsellorProfile.user.name}&apos;s Dashboard</span>
                </div>
              )}
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Counsellor Dashboard
              </h1>
              <p className="text-xl text-slate">
                Manage your bookings, clients, and calendar
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-semibold text-charcoal">{counsellorProfile.user.name}</div>
                <div className="text-sm text-slate">
                  {counsellorProfile.verified ? (
                    <span className="text-sage-600">✓ Verified Counsellor</span>
                  ) : (
                    <span className="text-amber-600">⚠ Pending Verification</span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-xl font-bold text-terracotta-600">
                {counsellorProfile.user.name?.[0] || 'C'}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Today&apos;s Sessions
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {todayBookings.length}
            </div>
            <div className="text-sm text-sage-500">
              {todayBookings.filter(b => b.status === 'COMPLETED').length} completed
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
              Total Sessions
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats._count}
            </div>
            <div className="text-sm text-sage-500">
              {completedSessions} completed
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Pending Payment
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {unpaidBookings}
            </div>
            <div className="text-sm text-amber-600">
              Awaiting payment
            </div>
          </div>
        </div>

        {/* SUPER_ADMIN Controls */}
        {session.user.role === 'SUPER_ADMIN' && (
          <div className="card p-6 mb-8 bg-red-50 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                  👑 Super Admin Controls
                </h3>
                <p className="text-sm text-slate">
                  You have full access to view and manage all counsellor data
                </p>
              </div>
              <Link href="/admin" className="btn btn-primary">
                Back to Admin Panel
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions counsellorId={counsellorProfile.id} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 mb-12">
          {/* Calendar */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl font-bold text-charcoal">
                My Calendar
              </h2>
              <div className="flex gap-2">
                <Link href="/counsellor/calendar" className="btn btn-outline btn-sm">
                  Full Calendar
                </Link>
                <Link href="/counsellor/availability" className="btn btn-outline btn-sm">
                  Set Availability
                </Link>
              </div>
            </div>
            <CalendarView 
              bookings={counsellorProfile.bookings}
              counsellorId={counsellorProfile.id}
            />
          </div>

          {/* Upcoming Bookings Sidebar */}
          <div className="space-y-6">
            <UpcomingBookings bookings={counsellorProfile.bookings} />
            
            {/* Today's Schedule */}
            {todayBookings.length > 0 && (
              <div className="card p-6">
                <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                  Today&apos;s Schedule
                </h3>
                <div className="space-y-3">
                  {todayBookings.map((booking) => {
                    const startTime = new Date(booking.startTime).toLocaleTimeString('en-GB', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    
                    return (
                      <Link
                        key={booking.id}
                        href={`/counsellor/bookings/${booking.id}`}
                        className="block p-4 bg-sage-50 rounded-xl hover:bg-sage-100 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-charcoal mb-1">
                              {booking.client.name}
                            </div>
                            <div className="text-sm text-slate">
                              {startTime} • {booking.room?.name || 'No room'}
                            </div>
                          </div>
                          <span className={`badge ${
                            booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            booking.status === 'SCHEDULED' ? 'bg-sage-100 text-sage-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/counsellor/clients" className="card p-8 text-center hover:-translate-y-1 transition">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Client Management
            </h3>
            <p className="text-slate">
              Manage clients, track progress, and view history
            </p>
          </Link>

          <Link href="/counsellor/rooms" className="card p-8 text-center hover:-translate-y-1 transition">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Room Bookings
            </h3>
            <p className="text-slate">
              Check availability and book rooms for sessions
            </p>
          </Link>

          <Link href="/counsellor/settings" className="card p-8 text-center hover:-translate-y-1 transition">
            <div className="text-5xl mb-4">⚙️</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Settings
            </h3>
            <p className="text-slate">
              Configure notifications, availability, and profile
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
