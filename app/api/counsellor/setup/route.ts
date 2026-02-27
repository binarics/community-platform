import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Must be a counsellor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      bio,
      specializations,
      hourlyRate,
      qualifications,
      yearsExperience,
      languages,
      organisationId,
      availability,
    } = body

    // COUNSELLOR can only create their own profile.
    // SUPER_ADMIN may specify a userId; defaults to their own if omitted.
    const userId =
      session.user.role === 'SUPER_ADMIN' && body.userId
        ? body.userId
        : session.user.id

    // Validation
    if (!bio || bio.length < 50) {
      return NextResponse.json(
        { error: 'Bio must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (!specializations || specializations.length === 0) {
      return NextResponse.json(
        { error: 'At least one specialization is required' },
        { status: 400 }
      )
    }

    if (!hourlyRate || hourlyRate <= 0) {
      return NextResponse.json(
        { error: 'Valid hourly rate is required' },
        { status: 400 }
      )
    }

    // Check if profile already exists
    const existingProfile = await prisma.counsellorProfile.findUnique({
      where: { userId },
    })

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 400 }
      )
    }

    // Create counsellor profile
    const profile = await prisma.counsellorProfile.create({
      data: {
        userId,
        bio,
        specializations: JSON.stringify(specializations),
        hourlyRate,
        availability: JSON.stringify(availability),
        verified: false, // Requires admin verification
      },
    })

    // TODO: Send notification to admin for verification
    // TODO: Send confirmation email to counsellor

    return NextResponse.json({ 
      profile,
      message: 'Profile created successfully. Pending admin verification.'
    })
  } catch (error) {
    console.error('Counsellor setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
