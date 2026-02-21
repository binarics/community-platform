import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create comment
export async function POST(request: Request, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parentId } = body

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 })
    }

    // Get event by slug
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.eventComment.findUnique({
        where: { id: parentId },
      })

      if (!parentComment || parentComment.eventId !== event.id) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment
    const comment = await prisma.eventComment.create({
      data: {
        eventId: event.id,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Create comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
