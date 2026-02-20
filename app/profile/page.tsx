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
    include: {
      _count: {
        select: {
          rsvps: true,
          comments: true,
          organisedEvents: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            My Profile
          </h1>
          <p className="text-xl text-slate">
            Manage your account settings and information
          </p>
        </div>

        {/* Profile Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-display text-3xl font-bold text-charcoal mb-1">
              {user._count.rsvps}
            </div>
            <div className="text-sm text-slate">Events Attending</div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">💬</div>
            <div className="font-display text-3xl font-bold text-charcoal mb-1">
              {user._count.comments}
            </div>
            <div className="text-sm text-slate">Comments</div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">🎭</div>
            <div className="font-display text-3xl font-bold text-charcoal mb-1 capitalize">
              {user.role.replace('_', ' ').toLowerCase()}
            </div>
            <div className="text-sm text-slate">Account Type</div>
          </div>

          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">
              {user._count.organisedEvents > 0 ? '🎪' : '👤'}
            </div>
            <div className="font-display text-3xl font-bold text-charcoal mb-1">
              {user._count.organisedEvents || '-'}
            </div>
            <div className="text-sm text-slate">Events Organised</div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="card p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                Profile Information
              </h2>
              <p className="text-slate">
                Update your personal details
              </p>
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center font-display text-3xl font-bold text-sage-600">
              {user.name?.[0] || 'U'}
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate mb-2">
                  Full Name
                </label>
                <div className="px-4 py-3 bg-sage-50 rounded-xl text-charcoal font-medium">
                  {user.name || 'Not set'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate mb-2">
                  Email Address
                </label>
                <div className="px-4 py-3 bg-sage-50 rounded-xl text-charcoal font-medium">
                  {user.email}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate mb-2">
                Account Role
              </label>
              <div className="px-4 py-3 bg-sage-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="badge bg-sage-100 text-sage-700">
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className="text-sm text-slate">
                    {user.role === 'SUPER_ADMIN' && 'Full platform access'}
                    {user.role === 'MASJID_ADMIN' && 'Can manage Masjid and events'}
                    {user.role === 'ORGANISER' && 'Can create and manage events'}
                    {user.role === 'COMMUNITY_MEMBER' && 'Can RSVP and comment on events'}
                    {user.role === 'COUNSELLOR' && 'Can manage counselling bookings'}
                    {user.role === 'CLIENT' && 'Can book counselling sessions'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate mb-2">
                Member Since
              </label>
              <div className="px-4 py-3 bg-sage-50 rounded-xl text-charcoal font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          <ProfileEditForm user={user} />
        </div>

        {/* Account Actions */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Account Actions
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-sage-50 rounded-xl">
              <div>
                <div className="font-semibold text-charcoal mb-1">
                  Change Password
                </div>
                <div className="text-sm text-slate">
                  Update your password to keep your account secure
                </div>
              </div>
              <button className="btn btn-outline btn-sm">
                Update
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <div className="font-semibold text-red-900 mb-1">
                  Delete Account
                </div>
                <div className="text-sm text-red-700">
                  Permanently delete your account and all data
                </div>
              </div>
              <button className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
