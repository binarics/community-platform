import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MasjidAdminSidebar } from '@/components/masjid/MasjidAdminSidebar'
import { MasjidSwitcher } from '@/components/masjid/MasjidSwitcher'
import { getSelectedMasjidId } from '@/lib/masjid-auth'

export default async function MasjidLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  // Determine which masjids the user can manage
  let masjids: {
    id: string
    name: string
    city: string
    country: string
    _count: { members: number; events: number }
  }[] = []

  if (isSuperAdmin) {
    masjids = await prisma.masjid.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        _count: { select: { members: true, events: true } },
      },
      orderBy: { name: 'asc' },
    })
  } else {
    // User must have at least one admin or moderator record
    const [adminRecords, modRecords] = await Promise.all([
      prisma.masjidAdmin.findMany({
        where: { userId: session.user.id },
        include: {
          masjid: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              _count: { select: { members: true, events: true } },
            },
          },
        },
      }),
      prisma.masjidModerator.findMany({
        where: { userId: session.user.id },
        include: {
          masjid: {
            select: {
              id: true,
              name: true,
              city: true,
              country: true,
              _count: { select: { members: true, events: true } },
            },
          },
        },
      }),
    ])

    const seen = new Set<string>()
    for (const r of [...adminRecords, ...modRecords]) {
      if (!seen.has(r.masjid.id)) {
        seen.add(r.masjid.id)
        masjids.push(r.masjid)
      }
    }

    if (masjids.length === 0) {
      redirect('/')
    }
  }

  const selectedId = await getSelectedMasjidId()
  const activeMasjidId =
    (selectedId && masjids.some((m) => m.id === selectedId) ? selectedId : null) ??
    (masjids.length > 0 ? masjids[0].id : null)

  return (
    <div className="flex min-h-screen bg-cream">
      <MasjidAdminSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
        masjidId={activeMasjidId ?? ''}
      />
      <main className="flex-1 min-w-0">
        <div className="pt-14 lg:pt-0">
          {(isSuperAdmin || masjids.length > 1) && (
            <MasjidSwitcher
              masjids={masjids}
              selectedId={activeMasjidId}
              isSuperAdmin={isSuperAdmin}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
