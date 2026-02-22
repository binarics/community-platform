import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentStatus, paymentAmount, referralFeePaid } = body

    // Validate paymentStatus
    if (paymentStatus && !['UNPAID', 'PARTIAL', 'PAID'].includes(paymentStatus)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
    }

    // Validate paymentAmount
    if (paymentAmount !== undefined && paymentAmount !== null && (typeof paymentAmount !== 'number' || paymentAmount < 0)) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    // Fetch the booking to verify ownership and get consultation status
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { counsellor: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Ensure counsellor can only update their own bookings
    if (session.user.role !== 'SUPER_ADMIN' && booking.counsellor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus
    if (paymentAmount !== undefined) updateData.paymentAmount = paymentAmount

    // Referral fee: only applicable to consultation bookings
    if (referralFeePaid !== undefined) {
      updateData.referralFeePaid = referralFeePaid
      // Set referral fee amount to £10 when marking as paid for a consultation
      if (referralFeePaid && (booking.sessionType === 'CONSULTATION' || (booking as any).isConsultation)) {
        updateData.referralFeeAmount = 10
      }
    }

    const updated = await prisma.booking.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ booking: updated })
  } catch (error) {
    console.error('Payment update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
