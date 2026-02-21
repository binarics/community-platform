import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Community member submits a counselling session request
// This creates a PENDING booking that the counsellor can then confirm/schedule
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Counsellors / admins should use the counsellor dashboard to create bookings
    if (['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Use the counsellor dashboard to manage bookings' }, { status: 403 })
    }

    const body = await request.json()
    const { counsellorId, sessionType, preferredDate, preferredTime, notes } = body

    if (!counsellorId || !preferredDate) {
      return NextResponse.json(
        { error: 'Counsellor and preferred date are required' },
        { status: 400 }
      )
    }

    // Verify counsellor exists
    const counsellor = await prisma.counsellorProfile.findUnique({
      where: { id: counsellorId },
    })
    if (!counsellor) {
      return NextResponse.json({ error: 'Counsellor not found' }, { status: 404 })
    }

    // Build a placeholder start/end time from preferred date
    // The counsellor will update this when they confirm
    const date = new Date(preferredDate)
    let hour = 10 // default morning
    if (preferredTime === 'afternoon') hour = 14
    if (preferredTime === 'evening') hour = 17

    const startTime = new Date(date)
    startTime.setHours(hour, 0, 0, 0)
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + 1)

    // Ensure the client has a relationship with this counsellor (create if not exists)
    await prisma.clientCounsellor.upsert({
      where: {
        clientId_counsellorId: {
          clientId: session.user.id,
          counsellorId: counsellorId,
        },
      },
      update: {},
      create: {
        clientId: session.user.id,
        counsellorId: counsellorId,
        isActive: true,
      },
    })

    // Create booking with PENDING status
    const booking = await prisma.booking.create({
      data: {
        counsellorId,
        clientId: session.user.id,
        startTime,
        endTime,
        status: 'SCHEDULED', // counsellor will confirm/reschedule
        sessionType: sessionType || 'INDIVIDUAL',
        paymentStatus: 'UNPAID',
        notes: notes
          ? `[Client Request] Preferred time: ${preferredTime || 'Any'}\n\n${notes}`
          : `[Client Request] Preferred time: ${preferredTime || 'Any'}`,
      },
    })

    return NextResponse.json({ booking, message: 'Booking request submitted successfully' })
  } catch (error) {
    console.error('Counselling request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
