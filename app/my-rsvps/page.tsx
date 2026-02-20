import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { CancelRSVPButton } from '@/components/CancelRSVPButton'

export default async function MyRSVPsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const rsvps = await prisma.rSVP.findMany({
    where: {
      userId: session.user.id,
      status: 'CONFIRMED',
      event: {
        startDate: { gte: new Date() },
      },
    },
    include: {
      event: {
        include: {
          organisation: true,
          _count: { select: { rsvps: true } },
        },
      },
    },
    orderBy: {
      event: { startDate: 'asc' },
    },
  })

  const pastRSVPs = await prisma.rSVP.findMany({
    where: {
      userId: session.user.id,
      event: {
        startDate: { lt: new Date() },
      },
    },
    include: {
      event: {
        include: {
          organisation: true,
        },
      },
    },
    orderBy: {
      event: { startDate: 'desc' },
    },
    take: 10,
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            My RSVPs
          </h1>
          <p className="text-xl text-slate">
            Events you&apos;re attending and your attendance history
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Upcoming Events
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {rsvps.length}
            </div>
            <div className="text-sm text-sage-500">
              You&apos;re attending
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Past Events
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {pastRSVPs.length}
            </div>
            <div className="text-sm text-sage-500">
              Previously attended
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Attendance
            </div>
            <div className="font-display text-4xl font-bold text-charcoal mb-1">
              {rsvps.length + pastRSVPs.length}
            </div>
            <div className="text-sm text-sage-500">
              All time
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <section className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-3xl font-bold text-charcoal">
              Upcoming Events
            </h2>
            <Link href="/discover" className="btn btn-outline">
              Browse More Events
            </Link>
          </div>

          {rsvps.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No upcoming events
              </h3>
              <p className="text-slate mb-6">
                You haven&apos;t RSVP&apos;d to any events yet. Discover events happening in your community!
              </p>
              <Link href="/discover" className="btn btn-primary">
                Discover Events
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {rsvps.map((rsvp) => {
                const event = rsvp.event
                const date = new Date(event.startDate)
                const day = date.getDate()
                const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
                const startTime = date.toLocaleTimeString('en-GB', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })
                const endDate = new Date(event.endDate)
                const endTime = endDate.toLocaleTimeString('en-GB', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })

                const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <div key={rsvp.id} className="card p-0 overflow-hidden grid md:grid-cols-[200px_1fr] gap-0">
                    <Link 
                      href={`/events/${event.slug}`}
                      className="relative h-48 md:h-auto bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center"
                    >
                      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md p-3 text-center">
                        <div className="text-2xl font-bold text-sage-500 leading-none">{day}</div>
                        <div className="text-xs font-semibold text-slate uppercase mt-1">{month}</div>
                      </div>
                      {daysUntil <= 1 && (
                        <div className="absolute top-4 right-4 bg-terracotta-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {daysUntil === 0 ? 'TODAY' : 'TOMORROW'}
                        </div>
                      )}
                    </Link>

                    <div className="p-6">
                      <div className="flex gap-2 mb-3">
                        {event.organisation.verified && (
                          <span className="badge bg-sage-100 text-sage-700">✓ Verified</span>
                        )}
                        <span className="badge bg-green-100 text-green-700">✓ RSVP&apos;d</span>
                        <span className="badge bg-clay-100 text-clay-600">{event.entryType}</span>
                      </div>

                      <Link href={`/events/${event.slug}`}>
                        <h3 className="font-display text-2xl font-bold text-charcoal mb-2 hover:text-sage-600 transition">
                          {event.title}
                        </h3>
                      </Link>

                      <div className="text-sage-500 font-semibold mb-3">
                        {event.organisation.name}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-slate mb-4">
                        <span className="flex items-center gap-1">
                          <span>🕐</span>
                          <span>{startTime} - {endTime}</span>
                        </span>
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{event.venue}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          <span>
                            {daysUntil === 0 ? 'Today' : 
                             daysUntil === 1 ? 'Tomorrow' : 
                             `In ${daysUntil} days`}
                          </span>
                        </span>
                      </div>

                      <p className="text-slate leading-relaxed line-clamp-2 mb-4">
                        {event.description}
                      </p>

                      <div className="flex justify-between items-center pt-4 border-t border-sage-100">
                        <span className="text-sm text-slate">
                          <strong className="text-sage-500">{event._count.rsvps}</strong> attending
                        </span>
                        <div className="flex gap-3">
                          <Link 
                            href={`/events/${event.slug}`}
                            className="btn btn-outline btn-sm"
                          >
                            View Details
                          </Link>
                          <CancelRSVPButton eventId={event.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastRSVPs.length > 0 && (
          <section>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Past Events
            </h2>

            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-sage-50 border-b border-sage-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {pastRSVPs.map((rsvp) => {
                    const event = rsvp.event
                    const date = new Date(event.startDate)
                    
                    return (
                      <tr key={rsvp.id} className="hover:bg-sage-50 transition">
                        <td className="px-6 py-4">
                          <Link 
                            href={`/events/${event.slug}`}
                            className="font-semibold text-charcoal hover:text-sage-600"
                          >
                            {event.title}
                          </Link>
                          <div className="text-sm text-slate">{event.category}</div>
                        </td>
                        <td className="px-6 py-4 text-charcoal">
                          {date.toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-slate">
                          {event.organisation.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="badge bg-gray-100 text-gray-700">
                            {rsvp.checkedIn ? '✓ Attended' : 'RSVP&apos;d'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
