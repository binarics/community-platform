import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'

export default async function HomePage() {
  const upcomingEvents = await prisma.event.findMany({
    where: {
      status: 'APPROVED',
      startDate: { gte: new Date() },
    },
    include: {
      organisation: true,
      _count: { select: { rsvps: true } },
    },
    take: 6,
    orderBy: { startDate: 'asc' },
  })

  return (
    <div className="min-h-screen">
      <Navigation />
      {/* <nav className="sticky top-0 bg-cream/95 backdrop-blur border-b border-sage-100 z-50">
        <div className="max-w-6xl mx-auto px-8 py-5 flex justify-between items-center">
          <Link href="/" className="font-display text-2xl font-bold text-sage-500">
            Community Platform
          </Link>
          <div className="flex gap-6 items-center">
            <Link href="/discover" className="text-slate hover:text-sage-500 font-medium">
              Discover Events
            </Link>
            <Link href="/courses" className="text-slate hover:text-sage-500 font-medium">
              Courses
            </Link>
            <Link href="/counselling" className="text-slate hover:text-sage-500 font-medium">
              Counselling
            </Link>
            <Link href="/dashboard" className="btn btn-outline btn-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </nav> */}

      {/* Hero */}
      <section className="min-h-[600px] flex items-center bg-gradient-to-br from-sage-50 to-clay-100 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[600px] h-[600px] bg-sage-500/5 rounded-full" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[500px] h-[500px] bg-terracotta-400/5 rounded-full" />
        
        <div className="max-w-6xl mx-auto px-8 py-16 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-semibold text-sage-600 mb-6 shadow-sm">
              <span>🌱</span>
              <span>Connecting Communities</span>
            </div>
            
            <h1 className="font-display text-6xl font-bold text-charcoal leading-tight mb-6">
              Discover Local Events & Services
            </h1>
            
            <p className="text-xl text-slate leading-relaxed mb-10">
              Find community events, therapeutic courses, and counselling services — all in one trusted place.
            </p>
            
            <div className="flex gap-4">
              <Link href="/discover" className="btn btn-primary text-lg px-8 py-4">
                Browse Events
              </Link>
              <Link href="/courses" className="btn btn-outline text-lg px-8 py-4">
                View Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="max-w-6xl mx-auto px-8 py-24">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="font-display text-4xl font-bold text-charcoal mb-2">
              Upcoming Events
            </h2>
            <p className="text-lg text-slate">
              Happening soon in your community
            </p>
          </div>
          <Link href="/discover" className="btn btn-outline">
            View All Events
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => {
            const date = new Date(event.startDate)
            const day = date.getDate()
            const month = date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
            const time = date.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })

            return (
              <Link key={event.id} href={`/events/${event.slug}`}>
                <div className="card hover:-translate-y-1 p-0 overflow-hidden">
                  <div className="relative h-40 bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center">
                    <div className="absolute top-4 left-4 bg-white rounded-xl shadow-md p-2 text-center">
                      <div className="text-2xl font-bold text-sage-500 leading-none">{day}</div>
                      <div className="text-xs font-semibold text-slate uppercase">{month}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-3">
                      {event.organisation.verified && (
                        <span className="badge bg-sage-100 text-sage-700">✓ Verified</span>
                      )}
                      <span className="badge bg-clay-100 text-clay-600">{event.entryType}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-charcoal mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="text-sage-500 font-semibold text-sm mb-3">
                      {event.organisation.name}
                    </div>
                    <div className="flex gap-3 text-sm text-slate">
                      <span>🕐 {time}</span>
                      {event.venue && <span>📍 {event.venue}</span>}
                    </div>
                    <div className="mt-4 pt-4 border-t border-sage-100 text-sm text-slate">
                      <strong className="text-sage-500">{event._count.rsvps}</strong> attending
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-br from-sage-50 to-cream py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
              Everything In One Place
            </h2>
            <p className="text-lg text-slate">
              Events, courses, and services for your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-sage-100">
              <div className="w-16 h-16 bg-gradient-to-br from-sage-50 to-sage-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                📅
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Community Events
              </h3>
              <p className="text-slate leading-relaxed">
                Discover lectures, iftars, youth programmes, and more from verified Masjids.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-sm border border-sage-100">
              <div className="w-16 h-16 bg-gradient-to-br from-terracotta-50 to-terracotta-100 rounded-2xl flex items-center justify-center text-3xl mb-6">
                📚
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Therapeutic Courses
              </h3>
              <p className="text-slate leading-relaxed">
                Join structured courses on mindfulness, wellbeing, and Islamic contemplation.
              </p>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-sm border border-sage-100">
              <div className="w-16 h-16 bg-gradient-to-br from-clay-100 to-clay-300 rounded-2xl flex items-center justify-center text-3xl mb-6">
                💬
              </div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Counselling Services
              </h3>
              <p className="text-slate leading-relaxed">
                Book sessions with qualified Islamic counsellors in a safe, private setting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-16">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="font-display text-xl font-bold mb-4">Community Platform</div>
              <p className="text-white/70 leading-relaxed">
                Building stronger communities through real-world connection.
              </p>
            </div>
            <div>
              <div className="font-semibold mb-4">Product</div>
              <div className="space-y-2 text-white/70">
                <div><Link href="/discover">Discover Events</Link></div>
                <div><Link href="/courses">Courses</Link></div>
                <div><Link href="/counselling">Counselling</Link></div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-4">For Organisers</div>
              <div className="space-y-2 text-white/70">
                <div><Link href="/dashboard">Dashboard</Link></div>
                <div><Link href="#">How it Works</Link></div>
              </div>
            </div>
            <div>
              <div className="font-semibold mb-4">Company</div>
              <div className="space-y-2 text-white/70">
                <div><Link href="#">About</Link></div>
                <div><Link href="#">Contact</Link></div>
                <div><Link href="#">Privacy</Link></div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
            © 2026 Community Platform. Built with ❤️ for the community.
          </div>
        </div>
      </footer>
    </div>
  )
}
