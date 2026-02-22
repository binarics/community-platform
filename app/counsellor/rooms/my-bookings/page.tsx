import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // If SUPER_ADMIN and no own profile, use first available counsellor profile
  if (!profile && session.user.role === 'SUPER_ADMIN') {
    profile = await prisma.counsellorProfile.findFirst()
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Get all bookings for this counsellor
  const bookings = await prisma.booking.findMany({
    where: {
      counsellorId: profile?.id,
      roomId: { not: null },
    },
    include: {
      client: true,
      room: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  // Separate upcoming and past bookings
  const now = new Date()
  const upcomingBookings = bookings.filter(b => new Date(b.startTime) >= now && b.status !== 'CANCELLED')
  const pastBookings = bookings.filter(b => new Date(b.startTime) < now || b.status === 'CANCELLED')

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/counsellor/rooms" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Rooms
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            My Room Bookings
          </h1>
          <p className="text-xl text-slate">
            View and manage your room reservations
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Upcoming Bookings
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {upcomingBookings.length}
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Past Bookings
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {pastBookings.length}
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Bookings
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {bookings.length}
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
            Upcoming Bookings ({upcomingBookings.length})
          </h2>

          {upcomingBookings.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No Upcoming Bookings
              </h3>
              <p className="text-slate mb-6">
                You don&apos;t have any upcoming room reservations
              </p>
              <Link href="/counsellor/rooms/book" className="btn btn-primary">
                Book a Room
              </Link>
            </>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/counsellor/bookings/${booking.id}`}
                  className="card p-6 hover:shadow-lg transition"
                >
                  {/* Date Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-sage-500 text-white px-4 py-2 rounded-xl">
                      <div className="text-xs font-semibold uppercase">
                        {new Date(booking.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="text-2xl font-bold">
                        {new Date(booking.startTime).getDate()}
                      </div>
                      <div className="text-xs">
                        {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </div>

                    <span className={`badge ${
                      booking.status === 'SCHEDULED' ? 'bg-sage-100 text-sage-700' :
                      booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="mb-4">
                    <div className="text-sm text-slate mb-1">Time</div>
                    <div className="font-semibold text-charcoal text-lg">
                      {new Date(booking.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                      {' - '}
                      {new Date(booking.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  {/* Room */}
                  <div className="mb-4 p-3 bg-terracotta-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <div>
                        <div className="font-semibold text-charcoal">
                          {booking.room?.name}
                        </div>
                        <div className="text-xs text-slate">
                          Capacity: {booking.room?.capacity} people
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center font-display text-lg font-bold text-sage-600">
                      {booking.client.name?.[0] || 'C'}
                    </div>
                    <div>
                      <div className="font-semibold text-charcoal">{booking.client.name}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate">{booking.isConsultation ? 'Consultation' : booking.sessionType}</div>
                        {booking.isConsultation && (
                          <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-semibold">
                            📋 Consultation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Past Bookings ({pastBookings.length})
            </h2>

            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-sage-50 border-b border-sage-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Room
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {pastBookings.slice(0, 20).map((booking) => (
                    <tr key={booking.id} className="hover:bg-sage-50 transition">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/counsellor/bookings/${booking.id}`}
                          className="hover:text-sage-600"
                        >
                          <div className="font-semibold text-charcoal">
                            {new Date(booking.startTime).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-slate">
                            {new Date(booking.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-charcoal">{booking.room?.name}</div>
                        <div className="text-sm text-slate">Cap: {booking.room?.capacity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-charcoal">{booking.client.name}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-slate">{booking.isConsultation ? 'Consultation' : booking.sessionType}</div>
                          {booking.isConsultation && (
                            <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-semibold">📋</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
