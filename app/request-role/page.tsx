import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { RoleRequestForm } from '@/components/roles/RoleRequestForm'

export default async function RequestRolePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Check if user already has a pending request
  const pendingRequest = await prisma.roleRequest.findFirst({
    where: {
      userId: session.user.id,
      status: 'PENDING',
    },
  })

  // Get user's current role and activity stats
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          organisedEvents: true,
          rsvps: true,
          comments: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Request Role Upgrade
          </h1>
          <p className="text-xl text-slate">
            Apply for a higher access level on the platform
          </p>
        </div>

        {/* Current Role */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold uppercase text-slate mb-1">
                Current Role
              </div>
              <div className="font-display text-2xl font-bold text-charcoal">
                {user?.role.replace('_', ' ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate mb-1">Your Activity</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="font-semibold text-sage-600">{user?._count.organisedEvents || 0}</span>
                  <span className="text-slate"> events</span>
                </div>
                <div>
                  <span className="font-semibold text-sage-600">{user?._count.rsvps || 0}</span>
                  <span className="text-slate"> RSVPs</span>
                </div>
                <div>
                  <span className="font-semibold text-sage-600">{user?._count.comments || 0}</span>
                  <span className="text-slate"> comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Request Notice */}
        {pendingRequest && (
          <div className="card p-8 mb-8 bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                  Request Pending
                </h3>
                <p className="text-slate mb-4">
                  You have a pending request for <strong>{pendingRequest.requestedRole}</strong> role. 
                  An administrator will review your application shortly.
                </p>
                <div className="text-sm text-slate">
                  <div>Requested: {new Date(pendingRequest.createdAt).toLocaleDateString()}</div>
                  {pendingRequest.reason && (
                    <div className="mt-2 p-3 bg-white rounded-lg">
                      <div className="font-semibold mb-1">Your reason:</div>
                      <div>{pendingRequest.reason}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Roles */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
            Available Roles
          </h2>

          <div className="space-y-4">
            {/* Organiser */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    📅 Organiser
                  </h3>
                  <p className="text-slate mb-3">
                    Create and manage events for your community
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-sage-50 text-sage-700">Create Events</span>
                    <span className="badge bg-sage-50 text-sage-700">Manage Attendees</span>
                    <span className="badge bg-sage-50 text-sage-700">Event Analytics</span>
                  </div>
                </div>
                <span className="badge bg-clay-100 text-clay-600">Approval Required</span>
              </div>
              <div className="text-sm text-slate mb-4">
                <strong>Requirements:</strong> Active community member, verified email, clear event plans
              </div>
            </div>

            {/* Masjid Admin */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    🕌 Masjid Admin
                  </h3>
                  <p className="text-slate mb-3">
                    Manage your Masjid&apos;s profile and approve events
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-sage-50 text-sage-700">Manage Masjid</span>
                    <span className="badge bg-sage-50 text-sage-700">Approve Events</span>
                    <span className="badge bg-sage-50 text-sage-700">Add Organisers</span>
                  </div>
                </div>
                <span className="badge bg-red-100 text-red-700">High Trust</span>
              </div>
              <div className="text-sm text-slate mb-4">
                <strong>Requirements:</strong> Official representative of a Masjid, verification documents required
              </div>
            </div>

            {/* Counsellor */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    🧠 Counsellor
                  </h3>
                  <p className="text-slate mb-3">
                    Provide professional counselling services (Eclectic House)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-terracotta-50 text-terracotta-700">Client Management</span>
                    <span className="badge bg-terracotta-50 text-terracotta-700">Booking Calendar</span>
                    <span className="badge bg-terracotta-50 text-terracotta-700">Session Notes</span>
                  </div>
                </div>
                <span className="badge bg-red-100 text-red-700">Professional</span>
              </div>
              <div className="text-sm text-slate mb-4">
                <strong>Requirements:</strong> Professional qualifications, certifications, background check, interview
              </div>
            </div>

            {/* Client */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                    💼 Client
                  </h3>
                  <p className="text-slate mb-3">
                    Book and manage counselling sessions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge bg-sage-50 text-sage-700">Book Sessions</span>
                    <span className="badge bg-sage-50 text-sage-700">View History</span>
                    <span className="badge bg-sage-50 text-sage-700">Provide Feedback</span>
                  </div>
                </div>
                <span className="badge bg-green-100 text-green-700">Easy Approval</span>
              </div>
              <div className="text-sm text-slate mb-4">
                <strong>Requirements:</strong> Verified email, basic profile completed
              </div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        {!pendingRequest && (
          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
              Submit Role Request
            </h2>
            <RoleRequestForm 
              userId={session.user.id}
              currentRole={session.user.role}
            />
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 p-6 bg-sage-50 rounded-2xl border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Need help choosing?
              </div>
              <p className="text-sm text-slate mb-3">
                Not sure which role is right for you? Here&apos;s a quick guide:
              </p>
              <ul className="text-sm text-slate space-y-1">
                <li>• <strong>Organiser:</strong> You want to create and host community events</li>
                <li>• <strong>Masjid Admin:</strong> You officially represent a Masjid or Islamic centre</li>
                <li>• <strong>Counsellor:</strong> You&apos;re a qualified therapist offering counselling services</li>
                <li>• <strong>Client:</strong> You want to book counselling sessions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
