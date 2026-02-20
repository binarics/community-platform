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

  // Get user's current role requests
  const existingRequests = await prisma.roleRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const pendingRequest = existingRequests.find(req => req.status === 'PENDING')

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Request Role Upgrade
          </h1>
          <p className="text-xl text-slate">
            Apply for additional permissions and responsibilities
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
                {session.user.role.replace('_', ' ')}
              </div>
            </div>
            <span className="badge bg-sage-100 text-sage-700 text-lg px-4 py-2">
              Active
            </span>
          </div>
        </div>

        {/* Available Roles Info */}
        <div className="card p-8 mb-8 bg-gradient-to-br from-sage-50 to-terracotta-50">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
            Available Roles
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl">
              <div className="font-semibold text-charcoal mb-2">🏢 ORGANISER</div>
              <p className="text-sm text-slate">
                Create and manage events for your organization. Access to event analytics and member management.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <div className="font-semibold text-charcoal mb-2">🕌 MASJID_ADMIN</div>
              <p className="text-sm text-slate">
                Full administrative access to manage a masjid, including events, members, and settings.
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <div className="font-semibold text-charcoal mb-2">🧠 COUNSELLOR</div>
              <p className="text-sm text-slate">
                Provide counselling services, manage client bookings, and access therapeutic resources.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Request Notice */}
        {pendingRequest && (
          <div className="card p-6 mb-8 bg-amber-50 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⏳</div>
              <div className="flex-1">
                <div className="font-semibold text-charcoal mb-2">
                  Request Pending Review
                </div>
                <p className="text-sm text-slate mb-3">
                  You have a pending request for <strong>{pendingRequest.requestedRole.replace('_', ' ')}</strong> role.
                  Submitted on {new Date(pendingRequest.createdAt).toLocaleDateString()}.
                </p>
                <p className="text-xs text-slate">
                  Our team typically reviews requests within 2-3 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Request Form */}
        {!pendingRequest && <RoleRequestForm currentRole={session.user.role} />}

        {/* Request History */}
        {existingRequests.length > 0 && (
          <div className="card p-6">
            <h3 className="font-display text-xl font-bold text-charcoal mb-4">
              Request History
            </h3>
            <div className="space-y-3">
              {existingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border-2 border-sage-100 rounded-xl"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-charcoal">
                        {request.requestedRole.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-slate">
                        {new Date(request.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        request.status === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : request.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {request.status}
                    </span>
                  </div>
                  {request.reviewNotes && (
                    <div className="text-sm text-slate mt-2 p-3 bg-sage-50 rounded-lg">
                      <div className="font-semibold mb-1">Admin Note:</div>
                      {request.reviewNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
