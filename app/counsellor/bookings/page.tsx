import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getActiveCounsellorWhere } from '@/lib/counsellor-auth'

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

export default async function CounsellorBookingsPage({
  searchParams,
}: {
  searchParams: { status?: string; upcoming?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // SUPER_ADMIN: respect the cookie-selected counsellor
  if (session.user.role === 'SUPER_ADMIN') {
    const where = await getActiveCounsellorWhere(session.user.id, session.user.role)
    if (where) {
      profile = await prisma.counsellorProfile.findFirst({ where })
    } else if (!profile) {
      profile = await prisma.counsellorProfile.findFirst()
    }
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  const statusFilter = searchParams.status
  const upcomingOnly = searchParams.upcoming === 'true'

  const bookings = await prisma.booking.findMany({
    where: {
      counsellorId: profile.id,
      ...(statusFilter && { status: statusFilter }),
      ...(upcomingOnly && { startTime: { gte: new Date() } }),
    },
    include: {
      client: {
        select: { id: true, name: true, email: true },
      },
      room: {
        select: { id: true, name: true },
      },
      sessionNotes: {
        select: { id: true },
      },
    },
    orderBy: { startTime: 'desc' },
  })

  const counts = {
    all: await prisma.booking.count({ where: { counsellorId: profile.id } }),
    scheduled: await prisma.booking.count({ where: { counsellorId: profile.id, status: 'SCHEDULED' } }),
    completed: await prisma.booking.count({ where: { counsellorId: profile.id, status: 'COMPLETED' } }),
    cancelled: await prisma.booking.count({ where: { counsellorId: profile.id, status: 'CANCELLED' } }),
    unpaid: await prisma.booking.count({
      where: { counsellorId: profile.id, paymentStatus: 'UNPAID', status: 'COMPLETED' },
    }),
  }

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Bookings</h1>
            <p className="text-xl text-slate">All your counselling sessions</p>
          </div>
          <Link href="/counsellor/bookings/new" className="btn btn-primary">
            + New Booking
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total</div>
            <div className="font-display text-4xl font-bold text-charcoal">{counts.all}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Scheduled</div>
            <div className="font-display text-4xl font-bold text-blue-600">{counts.scheduled}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Completed</div>
            <div className="font-display text-4xl font-bold text-green-600">{counts.completed}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Unpaid</div>
            <div className="font-display text-4xl font-bold text-amber-600">{counts.unpaid}</div>
            <div className="text-sm text-slate">completed sessions</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6 flex flex-wrap gap-2">
          <Link
            href="/counsellor/bookings"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              !statusFilter && !upcomingOnly
                ? 'bg-sage-500 text-white'
                : 'hover:bg-sage-50 text-charcoal'
            }`}
          >
            All ({counts.all})
          </Link>
          <Link
            href="/counsellor/bookings?upcoming=true"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              upcomingOnly ? 'bg-sage-500 text-white' : 'hover:bg-sage-50 text-charcoal'
            }`}
          >
            Upcoming
          </Link>
          <Link
            href="/counsellor/bookings?status=SCHEDULED"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === 'SCHEDULED' ? 'bg-blue-500 text-white' : 'hover:bg-sage-50 text-charcoal'
            }`}
          >
            Scheduled ({counts.scheduled})
          </Link>
          <Link
            href="/counsellor/bookings?status=COMPLETED"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === 'COMPLETED' ? 'bg-green-500 text-white' : 'hover:bg-sage-50 text-charcoal'
            }`}
          >
            Completed ({counts.completed})
          </Link>
          <Link
            href="/counsellor/bookings?status=CANCELLED"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              statusFilter === 'CANCELLED' ? 'bg-red-500 text-white' : 'hover:bg-sage-50 text-charcoal'
            }`}
          >
            Cancelled ({counts.cancelled})
          </Link>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">No Bookings Found</h3>
            <p className="text-slate mb-6">
              {statusFilter ? `No ${statusFilter.toLowerCase()} bookings yet.` : 'No bookings yet.'}
            </p>
            <Link href="/counsellor/bookings/new" className="btn btn-primary">
              Schedule a Session
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-sage-50 border-b border-sage-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Room</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">Notes</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {bookings.map((booking) => {
                  const start = new Date(booking.startTime)
                  const end = new Date(booking.endTime)
                  const isToday = start.toDateString() === new Date().toDateString()
                  const isPast = end < new Date()

                  return (
                    <tr
                      key={booking.id}
                      className={`hover:bg-sage-50 transition ${isToday ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/counsellor/clients/${booking.client.id}`}
                          className="font-semibold text-charcoal hover:text-sage-600"
                        >
                          {booking.client.name}
                        </Link>
                        <div className="text-xs text-slate">{booking.client.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className={`font-medium ${isToday ? 'text-sage-600' : 'text-charcoal'}`}>
                          {isToday ? 'Today' : start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-slate">
                          {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          {' – '}
                          {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate capitalize">
                        {(booking.sessionType || 'Individual').toLowerCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">
                        {booking.room?.name || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PAYMENT_STYLES[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">
                        {booking.sessionNotes.length > 0 ? (
                          <span className="text-sage-600 font-medium">✓ {booking.sessionNotes.length}</span>
                        ) : (
                          <span className="text-slate/50">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/counsellor/bookings/${booking.id}`}
                          className="text-sage-500 hover:text-sage-600 font-medium text-sm"
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
        )}

        {/* Add past booking link */}
        <div className="mt-6 text-center">
          <Link href="/counsellor/bookings/add-past" className="text-sage-500 hover:text-sage-600 text-sm font-medium">
            + Add a past session
          </Link>
        </div>
      </div>
    </>
  )
}
