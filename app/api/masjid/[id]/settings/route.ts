import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdminAccess(masjidId: string, userId: string, role: string) {
  if (role === 'SUPER_ADMIN') return true
  const admin = await prisma.masjidAdmin.findFirst({
    where: { masjidId, userId, canEditMasjid: true },
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

    const canEdit = await checkAdminAccess(params.id, session.user.id, session.user.role)
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const masjid = await prisma.masjid.findUnique({ where: { id: params.id } })
    if (!masjid) return NextResponse.json({ error: 'Masjid not found' }, { status: 404 })

    return NextResponse.json({ masjid })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const canEdit = await checkAdminAccess(params.id, session.user.id, session.user.role)
    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()

    // Whitelist updatable fields so arbitrary data can't be written
    const {
      name, description, address, city, state, country, postalCode,
      phone, email, website, facebook, instagram, twitter, youtube,
      capacity, facilities, prayerTimes,
      isPublic, allowEvents, requiresApproval,
      logo, coverImage, primaryColor,
    } = body

    const masjid = await prisma.masjid.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country !== undefined && { country }),
        ...(postalCode !== undefined && { postalCode }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(website !== undefined && { website }),
        ...(facebook !== undefined && { facebook }),
        ...(instagram !== undefined && { instagram }),
        ...(twitter !== undefined && { twitter }),
        ...(youtube !== undefined && { youtube }),
        ...(capacity !== undefined && { capacity: capacity ? parseInt(capacity) : null }),
        ...(facilities !== undefined && { facilities }),
        ...(prayerTimes !== undefined && { prayerTimes }),
        ...(isPublic !== undefined && { isPublic }),
        ...(allowEvents !== undefined && { allowEvents }),
        ...(requiresApproval !== undefined && { requiresApproval }),
        ...(logo !== undefined && { logo }),
        ...(coverImage !== undefined && { coverImage }),
        ...(primaryColor !== undefined && { primaryColor }),
      },
    })

    return NextResponse.json({ masjid })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
