import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { UserRoleChanger } from '@/components/admin/UserRoleChanger'
import { UserDeleteButton } from '@/components/admin/UserDeleteButton'

export default async function UsersManagement({ searchParams }: { searchParams: { role?: string, search?: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  // Build filters
  const where: any = {}
  if (searchParams.role) {
    where.role = searchParams.role
  }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search } },
      { email: { contains: searchParams.search } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      _count: {
        select: {
          organisedEvents: true,
          //rsvps: true,
          comments: true,
          clientBookings: true,
        },
      },
      counsellorProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const roleCount = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  })

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <Link href="/admin" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            User Management
          </h1>
          <p className="text-xl text-slate">
            View, edit, and manage all {users.length} registered users
          </p>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <form method="get" action="/admin/users">
                <input
                  type="text"
                  name="search"
                  defaultValue={searchParams.search}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                />
              </form>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/users"
                className={`btn ${!searchParams.role ? 'btn-primary' : 'btn-outline'} btn-sm`}
              >
                All Users
              </Link>
              {roleCount.map(({ role, _count }) => (
                <Link
                  key={role}
                  href={`/admin/users?role=${role}`}
                  className={`btn ${searchParams.role === role ? 'btn-primary' : 'btn-outline'} btn-sm`}
                >
                  {role} ({_count})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-sage-50 border-b border-sage-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                  Activity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-slate">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-sage-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center font-semibold text-sage-600">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div>
                        <Link 
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-charcoal hover:text-sage-600"
                        >
                          {user.name || 'No name'}
                        </Link>
                        <div className="text-sm text-slate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <UserRoleChanger user={user} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      {user._count.organisedEvents > 0 && (
                        <div className="text-slate">
                          📅 {user._count.organisedEvents} events
                        </div>
                      )}
                      {user._count.rsvps > 0 && (
                        <div className="text-slate">
                          ✓ {user._count.rsvps} RSVPs
                        </div>
                      )}
                      {user._count.comments > 0 && (
                        <div className="text-slate">
                          💬 {user._count.comments} comments
                        </div>
                      )}
                      {user._count.clientBookings > 0 && (
                        <div className="text-slate">
                          🗓️ {user._count.clientBookings} bookings
                        </div>
                      )}
                      {user.counsellorProfile && (
                        <div className="text-sage-600 font-semibold">
                          🧠 Counsellor
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate">
                    {new Date(user.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-sage-500 hover:text-sage-600 text-lg"
                        title="View/Edit"
                      >
                        ✏️
                      </Link>
                      <UserDeleteButton userId={user.id} userName={user.name || user.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No users found
            </h3>
            <p className="text-slate">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </>
  )
}
