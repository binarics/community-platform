import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DiscoverPage({ searchParams }: {
  searchParams: { category?: string, masjid?: string, search?: string }
}) {
  const session = await getServerSession(authOptions)

  // Get all approved events (both masjid and organization events)
  const events = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: { gte: new Date() },
      ...(searchParams.category && { category: searchParams.category }),
      ...(searchParams.masjid && { masjidId: searchParams.masjid }),
      ...(searchParams.search && {
        OR: [
          { title: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      masjid: true,
      organisation: true,
      organiser: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
          comments: true,
        },
      },
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  // Get categories for filter - FIX: Use PUBLISHED status
  const categories = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      startDate: { gte: new Date() },
      category: { not: null },
    },
    select: {
      category: true,
    },
    distinct: ['category'],
  })

  // Get masjids for filter
  const masjids = await prisma.masjid.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Discover Events
          </h1>
          <p className="text-xl text-slate">
            Find Islamic events, classes, and community gatherings near you
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <form method="get" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search events..."
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              />
            </div>
            <div className="w-48">
              <select
                name="category"
                defaultValue={searchParams.category}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category || ''}>
                    {c.category}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-64">
              <select
                name="masjid"
                defaultValue={searchParams.masjid}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              >
                <option value="">All Masjids</option>
                {masjids.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Filter
            </button>
            {(searchParams.search || searchParams.category || searchParams.masjid) && (
              <Link href="/discover" className="btn btn-outline">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-slate">
          Found <strong className="text-charcoal">{events.length}</strong> upcoming{' '}
          {events.length === 1 ? 'event' : 'events'}
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No Events Found
            </h3>
            <p className="text-slate">
              {searchParams.search || searchParams.category || searchParams.masjid
                ? 'Try adjusting your filters'
                : 'Check back soon for upcoming events'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const startDate = new Date(event.startDate)
              const day = startDate.getDate()
              const month = startDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
              const year = startDate.getFullYear()
              const startTime = event.startTime || startDate.toLocaleTimeString('en-GB', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })

              // Determine the organization name (masjid or organisation)
              const orgName = event.masjid?.name || event.organisation?.name || 'Community Event'

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition group"
                >
                  {/* Image or Gradient Header */}
                  <div className="h-48 bg-gradient-to-br from-sage-100 via-terracotta-50 to-sage-50 relative overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title || 'Event'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl opacity-20">
                          {event.category === 'Religious' ? '🕌' : 
                           event.category === 'Educational' ? '📚' :
                           event.category === 'Social' ? '👥' :
                           event.category === 'Youth' ? '🌟' :
                           event.category === 'Charity' ? '💝' : '📅'}
                        </div>
                      </div>
                    )}
                    {/* Date Badge */}
                    <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 text-center min-w-[70px]">
                      <div className="text-xs font-bold text-sage-600">{month}</div>
                      <div className="text-2xl font-bold text-charcoal">{day}</div>
                      <div className="text-xs text-slate">{year}</div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Category Badge */}
                    {event.category && (
                      <div className="mb-3">
                        <span className="badge bg-sage-100 text-sage-700 text-xs">
                          {event.category}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="font-display text-xl font-bold text-charcoal mb-2 line-clamp-2 group-hover:text-sage-600 transition">
                      {event.title}
                    </h2>

                    {/* Organization */}
                    <div className="flex items-center gap-2 text-sage-600 font-semibold mb-3 text-sm">
                      {event.masjid ? '🕌' : '🏢'} {orgName}
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 text-sm text-slate mb-4">
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{startTime}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-slate leading-relaxed line-clamp-2 mb-4">
                        {event.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-sage-100">
                      <div className="flex items-center gap-4 text-sm text-slate">
                        <div className="flex items-center gap-1">
                          <span>👥</span>
                          <span className="font-semibold text-charcoal">{event._count.rsvps}</span>
                        </div>
                        {event._count.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <span>💬</span>
                            <span className="font-semibold text-charcoal">{event._count.comments}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-sage-500 font-semibold text-sm group-hover:text-sage-600">
                        View Details →
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
