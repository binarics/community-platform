'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ClientCardProps {
  client: {
    id: string
    name: string | null
    email: string
    clientBookings: Array<{
      id: string
      status: string
      startTime: Date | string
    }>
  }
}

export function ClientCard({ client }: ClientCardProps) {
  const router = useRouter()

  const totalSessions = client.clientBookings.length
  const completedSessions = client.clientBookings.filter((b) => b.status === 'COMPLETED').length
  const upcomingSessions = client.clientBookings.filter(
    (b) => b.status === 'SCHEDULED' && new Date(b.startTime) > new Date()
  ).length
  const lastSession = client.clientBookings[0]

  function handleBookClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/counsellor/bookings/new?clientId=${client.id}`)
  }

  return (
    <Link
      href={`/counsellor/clients/${client.id}`}
      className="card p-6 hover:-translate-y-1 hover:shadow-xl transition group block"
    >
      {/* Client Avatar & Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-2xl font-bold text-terracotta-600 flex-shrink-0">
          {client.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-xl font-bold text-charcoal mb-1 group-hover:text-sage-600 transition truncate">
            {client.name}
          </h3>
          <div className="text-sm text-slate truncate">{client.email}</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-sage-100">
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-charcoal">{totalSessions}</div>
          <div className="text-xs text-slate">Total</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-green-600">{completedSessions}</div>
          <div className="text-xs text-slate">Done</div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold text-sage-600">{upcomingSessions}</div>
          <div className="text-xs text-slate">Next</div>
        </div>
      </div>

      {/* Last Session */}
      {lastSession ? (
        <div className="text-sm text-slate">
          <div className="flex items-center gap-2 mb-1">
            <span>📅</span>
            <span className="font-semibold">Last Session:</span>
          </div>
          <div className="pl-6">
            {new Date(lastSession.startTime).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>No sessions yet</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-sage-100 flex gap-2">
        <button
          onClick={handleBookClick}
          className="flex-1 text-center px-3 py-2 bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-lg text-sm font-semibold transition"
        >
          + Book
        </button>
        <div className="flex-1 text-center px-3 py-2 bg-terracotta-50 text-terracotta-700 rounded-lg text-sm font-semibold group-hover:bg-terracotta-100 transition">
          View Profile →
        </div>
      </div>
    </Link>
  )
}
