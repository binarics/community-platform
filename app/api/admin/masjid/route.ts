import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      city,
      country,
      address,
      state,
      postalCode,
      phone,
      email,
      website,
      capacity,
      isPublic,
      allowEvents,
    } = body

    // Validation
    if (!name || !city || !country || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existingMasjid = await prisma.masjid.findUnique({
      where: { slug },
    })

    if (existingMasjid) {
      return NextResponse.json(
        { error: 'A masjid with this name already exists' },
        { status: 400 }
      )
    }

    // Create masjid
    const masjid = await prisma.masjid.create({
      data: {
        name,
        slug,
        description,
        city,
        country,
        address,
        state,
        postalCode,
        phone,
        email,
        website,
        capacity: capacity ? parseInt(capacity) : null,
        isPublic: isPublic !== false,
        allowEvents: allowEvents !== false,
        isActive: true,
      },
    })

    // Add creator as admin
    await prisma.masjidAdmin.create({
      data: {
        masjidId: masjid.id,
        userId: session.user.id,
        role: 'ADMIN',
        canEditMasjid: true,
        canManageEvents: true,
        canManageMembers: true,
        canAssignRoles: true,
      },
    })

    return NextResponse.json({
      masjid,
      message: 'Masjid created successfully',
    })
  } catch (error) {
    console.error('Create masjid error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
