import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { RSVPButton } from '@/components/RSVPButton'

export default async function EventPage({ params }: { params: { slug: string } }) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      organisation: true,
      organiser: true,
      _count: { select: { rsvps: true, comments: true } },
      comments: {
        where: { parentId: null },
        include: {
          user: true,
          replies: { include: { user: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!event) notFound()

  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const day = startDate.getDate()
  const month = startDate.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
  const startTime = startDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  const endTime = endDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  const fullDate = startDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-cream">
      <nav className="bg-white border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-display text-xl font-bold text-sage-500">
            Community Platform
          </Link>
          <Link href="/discover" className="text-slate hover:text-sage-500">
            ← Back to Events
          </Link>
        </div>
      </nav>

      <div className="h-80 bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center text-slate">
        Event Banner
      </div>

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-[1fr_360px] gap-12">
          <main>
            <div className="flex gap-2 mb-4">
              {event.organisation.verified && (
                <span className="badge bg-sage-100 text-sage-700">✓ Verified</span>
              )}
              <span className="badge bg-clay-100 text-clay-600">{event.entryType}</span>
              <span className="badge bg-sage-50 text-sage-700">{event.category}</span>
            </div>

            <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
              {event.title}
            </h1>

            <Link href={`/masjid/${event.organisation.slug}`} className="flex items-center gap-2 text-sage-500 font-semibold text-lg mb-8 hover:underline">
              <span>🕌</span>
              <span>{event.organisation.name}</span>
            </Link>

            <div className="card p-8 mb-8 grid md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl mb-2">📅</div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">Date & Time</div>
                <div className="font-semibold text-charcoal">{fullDate}</div>
                <div className="text-sm text-slate">{startTime} - {endTime}</div>
              </div>
              <div>
                <div className="text-3xl mb-2">📍</div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">Location</div>
                <div className="font-semibold text-charcoal">{event.venue || 'Online'}</div>
              </div>
              <div>
                <div className="text-3xl mb-2">👥</div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">Audience</div>
                <div className="font-semibold text-charcoal">{event.audience}</div>
                <div className="text-sm text-slate">{event.ageGroup}</div>
              </div>
              <div>
                <div className="text-3xl mb-2">🎫</div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">Entry</div>
                <div className="font-semibold text-charcoal">{event.entryType}</div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="font-display text-3xl font-bold text-charcoal mb-4">
                About This Event
              </h2>
              <div className="prose prose-lg max-w-none text-slate leading-relaxed">
                {event.description.split('\n').map((para, i) => (
                  <p key={i} className="mb-4">{para}</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
                Discussion ({event._count.comments})
              </h2>
              
              <div className="card p-6 mb-8">
                <textarea 
                  className="w-full p-4 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none" 
                  rows={3}
                  placeholder="Ask a question or share your thoughts..."
                />
                <div className="flex justify-between items-center mt-4">
                  <label className="flex items-center gap-2 text-sm text-slate">
                    <input type="checkbox" className="w-4 h-4" />
                    <span>Post anonymously</span>
                  </label>
                  <button className="btn btn-primary btn-sm">Post Comment</button>
                </div>
              </div>

              <div className="space-y-6">
                {event.comments.map((comment) => (
                  <div key={comment.id} className="card p-6">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center font-semibold text-sage-600">
                        {comment.anonymous ? '?' : comment.user.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-charcoal">
                          {comment.anonymous ? 'Community Member' : comment.user.name}
                        </div>
                        <div className="text-sm text-slate mb-2">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-slate leading-relaxed mb-3">{comment.content}</p>
                        <button className="text-sm text-sage-500 hover:text-sage-600 font-semibold">
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside>
            <div className="card p-6 mb-6 sticky top-24 border border-slate-200 shadow-sm rounded-xl">
              {/* 1. Centered Top Count */}
              <div className="flex flex-col items-center justify-center pb-6 mb-6 border-b border-slate-100">
                <div className="text-5xl font-display font-bold text-slate-900">
                  {event._count.rsvps}
                </div>
                <div className="text-sm text-slate-500 text-center">
                  people have RSVP'd
                </div>
              </div>

              {/* 2. RSVP Button (Centered/Full Width) */}
              <div className="flex flex-col items-center w-full mb-4">
                {/* Ensure RSVPButton component has 'w-full' inside it, 
                    or wrap it in a div that centers its contents */}
                <RSVPButton 
                  eventId={event.id} 
                  initialRSVPCount={event._count.rsvps} 
                />
              </div>

              {/* 3. Helper Text */}
              <p className="text-center text-xs text-slate-400 mb-6">
                Free to attend • No ticket required
              </p>

              {/* 4. Action Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button className="btn btn-outline btn-sm flex items-center justify-center gap-2">
                  <span>📅</span> Calendar
                </button>
                <button className="btn btn-outline btn-sm flex items-center justify-center gap-2">
                  <span>🔗</span> Share
                </button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-display text-lg font-bold mb-4">Location</h3>
              <div className="h-48 bg-sage-50 rounded-lg mb-4 flex items-center justify-center text-sm text-slate">
                Map View
              </div>
              <div className="text-sm mb-2 text-charcoal font-medium">
                {event.venue || 'Online Event'}
              </div>
              {event.organisation.address && (
                <div className="text-sm text-slate mb-3">
                  {event.organisation.address}<br />
                  {event.organisation.postcode}
                </div>
              )}
              <a href="#" className="text-sage-500 font-semibold text-sm hover:underline">
                Get Directions →
              </a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
