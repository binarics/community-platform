import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint - returns verified counsellors for the booking page
export async function GET() {
  try {
    const counsellors = await prisma.counsellorProfile.findMany({
      where: { verified: true },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: 'asc' } },
    })

    const formatted = counsellors.map(c => ({
      id: c.id,
      bio: c.bio,
      hourlyRate: c.hourlyRate,
      specializations: (() => {
        try { return JSON.parse(c.specializations) } catch { return [] }
      })(),
      user: c.user,
    }))

    return NextResponse.json({ counsellors: formatted })
  } catch (error) {
    console.error('Get counsellors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
