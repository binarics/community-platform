import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendRoleRequestApprovedEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reviewNotes } = body

    // Get the role request
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: params.id },
      include: { user: true },
    })

    if (!roleRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (roleRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request already reviewed' },
        { status: 400 }
      )
    }

    // Update role request
    await prisma.roleRequest.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    })

    // Update user role
    await prisma.user.update({
      where: { id: roleRequest.userId },
      data: { role: roleRequest.requestedRole },
    })

    // Email the user with the good news
    await sendRoleRequestApprovedEmail(
      roleRequest.user.email,
      roleRequest.user.name || 'there',
      roleRequest.requestedRole,
      reviewNotes || undefined
    )

    return NextResponse.json({
      message: 'Role request approved successfully',
    })
  } catch (error) {
    console.error('Approve role request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
