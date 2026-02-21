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
    const { counsellorId, clientId, roomId, startTime, endTime, sessionType, status, paymentStatus, notes } = body

    // Validation
    if (!counsellorId || !clientId || !startTime || !endTime || !sessionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate that the date is in the past
    const sessionStart = new Date(startTime)
    if (sessionStart > new Date()) {
      return NextResponse.json({ error: 'Past sessions must have a date in the past' }, { status: 400 })
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        counsellorId,
        clientId,
        roomId: roomId || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        sessionType,
        status: status || 'COMPLETED',
        paymentStatus: paymentStatus || 'PAID',
      },
    })

    // If notes provided, create session note
    if (notes && notes.trim()) {
      await prisma.sessionNote.create({
        data: {
          bookingId: booking.id,
          counsellorId,
          content: notes.trim(),
        },
      })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Create past booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
