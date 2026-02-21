import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update session note
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subjective, objective, assessment, plan } = body

    // Get existing note to verify ownership
    const existingNote = await prisma.sessionNote.findUnique({
      where: { id: params.id },
      include: {
        counsellor: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Verify ownership
    if (session.user.role !== 'SUPER_ADMIN' && existingNote.counsellor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update note
    const note = await prisma.sessionNote.update({
      where: { id: params.id },
      data: {
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ note, message: 'Note updated successfully' })
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete session note
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing note to verify ownership
    const existingNote = await prisma.sessionNote.findUnique({
      where: { id: params.id },
      include: {
        counsellor: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Verify ownership
    if (session.user.role !== 'SUPER_ADMIN' && existingNote.counsellor.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete note
    await prisma.sessionNote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true, message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
