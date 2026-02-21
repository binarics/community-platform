import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { ClientOnboardingForm } from '@/components/counsellor/ClientOnboardingForm'
import Link from 'next/link'

export default async function OnboardClientPage() {
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

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

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
            Add a new client to your practice
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Client Onboarding
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Create a new client account or link an existing user</li>
                <li>• Client will be assigned to you automatically</li>
                <li>• You can book their first session immediately after</li>
                <li>• Client data is private and only visible to you</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <ClientOnboardingForm counsellorId={profile.id} />
        </div>
      </div>
    </div>
  )
}