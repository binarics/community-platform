import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CounsellorSidebar } from '@/components/counsellor/CounsellorSidebar'
import { CounsellorSwitcher } from '@/components/counsellor/CounsellorSwitcher'
import { getSelectedCounsellorId } from '@/lib/counsellor-auth'

export default async function CounsellorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (!['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

  // For SUPER_ADMIN fetch all counsellors so the switcher can list them
  const counsellors = isSuperAdmin
    ? await prisma.counsellorProfile.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { user: { name: 'asc' } },
      })
    : []

  const selectedId = isSuperAdmin ? await getSelectedCounsellorId() : null

  // If no cookie is set yet but counsellors exist, default to the first one
  const effectiveSelectedId =
    selectedId ?? (counsellors.length > 0 ? counsellors[0].id : null)

  return (
    <div className="flex min-h-screen bg-cream">
      <CounsellorSidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        }}
      />
      <main className="flex-1 min-w-0">
        <div className="pt-14 lg:pt-0">
          {isSuperAdmin && (
            <CounsellorSwitcher
              counsellors={counsellors}
              selectedId={effectiveSelectedId}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
