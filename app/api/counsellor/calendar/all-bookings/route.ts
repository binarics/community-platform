import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Get current user's counsellor profile ID so we can show full data for own bookings
    const myProfile = await prisma.counsellorProfile.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        counsellor: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Return client details for own bookings or SUPER_ADMIN; anonymize for others
    const result = bookings.map((booking) => {
      const isOwn = isSuperAdmin || booking.counsellorId === myProfile?.id
      return {
        id: booking.id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        sessionType: booking.sessionType,
        isConsultation: booking.isConsultation,
        counsellorId: booking.counsellorId,
        room: booking.room,
        counsellor: booking.counsellor
          ? { user: { name: booking.counsellor.user.name } }
          : null,
        client: isOwn
          ? { id: booking.client?.id ?? null, name: booking.client?.name ?? null }
          : { id: null, name: null },
      }
    })

    return NextResponse.json({
      bookings: result,
      message: 'All bookings retrieved',
    })
  } catch (error) {
    console.error('Fetch all bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
