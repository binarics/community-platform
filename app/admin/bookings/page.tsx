import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-600',
}

const PAYMENT_STYLES: Record<string, string> = {
  UNPAID: 'bg-amber-100 text-amber-700',
  PARTIAL: 'bg-orange-100 text-orange-700',
  PAID: 'bg-green-100 text-green-700',
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; counsellor?: string; search?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const where: Record<string, unknown> = {}
  if (searchParams.status) where.status = searchParams.status
  if (searchParams.counsellor) where.counsellorId = searchParams.counsellor
  if (searchParams.search) {
    where.client = {
      OR: [
        { name: { contains: searchParams.search } },
        { email: { contains: searchParams.search } },
      ],
    }
  }

  const [bookings, counsellors, counts] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        counsellor: {
          include: { user: { select: { name: true } } },
        },
        room: { select: { name: true } },
        sessionNotes: { select: { id: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    }),
    prisma.counsellorProfile.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: 'asc' } },
    }),
    {
      all: prisma.booking.count(),
      scheduled: prisma.booking.count({ where: { status: 'SCHEDULED' } }),
      completed: prisma.booking.count({ where: { status: 'COMPLETED' } }),
      cancelled: prisma.booking.count({ where: { status: 'CANCELLED' } }),
      unpaid: prisma.booking.count({ where: { paymentStatus: 'UNPAID', status: 'COMPLETED' } }),
    },
  ])

  const resolvedCounts = {
    all: await counts.all,
    scheduled: await counts.scheduled,
    completed: await counts.completed,
    cancelled: await counts.cancelled,
    unpaid: await counts.unpaid,
  }

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-sage-500 hover:text-sage-600 mb-2 inline-block">
              ← Admin Panel
            </Link>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Booking Management</h1>
            <p className="text-xl text-slate">All counselling sessions across the platform</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase text-slate mb-1">Total</div>
            <div className="font-display text-3xl font-bold text-charcoal">{resolvedCounts.all}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase text-slate mb-1">Scheduled</div>
            <div className="font-display text-3xl font-bold text-blue-600">{resolvedCounts.scheduled}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase text-slate mb-1">Completed</div>
            <div className="font-display text-3xl font-bold text-green-600">{resolvedCounts.completed}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase text-slate mb-1">Cancelled</div>
            <div className="font-display text-3xl font-bold text-red-500">{resolvedCounts.cancelled}</div>
          </div>
          <div className="card p-5">
            <div className="text-xs font-semibold uppercase text-slate mb-1">Unpaid</div>
            <div className="font-display text-3xl font-bold text-amber-600">{resolvedCounts.unpaid}</div>
            <div className="text-xs text-slate">completed sessions</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <form method="get" className="flex flex-wrap gap-4">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search by client name or email…"
              className="flex-1 min-w-[240px] px-4 py-2.5 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition text-sm"
            />
            <select
              name="status"
              defaultValue={searchParams.status}
              className="px-4 py-2.5 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition text-sm"
            >
              <option value="">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <select
              name="counsellor"
              defaultValue={searchParams.counsellor}
              className="px-4 py-2.5 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition text-sm"
            >
              <option value="">All counsellors</option>
              {counsellors.map(c => (
                <option key={c.id} value={c.id}>{c.user.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Filter</button>
            {(searchParams.status || searchParams.counsellor || searchParams.search) && (
              <Link href="/admin/bookings" className="btn btn-outline btn-sm">Clear</Link>
            )}
          </form>
        </div>

        {/* Table */}
        {bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🗓️</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">No Bookings Found</h3>
            <p className="text-slate">Try adjusting your filters</p>
          </>
        ) : (
          <>
            <div className="mb-4 text-sm text-slate">
              Showing <strong className="text-charcoal">{bookings.length}</strong> booking{bookings.length !== 1 ? 's' : ''}
              {resolvedCounts.all > 100 && ' (limited to 100 most recent)'}
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-sage-50 border-b border-sage-100">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Client</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Counsellor</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Date & Time</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Type</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Room</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Payment</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-slate">Notes</th>
                    <th className="px-5 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {bookings.map((booking) => {
                    const start = new Date(booking.startTime)
                    const end = new Date(booking.endTime)
                    return (
                      <tr key={booking.id} className="hover:bg-sage-50 transition">
                        <td className="px-5 py-4">
                          <div className="font-medium text-charcoal">{booking.client.name}</div>
                          <div className="text-xs text-slate">{booking.client.email}</div>
                        </td>
                        <td className="px-5 py-4 text-slate">
                          {booking.counsellor.user.name}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-charcoal font-medium">
                            {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-slate text-xs">
                            {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            {' – '}
                            {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate capitalize">
                          {(booking.sessionType || 'Individual').toLowerCase()}
                        </td>
                        <td className="px-5 py-4 text-slate">
                          {booking.room?.name || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PAYMENT_STYLES[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate">
                          {booking.sessionNotes.length > 0 ? (
                            <span className="text-sage-600 font-medium">✓ {booking.sessionNotes.length}</span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/counsellor/bookings/${booking.id}`}
                            className="text-sage-500 hover:text-sage-600 font-medium"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
