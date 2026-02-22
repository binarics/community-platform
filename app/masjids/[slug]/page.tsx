import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function MasjidDetailPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)

  const masjid = await prisma.masjid.findUnique({
    where: { slug: params.slug },
    include: {
      events: {
        where: {
          status: 'PUBLISHED',
          startDate: { gte: new Date() },
        },
        orderBy: {
          startDate: 'asc',
        },
        take: 20,
      },
      _count: {
        select: {
          events: true,
          members: true,
        },
      },
    },
  })

  if (!masjid || !masjid.isPublic || !masjid.isActive) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Back Link */}
        <Link
          href="/masjids"
          className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-6 inline-block"
        >
          ← Back to Directory
        </Link>

        {/* Masjid Header */}
        <div className="card p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-sage-100 to-terracotta-100 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0">
              🕌
            </div>
            <div className="flex-1">
              <h1 className="font-display text-4xl font-bold text-charcoal mb-3">
                {masjid.name}
              </h1>
              <div className="flex items-center gap-6 text-slate mb-4">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{masjid.address || `${masjid.city}, ${masjid.country}`}</span>
                </div>
                {masjid.phone && (
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${masjid.phone}`} className="hover:text-sage-500">
                      {masjid.phone}
                    </a>
                  </div>
                )}
              </div>
              {masjid.description && (
                <p className="text-slate leading-relaxed">
                  {masjid.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-sage-100">
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-charcoal mb-1">
                {masjid._count.events}
              </div>
              <div className="text-sm text-slate">Upcoming Events</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-charcoal mb-1">
                {masjid._count.members}
              </div>
              <div className="text-sm text-slate">Members</div>
            </div>
            <div className="text-center">
              {masjid.capacity ? (
                <>
                  <div className="font-display text-3xl font-bold text-charcoal mb-1">
                    {masjid.capacity}
                  </div>
                  <div className="text-sm text-slate">Capacity</div>
                </>
              ) : (
                <>
                  <div className="font-display text-3xl font-bold text-sage-500 mb-1">
                    ✓
                  </div>
                  <div className="text-sm text-slate">Active</div>
                </>
              )}
            </div>
          </div>

          {/* Contact & Social */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-sage-100">
            {masjid.website && (
              <a
                href={masjid.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-sm"
              >
                🌐 Website
              </a>
            )}
            {masjid.email && (
              <a href={`mailto:${masjid.email}`} className="btn btn-outline text-sm">
                ✉️ Email
              </a>
            )}
            {masjid.facebook && (
              <a
                href={masjid.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline text-sm"
              >
                Facebook
              </a>
            )}
          </div>
        </div>

        {/* Prayer Times (if available) */}
        {masjid.prayerTimes && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
              Prayer Times
            </h2>
            <div className="text-slate whitespace-pre-line">
              {masjid.prayerTimes}
            </div>
          </div>
        )}

        {/* Facilities (if available) */}
        {masjid.facilities && (
          <div className="card p-6 mb-8">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-4">
              Facilities
            </h2>
            <div className="text-slate whitespace-pre-line">
              {masjid.facilities}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Upcoming Events
          </h2>

          {masjid.events.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-slate">No upcoming events scheduled</p>
            </div>
          ) : (
            <div className="space-y-4">
              {masjid.events.map((event) => {
                const startDate = new Date(event.startDate)
                const day = startDate.getDate()
                const month = startDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="block p-6 border-2 border-sage-100 hover:border-sage-300 rounded-xl transition"
                  >
                    <div className="flex gap-6">
                      {/* Date Badge */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-sage-500 to-sage-600 text-white rounded-xl flex flex-col items-center justify-center">
                        <div className="text-2xl font-bold">{day}</div>
                        <div className="text-xs">{month}</div>
                      </div>

                      {/* Event Info */}
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate mb-2">
                          {event.startTime && (
                            <div className="flex items-center gap-1.5">
                              <span>🕐</span>
                              <span>{event.startTime}</span>
                            </div>
                          )}
                          {event.category && (
                            <div className="flex items-center gap-1.5">
                              <span>📂</span>
                              <span>{event.category}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1.5">
                              <span>📍</span>
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0 flex items-center">
                        <span className="text-sage-500 text-xl">→</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
