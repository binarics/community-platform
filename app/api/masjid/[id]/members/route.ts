import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAccess(masjidId: string, userId: string, role: string) {
  if (role === 'SUPER_ADMIN') return { access: true, canManage: true }
  const admin = await prisma.masjidAdmin.findFirst({ where: { masjidId, userId } })
  if (admin) return { access: true, canManage: admin.canManageMembers }
  const mod = await prisma.masjidModerator.findFirst({ where: { masjidId, userId } })
  if (mod) return { access: true, canManage: mod.canApproveMembers }
  return { access: false, canManage: false }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { access } = await checkAccess(params.id, session.user.id, session.user.role)
    if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const members = await prisma.masjidMember.findMany({
      where: { masjidId: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
      },
      orderBy: { joinedAt: 'desc' },
    })

    // Fetch admin/moderator records so we can show roles in the list
    const [admins, moderators] = await Promise.all([
      prisma.masjidAdmin.findMany({
        where: { masjidId: params.id },
        select: { userId: true, role: true },
      }),
      prisma.masjidModerator.findMany({
        where: { masjidId: params.id },
        select: { userId: true },
      }),
    ])

    const adminIds = new Set(admins.map((a) => a.userId))
    const modIds = new Set(moderators.map((m) => m.userId))

    const enriched = members.map((m) => ({
      ...m,
      staffRole: adminIds.has(m.userId)
        ? 'ADMIN'
        : modIds.has(m.userId)
        ? 'MODERATOR'
        : null,
    }))

    return NextResponse.json({ members: enriched })
  } catch (error) {
    console.error('Get members error:', error)
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

    const { access, canManage } = await checkAccess(params.id, session.user.id, session.user.role)
    if (!access || !canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    const member = await prisma.masjidMember.upsert({
      where: { masjidId_userId: { masjidId: params.id, userId } },
      create: { masjidId: params.id, userId },
      update: {},
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Add member error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
