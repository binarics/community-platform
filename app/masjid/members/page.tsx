import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'
import Link from 'next/link'
import { MasjidMembersClient } from '@/components/masjid/MasjidMembersClient'

async function getActiveMasjidId(userId: string, role: string) {
  const selectedId = await getSelectedMasjidId()
  if (role === 'SUPER_ADMIN') {
    if (selectedId) return selectedId
    const first = await prisma.masjid.findFirst({ select: { id: true }, orderBy: { name: 'asc' } })
    return first?.id ?? null
  }
  if (selectedId) {
    const access =
      (await prisma.masjidAdmin.findFirst({ where: { masjidId: selectedId, userId } })) ??
      (await prisma.masjidModerator.findFirst({ where: { masjidId: selectedId, userId } }))
    if (access) return selectedId
  }
  const admin = await prisma.masjidAdmin.findFirst({ where: { userId } })
  if (admin) return admin.masjidId
  const mod = await prisma.masjidModerator.findFirst({ where: { userId } })
  return mod?.masjidId ?? null
}

export default async function MasjidMembersPage({
  searchParams,
}: {
  searchParams: { search?: string; role?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const masjidId = await getActiveMasjidId(session.user.id, session.user.role)
  if (!masjidId) redirect('/masjid/dashboard')

  const masjid = await prisma.masjid.findUnique({
    where: { id: masjidId },
    select: { id: true, name: true },
  })
  if (!masjid) redirect('/masjid/dashboard')

  const [admins, moderators] = await Promise.all([
    prisma.masjidAdmin.findMany({ where: { masjidId }, select: { userId: true } }),
    prisma.masjidModerator.findMany({ where: { masjidId }, select: { userId: true } }),
  ])
  const adminIds = new Set(admins.map((a) => a.userId))
  const modIds = new Set(moderators.map((m) => m.userId))

  const members = await prisma.masjidMember.findMany({
    where: {
      masjidId,
      ...(searchParams.search && {
        user: {
          OR: [
            { name: { contains: searchParams.search, mode: 'insensitive' } },
            { email: { contains: searchParams.search, mode: 'insensitive' } },
          ],
        },
      }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  const enriched = members
    .map((m) => ({
      ...m,
      staffRole: adminIds.has(m.userId)
        ? 'ADMIN'
        : modIds.has(m.userId)
        ? 'MODERATOR'
        : null,
    }))
    .filter((m) => {
      if (searchParams.role === 'ADMIN') return m.staffRole === 'ADMIN'
      if (searchParams.role === 'MODERATOR') return m.staffRole === 'MODERATOR'
      if (searchParams.role === 'MEMBER') return !m.staffRole
      return true
    })

  const canManage =
    session.user.role === 'SUPER_ADMIN' ||
    !!(await prisma.masjidAdmin.findFirst({
      where: { masjidId, userId: session.user.id, canManageMembers: true },
    }))

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <div className="mb-8">
        <Link href="/masjid/dashboard" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Members</h1>
            <p className="text-xl text-slate">{masjid.name} · {members.length} members</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <form method="get" className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search}
              placeholder="Search by name or email..."
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            />
          </div>
          <div className="w-48">
            <select
              name="role"
              defaultValue={searchParams.role}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="MODERATOR">Moderators</option>
              <option value="MEMBER">Members Only</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Filter</button>
          {(searchParams.search || searchParams.role) && (
            <Link href="/masjid/members" className="btn btn-outline">Clear</Link>
          )}
        </form>
      </div>

      <MasjidMembersClient
        members={enriched}
        masjidId={masjid.id}
        canManage={canManage}
      />
    </div>
  )
}
