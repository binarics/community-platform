import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      counsellorId,
      name,
      email,
      createAccount,
      notes,
      // Consultation fields
      consultationBypassed,      // true = already completed retrospectively
      consultationBypassReason,  // reason string when bypassed
      consultationDate,          // ISO date string for booking
      consultationTime,          // HH:MM string
      consultationDuration,      // minutes as string/number
      consultationRoomId,        // optional room ID
    } = body

    let clientId: string

    if (createAccount) {
      // Create a new client account
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 400 }
        )
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'CLIENT',
        },
      })

      clientId = newUser.id

      // TODO: Send email with temporary password
      console.log(`Temporary password for ${email}: ${tempPassword}`)
    } else {
      // Link existing user
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (!existingUser) {
        return NextResponse.json(
          { error: 'No user found with this email' },
          { status: 404 }
        )
      }

      clientId = existingUser.id

      if (existingUser.role !== 'CLIENT') {
        await prisma.user.update({
          where: { id: clientId },
          data: { role: 'CLIENT' },
        })
      }
    }

    // Check if relationship already exists
    const existingRelation = await prisma.clientCounsellor.findUnique({
      where: {
        clientId_counsellorId: {
          clientId,
          counsellorId,
        },
      },
    })

    if (existingRelation) {
      return NextResponse.json(
        { error: 'This client is already assigned to you' },
        { status: 400 }
      )
    }

    // Determine consultation status and optionally create a booking
    let consultationStatus = 'PENDING'
    let consultationBookingId: string | null = null
    let consultationCompletedAt: Date | null = null

    if (consultationBypassed) {
      // Retrospective add — consultation already completed
      consultationStatus = 'BYPASSED'
      consultationCompletedAt = new Date()
    } else if (consultationDate && consultationTime) {
      // Book the consultation session now
      const startDateTime = new Date(`${consultationDate}T${consultationTime}`)
      const durationMins = parseInt(consultationDuration || '60', 10)
      const endDateTime = new Date(startDateTime.getTime() + durationMins * 60000)

      if (isNaN(startDateTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid consultation date/time' },
          { status: 400 }
        )
      }

      // Check counsellor conflict
      const counsellorConflict = await prisma.booking.findFirst({
        where: {
          counsellorId,
          status: { not: 'CANCELLED' },
          OR: [
            { AND: [{ startTime: { lte: startDateTime } }, { endTime: { gt: startDateTime } }] },
            { AND: [{ startTime: { lt: endDateTime } }, { endTime: { gte: endDateTime } }] },
            { AND: [{ startTime: { gte: startDateTime } }, { endTime: { lte: endDateTime } }] },
          ],
        },
      })

      if (counsellorConflict) {
        return NextResponse.json(
          { error: 'You already have a booking at that consultation time' },
          { status: 409 }
        )
      }

      // Check room conflict if a room is selected
      if (consultationRoomId) {
        const roomConflict = await prisma.booking.findFirst({
          where: {
            roomId: consultationRoomId,
            status: { not: 'CANCELLED' },
            OR: [
              { AND: [{ startTime: { lte: startDateTime } }, { endTime: { gt: startDateTime } }] },
              { AND: [{ startTime: { lt: endDateTime } }, { endTime: { gte: endDateTime } }] },
              { AND: [{ startTime: { gte: startDateTime } }, { endTime: { lte: endDateTime } }] },
            ],
          },
        })

        if (roomConflict) {
          return NextResponse.json(
            { error: 'Selected room is not available at that time' },
            { status: 409 }
          )
        }
      }

      const consultationBooking = await prisma.booking.create({
        data: {
          counsellorId,
          clientId,
          roomId: consultationRoomId || null,
          startTime: startDateTime,
          endTime: endDateTime,
          sessionType: 'CONSULTATION',
          status: 'SCHEDULED',
          paymentStatus: 'UNPAID',
          isConsultation: true,
          notes: 'Initial consultation session',
        },
      })

      consultationBookingId = consultationBooking.id
      consultationStatus = 'SCHEDULED'
    }

    // Create the client-counsellor relationship with consultation data
    await prisma.clientCounsellor.create({
      data: {
        clientId,
        counsellorId,
        notes,
        consultationStatus,
        consultationBookingId,
        consultationBypassReason: consultationBypassed ? (consultationBypassReason || 'Consultation already completed') : null,
        consultationCompletedAt,
      },
    })

    return NextResponse.json({
      clientId,
      consultationStatus,
      consultationBookingId,
      message: 'Client onboarded successfully',
    })
  } catch (error) {
    console.error('Onboard client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
