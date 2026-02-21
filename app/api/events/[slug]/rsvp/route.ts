import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create RSVP
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Get event by slug
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
      include: {
        _count: {
          select: { rsvps: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check capacity
    if (event.capacity && event._count.rsvps >= event.capacity) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 })
    }

    // Check if already RSVPed
    const existingRSVP = await prisma.eventRSVP.findFirst({
      where: {
        eventId: event.id,
        userId: session.user.id,
      },
    })

    if (existingRSVP) {
      return NextResponse.json({ error: 'Already RSVPed' }, { status: 400 })
    }

    // Create RSVP
    const rsvp = await prisma.eventRSVP.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        status: status || 'GOING',
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('Create RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Cancel RSVP
export async function DELETE(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get event by slug
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete RSVP
    await prisma.eventRSVP.deleteMany({
      where: {
        eventId: event.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
