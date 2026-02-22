import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  // Get comprehensive stats
  const [
    totalUsers,
    totalEvents,
    totalMasjids,
    totalBookings,
    totalCourses,
    pendingEvents,
    pendingRoleRequests,
    usersByRole,
    eventsByStatus,
    recentUsers,
    recentEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.masjid.count(),
    prisma.booking.count(),
    prisma.course.count(),
    prisma.event.count({ where: { status: 'PENDING' } }),
    prisma.roleRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.event.groupBy({ by: ['status'], _count: true }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.event.findMany({
      where: { status: 'PENDING' },
      include: { masjid: true, organiser: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
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

        {/* System Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Users</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">{totalUsers}</div>
            <div className="text-sm text-sage-500">Registered accounts</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Events</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">{totalEvents}</div>
            <div className="text-sm text-amber-600">{pendingEvents} pending review</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Masjids</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">{totalMasjids}</div>
            <div className="text-sm text-sage-500">Registered masjids</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Bookings</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">{totalBookings}</div>
            <div className="text-sm text-sage-500">Counselling sessions</div>
          </div>
        </div>

        {/* Admin Control Panels */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Link href="/admin/users" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">👥</div>
              <span className="badge bg-red-100 text-red-700">Root</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">User Management</h2>
            <p className="text-slate mb-4">
              View all users, change roles, edit profiles, delete accounts
            </p>
            <div className="text-sm text-slate">{totalUsers} total users</div>
          </Link>

          <Link href="/admin/events" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">📅</div>
              {pendingEvents > 0 && (
                <span className="badge bg-amber-100 text-amber-700">{pendingEvents} pending</span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Event Moderation</h2>
            <p className="text-slate mb-4">
              Approve, reject, edit, or delete any event on the platform
            </p>
            <div className="text-sm text-slate">{pendingEvents} pending approval</div>
          </Link>

          <Link href="/admin/bookings" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🗓️</div>
              <span className="badge bg-sage-100 text-sage-700">All</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Booking Management</h2>
            <p className="text-slate mb-4">
              View all counselling bookings, cancel, or manage payments
            </p>
            <div className="text-sm text-slate">{totalBookings} total bookings</div>
          </Link>

          <Link href="/admin/masjid" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🕌</div>
              <span className="badge bg-sage-100 text-sage-700">Root</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Masjids</h2>
            <p className="text-slate mb-4">
              Manage masjids, verify organisations, assign admins and events
            </p>
            <div className="text-sm text-slate">{totalMasjids} masjids</div>
          </Link>

          <Link href="/admin/role-requests" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">⬆️</div>
              {pendingRoleRequests > 0 && (
                <span className="badge bg-amber-100 text-amber-700">{pendingRoleRequests} pending</span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Role Requests</h2>
            <p className="text-slate mb-4">
              Review and approve requests for role upgrades from community members
            </p>
            <div className="text-sm text-slate">{pendingRoleRequests} awaiting review</div>
          </Link>

          <Link href="/counsellor/dashboard" className="card p-8 hover:-translate-y-1 transition">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">🧠</div>
              <span className="badge bg-sage-100 text-sage-700">View</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-charcoal mb-2">Counsellor View</h2>
            <p className="text-slate mb-4">
              Access the counsellor dashboard to view bookings, clients, and sessions
            </p>
            <div className="text-sm text-slate">{totalCourses} courses published</div>
          </Link>
        </div>

        {/* Activity Feed */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Pending Events */}
          {recentEvents.length > 0 && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-bold text-charcoal">
                  Pending Event Approvals
                </h3>
                <Link href="/admin/events" className="text-sage-500 hover:text-sage-600 font-semibold text-sm">
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
                      <div className="font-semibold text-charcoal">{event.title}</div>
                      <span className="badge bg-amber-100 text-amber-700">Pending</span>
                    </div>
                    <div className="text-sm text-slate">
                      {event.masjid?.name || 'No masjid'} • {event.organiser?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate mt-1">
                      Created {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Recent Users */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-bold text-charcoal">Recent Registrations</h3>
              <Link href="/admin/users" className="text-sage-500 hover:text-sage-600 font-semibold text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map(user => (
                <div
                  key={user.id}
                  className="p-4 bg-sage-50 rounded-xl"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-charcoal">{user.name || 'No name'}</div>
                    <span className="badge bg-sage-100 text-sage-700 text-xs">
                      {user.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-slate">{user.email}</div>
                  <div className="text-xs text-slate mt-1">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
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
            {usersByRole.map(({ role, _count }) => (
              <Link
                key={role}
                href={`/admin/users?role=${role}`}
                className="text-center p-4 bg-sage-50 hover:bg-sage-100 rounded-xl transition"
              >
                <div className="font-display text-2xl font-bold text-charcoal mb-1">{_count}</div>
                <div className="text-xs text-slate uppercase font-semibold">
                  {role.replace(/_/g, ' ')}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-8 bg-gradient-to-br from-red-50 to-amber-50 border-2 border-red-100">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-4">⚡ Quick Actions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/admin/masjid/new" className="btn btn-outline w-full">
              🕌 Create New Masjid
            </Link>
            <Link href="/counsellor/dashboard" className="btn btn-outline w-full">
              🧠 View Counsellor Dashboard
            </Link>
            <Link href="/settings" className="btn btn-outline w-full">
              ⚙️ Account Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
