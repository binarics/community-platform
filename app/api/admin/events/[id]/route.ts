import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update event
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        masjid: {
          include: {
            admins: {
              where: { userId: session.user.id }
            },
            moderators: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isEventOrganiser = event.organiserId === session.user.id
    const isMasjidAdmin = (event.masjid?.admins?.length ?? 0) > 0
    const isMasjidModerator = (event.masjid?.moderators?.length ?? 0) > 0

    if (!isSuperAdmin && !isEventOrganiser && !isMasjidAdmin && !isMasjidModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      venue,
      masjidId,
      category,
      image,
      imageUrl, // Legacy field
      registrationUrl,
      capacity,
      maxAttendees,
      status,
      isOnline,
      onlineLink,
      requiresRSVP,
      isFeatured,
      isPublic,
      price,
      isFree,
      entryType,
      audience,
      ageGroup,
    } = body

    // Build update data
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (startTime !== undefined) updateData.startTime = startTime || null
    if (endTime !== undefined) updateData.endTime = endTime || null
    if (location !== undefined) updateData.location = location || null
    if (venue !== undefined) updateData.venue = venue || null
    if (masjidId !== undefined) updateData.masjidId = masjidId || null
    if (category !== undefined) updateData.category = category || null
    
    // FIX: Use 'image' field, not 'imageUrl'
    if (image !== undefined) updateData.image = image || null
    if (imageUrl !== undefined) updateData.image = imageUrl || null
    
    if (registrationUrl !== undefined) updateData.registrationUrl = registrationUrl || null
    if (capacity !== undefined) updateData.capacity = capacity ? parseInt(capacity) : null
    if (maxAttendees !== undefined) updateData.maxAttendees = maxAttendees ? parseInt(maxAttendees) : null
    if (status !== undefined) updateData.status = status
    if (isOnline !== undefined) updateData.isOnline = isOnline
    if (onlineLink !== undefined) updateData.onlineLink = onlineLink || null
    if (requiresRSVP !== undefined) updateData.requiresRSVP = requiresRSVP
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (price !== undefined) updateData.price = price ? parseFloat(price) : null
    if (isFree !== undefined) updateData.isFree = isFree
    if (entryType !== undefined) updateData.entryType = entryType || null
    if (audience !== undefined) updateData.audience = audience || null
    if (ageGroup !== undefined) updateData.ageGroup = ageGroup || null

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        masjid: true,
        organiser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete event
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        masjid: {
          include: {
            admins: {
              where: { userId: session.user.id }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isEventOrganiser = event.organiserId === session.user.id
    const isMasjidAdmin = (event.masjid?.admins?.length ?? 0) > 0

    if (!isSuperAdmin && !isEventOrganiser && !isMasjidAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete associated data first
    await prisma.eventRSVP.deleteMany({
      where: { eventId: params.id },
    })

    // FIX: Use 'Comment' model, not 'EventComment'
    await prisma.comment.deleteMany({
      where: { eventId: params.id },
    })

    // Delete event
    await prisma.event.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
