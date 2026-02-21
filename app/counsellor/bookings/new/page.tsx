import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { BookingForm } from '@/components/counsellor/BookingForm'
import Link from 'next/link'

export default async function CreateBookingPage({ searchParams }: { searchParams: { clientId?: string } }) {
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

  // Get ONLY clients assigned to this counsellor via ClientCounsellor relationship
  const clientRelations = await prisma.clientCounsellor.findMany({
    where: {
      counsellorId: profile.id,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      client: {
        name: 'asc',
      },
    },
  })

  const clients = clientRelations.map(rel => rel.client)

  // Get all available rooms
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  // Pre-select client if provided in URL
  const preSelectedClient = searchParams.clientId
    ? clients.find(c => c.id === searchParams.clientId) || null
    : null

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/counsellor/dashboard" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Book New Session
          </h1>
          <p className="text-xl text-slate">
            Schedule a counselling session with a client
          </p>
        </div>

        {/* No Clients Warning */}
        {clients.length === 0 && (
          <div className="card p-8 mb-8 bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⚠️</div>
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                  No Clients Yet
                </h3>
                <p className="text-slate mb-4">
                  You need to onboard a client before you can book a session.
                </p>
                <Link href="/counsellor/clients/onboard" className="btn btn-primary">
                  + Onboard Your First Client
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        {clients.length > 0 && (
          <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-semibold text-charcoal mb-2">
                  Booking a Session
                </div>
                <ul className="text-sm text-slate space-y-1">
                  <li>• Choose the client from your client list</li>
                  <li>• Select date and time for the session</li>
                  <li>• Pick a room (we&apos;ll check availability)</li>
                  <li>• Choose session type and add any notes</li>
                  <li>• Client will receive an email confirmation</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form */}
        {clients.length > 0 && (
          <div className="card p-8">
            <BookingForm
              counsellorId={profile.id}
              clients={clients}
              rooms={rooms}
              preSelectedClientId={searchParams.clientId}
            />
          </div>
        )}
      </div>
    </div>
  )
}