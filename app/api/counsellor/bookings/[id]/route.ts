import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBookingRescheduledEmail, sendBookingCancelledEmail } from '@/lib/email'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        room: true,
        counsellor: { include: { user: true } },
        sessionNotes: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Fetch existing booking before update to detect reschedule
    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, email: true } },
        room: { select: { name: true } },
        counsellor: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: body,
    })

    // If the time changed, notify both parties
    if (
      existing &&
      (body.startTime || body.endTime) &&
      (new Date(body.startTime ?? existing.startTime).getTime() !== existing.startTime.getTime() ||
        new Date(body.endTime ?? existing.endTime).getTime() !== existing.endTime.getTime())
    ) {
      const reschedulePayload = {
        id: booking.id,
        clientName: existing.client.name || 'Client',
        counsellorName: existing.counsellor.user.name || 'Counsellor',
        newStartTime: new Date(booking.startTime),
        newEndTime: new Date(booking.endTime),
        oldStartTime: existing.startTime,
        roomName: existing.room?.name,
      }
      await Promise.all([
        sendBookingRescheduledEmail(existing.client.email, existing.client.name || 'there', reschedulePayload),
        sendBookingRescheduledEmail(existing.counsellor.user.email, existing.counsellor.user.name || 'there', reschedulePayload),
      ])
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch booking details before cancelling for the notification emails
    const existing = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { name: true, email: true } },
        room: { select: { name: true } },
        counsellor: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    await prisma.booking.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    // Notify both parties of the cancellation
    if (existing) {
      const cancelPayload = {
        clientName: existing.client.name || 'Client',
        counsellorName: existing.counsellor.user.name || 'Counsellor',
        startTime: existing.startTime,
        endTime: existing.endTime,
        roomName: existing.room?.name,
      }
      await Promise.all([
        sendBookingCancelledEmail(existing.client.email, existing.client.name || 'there', cancelPayload),
        sendBookingCancelledEmail(existing.counsellor.user.email, existing.counsellor.user.name || 'there', cancelPayload),
      ])
    }

    return NextResponse.json({ message: 'Booking cancelled' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}