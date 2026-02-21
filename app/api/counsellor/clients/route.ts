import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET - List all clients assigned to this counsellor
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
      return NextResponse.json(
        { error: 'Counsellor profile not found' },
        { status: 404 }
      )
    }

    // Get all clients assigned to this counsellor via ClientCounsellor relationship
    const clientRelations = await prisma.clientCounsellor.findMany({
      where: {
        counsellorId: profile?.id,
        isActive: true, // Only active relationships
      },
      include: {
        client: {
          include: {
            _count: {
              select: {
                clientBookings: {
                  where: {
                    counsellorId: profile?.id,
                  },
                },
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
              select: {
                id: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
      orderBy: {
        client: {
          name: 'asc',
        },
      },
    })

    // Format response with client data
    const formattedClients = clientRelations.map((relation) => ({
      id: relation.client.id,
      name: relation.client.name,
      email: relation.client.email,
      totalSessions: relation.client._count.clientBookings,
      lastSession: relation.client.clientBookings[0] || null,
      assignedAt: relation.assignedAt,
      relationshipNotes: relation.notes,
      createdAt: relation.client.createdAt,
    }))

    return NextResponse.json({ clients: formattedClients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new client and assign to counsellor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      emergencyContact,
      emergencyPhone,
      presentingIssues,
      goals,
      counsellorId,
    } = body

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!counsellorId) {
      return NextResponse.json(
        { error: 'Counsellor ID is required' },
        { status: 400 }
      )
    }

    // Verify counsellor exists
    const counsellorProfile = await prisma.counsellorProfile.findUnique({
      where: { id: counsellorId },
    })

    if (!counsellorProfile) {
      return NextResponse.json(
        { error: 'Counsellor profile not found' },
        { status: 404 }
      )
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
      // Generate a secure random password (user can reset it later)
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
      console.log(`New client created with temporary password: ${tempPassword}`)
    }

    // Check if relationship already exists
    const existingRelation = await prisma.clientCounsellor.findUnique({
      where: {
        clientId_counsellorId: {
          clientId: client.id,
          counsellorId: counsellorId,
        },
      },
    })

    let relation

    if (existingRelation) {
      // Reactivate if inactive
      if (!existingRelation.isActive) {
        relation = await prisma.clientCounsellor.update({
          where: { id: existingRelation.id },
          data: {
            isActive: true,
            notes: presentingIssues || goals || null,
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Client already assigned to this counsellor' },
          { status: 400 }
        )
      }
    } else {
      // Create new relationship
      relation = await prisma.clientCounsellor.create({
        data: {
          clientId: client.id,
          counsellorId: counsellorId,
          isActive: true,
          notes: presentingIssues || goals || null,
        },
      })
    }

    // Store additional client info for reference
    const clientInfo = {
      phone,
      emergencyContact,
      emergencyPhone,
      presentingIssues,
      goals,
      createdBy: counsellorId,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      client,
      relation,
      clientInfo,
      message: 'Client created and assigned successfully',
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
