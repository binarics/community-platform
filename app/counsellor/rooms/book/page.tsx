import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RoomBookingForm } from '@/components/counsellor/RoomBookingForm'
import Link from 'next/link'
import { getActiveCounsellorWhere } from '@/lib/counsellor-auth'

export default async function BookRoomPage({ searchParams }: { searchParams: { date?: string, time?: string } }) {
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

  // Get all rooms
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  // Get all clients for this counsellor
  const clients = await prisma.user.findMany({
    where: {
      role: 'CLIENT',
      clientBookings: {
        some: {
          counsellorId: profile?.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/counsellor/rooms" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Rooms
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Book a Room
          </h1>
          <p className="text-xl text-slate">
            Reserve a room for your counselling session
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Room Booking Process
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Select the date and time you need the room</li>
                <li>• System will show available rooms for that slot</li>
                <li>• Choose the room that fits your needs</li>
                <li>• Optionally link to a client booking</li>
                <li>• Receive instant confirmation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        {rooms.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No Rooms Available
            </h3>
            <p className="text-slate mb-6">
              No rooms have been set up yet. Contact your administrator to add rooms.
            </p>
          </div>
        ) : (
          <div className="card p-8">
            <RoomBookingForm
              counsellorId={profile?.id || ''}
              rooms={rooms.map(r => ({ ...r, facilities: r.facilities ?? undefined }))}
              clients={clients}
              preSelectedDate={searchParams.date}
              preSelectedTime={searchParams.time}
            />
          </div>
        )}

        {/* Room Features Guide */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📋</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Choosing the Right Room
              </div>
              <p className="text-sm text-slate mb-3">
                Consider these factors when selecting a room:
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate">
                <div>
                  <strong className="text-charcoal">Capacity:</strong> Ensure room fits all attendees (individual vs group)
                </div>
                <div>
                  <strong className="text-charcoal">Facilities:</strong> Check for whiteboard, audio equipment, etc.
                </div>
                <div>
                  <strong className="text-charcoal">Privacy:</strong> Some rooms offer better sound insulation
                </div>
                <div>
                  <strong className="text-charcoal">Accessibility:</strong> Ground floor rooms for mobility needs
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
