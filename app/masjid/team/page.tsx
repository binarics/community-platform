import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSelectedMasjidId } from '@/lib/masjid-auth'
import Link from 'next/link'
import { MasjidTeamClient } from '@/components/masjid/MasjidTeamClient'

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

export default async function MasjidTeamPage() {
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
    prisma.masjidAdmin.findMany({
      where: { masjidId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { assignedAt: 'asc' },
    }),
    prisma.masjidModerator.findMany({
      where: { masjidId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { assignedAt: 'asc' },
    }),
  ])

  const canManage =
    session.user.role === 'SUPER_ADMIN' ||
    !!(await prisma.masjidAdmin.findFirst({
      where: { masjidId, userId: session.user.id, canAssignRoles: true },
    }))

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      <div className="mb-8">
        <Link href="/masjid/dashboard" className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Team</h1>
        <p className="text-xl text-slate">{masjid.name}</p>
      </div>

      <MasjidTeamClient
        admins={admins}
        moderators={moderators}
        masjidId={masjid.id}
        canManage={canManage}
      />
    </div>
  )
}
