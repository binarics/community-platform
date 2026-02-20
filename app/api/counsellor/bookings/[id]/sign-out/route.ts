import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, feedback } = body

    if (!rating) {
      return NextResponse.json({ error: 'Rating is required' }, { status: 400 })
    }

    // Update booking with sign-out data and complete the session
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        signedOut: true,
        signOutTime: new Date(),
        signOutRating: rating,
        signOutFeedback: feedback || null,
        status: 'COMPLETED',
      },
    })

    return NextResponse.json({ booking, message: 'Session completed successfully' })
  } catch (error) {
    console.error('Sign-out error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}