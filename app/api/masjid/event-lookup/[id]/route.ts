import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'

async function resolveActiveMasjidId(userId: string, role: string) {
  const selectedId = await getSelectedMasjidId()

  if (role === 'SUPER_ADMIN') {
    if (selectedId) return selectedId
    const first = await prisma.masjid.findFirst({ select: { id: true }, orderBy: { name: 'asc' } })
    return first?.id ?? null
  }

  if (selectedId) {
    const access =
      (await prisma.masjidAdmin.findFirst({ where: { masjidId: selectedId, userId } })) ??
      (await prisma.masjidModerator.findFirst({ where: { masjidId: selectedId, userId } }))
    if (access) return selectedId
  }

  const admin = await prisma.masjidAdmin.findFirst({ where: { userId } })
  if (admin) return admin.masjidId
  const mod = await prisma.masjidModerator.findFirst({ where: { userId } })
  return mod?.masjidId ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const masjidId = await resolveActiveMasjidId(session.user.id, session.user.role)
    if (!masjidId) return NextResponse.json({ error: 'No accessible masjid' }, { status: 403 })

    const event = await prisma.event.findFirst({
      where: { id: params.id, masjidId },
      include: { _count: { select: { rsvps: true, comments: true } } },
    })

    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    return NextResponse.json({ event, masjidId })
  } catch (error) {
    console.error('Event lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
