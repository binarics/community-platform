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
    const {
      title,
      slug,
      description,
      category,
      masjidId,
      organiserId,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      requiresRSVP,
      maxAttendees,
      isPublic,
      status,
    } = body

    // Validation
    if (!title || !masjidId || !organiserId || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    if (slug) {
      const existingEvent = await prisma.event.findUnique({
        where: { slug },
      })

      if (existingEvent) {
        return NextResponse.json(
          { error: 'An event with this URL already exists' },
          { status: 400 }
        )
      }
    }

    // Verify user has permission to create events for this masjid
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = await prisma.masjidAdmin.findFirst({
      where: {
        masjidId,
        userId: session.user.id,
      },
    })
    const isModerator = await prisma.masjidModerator.findFirst({
      where: {
        masjidId,
        userId: session.user.id,
      },
    })

    if (!isSuperAdmin && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'You do not have permission to create events for this masjid' },
        { status: 403 }
      )
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        title,
        slug,
        description,
        category,
        masjidId,
        organiserId,
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        startTime,
        endTime,
        location,
        requiresRSVP: requiresRSVP || false,
        maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
        isPublic: isPublic !== false,
        status: status || 'DRAFT',
      },
      include: {
        masjid: true,
        organiser: true,
      },
    })

    return NextResponse.json({
      event,
      message: 'Event created successfully',
    })
  } catch (error) {
    console.error('Create event error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
