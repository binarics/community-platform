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

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subjective, objective, assessment, plan, counsellorId } = body

    // Validation - all SOAP fields required
    if (!subjective || !objective || !assessment || !plan) {
      return NextResponse.json({ error: 'All SOAP fields are required' }, { status: 400 })
    }

    // Create session note
    const note = await prisma.sessionNote.create({
      data: {
        bookingId: params.id,
        counsellorId,
        subjective,
        objective,
        assessment,
        plan,
        private: true,
      },
    })

    return NextResponse.json({ note, message: 'Session notes saved successfully' })
  } catch (error) {
    console.error('Save notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}