// app/api/cron/send-reminders/route.ts
// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, or external cron service)
// Schedule: Run every hour to check for bookings that need reminders

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendBookingReminderEmail } from '@/lib/email'

export async function GET(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current time
    const now = new Date()
    
    // Calculate 24 hours from now (with 1 hour window)
    const reminderStart = new Date(now)
    reminderStart.setHours(reminderStart.getHours() + 23)
    
    const reminderEnd = new Date(now)
    reminderEnd.setHours(reminderEnd.getHours() + 25)

    // Find bookings that:
    // 1. Start in 23-25 hours
    // 2. Haven't had reminder sent yet
    // 3. Are not cancelled
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: reminderStart,
          lte: reminderEnd,
        },
        reminderSent: false,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
          },
        },
        counsellor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        room: {
          select: {
            name: true,
          },
        },
      },
    })

    console.log(`Found ${bookingsToRemind.length} bookings to send reminders for`)

    const results = []

    // Send reminder emails
    for (const booking of bookingsToRemind) {
      // Skip if client email not verified
      if (!booking.client.emailVerified) {
        console.log(`Skipping reminder for ${booking.client.email} - email not verified`)
        continue
      }

      try {
        const result = await sendBookingReminderEmail(
          booking.client.email,
          booking.client.name || 'Client',
          {
            id: booking.id,
            counsellorName: booking.counsellor.user.name || 'Your counsellor',
            startTime: booking.startTime,
            endTime: booking.endTime,
            roomName: booking.room?.name,
          }
        )

        if (result.success) {
          // Mark reminder as sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
            },
          })

          results.push({
            bookingId: booking.id,
            clientEmail: booking.client.email,
            status: 'sent',
          })

          console.log(`Reminder sent for booking ${booking.id}`)
        } else {
          results.push({
            bookingId: booking.id,
            clientEmail: booking.client.email,
            status: 'failed',
            error: result.error,
          })

          console.error(`Failed to send reminder for booking ${booking.id}`)
        }
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.id}:`, error)
        results.push({
          bookingId: booking.id,
          clientEmail: booking.client.email,
          status: 'error',
          error: String(error),
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${bookingsToRemind.length} bookings`,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Send reminders cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request)
}
