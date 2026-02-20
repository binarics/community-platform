import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or super admin
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = await prisma.masjidAdmin.findFirst({
      where: {
        masjidId: params.id,
        userId: session.user.id,
      },
    })

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const masjid = await prisma.masjid.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({ masjid })
  } catch (error) {
    console.error('Update masjid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.masjid.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Masjid deleted' })
  } catch (error) {
    console.error('Delete masjid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}