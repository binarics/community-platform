import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FullCalendar } from '@/components/counsellor/FullCalendar'
import Link from 'next/link'
import { getActiveCounsellorWhere } from '@/lib/counsellor-auth'

export default async function CalendarPage({ searchParams }: { 
  searchParams: { view?: string, date?: string } 
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

  // Get date range for calendar (current month ± 1 month)
  const currentDate = searchParams.date ? new Date(searchParams.date) : new Date()
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0)

  // Get all bookings for calendar
  const bookings = await prisma.booking.findMany({
    where: {
      counsellorId: profile?.id,
      startTime: {
        gte: startDate,
        lte: endDate,
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

  // Get all clients assigned to this counsellor (FIXED: Now shows ALL assigned clients)
  const clientRelations = await prisma.clientCounsellor.findMany({
    where: {
      counsellorId: profile?.id,
      isActive: true,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      client: {
        name: 'asc',
      },
    },
  })

  const clients = clientRelations.map(rel => rel.client)

  // Get all rooms for quick booking
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  // Parse availability
  const availability = profile?.availability ? JSON.parse(profile.availability) : null

  return (
    <>

      <div className="max-w-[1600px] mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Calendar
              </h1>
              <p className="text-xl text-slate">
                Manage your schedule and appointments
              </p>
            </div>

            <div className="flex gap-3">
              <Link href="/counsellor/bookings/new" className="btn btn-primary">
                + New Booking
              </Link>
              <Link href="/counsellor/calendar/availability" className="btn btn-outline">
                ⚙️ Set Availability
              </Link>
              <Link 
                href="/counsellor/bookings/add-past"
                className="btn btn-outline"
              >
                + Add Past Session
              </Link>
            </div>
          </div>
        </div>


        {/* Calendar Component */}
        <div className="card p-8">
          <FullCalendar
            bookings={bookings.map(b => ({ ...b, startTime: b.startTime.toISOString(), endTime: b.endTime.toISOString(), sessionType: b.sessionType ?? '' }))}
            clients={clients}
            rooms={rooms}
            counsellorId={profile?.id || ''}
            isSuperAdmin={session.user.role === 'SUPER_ADMIN'}
            initialView={searchParams.view || 'month'}
            initialDate={searchParams.date}
            availability={availability}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-sm font-semibold text-charcoal">Legend:</div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-violet-500"></div>
              <span className="text-sm text-slate">Consultation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-sage-500"></div>
              <span className="text-sm text-slate">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm text-slate">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500"></div>
              <span className="text-sm text-slate">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm text-slate">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-300"></div>
              <span className="text-sm text-slate">No Show</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
