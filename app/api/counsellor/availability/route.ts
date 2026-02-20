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
    const { counsellorId, availability } = body

    // Update counsellor profile with availability
    await prisma.counsellorProfile.update({
      where: { id: counsellorId },
      data: {
        availability: availability, // Store as JSON string
      },
    })

    return NextResponse.json({ 
      message: 'Availability updated successfully',
      availability 
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.counsellorProfile.findFirst({
      where: { userId: session.user.id },
      select: {
        id: true,
        availability: true,
      },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      availability: profile.availability ? JSON.parse(profile.availability) : null 
    })
  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}