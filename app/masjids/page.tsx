import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function MasjidsPage({ searchParams }: {
  searchParams: { city?: string, search?: string }
}) {
  // Get all active masjids
  const masjids = await prisma.masjid.findMany({
    where: {
      isActive: true,
      isPublic: true,
      ...(searchParams.city && { city: { contains: searchParams.city, mode: 'insensitive' } }),
      ...(searchParams.search && {
        OR: [
          { name: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
          { city: { contains: searchParams.search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      _count: {
        select: {
          events: {
            where: {
              status: 'APPROVED',
              startDate: { gte: new Date() },
            },
          },
          members: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Get unique cities for filter
  const cities = await prisma.masjid.findMany({
    where: {
      isActive: true,
      isPublic: true,
    },
    select: {
      city: true,
    },
    distinct: ['city'],
    orderBy: {
      city: 'asc',
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Masjid Directory
          </h1>
          <p className="text-xl text-slate">
            Find mosques and Islamic centers in your area
          </p>
        </div>

        {/* Search & Filters */}
        <div className="card p-6 mb-8">
          <form method="get" className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="search"
                defaultValue={searchParams.search}
                placeholder="Search by name, city, or description..."
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              />
            </div>
            <div className="w-64">
              <select
                name="city"
                defaultValue={searchParams.city}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {(searchParams.search || searchParams.city) && (
              <Link href="/masjids" className="btn btn-outline">
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-slate">
          Found <strong className="text-charcoal">{masjids.length}</strong> {masjids.length === 1 ? 'masjid' : 'masjids'}
        </div>

        {/* Masjids Grid */}
        {masjids.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🕌</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No Masjids Found
            </h3>
            <p className="text-slate">
              Try adjusting your search filters
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masjids.map((masjid) => (
              <Link
                key={masjid.id}
                href={`/masjids/${masjid.slug}`}
                className="card p-6 hover:-translate-y-1 hover:shadow-xl transition"
              >
                {/* Masjid Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-sage-100 to-terracotta-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    🕌
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-bold text-charcoal mb-1 truncate">
                      {masjid.name}
                    </h3>
                    <div className="text-sm text-slate">
                      📍 {masjid.city}, {masjid.country}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {masjid.description && (
                  <p className="text-sm text-slate mb-4 line-clamp-2">
                    {masjid.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm border-t border-sage-100 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sage-600">📅</span>
                    <span className="font-semibold text-charcoal">{masjid._count.events}</span>
                    <span className="text-slate">events</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sage-600">👥</span>
                    <span className="font-semibold text-charcoal">{masjid._count.members}</span>
                    <span className="text-slate">members</span>
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4">
                  <div className="text-sage-500 font-semibold text-sm flex items-center gap-2">
                    View Details
                    <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
