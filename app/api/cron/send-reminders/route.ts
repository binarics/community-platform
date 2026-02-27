import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingReminderEmail } from '@/lib/email'
import { validateApiKey } from '@/lib/api-key'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization') ?? ''

  // Accept either the env-level CRON_SECRET (used by Vercel's scheduler)
  // or a database-backed rolling API key issued from the admin panel.
  const cronSecret = process.env.CRON_SECRET
  const validCronSecret = !!cronSecret && authHeader === `Bearer ${cronSecret}`
  const validApiKey = !validCronSecret && (await validateApiKey(authHeader))

  if (!validCronSecret && !validApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'SCHEDULED',
        reminderSent: false,
        startTime: { gte: windowStart, lte: windowEnd },
      },
      include: {
        client: { select: { name: true, email: true } },
        room: { select: { name: true } },
        counsellor: { include: { user: { select: { name: true, email: true } } } },
      },
    })
    if (upcomingBookings.length === 0) {
      return NextResponse.json({ message: 'No reminders to send', sent: 0 })
    }
    let sent = 0
    const errors: string[] = []
    for (const booking of upcomingBookings) {
      const payload = {
        id: booking.id,
        counsellorName: booking.counsellor.user.name || 'Your Counsellor',
        startTime: booking.startTime,
        endTime: booking.endTime,
        roomName: booking.room?.name,
      }
      try {
        await Promise.all([
          sendBookingReminderEmail(booking.client.email, booking.client.name || 'there', payload),
          sendBookingReminderEmail(booking.counsellor.user.email, booking.counsellor.user.name || 'there', payload),
        ])
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true, reminderSentAt: new Date() },
        })
        sent++
      } catch (err) {
        errors.push(`Booking ${booking.id}: ${String(err)}`)
      }
    }
    return NextResponse.json({
      message: `Reminders sent for ${sent} of ${upcomingBookings.length} bookings`,
      sent,
      ...(errors.length > 0 && { errors }),
    })
  } catch (error) {
    console.error('Cron send-reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
