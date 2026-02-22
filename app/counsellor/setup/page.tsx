import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CounsellorSetupForm } from '@/components/counsellor/CounsellorSetupForm'

export default async function CounsellorSetupPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Check if user is a counsellor - super admins should not complete counsellor setup
  if (session.user.role === 'SUPER_ADMIN') {
    redirect('/counsellor/dashboard')
  }

  if (session.user.role !== 'COUNSELLOR') {
    redirect('/')
  }

  // Check if profile already exists
  const existingProfile = await prisma.counsellorProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (existingProfile) {
    redirect('/counsellor/dashboard')
  }

  // Get available organisations (therapy centres)
  const organisations = await prisma.organisation.findMany({
    where: { type: 'THERAPY_CENTRE' },
  })

  return (
    <>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terracotta-50 text-terracotta-700 rounded-full text-sm font-semibold mb-4">
            <span>🧠</span>
            <span>COUNSELLOR ONBOARDING</span>
          </div>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xl text-slate">
            Set up your counsellor profile to start accepting bookings
          </p>
        </div>

        {/* Progress Steps */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <div className="font-semibold text-charcoal">Profile Info</div>
                <div className="text-sm text-slate">Bio & specializations</div>
              </div>
            </div>

            <div className="flex-1 h-0.5 bg-sage-200 mx-4"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-200 text-slate flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <div className="font-semibold text-slate">Availability</div>
                <div className="text-sm text-slate">Set your hours</div>
              </div>
            </div>

            <div className="flex-1 h-0.5 bg-sage-200 mx-4"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sage-200 text-slate flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <div className="font-semibold text-slate">Verification</div>
                <div className="text-sm text-slate">Admin approval</div>
              </div>
            </div>
          </div>

          <div className="bg-sage-50 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-semibold text-charcoal mb-1">
                  Before you start:
                </div>
                <ul className="text-sm text-slate space-y-1">
                  <li>• Have your professional qualifications ready</li>
                  <li>• Prepare a brief bio (2-3 paragraphs)</li>
                  <li>• Know your hourly rate and specializations</li>
                  <li>• Your profile will be reviewed before going live</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Form */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Step 1: Profile Information
          </h2>
          <CounsellorSetupForm 
            userId={session.user.id}
            userName={session.user.name || ''}
            userEmail={session.user.email || ''}
            organisations={organisations}
          />
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">❓</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Need help?
              </div>
              <p className="text-sm text-slate mb-3">
                If you have any questions about setting up your profile or the onboarding process, 
                please contact the admin team.
              </p>
              <a href="mailto:admin@platform.com" className="text-sage-600 hover:text-sage-700 font-semibold text-sm">
                Contact Support →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
