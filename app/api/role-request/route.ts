import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, requestedRole, currentRole, reason } = body

    // Validation
    if (!userId || !requestedRole || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (reason.length < 50) {
      return NextResponse.json({ error: 'Reason must be at least 50 characters' }, { status: 400 })
    }

    // Can't request SUPER_ADMIN
    if (requestedRole === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot request SUPER_ADMIN role' }, { status: 400 })
    }

    // Can't request same role
    if (requestedRole === currentRole) {
      return NextResponse.json({ error: 'You already have this role' }, { status: 400 })
    }

    // Check if user already has a pending request
    const existingRequest = await prisma.roleRequest.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending role request' },
        { status: 400 }
      )
    }

    // Create role request
    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId,
        requestedRole,
        currentRole,
        reason,
        status: 'PENDING',
      },
    })

    // TODO: Send notification to admins

    return NextResponse.json({ 
      roleRequest,
      message: 'Role request submitted successfully'
    })
  } catch (error) {
    console.error('Role request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
