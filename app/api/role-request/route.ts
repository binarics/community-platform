import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sendRoleRequestReceivedEmail,
  sendRoleRequestAdminNotificationEmail,
} from '@/lib/email'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestedRole, reason } = body

    // Validation
    if (!requestedRole || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const validRoles = ['ORGANISER', 'MASJID_ADMIN', 'COUNSELLOR']
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (reason.trim().length < 20) {
      return NextResponse.json(
        { error: 'Reason must be at least 20 characters' },
        { status: 400 }
      )
    }

    // Check for pending requests
    const existingPending = await prisma.roleRequest.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'You already have a pending role request' },
        { status: 400 }
      )
    }

    // Create role request
    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId: session.user.id,
        requestedRole,
        currentRole: session.user.role,
        reason,
        status: 'PENDING',
      },
    })

    // Notify the user their request was received
    await sendRoleRequestReceivedEmail(
      session.user.email!,
      session.user.name || 'there',
      requestedRole
    )

    // Notify all super admins
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, name: true },
    })
    await Promise.all(
      superAdmins.map((admin) =>
        sendRoleRequestAdminNotificationEmail(
          admin.email,
          admin.name || 'Admin',
          session.user.name || session.user.email!,
          session.user.email!,
          requestedRole,
          reason,
          roleRequest.id
        )
      )
    )

    return NextResponse.json({
      roleRequest,
      message: 'Role request submitted successfully',
    })
  } catch (error) {
    console.error('Role request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
