import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/lookup?email=...
 * Returns a user's id by email. Only accessible to SUPER_ADMIN or masjid admins with canAssignRoles.
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })

    // Only admins can look up users
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    if (!isSuperAdmin) {
      const adminRecord = await prisma.masjidAdmin.findFirst({
        where: { userId: session.user.id, canAssignRoles: true },
      })
      if (!adminRecord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, role: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ userId: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    console.error('User lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
