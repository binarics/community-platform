import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { RSVPButton } from '@/components/RSVPButton'

export default async function DiscoverPage() {
  const events = await prisma.event.findMany({
    where: {
      status: 'APPROVED',
      startDate: { gte: new Date() },
    },
    include: {
      organisation: true,
      _count: { select: { rsvps: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Discover Events
          </h1>
          <p className="text-xl text-slate">
            {events.length} upcoming events in your area
          </p>
        </div>

        <div className="space-y-6">
          {events.map((event) => {
            const date = new Date(event.startDate)
            const day = date.getDate()
            const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
            const startTime = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
            const endDate = new Date(event.endDate)
            const endTime = endDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })

            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="card hover:-translate-y-1 grid md:grid-cols-[200px_1fr] gap-0 p-0 overflow-hidden">
                  <div className="relative h-48 md:h-auto bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center">
                    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md p-3 text-center">
                      <div className="text-2xl font-bold text-sage-500 leading-none">{day}</div>
                      <div className="text-xs font-semibold text-slate uppercase mt-1">{month}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      {event.organisation.verified && (
                        <span className="badge bg-sage-100 text-sage-700">✓ Verified</span>
                      )}
                      <span className="badge bg-clay-100 text-clay-600">{event.entryType}</span>
                      <span className="badge bg-sage-50 text-sage-700">{event.category}</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                      {event.title}
                    </h2>
                    <div className="text-sage-500 font-semibold mb-3">
                      {event.organisation.name}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate mb-4">
                      <span>🕐 {startTime} - {endTime}</span>
                      {event.venue && <span>📍 {event.venue}</span>}
                      <span>👥 {event.audience}</span>
                    </div>
                    <p className="text-slate leading-relaxed line-clamp-2 mb-4">
                      {event.description}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-sage-100">
                      <span className="text-sm text-slate">
                        <strong className="text-sage-500">{event._count.rsvps}</strong> attending
                      </span>
                      <RSVPButton 
                        eventId={event.id} 
                        initialRSVPCount={event._count.rsvps}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
