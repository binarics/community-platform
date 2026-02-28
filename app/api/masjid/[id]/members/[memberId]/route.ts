import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkManageAccess(masjidId: string, userId: string, role: string) {
  if (role === 'SUPER_ADMIN') return true
  const admin = await prisma.masjidAdmin.findFirst({ where: { masjidId, userId } })
  return !!admin?.canManageMembers
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canManage = await checkManageAccess(params.id, session.user.id, session.user.role)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { receiveNotifications, favorited } = body

    const member = await prisma.masjidMember.update({
      where: { id: params.memberId },
      data: {
        ...(receiveNotifications !== undefined && { receiveNotifications }),
        ...(favorited !== undefined && { favorited }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canManage = await checkManageAccess(params.id, session.user.id, session.user.role)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.masjidMember.delete({ where: { id: params.memberId } })

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
