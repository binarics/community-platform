import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'
import { RoleRequestReviewButtons } from '@/components/roles/RoleRequestReviewButtons'

export default async function RoleRequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const requests = await prisma.roleRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        include: {
          _count: {
            select: {
              organisedEvents: true,
              comments: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const reviewedRequests = await prisma.roleRequest.findMany({
    where: { status: { in: ['APPROVED', 'REJECTED'] } },
    include: { user: true },
    orderBy: { reviewedAt: 'desc' },
    take: 20,
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <Link href="/admin" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Role Requests
          </h1>
          <p className="text-xl text-slate">
            Review and approve user role upgrade requests
          </p>
        </div>

        {/* Pending Requests */}
        <div className="mb-12">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
            Pending Requests ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                All Caught Up!
              </h3>
              <p className="text-slate">
                No pending role requests at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {requests.map((request) => (
                <div key={request.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/admin/users/${request.userId}`}
                          className="font-display text-xl font-bold text-charcoal hover:text-sage-600"
                        >
                          {request.user.name || 'Unnamed User'}
                        </Link>
                        <span className="badge bg-amber-100 text-amber-700">Pending</span>
                      </div>
                      <div className="text-sm text-slate mb-1">{request.user.email}</div>
                      <div className="text-sm text-slate mb-4">
                        Requested {new Date(request.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <div className="text-sm font-semibold uppercase text-slate mb-2">
                        Current Role
                      </div>
                      <span className="badge bg-clay-100 text-clay-600">
                        {request.currentRole}
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-semibold uppercase text-slate mb-2">
                        Requested Role
                      </div>
                      <span className="badge bg-sage-500 text-white">
                        {request.requestedRole}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm font-semibold uppercase text-slate mb-2">
                      User Activity
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="font-semibold text-sage-600">
                          {request.user._count.organisedEvents}
                        </span>
                        <span className="text-slate"> events organized</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sage-600">
                          {request.user._count.rsvps}
                        </span>
                        <span className="text-slate"> RSVPs</span>
                      </div>
                      <div>
                        <span className="font-semibold text-sage-600">
                          {request.user._count.comments}
                        </span>
                        <span className="text-slate"> comments</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="text-sm font-semibold uppercase text-slate mb-2">
                      Reason for Request
                    </div>
                    <div className="p-4 bg-sage-50 rounded-lg text-slate">
                      {request.reason}
                    </div>
                  </div>

                  <RoleRequestReviewButtons requestId={request.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Reviewed */}
        {reviewedRequests.length > 0 && (
          <div>
            <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
              Recently Reviewed
            </h2>

            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-sage-50 border-b border-sage-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Requested
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                      Reviewed
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100">
                  {reviewedRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-sage-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-charcoal">
                          {request.user.name}
                        </div>
                        <div className="text-sm text-slate">{request.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <span className="text-slate">{request.currentRole}</span>
                          <span className="mx-2">→</span>
                          <span className="font-semibold text-charcoal">
                            {request.requestedRole}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`badge ${
                            request.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate">
                        {request.reviewedAt
                          ? new Date(request.reviewedAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
