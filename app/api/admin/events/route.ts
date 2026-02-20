import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if user can create events for this masjid
    const canCreate = session.user.role === 'SUPER_ADMIN' ||
      await prisma.masjidAdmin.findFirst({
        where: {
          masjidId: body.masjidId,
          userId: session.user.id,
        },
      }) ||
      await prisma.masjidModerator.findFirst({
        where: {
          masjidId: body.masjidId,
          userId: session.user.id,
        },
      })

    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const event = await prisma.event.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        category: body.category,
        startDate: body.startDate,
        endDate: body.endDate,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        masjidId: body.masjidId,
        organiserId: body.organiserId,
        requiresRSVP: body.requiresRSVP,
        maxAttendees: body.maxAttendees,
        isPublic: body.isPublic,
        status: body.status,
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}