import { NextResponse } from 'next/server'
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendBookingRescheduledEmail,
  sendBookingCancelledEmail,
  sendRoleRequestReceivedEmail,
  sendRoleRequestApprovedEmail,
  sendRoleRequestRejectedEmail,
  sendPasswordChangedEmail,
  sendCounsellorBookingConfirmationEmail,
} from '@/lib/email'

// Only available in development
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'verification'
  const to = searchParams.get('to')

  if (!to) {
    return NextResponse.json({
      error: 'Missing ?to= parameter',
      available_types: [
        'verification',
        'password-reset',
        'password-changed',
        'booking-confirmation-client',
        'booking-confirmation-counsellor',
        'booking-reminder',
        'booking-rescheduled',
        'booking-cancelled',
        'role-request-received',
        'role-request-approved',
        'role-request-rejected',
        'cron-reminder',
      ],
      example: '/api/dev/test-email?type=verification&to=you@example.com',
    }, { status: 400 })
  }

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const mockBooking = {
    id: 'test-booking-id',
    counsellorName: 'Dr. Sarah Ahmed',
    clientName: 'John Doe',
    startTime: tomorrow,
    endTime: tomorrowEnd,
    oldStartTime: yesterday,
    roomName: 'Room 3 – Quiet Suite',
    sessionType: 'INDIVIDUAL',
  }

  let result: any

  switch (type) {
    case 'verification':
      result = await sendVerificationEmail(to, 'Test User', 'test-token-abc123')
      break
    case 'password-reset':
      result = await sendPasswordResetEmail(to, 'Test User', 'test-reset-token-abc123')
      break
    case 'password-changed':
      result = await sendPasswordChangedEmail(to, 'Test User')
      break
    case 'booking-confirmation-client':
      result = await sendBookingConfirmationEmail(to, 'Test Client', mockBooking)
      break
    case 'booking-confirmation-counsellor':
      result = await sendCounsellorBookingConfirmationEmail(to, 'Dr. Sarah Ahmed', mockBooking)
      break
    case 'booking-reminder':
      result = await sendBookingReminderEmail(to, 'Test User', mockBooking)
      break
    case 'booking-rescheduled':
      result = await sendBookingRescheduledEmail(to, 'Test User', {
        ...mockBooking,
        newStartTime: tomorrow,
        newEndTime: tomorrowEnd,
      })
      break
    case 'booking-cancelled':
      result = await sendBookingCancelledEmail(to, 'Test User', {
        ...mockBooking,
        startTime: tomorrow,
        endTime: tomorrowEnd,
      })
      break
    case 'role-request-received':
      result = await sendRoleRequestReceivedEmail(to, 'Test User', 'COUNSELLOR')
      break
    case 'role-request-approved':
      result = await sendRoleRequestApprovedEmail(to, 'Test User', 'COUNSELLOR', 'Great application, welcome aboard!')
      break
    case 'role-request-rejected':
      result = await sendRoleRequestRejectedEmail(to, 'Test User', 'COUNSELLOR', 'We need additional qualifications before approving this role.')
      break
    case 'cron-reminder':
      // Simulate the cron firing — calls the cron endpoint directly
      result = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/send-reminders`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET || ''}` },
      }).then((r) => r.json())
      return NextResponse.json({ type: 'cron-reminder', result })
    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
  }

  return NextResponse.json({ type, to, result })
}
