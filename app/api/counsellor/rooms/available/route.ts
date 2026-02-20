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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startTime = searchParams.get('startTime')
    const duration = parseInt(searchParams.get('duration') || '60')

    if (!date || !startTime) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const startDateTime = new Date(`${date}T${startTime}`)
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000)

    // Get all rooms
    const allRooms = await prisma.room.findMany()

    // Find rooms with conflicting bookings
    const occupiedRoomIds = await prisma.booking.findMany({
      where: {
        status: { not: 'CANCELLED' },
        OR: [
          { AND: [{ startTime: { lte: startDateTime } }, { endTime: { gt: startDateTime } }] },
          { AND: [{ startTime: { lt: endDateTime } }, { endTime: { gte: endDateTime } }] },
          { AND: [{ startTime: { gte: startDateTime } }, { endTime: { lte: endDateTime } }] },
        ],
      },
      select: { roomId: true },
    }).then(bookings => bookings.map(b => b.roomId))

    // Filter available rooms
    const availableRooms = allRooms.filter(room => !occupiedRoomIds.includes(room.id))

    return NextResponse.json({ rooms: availableRooms })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}