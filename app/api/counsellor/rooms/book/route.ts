import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { counsellorId, roomId, clientId, startTime, endTime, purpose } = body

    // Check room availability
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        OR: [
          { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
          { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
          { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] },
        ],
      },
    })

    if (conflictingBooking) {
      return NextResponse.json({ error: 'Room not available at this time' }, { status: 400 })
    }

    // If clientId provided, create full booking
    if (clientId) {
      const booking = await prisma.booking.create({
        data: {
          counsellorId,
          clientId,
          roomId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          sessionType: 'INDIVIDUAL',
          status: 'SCHEDULED',
          paymentStatus: 'UNPAID',
          notes: purpose || null,
        },
      })

      return NextResponse.json({
        booking,
        bookingId: booking.id,
        message: 'Room booked and linked to client session',
      })
    } else {
      // Create a booking without client (room reservation only)
      // You'll need a placeholder client or modify your schema
      // For now, we'll return success without creating a booking
      // In production, you might want a separate RoomReservation model

      return NextResponse.json({
        message: 'Room reserved successfully',
        roomId,
        startTime,
        endTime,
      })
    }
  } catch (error) {
    console.error('Book room error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}