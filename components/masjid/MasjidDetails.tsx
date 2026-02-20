'use client'

interface MasjidDetailsProps {
  masjid: any
}

export function MasjidDetails({ masjid }: MasjidDetailsProps) {
  return (
    <div className="card p-8">
      <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
        About
      </h2>

      {masjid.description && (
        <p className="text-slate mb-6 leading-relaxed">
          {masjid.description}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Location */}
        <div>
          <h3 className="font-semibold text-charcoal mb-3">Location</h3>
          <div className="space-y-2 text-sm text-slate">
            {masjid.address && <div>📍 {masjid.address}</div>}
            <div>{masjid.city}, {masjid.state}</div>
            <div>{masjid.country} {masjid.postalCode}</div>
          </div>
        </div>

        {/* Contact */}
        {(masjid.phone || masjid.email || masjid.website) && (
          <div>
            <h3 className="font-semibold text-charcoal mb-3">Contact</h3>
            <div className="space-y-2 text-sm text-slate">
              {masjid.phone && <div>📞 {masjid.phone}</div>}
              {masjid.email && <div>✉️ {masjid.email}</div>}
              {masjid.website && (
                <div>
                  🌐 <a href={masjid.website} target="_blank" rel="noopener noreferrer" className="text-sage-500 hover:underline">
                    Visit Website
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Capacity */}
        {masjid.capacity && (
          <div>
            <h3 className="font-semibold text-charcoal mb-3">Capacity</h3>
            <div className="text-sm text-slate">
              👥 {masjid.capacity} people
            </div>
          </div>
        )}
      </div>
    </div>
  )
}