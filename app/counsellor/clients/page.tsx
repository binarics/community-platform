import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClientCard } from '@/components/counsellor/ClientCard'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // If SUPER_ADMIN and no own profile, use first available counsellor profile
  if (!profile && session.user.role === 'SUPER_ADMIN') {
    profile = await prisma.counsellorProfile.findFirst()
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Collect client IDs from both explicit assignments AND bookings so both
  // lists stay in sync — a client booked directly (without going through
  // "onboard client") will now appear here too.
  const [clientRelations, bookingRows] = await Promise.all([
    prisma.clientCounsellor.findMany({
      where: { counsellorId: profile.id, isActive: true },
      select: {
        clientId: true,
        consultationStatus: true,
      },
    }),
    prisma.booking.findMany({
      where: { counsellorId: profile.id },
      select: { clientId: true },
      distinct: ['clientId'],
    }),
  ])

  // Build a map of clientId -> consultationStatus
  const consultationStatusMap = new Map(
    clientRelations.map((r) => [r.clientId, r.consultationStatus])
  )

  const assignedIds = new Set(clientRelations.map((r) => r.clientId))
  const allClientIds = [
    ...assignedIds,
    ...bookingRows.map((b) => b.clientId).filter((id) => !assignedIds.has(id)),
  ]

  const clients = await prisma.user.findMany({
    where: { id: { in: allClientIds } },
    include: {
      clientBookings: {
        where: { counsellorId: profile.id },
        select: { id: true, status: true, startTime: true },
        orderBy: { startTime: 'desc' },
      },
    },
  })

  // Calculate stats
  const activeClients = clients.filter((c) => {
    const upcomingSessions = c.clientBookings.filter(
      (b) => b.status === 'SCHEDULED' && new Date(b.startTime) > new Date()
    )
    return upcomingSessions.length > 0
  }).length

  const totalSessions = clients.reduce((sum, c) => sum + c.clientBookings.length, 0)

  const pendingConsultations = clientRelations.filter(
    (r) => r.consultationStatus === 'PENDING' || r.consultationStatus === 'SCHEDULED'
  ).length

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">My Clients</h1>
              <p className="text-xl text-slate">Manage your client relationships and sessions</p>
            </div>

            <Link href="/counsellor/clients/onboard" className="btn btn-primary">
              + Add Client
            </Link>
          </div>
        </div>

        {/* Consultation Pending Banner */}
        {pendingConsultations > 0 && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-amber-800 mb-1">
                {pendingConsultations} client{pendingConsultations > 1 ? 's' : ''} awaiting consultation
              </div>
              <p className="text-sm text-amber-700">
                Consultations must be completed before counselling sessions can begin. Clients with
                a &quot;Consultation Pending&quot; or &quot;Consultation Booked&quot; badge below need their
                initial consultation session.
              </p>
            </div>
          </>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Clients</div>
            <div className="font-display text-4xl font-bold text-charcoal">{clients.length}</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Active Clients</div>
            <div className="font-display text-4xl font-bold text-green-600">{activeClients}</div>
            <div className="text-sm text-slate">with upcoming sessions</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Sessions</div>
            <div className="font-display text-4xl font-bold text-sage-600">{totalSessions}</div>
            <div className="text-sm text-slate">all time</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Consultations Due</div>
            <div className={`font-display text-4xl font-bold ${pendingConsultations > 0 ? 'text-amber-600' : 'text-charcoal'}`}>
              {pendingConsultations}
            </div>
            <div className="text-sm text-slate">pending or scheduled</div>
          </div>
        </div>

        {/* Client List */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">All Clients</h2>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No Clients Yet
              </h3>
              <p className="text-slate mb-6">
                Get started by onboarding your first client
              </p>
              <Link href="/counsellor/clients/onboard" className="btn btn-primary">
                + Onboard First Client
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  consultationStatus={consultationStatusMap.get(client.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
