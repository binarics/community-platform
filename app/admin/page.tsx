import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  // Get comprehensive stats
  const stats = {
    totalUsers: await prisma.user.count(),
    totalEvents: await prisma.event.count(),
    totalOrganisations: await prisma.organisation.count(),
    totalBookings: await prisma.booking.count(),
    totalCourses: await prisma.course.count(),
    pendingEvents: await prisma.event.count({ where: { status: 'PENDING' } }),
    
    usersByRole: await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    
    eventsByStatus: await prisma.event.groupBy({
      by: ['status'],
      _count: true,
    }),
  }

  // Recent activity
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const recentEvents = await prisma.event.findMany({
    where: { status: 'PENDING' },
    include: { organisation: true, organiser: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-semibold mb-4">
                <span>👑</span>
                <span>SUPER ADMIN ACCESS</span>
              </div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                System Administration
              </h1>
              <p className="text-xl text-slate">
                Complete control over all platform data and users
              </p>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Users
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats.totalUsers}
            </div>
            <div className="text-sm text-sage-500">
              Registered accounts
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Events
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats.totalEvents}
            </div>
            <div className="text-sm text-amber-600">
              {stats.pendingEvents} pending review
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Organisations
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats.totalOrganisations}
            </div>
            <div className="text-sm text-sage-500">
              Masjids & Centres
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Bookings
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {stats.totalBookings}
            </div>
            <div className="text-sm text-sage-500">
              Counselling sessions
            </div>
          </div>
        </div>

        {/* Admin Control Panels */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/admin/users" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">👥</div>
              <span className="badge bg-red-100 text-red-700">Root</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              User Management
            </h2>
            <p className="text-slate mb-4">
              View all users, change roles, edit profiles, delete accounts
            </p>
            <div className="text-sm text-slate">
              {stats.totalUsers} total users
            </div>
          </Link>

          <Link href="/admin/events" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📅</div>
              <span className="badge bg-amber-100 text-amber-700">{stats.pendingEvents}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Event Moderation
            </h2>
            <p className="text-slate mb-4">
              Approve, reject, edit, or delete any event on the platform
            </p>
            <div className="text-sm text-slate">
              {stats.pendingEvents} pending approval
            </div>
          </Link>

          <Link href="/admin/bookings" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🗓️</div>
              <span className="badge bg-sage-100 text-sage-700">All</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Booking Management
            </h2>
            <p className="text-slate mb-4">
              View all counselling bookings, edit, cancel, or manage payments
            </p>
            <div className="text-sm text-slate">
              {stats.totalBookings} total bookings
            </div>
          </Link>

          <Link href="/admin/organisations" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🏢</div>
              <span className="badge bg-sage-100 text-sage-700">Root</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Organisations
            </h2>
            <p className="text-slate mb-4">
              Manage Masjids, therapy centres, verify organisations
            </p>
            <div className="text-sm text-slate">
              {stats.totalOrganisations} organisations
            </div>
          </Link>

          <Link href="/admin/courses" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📚</div>
              <span className="badge bg-sage-100 text-sage-700">All</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Course Management
            </h2>
            <p className="text-slate mb-4">
              View, edit, approve, or delete therapeutic courses
            </p>
            <div className="text-sm text-slate">
              {stats.totalCourses} courses
            </div>
          </Link>

          <Link href="/admin/database" className="card p-8 hover:-translate-y-1 transition border-2 border-red-200">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">💾</div>
              <span className="badge bg-red-100 text-red-700">Danger</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
              Database Editor
            </h2>
            <p className="text-slate mb-4">
              Direct access to edit Prisma tables and database records
            </p>
            <div className="text-sm text-red-600 font-semibold">
              ⚠️ Advanced users only
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Pending Events */}
          {recentEvents.length > 0 && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-bold text-charcoal">
                  Pending Event Approvals
                </h3>
                <Link href="/admin/events?status=pending" className="text-sage-500 hover:text-sage-600 font-semibold text-sm">
                  View All →
                </Link>
              </div>
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="block p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-charcoal">
                        {event.title}
                      </div>
                      <span className="badge bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    </div>
                    <div className="text-sm text-slate">
                      {event.organisation.name} • {event.organiser.name}
                    </div>
                    <div className="text-xs text-slate mt-1">
                      Created {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Users */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-charcoal">
                Recent Registrations
              </h3>
              <Link href="/admin/users" className="text-sage-500 hover:text-sage-600 font-semibold text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map(user => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="block p-4 bg-sage-50 hover:bg-sage-100 rounded-xl transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-charcoal">
                      {user.name || 'No name'}
                    </div>
                    <span className="badge bg-sage-100 text-sage-700 text-xs">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-sm text-slate">{user.email}</div>
                  <div className="text-xs text-slate mt-1">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* User Distribution */}
        <div className="card p-6 mb-12">
          <h3 className="font-display text-xl font-bold text-charcoal mb-6">
            User Distribution by Role
          </h3>
          <div className="grid md:grid-cols-6 gap-4">
            {stats.usersByRole.map(({ role, _count }) => (
              <div key={role} className="text-center p-4 bg-sage-50 rounded-xl">
                <div className="font-display text-2xl font-bold text-charcoal mb-1">
                  {_count}
                </div>
                <div className="text-xs text-slate uppercase font-semibold">
                  {role.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Access Links */}
        <div className="card p-8 bg-gradient-to-br from-red-50 to-amber-50 border-2 border-red-100">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
            ⚡ Quick Admin Actions
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/counsellor-dashboard" className="btn btn-outline w-full">
              🧠 View Counsellor Dashboard
            </Link>
            <Link href="/dashboard" className="btn btn-outline w-full">
              📊 View Organiser Dashboard
            </Link>
            <button className="btn btn-outline w-full">
              🔧 System Settings
            </button>
          </div>
          <p className="text-sm text-slate mt-4">
            As SUPER_ADMIN, you can access any dashboard and impersonate any user role
          </p>
        </div>
      </div>
    </div>
  )
}
