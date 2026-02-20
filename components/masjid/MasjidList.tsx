'use client'

import Link from 'next/link'

interface Masjid {
  id: string
  name: string
  city: string
  country: string
  description: string | null
  logo: string | null
  isActive: boolean
  _count: {
    events: number
    members: number
    moderators: number
  }
  admins: Array<{
    user: {
      name: string | null
    }
  }>
}

interface MasjidListProps {
  masjids: Masjid[]
}

export function MasjidList({ masjids }: MasjidListProps) {
  if (masjids.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🕌</div>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
          No Masjids Yet
        </h3>
        <p className="text-slate mb-6">
          Create your first masjid to get started
        </p>
        <Link href="/admin/masjid/new" className="btn btn-primary">
          + Create Masjid
        </Link>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {masjids.map((masjid) => (
        <Link 
          key={masjid.id}
          href={`/admin/masjid/${masjid.id}`}
          className="card p-6 hover:shadow-lg transition"
        >
          {/* Logo/Image */}
          {masjid.logo ? (
            <img 
              src={masjid.logo} 
              alt={masjid.name}
              className="w-16 h-16 object-cover rounded-xl mb-4"
            />
          ) : (
            <div className="w-16 h-16 bg-sage-100 rounded-xl flex items-center justify-center text-3xl mb-4">
              🕌
            </div>
          )}

          {/* Name and Location */}
          <h3 className="font-display text-xl font-bold text-charcoal mb-1">
            {masjid.name}
          </h3>
          <p className="text-sm text-slate mb-3">
            📍 {masjid.city}, {masjid.country}
          </p>

          {/* Description */}
          {masjid.description && (
            <p className="text-sm text-slate mb-4 line-clamp-2">
              {masjid.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-slate mb-3">
            <span>📅 {masjid._count.events} events</span>
            <span>👥 {masjid._count.members} members</span>
          </div>

          {/* Admins */}
          <div className="text-xs text-slate">
            Admins: {masjid.admins.map(a => a.user.name).filter(Boolean).join(', ') || 'None'}
          </div>

          {/* Status Badge */}
          <div className="mt-4">
            {masjid.isActive ? (
              <span className="badge bg-green-100 text-green-700">Active</span>
            ) : (
              <span className="badge bg-gray-100 text-gray-700">Inactive</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}