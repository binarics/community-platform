export function UpcomingBookings({ bookings }: { bookings: any[] }) {
  return (
    <div className="card p-6">
      <h3 className="font-display text-xl font-bold text-charcoal mb-4">
        Upcoming Bookings
      </h3>
      {bookings.length === 0 ? (
        <p className="text-slate text-sm">No upcoming bookings</p>
      ) : (
        <div className="space-y-2">
          {bookings.slice(0, 5).map(b => (
            <div key={b.id} className="p-3 bg-sage-50 rounded-lg text-sm">
              <div className="font-semibold">{b.client.name}</div>
              <div className="text-xs text-slate">
                {new Date(b.startTime).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
