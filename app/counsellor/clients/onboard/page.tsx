import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ClientOnboardingForm } from '@/components/counsellor/ClientOnboardingForm'
import Link from 'next/link'
import { getActiveCounsellorWhere } from '@/lib/counsellor-auth'

export default async function OnboardClientPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // SUPER_ADMIN: respect the cookie-selected counsellor
  if (session.user.role === 'SUPER_ADMIN') {
    const where = await getActiveCounsellorWhere(session.user.id, session.user.role)
    if (where) {
      profile = await prisma.counsellorProfile.findFirst({ where })
    } else if (!profile) {
      profile = await prisma.counsellorProfile.findFirst()
    }
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Fetch rooms so counsellor can optionally book one for the consultation
  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true },
  })

  return (
    <>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/counsellor/clients"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Clients
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Onboard New Client
          </h1>
          <p className="text-xl text-slate">
            Add a new client and book their initial consultation
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Onboarding Process
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Step 1: Create or link the client account</li>
                <li>• Step 2: Book the mandatory consultation session</li>
                <li>• Consultation covers the client&apos;s situation, therapy process & safeguarding</li>
                <li>• Regular counselling sessions can only be booked after consultation</li>
                <li>• Use the bypass option only when adding clients retrospectively</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <ClientOnboardingForm counsellorId={profile.id} rooms={rooms} />
        </div>
      </div>
    </>
  )
}
