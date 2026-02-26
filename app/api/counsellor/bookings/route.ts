import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBookingConfirmationEmail, sendCounsellorBookingConfirmationEmail } from '@/lib/email'

// GET - List all bookings for this counsellor
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.counsellorProfile.findFirst({
      where: { userId: session.user.id },
    })

    if (!profile && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const bookings = await prisma.booking.findMany({
      where: { counsellorId: profile?.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        sessionNotes: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { counsellorId, clientId, roomId, startTime, endTime, sessionType, notes } = body

    // Validation
    if (!counsellorId || !clientId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Counsellor, client, start time, and end time are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    // Verify client is assigned to this counsellor
    const clientRelation = await prisma.clientCounsellor.findUnique({
      where: {
        clientId_counsellorId: {
          clientId,
          counsellorId,
        },
      },
    })

    if (!clientRelation || !clientRelation.isActive) {
      return NextResponse.json(
        { error: 'Client is not assigned to this counsellor' },
        { status: 403 }
      )
    }

    // Check for counsellor availability conflicts
    const counsellorConflict = await prisma.booking.findFirst({
      where: {
        counsellorId,
        status: { not: 'CANCELLED' },
        OR: [
          { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
          { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
          { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
        ],
      },
    })

    if (counsellorConflict) {
      return NextResponse.json(
        { error: 'Counsellor already has a booking at this time' },
        { status: 409 }
      )
    }

    // If room specified, check room availability
    if (roomId) {
      const roomConflict = await prisma.booking.findFirst({
        where: {
          roomId,
          status: { not: 'CANCELLED' },
          OR: [
            { AND: [{ startTime: { lte: start } }, { endTime: { gt: start } }] },
            { AND: [{ startTime: { lt: end } }, { endTime: { gte: end } }] },
            { AND: [{ startTime: { gte: start } }, { endTime: { lte: end } }] },
          ],
        },
      })

      if (roomConflict) {
        return NextResponse.json(
          { error: 'Room is not available at this time' },
          { status: 409 }
        )
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        counsellorId,
        clientId,
        roomId: roomId || null,
        startTime: start,
        endTime: end,
        sessionType: sessionType || 'INDIVIDUAL',
        status: 'SCHEDULED',
        paymentStatus: 'UNPAID',
        notes,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        room: {
          select: { id: true, name: true },
        },
        counsellor: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    // Send confirmation emails to both parties (non-blocking)
    const emailPayload = {
      id: booking.id,
      counsellorName: booking.counsellor.user.name || 'Your Counsellor',
      startTime: booking.startTime,
      endTime: booking.endTime,
      roomName: booking.room?.name,
      sessionType: booking.sessionType,
    }
    await Promise.all([
      sendBookingConfirmationEmail(booking.client.email, booking.client.name || 'there', emailPayload),
      sendCounsellorBookingConfirmationEmail(
        booking.counsellor.user.email,
        booking.counsellor.user.name || 'there',
        { ...emailPayload, clientName: booking.client.name || 'Client' }
      ),
    ])

    return NextResponse.json({ booking, message: 'Booking created successfully' })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
