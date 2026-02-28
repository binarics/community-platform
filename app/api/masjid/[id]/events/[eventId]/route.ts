import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkEventAccess(
  masjidId: string,
  userId: string,
  role: string
) {
  if (role === 'SUPER_ADMIN') return { canEdit: true, canDelete: true }
  const admin = await prisma.masjidAdmin.findFirst({ where: { masjidId, userId } })
  if (admin) return { canEdit: admin.canManageEvents, canDelete: admin.canManageEvents }
  const mod = await prisma.masjidModerator.findFirst({ where: { masjidId, userId } })
  if (mod) return { canEdit: mod.canEditEvents, canDelete: mod.canDeleteEvents }
  return { canEdit: false, canDelete: false }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const event = await prisma.event.findFirst({
      where: { id: params.eventId, masjidId: params.id },
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        _count: { select: { rsvps: true, comments: true } },
      },
    })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const { canEdit } = await checkEventAccess(params.id, session.user.id, session.user.role)
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Get event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { canEdit } = await checkEventAccess(params.id, session.user.id, session.user.role)
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()

    // Ensure the event actually belongs to this masjid
    const existing = await prisma.event.findFirst({
      where: { id: params.eventId, masjidId: params.id },
    })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const event = await prisma.event.update({
      where: { id: params.eventId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.requiresRSVP !== undefined && { requiresRSVP: body.requiresRSVP }),
        ...(body.maxAttendees !== undefined && { maxAttendees: body.maxAttendees }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.image !== undefined && { image: body.image }),
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { canDelete } = await checkEventAccess(params.id, session.user.id, session.user.role)
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Ensure event belongs to this masjid
    const existing = await prisma.event.findFirst({
      where: { id: params.eventId, masjidId: params.id },
    })
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    await prisma.event.delete({ where: { id: params.eventId } })

    return NextResponse.json({ message: 'Event deleted' })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
