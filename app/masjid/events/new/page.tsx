import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'
import { EventForm } from '@/components/masjid/EventForm'
import Link from 'next/link'

async function getActiveMasjidId(userId: string, role: string) {
  const selectedId = await getSelectedMasjidId()

  if (role === 'SUPER_ADMIN') {
    if (selectedId) return selectedId
    const first = await prisma.masjid.findFirst({ select: { id: true }, orderBy: { name: 'asc' } })
    return first?.id ?? null
  }

  if (selectedId) {
    const access =
      (await prisma.masjidAdmin.findFirst({ where: { masjidId: selectedId, userId } })) ??
      (await prisma.masjidModerator.findFirst({ where: { masjidId: selectedId, userId } }))
    if (access) return selectedId
  }

  const admin = await prisma.masjidAdmin.findFirst({ where: { userId } })
  if (admin) return admin.masjidId
  const mod = await prisma.masjidModerator.findFirst({ where: { userId } })
  return mod?.masjidId ?? null
}

export default async function NewMasjidEventPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const masjidId = await getActiveMasjidId(session.user.id, session.user.role)
  if (!masjidId) redirect('/masjid/dashboard')

  const masjid = await prisma.masjid.findUnique({
    where: { id: masjidId },
    select: { id: true, name: true, allowEvents: true },
  })

  if (!masjid) redirect('/masjid/dashboard')

  if (!masjid.allowEvents && session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-4">Events Disabled</h1>
          <p className="text-slate mb-6">Event creation has been disabled for {masjid.name}.</p>
          <Link href="/masjid/settings" className="btn btn-outline">Go to Settings</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <Link href="/masjid/events" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
          ← Back to Events
        </Link>
        <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Create Event</h1>
        <p className="text-xl text-slate">Add a new event to {masjid.name}</p>
      </div>

      <div className="card p-6 mb-8 bg-sage-50 border border-sage-100">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📅</div>
          <div>
            <div className="font-semibold text-charcoal mb-2">Event Publishing</div>
            <ul className="text-sm text-slate space-y-1">
              <li>• Events are automatically associated with {masjid.name}</li>
              <li>• Members will receive notifications based on their preferences</li>
              <li>• You can set registration limits and RSVP requirements</li>
              <li>• Draft events can be saved and published later</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card p-8">
        <EventForm
          masjidId={masjid.id}
          masjidName={masjid.name}
          organiserId={session.user.id}
          successRedirect="/masjid/events"
        />
      </div>
    </div>
  )
}
