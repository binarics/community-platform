import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single client details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get counsellor profile
    const profile = await prisma.counsellorProfile.findFirst({
      where: { userId: session.user.id },
    })

    if (!profile && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Counsellor profile not found' }, { status: 404 })
    }

    // Get client with all bookings
    const client = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        clientBookings: {
          where: {
            counsellorId: profile?.id,
          },
          include: {
            room: true,
            sessionNotes: {
              select: {
                id: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
        },
        _count: {
          select: {
            clientBookings: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update client information
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email } = body

    // Validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: params.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Update client
    const client = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    })

    return NextResponse.json({ client, message: 'Client updated successfully' })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete client (soft delete or full delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Only SUPER_ADMIN can delete clients
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if client has any bookings
    const bookingsCount = await prisma.booking.count({
      where: { clientId: params.id },
    })

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing bookings' },
        { status: 400 }
      )
    }

    // Delete client
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
