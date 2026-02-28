'use server'

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MASJID_COOKIE } from '@/lib/masjid-auth'

export async function selectMasjid(masjidId: string) {
  const session = await getServerSession(authOptions)
  if (!session) return

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  if (!isSuperAdmin) {
    // Verify user actually has access to this masjid
    const access = await prisma.masjidAdmin.findFirst({
      where: { masjidId, userId: session.user.id },
    }) ?? await prisma.masjidModerator.findFirst({
      where: { masjidId, userId: session.user.id },
    })
    if (!access) return
  }

  const cookieStore = await cookies()
  cookieStore.set(MASJID_COOKIE, masjidId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  })
}
