import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!reviewNotes || reviewNotes.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a reason for rejection (at least 10 characters)' },
        { status: 400 }
      )
    }

    // Get the role request
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: params.id },
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
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    })

    return NextResponse.json({
      message: 'Role request rejected',
    })
  } catch (error) {
    console.error('Reject role request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
