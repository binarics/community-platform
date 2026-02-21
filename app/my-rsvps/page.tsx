import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function MyRSVPsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const rsvps = await prisma.eventRSVP.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          organisation: true,
          masjid: true, // FIX: Include masjid
        },
      },
    },
    orderBy: {
      event: {
        startDate: 'asc',
      },
    },
  })

  const upcoming = rsvps.filter(rsvp => new Date(rsvp.event.startDate) >= new Date())
  const past = rsvps.filter(rsvp => new Date(rsvp.event.startDate) < new Date())

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            My RSVPs
          </h1>
          <p className="text-xl text-slate">
            View and manage your event registrations
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Upcoming Events
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {upcoming.length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Past Events
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {past.length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total RSVPs
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {rsvps.length}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Upcoming Events
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {upcoming.map(({ event, status, guests }) => {
                const startDate = new Date(event.startDate)
                // FIX: Handle both masjid and organisation
                const orgName = event.masjid?.name || event.organisation?.name || 'Community Event'
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="card p-6 hover:-translate-y-1 transition"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-sage-100 to-terracotta-100 rounded-xl flex flex-col items-center justify-center">
                        <div className="font-display text-2xl font-bold text-sage-600">
                          {startDate.getDate()}
                        </div>
                        <div className="text-xs uppercase text-slate">
                          {startDate.toLocaleDateString('en-GB', { month: 'short' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-xl font-bold text-charcoal mb-1 truncate">
                          {event.title}
                        </h3>
                        <div className="text-sm text-sage-500 mb-2">
                          {orgName}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="badge bg-sage-100 text-sage-700">
                            {status}
                          </span>
                          {guests > 0 && (
                            <span className="text-slate">
                              +{guests} {guests === 1 ? 'guest' : 'guests'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Past Events
            </h2>
            <div className="space-y-4">
              {past.map(({ event, status }) => {
                const startDate = new Date(event.startDate)
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="card p-4 hover:border-sage-300 transition flex items-center gap-4"
                  >
                    <div className="text-2xl">📅</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-charcoal truncate">
                        {event.title}
                      </h3>
                      <div className="text-sm text-slate">
                        {startDate.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span className="badge bg-gray-100 text-gray-700">
                      Attended
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {rsvps.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No RSVPs Yet
            </h3>
            <p className="text-slate mb-6">
              You haven't RSVP'd to any events. Explore upcoming events to get started!
            </p>
            <Link href="/discover" className="btn btn-primary inline-flex">
              Discover Events
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
