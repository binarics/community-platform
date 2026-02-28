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

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Any admin or moderator can view the team
    const hasAccess =
      session.user.role === 'SUPER_ADMIN' ||
      !!(await prisma.masjidAdmin.findFirst({ where: { masjidId: params.id, userId: session.user.id } })) ||
      !!(await prisma.masjidModerator.findFirst({ where: { masjidId: params.id, userId: session.user.id } }))

    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [admins, moderators] = await Promise.all([
      prisma.masjidAdmin.findMany({
        where: { masjidId: params.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { assignedAt: 'asc' },
      }),
      prisma.masjidModerator.findMany({
        where: { masjidId: params.id },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { assignedAt: 'asc' },
      }),
    ])

    return NextResponse.json({ admins, moderators })
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canManage = await checkTeamAccess(params.id, session.user.id, session.user.role)
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId, teamRole } = await request.json()
    if (!userId || !teamRole) {
      return NextResponse.json({ error: 'userId and teamRole are required' }, { status: 400 })
    }

    if (teamRole === 'ADMIN') {
      const admin = await prisma.masjidAdmin.upsert({
        where: { masjidId_userId: { masjidId: params.id, userId } },
        create: {
          masjidId: params.id,
          userId,
          assignedBy: session.user.id,
        },
        update: {},
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      return NextResponse.json({ admin })
    }

    if (teamRole === 'MODERATOR') {
      const moderator = await prisma.masjidModerator.upsert({
        where: { masjidId_userId: { masjidId: params.id, userId } },
        create: {
          masjidId: params.id,
          userId,
          assignedBy: session.user.id,
        },
        update: {},
        include: { user: { select: { id: true, name: true, email: true } } },
      })
      return NextResponse.json({ moderator })
    }

    return NextResponse.json({ error: 'teamRole must be ADMIN or MODERATOR' }, { status: 400 })
  } catch (error) {
    console.error('Add team member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
