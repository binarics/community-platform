import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function ClientsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  const profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Get ONLY clients assigned to this counsellor
  const clientRelations = await prisma.clientCounsellor.findMany({
    where: {
      counsellorId: profile.id,
    },
    include: {
      client: {
        include: {
          clientBookings: {
            where: { counsellorId: profile.id },
            select: {
              id: true,
              status: true,
              startTime: true,
            },
            orderBy: { startTime: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      assignedAt: 'desc',
    },
  })

  const clients = clientRelations.map(rel => rel.client)

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                My Clients
              </h1>
              <p className="text-xl text-slate">
                Manage your client relationships and sessions
              </p>
            </div>

            <Link href="/counsellor/clients/onboard" className="btn btn-primary">
              + Add Client
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Clients
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {clients.length}
            </div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Active Clients
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {clients.filter(c => c.clientBookings.length > 0).length}
            </div>
            <div className="text-sm text-slate">with bookings</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              New Clients
            </div>
            <div className="font-display text-4xl font-bold text-sage-600">
              {clients.filter(c => c.clientBookings.length === 0).length}
            </div>
            <div className="text-sm text-slate">no sessions yet</div>
          </div>

          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              This Month
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {clientRelations.filter(rel => {
                const assignedThisMonth = new Date(rel.assignedAt).getMonth() === new Date().getMonth()
                return assignedThisMonth
              }).length}
            </div>
            <div className="text-sm text-slate">onboarded</div>
          </div>
        </div>

        {/* Client List */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            All Clients ({clients.length})
          </h2>

          {clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                No Clients Yet
              </h3>
              <p className="text-slate mb-6">
                Start by onboarding your first client
              </p>
              <Link href="/counsellor/clients/onboard" className="btn btn-primary">
                + Onboard First Client
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => {
                const lastBooking = client.clientBookings[0]
                const hasBookings = client.clientBookings.length > 0

                return (
                  <Link
                    key={client.id}
                    href={`/counsellor/clients/${client.id}`}
                    className="block p-6 border-2 border-sage-100 hover:border-sage-300 rounded-xl transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-xl font-bold text-terracotta-600">
                          {client.name?.[0] || 'C'}
                        </div>

                        {/* Client Info */}
                        <div>
                          <h3 className="font-display text-xl font-bold text-charcoal mb-1">
                            {client.name || 'Unnamed Client'}
                          </h3>
                          <div className="text-sm text-slate mb-2">
                            {client.email}
                          </div>
                          
                          {hasBookings ? (
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-slate">
                                Last session: {new Date(lastBooking.startTime).toLocaleDateString()}
                              </span>
                              <span className={`badge ${
                                lastBooking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                lastBooking.status === 'SCHEDULED' ? 'bg-sage-100 text-sage-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {lastBooking.status}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="badge bg-terracotta-100 text-terracotta-700">
                                🆕 New Client
                              </span>
                              <span className="text-sm text-slate">
                                No sessions yet
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions - REMOVED onClick handler */}
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm text-slate">
                          Joined {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                        {!hasBookings && (
                          <span className="text-sm text-sage-600 font-semibold">
                            Book First Session →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}