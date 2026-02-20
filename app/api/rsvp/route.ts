import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { eventId } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      )
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { rsvps: true } } },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check capacity
    if (event.capacity && event._count.rsvps >= event.capacity) {
      return NextResponse.json(
        { error: 'Event is at capacity' },
        { status: 400 }
      )
    }

    // Check if already RSVP'd
    const existingRSVP = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    })

    if (existingRSVP) {
      return NextResponse.json(
        { error: 'Already RSVP\'d to this event' },
        { status: 400 }
      )
    }

    // Create RSVP
    const rsvp = await prisma.rSVP.create({
      data: {
        userId: session.user.id,
        eventId: eventId,
        status: 'CONFIRMED',
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      )
    }

    // Delete RSVP
    await prisma.rSVP.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel RSVP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      )
    }

    // Check if user has RSVP'd
    const rsvp = await prisma.rSVP.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    })

    return NextResponse.json({ hasRSVPd: !!rsvp, rsvp })
  } catch (error) {
    console.error('Check RSVP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
