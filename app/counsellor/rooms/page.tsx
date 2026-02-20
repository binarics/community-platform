import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { RoomCalendar } from '@/components/counsellor/RoomCalendar'
import { BookRoomButton } from '@/components/counsellor/BookRoomButton'
import Link from 'next/link'

export default async function RoomsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'COUNSELLOR' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/')
  }

  const counsellorProfile = await prisma.counsellorProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!counsellorProfile) {
    redirect('/counsellor/setup')
  }

  // Get all rooms
  const rooms = await prisma.room.findMany({
    include: {
      organisation: true,
      bookings: {
        where: {
          startTime: {
            gte: new Date(),
          },
        },
        include: {
          counsellor: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      },
      _count: {
        select: {
          // APPLY FILTER HERE TO MATCH THE LIST ABOVE
          bookings: {
            where: {
              startTime: {
                gte: new Date(),
              },
            },
          },
        },
      },
    },
  })

  // Get all bookings for today (all rooms, all counsellors)
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
    },
    include: {
      room: true,
      counsellor: {
        include: {
          user: true,
        },
      },
      client: true,
    },
    orderBy: { startTime: 'asc' },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Room Bookings
              </h1>
              <p className="text-xl text-slate">
                Check room availability and book for your sessions
              </p>
            </div>
          </div>
        </div>

        {/* Room List */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {rooms.map((room) => {
            const nextBooking = room.bookings[0]
            const availableNow = !todayBookings.some(
              b => 
                b.roomId === room.id && 
                new Date(b.startTime) <= new Date() && 
                new Date(b.endTime) >= new Date()
            )

            return (
              <div key={room.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-charcoal mb-1">
                      {room.name}
                    </h3>
                    <div className="text-sm text-slate">
                      Capacity: {room.capacity} people
                    </div>
                  </div>
                  <span className={`badge ${
                    availableNow 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {availableNow ? 'Available' : 'In Use'}
                  </span>
                </div>

                {room.facilities && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase text-slate mb-2">
                      Facilities
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {JSON.parse(room.facilities).map((facility: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-1 bg-sage-50 text-sage-700 rounded-full">
                          {facility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase text-slate mb-2">
                    Next Booking
                  </div>
                  {nextBooking ? (
                    <div className="text-sm">
                      <div className="font-semibold text-charcoal">
                        {new Date(nextBooking.startTime).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <div className="text-slate">
                        {new Date(nextBooking.startTime).toLocaleTimeString('en-GB', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                        {' - '}
                        {new Date(nextBooking.endTime).toLocaleTimeString('en-GB', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                      <div className="text-xs text-slate mt-1">
                        {nextBooking.counsellor.user.name}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate">No upcoming bookings</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <BookRoomButton 
                    roomId={room.id}
                    counsellorId={counsellorProfile.id}
                  />
                  <button className="btn btn-outline btn-sm flex-1">
                    View Calendar
                  </button>
                </div>
                
                <div className="mt-3 text-xs text-slate">
                  {room._count.bookings} upcoming bookings
                </div>
              </div>
            )
          })}
        </div>

        {/* Today's Room Schedule */}
        <div className="card p-6 mb-12">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Today&apos;s Schedule - All Rooms
          </h2>

          {todayBookings.length === 0 ? (
            <div className="text-center py-8 text-slate">
              No bookings today
            </div>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((booking) => {
                const startTime = new Date(booking.startTime).toLocaleTimeString('en-GB', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
                const endTime = new Date(booking.endTime).toLocaleTimeString('en-GB', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
                const isCurrentUser = booking.counsellor.userId === session.user.id

                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border-2 ${
                      isCurrentUser
                        ? 'bg-sage-50 border-sage-200'
                        : 'bg-white border-sage-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-slate">Time</div>
                          <div className="font-semibold text-charcoal">
                            {startTime}
                          </div>
                          <div className="text-xs text-slate">
                            {endTime}
                          </div>
                        </div>

                        <div className="h-12 w-px bg-sage-200"></div>

                        <div>
                          <div className="font-semibold text-charcoal">
                            {booking.room?.name || 'No room'}
                          </div>
                          <div className="text-sm text-slate">
                            {booking.counsellor.user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-sage-600 font-semibold">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`badge ${
                        booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'SCHEDULED' ? 'bg-sage-100 text-sage-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Weekly Room Calendar */}
        <div className="card p-6">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Weekly Room Calendar
          </h2>
          <RoomCalendar rooms={rooms} />
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-1">
                Room Booking Tips
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Book rooms at least 24 hours in advance when possible</li>
                <li>• Check the shared calendar to avoid conflicts</li>
                <li>• Mark yourself as available/unavailable to help colleagues plan</li>
                <li>• Cancel unused bookings promptly to free up space</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
