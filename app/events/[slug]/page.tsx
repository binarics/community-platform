import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { EventRSVPButton } from '@/components/events/EventRSVPButton'
import { EventComments } from '@/components/events/EventComments'
import { ShareButton } from '@/components/events/ShareButton'

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      masjid: true,
      organisation: true,
      organiser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rsvps: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              updatedAt: 'asc',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  // FIX: Check if event is published (PUBLISHED status, not APPROVED)
  if (event.status !== 'PUBLISHED' && (!session || session.user.role !== 'SUPER_ADMIN')) {
    notFound()
  }

  // Check if user has RSVPed
  const userRSVP = session
    ? event.rsvps.find((rsvp) => rsvp.userId === session.user.id)
    : null

  const startDate = new Date(event.startDate)
  const endDate = event.endDate ? new Date(event.endDate) : null
  const day = startDate.getDate()
  const month = startDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const year = startDate.getFullYear()
  const fullDate = startDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const startTime =
    event.startTime ||
    startDate.toLocaleTimeString('en-GB', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  const endTime = event.endTime || (endDate
    ? endDate.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null)

  // Determine organization details
  const orgName = event.masjid?.name || event.organisation?.name || 'Community Event'
  const orgType = event.masjid ? 'masjid' : 'organisation'
  const orgSlug = event.masjid?.slug || event.organisation?.slug

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Back Link */}
        <Link
          href="/discover"
          className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-6 inline-block"
        >
          ← Back to Events
        </Link>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Main Content */}
          <div>
            {/* Event Header */}
            <div className="card p-8 mb-8">
              {/* FIX: Use 'image' field instead of 'imageUrl' */}
              {event.image && (
                <div className="mb-6 -mx-8 -mt-8">
                  <img
                    src={event.image}
                    alt={event.title || 'Event'}
                    className="w-full h-64 object-cover rounded-t-2xl"
                  />
                </div>
              )}

              {/* Category & Status */}
              <div className="flex items-center gap-3 mb-4">
                {event.category && (
                  <span className="badge bg-sage-100 text-sage-700">{event.category}</span>
                )}
                {event.status !== 'PUBLISHED' && (
                  <span className="badge bg-amber-100 text-amber-700">{event.status}</span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-4xl font-bold text-charcoal mb-4">
                {event.title}
              </h1>

              {/* Organization Link */}
              {orgSlug ? (
                <Link
                  href={orgType === 'masjid' ? `/masjids/${orgSlug}` : `#`}
                  className="text-sage-600 hover:text-sage-700 font-semibold text-lg mb-6 inline-flex items-center gap-2"
                >
                  {event.masjid ? '🕌' : '🏢'} {orgName}
                </Link>
              ) : (
                <div className="text-sage-600 font-semibold text-lg mb-6 flex items-center gap-2">
                  {event.masjid ? '🕌' : '🏢'} {orgName}
                </div>
              )}

              {/* Description */}
              <div className="prose prose-lg max-w-none text-slate leading-relaxed mt-6">
                {event.description?.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
                Discussion ({event.comments.length})
              </h2>
              <EventComments
                eventId={event.id}
                eventSlug={event.slug || ''}
                comments={event.comments}
                currentUserId={session?.user.id}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date Card */}
            <div className="card p-6 text-center">
              <div className="inline-block bg-gradient-to-br from-sage-500 to-sage-600 text-white rounded-2xl p-6 mb-4">
                <div className="text-sm font-bold mb-1">{month}</div>
                <div className="text-5xl font-bold">{day}</div>
                <div className="text-sm mt-1">{year}</div>
              </div>
              <div className="font-semibold text-charcoal text-lg">{fullDate}</div>
              <div className="text-sage-600 font-semibold mt-2">
                {startTime}
                {endTime && ` - ${endTime}`}
              </div>
            </div>

            {/* RSVP Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold uppercase text-slate">Attendees</div>
                <div className="font-display text-2xl font-bold text-charcoal">
                  {event.rsvps.length}
                  {event.capacity && <span className="text-slate text-lg">/{event.capacity}</span>}
                </div>
              </div>

              <EventRSVPButton
                eventId={event.id}
                eventSlug={event.slug || ''}
                userRSVP={userRSVP}
                isLoggedIn={!!session}
                capacity={event.capacity}
                currentCount={event.rsvps.length}
              />

              {/* Recent Attendees */}
              {event.rsvps.length > 0 && (
                <div className="mt-4 pt-4 border-t border-sage-100">
                  <div className="text-xs font-semibold uppercase text-slate mb-3">
                    Recent Attendees
                  </div>
                  <div className="space-y-2">
                    {event.rsvps.slice(0, 5).map((rsvp) => (
                      <div key={rsvp.id} className="flex items-center gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display font-bold text-terracotta-600">
                          {rsvp.user.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-charcoal">{rsvp.user.name || 'Anonymous'}</span>
                      </div>
                    ))}
                    {event.rsvps.length > 5 && (
                      <div className="text-xs text-slate">
                        +{event.rsvps.length - 5} more attending
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Event Details
              </h3>

              <div className="space-y-4 text-sm">
                {/* Location */}
                {event.location && (
                  <div>
                    <div className="flex items-center gap-2 text-slate mb-1">
                      <span>📍</span>
                      <span className="font-semibold">Location</span>
                    </div>
                    <div className="text-charcoal pl-6">{event.location}</div>
                  </div>
                )}

                {/* Online Link */}
                {event.onlineLink && (
                  <div>
                    <div className="flex items-center gap-2 text-slate mb-1">
                      <span>💻</span>
                      <span className="font-semibold">Online Event</span>
                    </div>
                    <a
                      href={event.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-500 hover:text-sage-600 pl-6 break-all"
                    >
                      Join Online
                    </a>
                  </div>
                )}

                {/* Organizer */}
                {event.organiser && (
                  <div>
                    <div className="flex items-center gap-2 text-slate mb-1">
                      <span>👤</span>
                      <span className="font-semibold">Organizer</span>
                    </div>
                    <div className="text-charcoal pl-6">{event.organiser.name}</div>
                  </div>
                )}

                {/* Capacity */}
                {event.capacity && (
                  <div>
                    <div className="flex items-center gap-2 text-slate mb-1">
                      <span>🎫</span>
                      <span className="font-semibold">Capacity</span>
                    </div>
                    <div className="text-charcoal pl-6">
                      {event.capacity} attendees max
                      {event.rsvps.length >= event.capacity && (
                        <span className="text-red-600 ml-2">(Full)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share Card */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">Share Event</h3>
              <div className="text-sm text-slate mb-3">
                Spread the word about this event
              </div>
              <ShareButton title={event.title || 'Event'} description={event.description || ''} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
