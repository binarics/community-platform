import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Extract all possible field names (handle both spellings)
    const {
      title,
      slug: providedSlug,
      description,
      category,
      masjidId,
      organiserId,
      organizerId, // American spelling alternative
      startDate,
      endDate,
      startTime,
      endTime,
      location,
      venue,
      isOnline,
      onlineLink,
      requiresRSVP,
      maxAttendees,
      capacity,
      registrationDeadline,
      allowWaitlist,
      image,
      imageUrl, // Legacy field name
      isPublic,
      isFeatured,
      status,
      entryType,
      price,
      isFree,
      currency,
      audience,
      ageGroup,
      timezone,
      isAllDay,
      isRecurring,
      recurrence,
    } = body

    // Use either spelling for organiser
    const finalOrganiserId = organiserId || organizerId

    // Validation - only check truly required fields from schema
    if (!title) {
      return NextResponse.json(
        { error: 'Event title is required' },
        { status: 400 }
      )
    }

    if (!masjidId) {
      return NextResponse.json(
        { error: 'Masjid is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    let finalSlug = providedSlug
    if (!finalSlug) {
      const baseSlug = generateSlug(title)
      const timestamp = Date.now().toString(36)
      finalSlug = `${baseSlug}-${timestamp}`
    }

    // Check if slug already exists
    const existingEvent = await prisma.event.findUnique({
      where: { slug: finalSlug },
    })

    if (existingEvent) {
      // Auto-generate new slug with timestamp
      const baseSlug = generateSlug(title)
      const timestamp = Date.now().toString(36)
      finalSlug = `${baseSlug}-${timestamp}`
    }

    // Verify user has permission to create events for this masjid
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isAdmin = await prisma.masjidAdmin.findFirst({
      where: {
        masjidId,
        userId: session.user.id,
      },
    })
    const isModerator = await prisma.masjidModerator.findFirst({
      where: {
        masjidId,
        userId: session.user.id,
      },
    })

    if (!isSuperAdmin && !isAdmin && !isModerator) {
      return NextResponse.json(
        { error: 'You do not have permission to create events for this masjid' },
        { status: 403 }
      )
    }

    // Parse dates
    const parsedStartDate = new Date(startDate)
    const parsedEndDate = endDate ? new Date(endDate) : parsedStartDate

    // Build event data
    const eventData: any = {
      title,
      slug: finalSlug,
      description: description || null,
      category: category || null,
      masjidId,
      organiserId: finalOrganiserId || session.user.id, // Use provided or default to session user
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      startTime: startTime || null,
      endTime: endTime || null,
      timezone: timezone || 'America/New_York',
      isAllDay: isAllDay || false,
      isRecurring: isRecurring || false,
      recurrence: recurrence || null,
      location: location || venue || null,
      venue: venue || location || null,
      isOnline: isOnline || false,
      onlineLink: onlineLink || null,
      requiresRSVP: requiresRSVP !== undefined ? requiresRSVP : false,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      capacity: capacity ? parseInt(capacity) : (maxAttendees ? parseInt(maxAttendees) : null),
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      allowWaitlist: allowWaitlist || false,
      image: image || imageUrl || null, // Handle both field names
      isPublic: isPublic !== false,
      isFeatured: isFeatured || false,
      status: status || 'DRAFT',
      entryType: entryType || null,
      price: price ? parseFloat(price) : null,
      isFree: isFree !== false,
      currency: currency || 'USD',
      audience: audience || null,
      ageGroup: ageGroup || null,
    }

    // Create event
    const event = await prisma.event.create({
      data: eventData,
      include: {
        masjid: true,
        organiser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      event,
      message: 'Event created successfully',
    })
  } catch (error: any) {
    console.error('Create event error:', error)
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An event with this URL already exists' },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid masjid or organiser reference' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}
