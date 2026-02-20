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

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user can assign roles
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = await prisma.masjidAdmin.findFirst({
      where: {
        masjidId: params.id,
        userId: session.user.id,
        canAssignRoles: true,
      },
    })

    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, role, permissions } = body

    if (role === 'ADMIN') {
      const admin = await prisma.masjidAdmin.create({
        data: {
          masjidId: params.id,
          userId,
          assignedBy: session.user.id,
          ...permissions,
        },
      })
      return NextResponse.json({ admin })
    } else if (role === 'MODERATOR') {
      const moderator = await prisma.masjidModerator.create({
        data: {
          masjidId: params.id,
          userId,
          assignedBy: session.user.id,
          ...permissions,
        },
      })
      return NextResponse.json({ moderator })
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  } catch (error) {
    console.error('Assign role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}