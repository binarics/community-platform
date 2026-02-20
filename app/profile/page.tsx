import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { ProfileEditForm } from '@/components/ProfileEditForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            My Profile
          </h1>
          <p className="text-xl text-slate">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <ProfileEditForm user={user} />

            {/* Account Stats */}
            <div className="card p-6">
              <h3 className="font-display text-xl font-bold text-charcoal mb-4">
                Account Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">Member Since</span>
                  <span className="font-semibold text-charcoal">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Account Type</span>
                  <span className="badge bg-sage-100 text-sage-700">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Role Badge */}
            <div className="card p-6 text-center">
              <div className="text-5xl mb-4">👤</div>
              <div className="font-display text-2xl font-bold text-charcoal mb-2">
                {user.name || 'User'}
              </div>
              <div className="text-sm text-slate mb-4">{user.email}</div>
              <span className="badge bg-gradient-to-br from-sage-100 to-terracotta-100 text-charcoal">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Links */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-bold text-charcoal mb-4">
                Quick Links
              </h3>
              <div className="space-y-2 text-sm">
                {['SUPER_ADMIN', 'MASJID_ADMIN', 'ORGANISER'].includes(user.role) && (
                  <a
                    href="/dashboard"
                    className="block p-3 hover:bg-sage-50 rounded-lg transition"
                  >
                    📊 Dashboard
                  </a>
                )}
                {['SUPER_ADMIN', 'COUNSELLOR'].includes(user.role) && (
                  <a
                    href="/counsellor-dashboard"
                    className="block p-3 hover:bg-sage-50 rounded-lg transition"
                  >
                    🧠 Counsellor Dashboard
                  </a>
                )}
                <a
                  href="/my-rsvps"
                  className="block p-3 hover:bg-sage-50 rounded-lg transition"
                >
                  📅 My RSVPs
                </a>
                {user.role === 'COMMUNITY_MEMBER' && (
                  <a
                    href="/request-role"
                    className="block p-3 hover:bg-sage-50 rounded-lg transition"
                  >
                    ⬆️ Request Role Upgrade
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
