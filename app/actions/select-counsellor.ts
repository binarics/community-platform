'use server'

import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { COUNSELLOR_COOKIE } from '@/lib/counsellor-auth'

export async function selectCounsellor(profileId: string) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') return

  const cookieStore = await cookies()
  cookieStore.set(COUNSELLOR_COOKIE, profileId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // Session cookie — clears when browser closes
  })
}

export async function clearCounsellorSelection() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') return

  const cookieStore = await cookies()
  cookieStore.delete(COUNSELLOR_COOKIE)
}
