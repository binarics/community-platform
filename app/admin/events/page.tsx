import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminEventsPage({ searchParams }: {
  searchParams: { status?: string, masjid?: string, search?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  // Build where clause
  const where: any = {
    ...(searchParams.status && { status: searchParams.status }),
    ...(searchParams.masjid && { masjidId: searchParams.masjid }),
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
      masjid: true,
      organiser: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
          comments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get masjids for filter
  const masjids = await prisma.masjid.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Stats
  const stats = {
    total: events.length,
    pending: events.filter((e) => e.status === 'PENDING').length,
    approved: events.filter((e) => e.status === 'APPROVED').length,
    draft: events.filter((e) => e.status === 'DRAFT').length,
    rejected: events.filter((e) => e.status === 'REJECTED').length,
  }

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Event Management
          </h1>
          <p className="text-xl text-slate">
            Review, approve, and manage all platform events
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total</div>
            <div className="font-display text-4xl font-bold text-charcoal">{stats.total}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Pending</div>
            <div className="font-display text-4xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Approved</div>
            <div className="font-display text-4xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Draft</div>
            <div className="font-display text-4xl font-bold text-slate">{stats.draft}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Rejected</div>
            <div className="font-display text-4xl font-bold text-red-600">{stats.rejected}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <form method="get" className="flex gap-4">
            <div className="flex-1">
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
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DRAFT">Draft</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div className="w-64">
              <select
                name="masjid"
                defaultValue={searchParams.masjid}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              >
                <option value="">All Masjids</option>
                {masjids.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
            {(searchParams.search || searchParams.status || searchParams.masjid) && (
              <Link href="/admin/events" className="btn btn-outline">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Events Table */}
        <div className="card overflow-hidden">
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No Events Found
              </h3>
              <p className="text-slate">Try adjusting your filters</p>
            </>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sage-50 border-b-2 border-sage-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Event</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Masjid</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Organiser</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Date</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Status</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Engagement</th>
                    <th className="text-left p-4 font-semibold text-sm text-slate">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, idx) => (
                    <tr key={event.id} className={`border-b border-sage-100 hover:bg-sage-50 transition`}>
                      <td className="p-4">
                        <div className="font-semibold text-charcoal">{event.title}</div>
                        {event.category && (
                          <div className="text-xs text-slate">{event.category}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-charcoal">{event.masjid?.name || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-charcoal">{event.organiser?.name}</div>
                        <div className="text-xs text-slate">{event.organiser?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-charcoal">
                          {new Date(event.startDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        {event.startTime && (
                          <div className="text-xs text-slate">{event.startTime}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge text-xs ${
                            event.status === 'APPROVED'
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
                          <span className="text-slate">
                            👥 {event._count.rsvps}
                          </span>
                          <span className="text-slate">
                            💬 {event._count.comments}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/events/${event.id}`}
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
    </div>
  )
}
