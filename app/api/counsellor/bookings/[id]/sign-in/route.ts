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
    const { mood, concerns } = body

    // Update booking with sign-in data
    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        signedIn: true,
        signInTime: new Date(),
        signInMood: mood,
        signInConcerns: concerns || null,
      },
    })

    return NextResponse.json({ booking, message: 'Client checked in successfully' })
  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}