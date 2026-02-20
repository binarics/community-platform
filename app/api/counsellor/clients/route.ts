import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - List all clients for this counsellor
export async function GET(request: Request) {
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

    // Get all clients for this counsellor
    const clients = await prisma.user.findMany({
      where: {
        role: 'CLIENT',
        clientBookings: {
          some: {
            counsellorId: profile?.id,
          },
        },
      },
      include: {
        _count: {
          select: {
            clientBookings: true,
          },
        },
        clientBookings: {
          where: {
            counsellorId: profile?.id,
            status: 'COMPLETED',
          },
          orderBy: {
            startTime: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Format response with last session info
    const formattedClients = clients.map(client => ({
      id: client.id,
      name: client.name,
      email: client.email,
      totalSessions: client._count.clientBookings,
      lastSession: client.clientBookings[0] || null,
      createdAt: client.createdAt,
    }))

    return NextResponse.json({ clients: formattedClients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new client
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, emergencyContact, emergencyPhone, presentingIssues, goals, counsellorId } = body

    // Validation
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    let client

    if (existingUser) {
      // Update existing user to CLIENT role if not already
      if (existingUser.role !== 'CLIENT') {
        client = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            name: name || existingUser.name,
            role: 'CLIENT',
          },
        })
      } else {
        client = existingUser
      }
    } else {
      // Create new CLIENT user
      // Generate a random password (user can reset it later)
      const tempPassword = Math.random().toString(36).slice(-10)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      client = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'CLIENT',
        },
      })

      // TODO: Send welcome email with password reset link
    }

    // Store additional client info in notes field for first booking
    // Or create a separate ClientProfile model (future enhancement)
    const clientInfo = {
      phone,
      emergencyContact,
      emergencyPhone,
      presentingIssues,
      goals,
      createdBy: counsellorId,
      createdAt: new Date().toISOString(),
    }

    // You could store this in a ClientProfile model or in the first booking notes
    // For now, we'll return the client and you can add this info to the first booking

    return NextResponse.json({
      client,
      clientInfo, // Return this so it can be used when creating first booking
      message: 'Client created successfully',
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
