import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update event status
    const event = await prisma.event.update({
      where: { id: params.id },
      data: { status },
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update event status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
