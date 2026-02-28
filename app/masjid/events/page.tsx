import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'
import Link from 'next/link'

async function getActiveMasjidId(userId: string, role: string): Promise<string | null> {
  const selectedId = await getSelectedMasjidId()

  if (role === 'SUPER_ADMIN') {
    if (selectedId) return selectedId
    const first = await prisma.masjid.findFirst({ select: { id: true }, orderBy: { name: 'asc' } })
    return first?.id ?? null
  }

  if (selectedId) {
    const access =
      (await prisma.masjidAdmin.findFirst({ where: { masjidId: selectedId, userId } })) ??
      (await prisma.masjidModerator.findFirst({ where: { masjidId: selectedId, userId } }))
    if (access) return selectedId
  }

  const admin = await prisma.masjidAdmin.findFirst({ where: { userId } })
  if (admin) return admin.masjidId
  const mod = await prisma.masjidModerator.findFirst({ where: { userId } })
  return mod?.masjidId ?? null
}

export default async function MasjidEventsPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const masjidId = await getActiveMasjidId(session.user.id, session.user.role)
  if (!masjidId) redirect('/masjid/dashboard')

  const masjid = await prisma.masjid.findUnique({
    where: { id: masjidId },
    select: { id: true, name: true },
  })
  if (!masjid) redirect('/masjid/dashboard')

  const where: any = {
    masjidId,
    ...(searchParams.status && { status: searchParams.status }),
    ...(searchParams.search && {
      OR: [
        { title: { contains: searchParams.search, mode: 'insensitive' } },
        { description: { contains: searchParams.search, mode: 'insensitive' } },
      ],
    }),
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      organiser: { select: { name: true, email: true } },
      _count: { select: { rsvps: true, comments: true } },
    },
    orderBy: { startDate: 'desc' },
  })

  const stats = {
    total: await prisma.event.count({ where: { masjidId } }),
    pending: await prisma.event.count({ where: { masjidId, status: 'PENDING' } }),
    approved: await prisma.event.count({ where: { masjidId, status: { in: ['APPROVED', 'PUBLISHED'] } } }),
    draft: await prisma.event.count({ where: { masjidId, status: 'DRAFT' } }),
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/masjid/dashboard" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Events</h1>
            <p className="text-xl text-slate">{masjid.name}</p>
          </div>
          <Link href="/masjid/events/new" className="btn btn-primary">
            + New Event
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'text-charcoal' },
          { label: 'Published', value: stats.approved, color: 'text-green-600' },
          { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
          { label: 'Draft', value: stats.draft, color: 'text-slate' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <form method="get" className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search events..."
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div className="w-48">
            <select
              name="status"
              defaultValue={searchParams.status}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Filter</button>
          {(searchParams.search || searchParams.status) && (
            <Link href="/masjid/events" className="btn btn-outline">Clear</Link>
          )}
        </form>
      </div>

      {/* Events Table */}
      <div className="card overflow-hidden">
        {events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">No Events Found</h3>
            <p className="text-slate mb-6">
              {searchParams.search || searchParams.status
                ? 'Try adjusting your filters.'
                : 'Create your first event to engage your community.'}
            </p>
            <Link href="/masjid/events/new" className="btn btn-primary">Create Event</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sage-50 border-b-2 border-sage-100">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm text-slate">Event</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate">Date</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate">Status</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate">Engagement</th>
                  <th className="text-left p-4 font-semibold text-sm text-slate">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id} className="border-b border-sage-100 hover:bg-sage-50 transition">
                    <td className="p-4">
                      <div className="font-semibold text-charcoal">{event.title}</div>
                      {event.category && <div className="text-xs text-slate">{event.category}</div>}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-charcoal">
                        {new Date(event.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {event.startTime && <div className="text-xs text-slate">{event.startTime}</div>}
                    </td>
                    <td className="p-4">
                      <span
                        className={`badge text-xs ${
                          event.status === 'APPROVED' || event.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : event.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm space-x-3">
                        <span className="text-slate">👥 {event._count.rsvps}</span>
                        <span className="text-slate">💬 {event._count.comments}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/masjid/events/${event.id}`}
                          className="text-sm text-sage-500 hover:text-sage-600 font-semibold"
                        >
                          Edit
                        </Link>
                        {event.slug && (
                          <Link
                            href={`/events/${event.slug}`}
                            target="_blank"
                            className="text-sm text-slate hover:text-charcoal"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
