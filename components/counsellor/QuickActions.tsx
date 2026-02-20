import Link from 'next/link'

export function QuickActions({ counsellorId }: { counsellorId: string }) {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-12">
      <Link href="/counsellor/clients" className="card p-6 text-center hover:-translate-y-1 transition">
        <div className="text-3xl mb-2">👥</div>
        <div className="font-semibold text-charcoal">Manage Clients</div>
      </Link>
      <Link href="/counsellor/rooms" className="card p-6 text-center hover:-translate-y-1 transition">
        <div className="text-3xl mb-2">🏠</div>
        <div className="font-semibold text-charcoal">Book Rooms</div>
      </Link>
      <Link href="/counsellor/bookings/new" className="card p-6 text-center hover:-translate-y-1 transition">
        <div className="text-3xl mb-2">📅</div>
        <div className="font-semibold text-charcoal">New Booking</div>
      </Link>
      <Link href="/counsellor/settings" className="card p-6 text-center hover:-translate-y-1 transition">
        <div className="text-3xl mb-2">⚙️</div>
        <div className="font-semibold text-charcoal">Settings</div>
      </Link>
    </div>
  )
}
