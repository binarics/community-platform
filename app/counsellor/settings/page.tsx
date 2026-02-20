import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default async function CounsellorSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/counsellor-dashboard')
  }

  const profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/counsellor-dashboard"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Counsellor Settings
          </h1>
          <p className="text-xl text-slate">
            Manage your profile, availability, and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Information */}
          <div className="card p-8">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
              Profile Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={session.user.name || ''}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={session.user.email || ''}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl"
                  readOnly
                />
              </div>
              <div className="pt-4">
                <Link href="/profile" className="btn btn-outline">
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="card p-8">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
              Availability
            </h3>
            <p className="text-slate mb-6">
              Set your working hours and availability for client bookings
            </p>
            <button className="btn btn-primary">
              Configure Availability
            </button>
          </div>

          {/* Notifications */}
          <div className="card p-8">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border-2 border-sage-100 rounded-xl cursor-pointer hover:border-sage-300 transition">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <div>
                  <div className="font-semibold text-charcoal">
                    New Booking Notifications
                  </div>
                  <div className="text-sm text-slate">
                    Receive email when clients book sessions
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-sage-100 rounded-xl cursor-pointer hover:border-sage-300 transition">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <div>
                  <div className="font-semibold text-charcoal">
                    Session Reminders
                  </div>
                  <div className="text-sm text-slate">
                    Get reminders 1 hour before sessions
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-sage-100 rounded-xl cursor-pointer hover:border-sage-300 transition">
                <input type="checkbox" className="w-5 h-5" />
                <div>
                  <div className="font-semibold text-charcoal">
                    Cancellation Notifications
                  </div>
                  <div className="text-sm text-slate">
                    Notify when clients cancel bookings
                  </div>
                </div>
              </label>
            </div>
            <div className="mt-6">
              <button className="btn btn-primary">
                Save Preferences
              </button>
            </div>
          </div>

          {/* Session Defaults */}
          <div className="card p-8">
            <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
              Session Defaults
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Default Session Duration
                </label>
                <select className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl">
                  <option>50 minutes</option>
                  <option>60 minutes</option>
                  <option>90 minutes</option>
                  <option>120 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-2">
                  Buffer Time Between Sessions
                </label>
                <select className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl">
                  <option>10 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                </select>
              </div>
            </div>
            <div className="mt-6">
              <button className="btn btn-primary">
                Save Defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
