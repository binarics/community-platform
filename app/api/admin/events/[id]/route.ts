import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update event
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      masjidId,
      category,
      imageUrl,
      registrationUrl,
      capacity,
      status,
    } = body

    // Validation
    if (!title || !description || !startDate) {
      return NextResponse.json(
        { error: 'Title, description, and start date are required' },
        { status: 400 }
      )
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        masjidId: masjidId || null,
        category: category || null,
        imageUrl: imageUrl || null,
        registrationUrl: registrationUrl || null,
        capacity: capacity || null,
        status: status || 'DRAFT',
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete event
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete associated data first
    await prisma.eventRSVP.deleteMany({
      where: { eventId: params.id },
    })

    await prisma.eventComment.deleteMany({
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
