import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already a member
    const existing = await prisma.masjidMember.findUnique({
      where: {
        masjidId_userId: {
          masjidId: params.id,
          userId: session.user.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    const member = await prisma.masjidMember.create({
      data: {
        masjidId: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Join masjid error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}