import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { AvailabilityEditor } from '@/components/counsellor/AvailabilityEditor'
import Link from 'next/link'

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get counsellor profile
  const profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  if (!profile && session.user.role !== 'SUPER_ADMIN') {
    redirect('/counsellor/setup')
  }

  // Parse current availability
  const currentAvailability = profile?.availability ? JSON.parse(profile.availability) : null

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/counsellor/calendar" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Calendar
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Set Your Availability
          </h1>
          <p className="text-xl text-slate">
            Define your working hours and available days
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                How Availability Works
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Set your regular working hours for each day of the week</li>
                <li>• Add breaks between sessions if needed</li>
                <li>• Mark days off when you&apos;re unavailable</li>
                <li>• Your calendar will reflect your availability settings</li>
                <li>• Clients can only book during your available hours</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Availability Editor */}
        <div className="card p-8">
          <AvailabilityEditor 
            counsellorId={profile?.id || ''}
            currentAvailability={currentAvailability}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📋</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Best Practices
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-slate">
                <div>
                  <strong className="text-charcoal">Regular Schedule:</strong> Try to maintain consistent hours each week
                </div>
                <div>
                  <strong className="text-charcoal">Buffer Time:</strong> Leave gaps between sessions for notes and breaks
                </div>
                <div>
                  <strong className="text-charcoal">Flexibility:</strong> You can always override for special appointments
                </div>
                <div>
                  <strong className="text-charcoal">Updates:</strong> Update your availability as your schedule changes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
