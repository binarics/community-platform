import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Redirect if not logged in
  if (!session) {
    redirect('/login')
  }

  // Check if user has organiser/admin role
  const allowedRoles = ['SUPER_ADMIN', 'MASJID_ADMIN', 'ORGANISER']
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/')
  }

  // Fetch user's organization(s)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organisedEvents: {
        include: {
          organisation: true,
          _count: { select: { rsvps: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  const events = user?.organisedEvents || []
  const totalRSVPs = events.reduce((sum, e) => sum + e._count.rsvps, 0)
  const approvedEvents = events.filter(e => e.status === 'APPROVED')
  const pendingEvents = events.filter(e => e.status === 'PENDING')

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Welcome back, {session.user.name}
          </h1>
          <p className="text-xl text-slate">
            Manage your events and see how your community is engaging
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sage-50 rounded-full text-sm">
            <span className="font-semibold text-sage-700">Role:</span>
            <span className="text-slate capitalize">{session.user.role.replace('_', ' ').toLowerCase()}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Active Events</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {approvedEvents.length}
            </div>
            <div className="text-sm text-sage-500">
              {events.length} total events
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total RSVPs</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {totalRSVPs}
            </div>
            <div className="text-sm text-sage-500">Across all events</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Pending Review</div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {pendingEvents.length}
            </div>
            <div className="text-sm text-slate">Awaiting approval</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Your Role</div>
            <div className="font-display text-xl font-bold text-charcoal mb-1 capitalize">
              {session.user.role.replace('_', ' ')}
            </div>
            <div className="text-sm text-slate">Account type</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <Link href="/admin/masjid" className="card p-6 text-center hover:-translate-y-1 transition">
            <div className="text-3xl mb-2">✨</div>
            <div className="font-semibold text-charcoal">Create Event</div>
            <div className="text-xs text-slate mt-1">Via Masjid panel</div>
          </Link>
          <Link href="/discover" className="card p-6 text-center hover:-translate-y-1 transition">
            <div className="text-3xl mb-2">👁️</div>
            <div className="font-semibold text-charcoal">View Events</div>
          </Link>
          <Link href="/masjids" className="card p-6 text-center hover:-translate-y-1 transition">
            <div className="text-3xl mb-2">🕌</div>
            <div className="font-semibold text-charcoal">Browse Masjids</div>
          </Link>
          <Link href="/settings" className="card p-6 text-center hover:-translate-y-1 transition">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-semibold text-charcoal">Settings</div>
          </Link>
        </div>

        {/* Events Table */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-3xl font-bold text-charcoal">
            Your Events
          </h2>
          <Link href="/admin/masjid" className="btn btn-primary">
            + Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No events yet
            </h3>
            <p className="text-slate mb-6">
              Create your first event to start engaging with your community
            </p>
            <Link href="/admin/masjid" className="btn btn-primary">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-sage-50 border-b border-sage-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Event</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">RSVPs</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {events.map((event) => {
                  const date = new Date(event.startDate)
                  return (
                    <tr key={event.id} className="hover:bg-sage-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-charcoal">{event.title}</div>
                        <div className="text-sm text-slate">{event.category} • {event.entryType}</div>
                      </td>
                      <td className="px-6 py-4 text-charcoal">
                        {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}<br />
                        <span className="text-sm text-slate">
                          {date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sage-500 text-lg">{event._count.rsvps}</span>
                        <span className="text-sm text-slate"> attending</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          event.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          event.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link href={`/events/${event.slug}`} className="text-sage-500 hover:text-sage-600 text-lg">
                            👁️
                          </Link>
                          <button className="text-sage-500 hover:text-sage-600 text-lg">✏️</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
