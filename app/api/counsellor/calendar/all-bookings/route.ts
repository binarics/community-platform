import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all bookings for all counsellors
    // This is for the public/shared calendar view
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
          }
        },
        counsellor: {
          select: {
            user: {
              select: {
                name: true,
              }
            }
          }
        },
        // DO NOT include client details for privacy
        // Client info will be anonymized in the response
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Anonymize client information for privacy
    const anonymizedBookings = bookings.map(booking => ({
      id: booking.id,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      room: booking.room,
      counsellor: booking.counsellor,
      // Client name is NOT included - will show as "Busy" in the UI
      client: {
        name: null, // Anonymized for privacy
      }
    }))

    return NextResponse.json({ 
      bookings: anonymizedBookings,
      message: 'All bookings retrieved (client info anonymized)'
    })
  } catch (error) {
    console.error('Fetch all bookings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
