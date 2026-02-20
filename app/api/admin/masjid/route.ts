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

    // Create masjid
    const masjid = await prisma.masjid.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        address: body.address,
        city: body.city,
        state: body.state,
        country: body.country,
        postalCode: body.postalCode,
        phone: body.phone,
        email: body.email,
        website: body.website,
        capacity: body.capacity,
        isPublic: body.isPublic,
        allowEvents: body.allowEvents,
      },
    })

    // Auto-assign creator as admin
    await prisma.masjidAdmin.create({
      data: {
        masjidId: masjid.id,
        userId: session.user.id,
        role: 'SUPER_ADMIN',
        assignedBy: session.user.id,
      },
    })

    return NextResponse.json({ masjid })
  } catch (error) {
    console.error('Create masjid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const masjids = await prisma.masjid.findMany({
      include: {
        _count: {
          select: {
            events: true,
            members: true,
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ masjids })
  } catch (error) {
    console.error('Get masjids error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}