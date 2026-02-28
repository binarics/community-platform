import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkTeamAccess(masjidId: string, userId: string, role: string) {
  if (role === 'SUPER_ADMIN') return true
  const admin = await prisma.masjidAdmin.findFirst({
    where: { masjidId, userId, canAssignRoles: true },
  })
  return !!admin
}

/**
 * DELETE /api/masjid/[id]/team/[memberId]
 * Removes an admin or moderator from the masjid team.
 * The memberId is the MasjidAdmin.id or MasjidModerator.id, with a
 * `type` query param of "admin" or "moderator".
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canManage = await checkTeamAccess(params.id, session.user.id, session.user.role)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'admin' | 'moderator'

    if (type === 'admin') {
      await prisma.masjidAdmin.delete({ where: { id: params.memberId } })
    } else if (type === 'moderator') {
      await prisma.masjidModerator.delete({ where: { id: params.memberId } })
    } else {
      return NextResponse.json({ error: 'type must be admin or moderator' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Team member removed' })
  } catch (error) {
    console.error('Remove team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
