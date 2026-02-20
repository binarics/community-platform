'use client'

import Link from 'next/link'

interface MasjidEventsProps {
  events: any[]
  masjidId: string
}

export function MasjidEvents({ events, masjidId }: MasjidEventsProps) {
  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Recent Events
        </h2>
        <Link href={`/admin/masjid/${masjidId}/events`} className="text-sm text-sage-500 hover:text-sage-600 font-semibold">
          View All →
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-slate mb-4">No events yet</p>
          <Link href={`/admin/masjid/${masjidId}/events/new`} className="btn btn-primary">
            + Create First Event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link 
              key={event.id}
              href={`/events/${event.id}`}
              className="block p-4 border-2 border-sage-100 rounded-xl hover:border-sage-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal mb-1">
                    {event.title}
                  </h3>
                  <div className="text-sm text-slate space-x-4">
                    <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                    <span>⏰ {event.startTime}</span>
                    {event._count.rsvps > 0 && (
                      <span>👥 {event._count.rsvps} RSVPs</span>
                    )}
                  </div>
                </div>
                <span className={`badge ${
                  event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {event.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}