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

    const profile = await prisma.counsellorProfile.findFirst({
      where: { userId: session.user.id },
    })

    const bookings = await prisma.booking.findMany({
      where: { counsellorId: profile?.id },
      include: {
        client: true,
        room: true,
        sessionNotes: { select: { id: true } },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { counsellorId, clientId, roomId, startTime, endTime, sessionType, notes } = body

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
      return NextResponse.json({ error: 'Room not available' }, { status: 400 })
    }

    const booking = await prisma.booking.create({
      data: {
        counsellorId,
        clientId,
        roomId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        sessionType: sessionType || 'INDIVIDUAL',
        status: 'SCHEDULED',
        paymentStatus: 'UNPAID',
        notes,
      },
      include: {
        client: true,
        room: true,
      },
    })

    return NextResponse.json({ booking, message: 'Booking created successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}