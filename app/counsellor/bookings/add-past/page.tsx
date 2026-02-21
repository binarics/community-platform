import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { PastSessionForm } from '@/components/counsellor/PastSessionForm'
import Link from 'next/link'

export default async function AddPastSessionPage() {
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

  // Get all clients
  const clientRelations = await prisma.clientCounsellor.findMany({
    where: {
      counsellorId: profile?.id,
      isActive: true,
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

  const clients = clientRelations.map((rel) => rel.client)

  // Get rooms
  const rooms = await prisma.room.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/counsellor/calendar"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Calendar
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Add Past Session
          </h1>
          <p className="text-xl text-slate">
            Log a session that was completed but not recorded in the calendar
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                When to Use This
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Forgot to schedule a completed session</li>
                <li>• Need to add sessions from before using this system</li>
                <li>• Emergency sessions that weren&apos;t pre-booked</li>
                <li>• Backdating sessions for record-keeping</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <PastSessionForm
            counsellorId={profile?.id || ''}
            clients={clients}
            rooms={rooms}
          />
        </div>
      </div>
    </div>
  )
}
