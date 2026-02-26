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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if event exists and requires RSVP
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            rsvps: {
              where: { status: 'ATTENDING' }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (!event.requiresRSVP) {
      return NextResponse.json({ error: 'Event does not require RSVP' }, { status: 400 })
    }

    // Check capacity
    if (event.maxAttendees && event._count.rsvps >= event.maxAttendees) {
      // Add to waitlist
      const rsvp = await prisma.eventRSVP.upsert({
        where: {
          eventId_userId: {
            eventId: params.id,
            userId: session.user.id,
          }
        },
        create: {
          eventId: params.id,
          userId: session.user.id,
          status: 'WAITLIST',
          guests: body.guests || 0,
        },
        update: {
          status: 'WAITLIST',
          guests: body.guests || 0,
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({ rsvp, waitlisted: true })
    }

    // Create or update RSVP
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        }
      },
      create: {
        eventId: params.id,
        userId: session.user.id,
        status: body.status || 'ATTENDING',
        guests: body.guests || 0,
      },
      update: {
        status: body.status || 'ATTENDING',
        guests: body.guests || 0,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}