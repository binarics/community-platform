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

    if (!reviewNotes) {
      return NextResponse.json({ error: 'Reason for rejection required' }, { status: 400 })
    }

    await prisma.roleRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes,
      },
    })

    return NextResponse.json({ message: 'Role request rejected' })
  } catch (error) {
    console.error('Reject error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
