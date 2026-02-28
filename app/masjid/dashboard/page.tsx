import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'
import Link from 'next/link'

async function getActiveMasjid(userId: string, role: string) {
  const selectedId = await getSelectedMasjidId()

  if (role === 'SUPER_ADMIN') {
    if (selectedId) {
      const m = await prisma.masjid.findUnique({ where: { id: selectedId } })
      if (m) return m
    }
    return prisma.masjid.findFirst({ orderBy: { name: 'asc' } })
  }

  // For regular admin/moderator, validate they have access to the selected masjid
  if (selectedId) {
    const adminRecord = await prisma.masjidAdmin.findFirst({
      where: { masjidId: selectedId, userId },
    }) ?? await prisma.masjidModerator.findFirst({
      where: { masjidId: selectedId, userId },
    })
    if (adminRecord) {
      return prisma.masjid.findUnique({ where: { id: selectedId } })
    }
  }

  // Fall back to first accessible masjid
  const adminRecord = await prisma.masjidAdmin.findFirst({ where: { userId } })
  if (adminRecord) return prisma.masjid.findUnique({ where: { id: adminRecord.masjidId } })
  const modRecord = await prisma.masjidModerator.findFirst({ where: { userId } })
  if (modRecord) return prisma.masjid.findUnique({ where: { id: modRecord.masjidId } })
  return null
}

export default async function MasjidDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const isMasjidAdmin = session.user.role === 'MASJID_ADMIN'

  if (!isSuperAdmin && !isMasjidAdmin) {
    // Allow moderators too — check directly
    const modRecord = await prisma.masjidModerator.findFirst({
      where: { userId: session.user.id },
    })
    if (!modRecord) redirect('/')
  }

  const masjid = await getActiveMasjid(session.user.id, session.user.role)

  if (!masjid) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🕌</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">No Masjids Found</h1>
          <p className="text-slate mb-6">
            {isSuperAdmin
              ? 'No masjids have been created yet.'
              : 'You are not assigned to any masjid.'}
          </p>
          {isSuperAdmin && (
            <Link href="/admin/masjid/new" className="btn btn-primary">
              Create First Masjid
            </Link>
          )}
        </div>
      </div>
    )
  }

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Parallel stats fetch
  const [
    totalMembers,
    totalEvents,
    upcomingEvents,
    pendingEvents,
    recentMembers,
    adminRecord,
    modRecord,
  ] = await Promise.all([
    prisma.masjidMember.count({ where: { masjidId: masjid.id } }),
    prisma.event.count({ where: { masjidId: masjid.id } }),
    prisma.event.findMany({
      where: {
        masjidId: masjid.id,
        startDate: { gte: today },
        status: { in: ['APPROVED', 'PUBLISHED', 'DRAFT'] },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      include: { _count: { select: { rsvps: true } } },
    }),
    prisma.event.count({ where: { masjidId: masjid.id, status: 'PENDING' } }),
    prisma.masjidMember.findMany({
      where: { masjidId: masjid.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'desc' },
      take: 5,
    }),
    prisma.masjidAdmin.findFirst({ where: { masjidId: masjid.id, userId: session.user.id } }),
    prisma.masjidModerator.findFirst({ where: { masjidId: masjid.id, userId: session.user.id } }),
  ])

  const userRole = isSuperAdmin ? 'Super Admin' : adminRecord ? 'Masjid Admin' : modRecord ? 'Moderator' : 'Staff'

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
              {masjid.name}
            </h1>
            <p className="text-xl text-slate">
              {masjid.city}, {masjid.country}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-50 rounded-full text-terracotta-600 font-semibold text-sm">
              <span>🕌</span>
              <span>{userRole}</span>
            </span>
            {masjid.isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full text-green-600 text-sm font-semibold">
                ● Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full text-red-600 text-sm font-semibold">
                ● Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-charcoal">{totalMembers}</div>
          <div className="text-slate text-sm mt-1">Total Members</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-charcoal">{totalEvents}</div>
          <div className="text-slate text-sm mt-1">Total Events</div>
        </div>
        <div className="card p-6">
          <div className="text-3xl font-display font-bold text-charcoal">{upcomingEvents.length}</div>
          <div className="text-slate text-sm mt-1">Upcoming Events</div>
        </div>
        <div className="card p-6">
          <div className={`text-3xl font-display font-bold ${pendingEvents > 0 ? 'text-amber-600' : 'text-charcoal'}`}>
            {pendingEvents}
          </div>
          <div className="text-slate text-sm mt-1">Pending Events</div>
        </div>
      </div>

      {/* Upcoming events */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-3xl font-bold text-charcoal">Upcoming Events</h2>
          <Link href="/masjid/events/new" className="btn btn-primary btn-sm">
            + New Event
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">No Upcoming Events</h3>
            <p className="text-slate mb-6">Schedule an event to engage your community.</p>
            <Link href="/masjid/events/new" className="btn btn-primary">
              Create Event
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcomingEvents.map((event) => {
              const start = new Date(event.startDate)
              return (
                <Link
                  key={event.id}
                  href={`/masjid/events/${event.id}`}
                  className="card p-6 hover:-translate-y-1 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-display text-xl font-bold text-charcoal">
                          {event.title}
                        </div>
                        {event.category && (
                          <span className="badge text-xs bg-sage-100 text-sage-700">
                            {event.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate">
                        <span>
                          📅{' '}
                          {start.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          {event.startTime && ` at ${event.startTime}`}
                        </span>
                        {event.location && <span>📍 {event.location}</span>}
                        <span>👥 {event._count.rsvps} RSVPs</span>
                      </div>
                    </div>
                    <span
                      className={`badge text-xs ${
                        event.status === 'APPROVED' || event.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-700'
                          : event.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Members */}
      {recentMembers.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">Recent Members</h2>
            <Link href="/masjid/members" className="text-sage-500 hover:text-sage-600 font-semibold text-sm">
              View All Members →
            </Link>
          </div>
          <div className="card overflow-hidden">
            <div className="divide-y divide-sage-100">
              {recentMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {m.user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-charcoal text-sm">{m.user.name}</div>
                    <div className="text-xs text-slate">{m.user.email}</div>
                  </div>
                  <div className="text-xs text-slate shrink-0">
                    Joined {new Date(m.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/masjid/members" className="card p-8 text-center hover:-translate-y-1 transition group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition">👥</div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-2">Members</h3>
          <p className="text-slate">View and manage your congregation</p>
        </Link>

        <Link href="/masjid/events" className="card p-8 text-center hover:-translate-y-1 transition group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition">📅</div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-2">Events</h3>
          <p className="text-slate">Manage events and RSVPs</p>
        </Link>

        <Link href="/masjid/team" className="card p-8 text-center hover:-translate-y-1 transition group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition">🤝</div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-2">Team</h3>
          <p className="text-slate">Manage admins and moderators</p>
        </Link>

        <Link href="/masjid/settings" className="card p-8 text-center hover:-translate-y-1 transition group">
          <div className="text-5xl mb-4 group-hover:scale-110 transition">⚙️</div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-2">Settings</h3>
          <p className="text-slate">Update masjid info and preferences</p>
        </Link>
      </div>
    </div>
  )
}
