import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function CounsellorRoomsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/counsellor-dashboard')
  }

  // Get all rooms
  const rooms = await prisma.room.findMany({
    include: {
      organisation: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Get today's bookings for each room
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayBookings = await prisma.booking.findMany({
    where: {
      startTime: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS'],
      },
    },
    include: {
      client: true,
      room: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/counsellor-dashboard"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Room Management
          </h1>
          <p className="text-xl text-slate">
            View room availability and book spaces for sessions
          </p>
        </div>

        {/* Today's Schedule */}
        {todayBookings.length > 0 && (
          <div className="card p-8 mb-8 bg-gradient-to-br from-sage-50 to-terracotta-50">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
              Today's Bookings
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="p-4 bg-white rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-charcoal">
                        {booking.room?.name || 'No room assigned'}
                      </div>
                      <div className="text-sm text-slate">
                        {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(booking.endTime).toLocaleTimeString('en-GB', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span className="badge bg-sage-100 text-sage-700">
                      {booking.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate">
                    Client: {booking.client.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
            Available Rooms
          </h2>
          {rooms.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No Rooms Available
              </h3>
              <p className="text-slate">
                Contact your administrator to set up counselling rooms
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room.id} className="card p-6">
                  <div className="text-4xl mb-3">🏠</div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    {room.name}
                  </h3>
                  <div className="text-sm text-slate mb-4">
                    {room.organisation.name}
                  </div>

                  {room.description && (
                    <p className="text-sm text-slate mb-4">{room.description}</p>
                  )}

                  <div className="space-y-2 text-sm mb-4">
                    {room.capacity && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate">Capacity:</span>
                        <span className="font-semibold text-charcoal">
                          {room.capacity} people
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-slate">Total bookings:</span>
                      <span className="font-semibold text-charcoal">
                        {room._count.bookings}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/counsellor/bookings/new?roomId=${room.id}`}
                    className="btn btn-outline w-full justify-center text-sm"
                  >
                    Book This Room
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="card p-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Booking Tips
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Check room availability before booking sessions</li>
                <li>• Reserve rooms at least 24 hours in advance when possible</li>
                <li>
                  • Contact admin if you need to request additional rooms or equipment
                </li>
                <li>• Cancel unused bookings to free up space for others</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
