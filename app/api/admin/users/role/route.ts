import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, role } = body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Role change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
