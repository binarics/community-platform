import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { MasjidList } from '@/components/masjid/MasjidList'
import { MasjidStats } from '@/components/masjid/MasjidStats'
import Link from 'next/link'

export default async function MasjidManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get all masjids with stats
  const masjids = await prisma.masjid.findMany({
    include: {
      _count: {
        select: {
          events: true,
          members: true,
          moderators: true,
        }
      },
      admins: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      },
      moderators: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Get overall stats
  const totalEvents = await prisma.event.count()
  const activeEvents = await prisma.event.count({
    where: {
      startDate: {  // Changed from 'date' to 'startDate'
        gte: new Date(),
      },
    },
  })
  const totalMembers = await prisma.masjidMember.count()

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Masjid Management
              </h1>
              <p className="text-xl text-slate">
                Manage mosques, events, and community organization
              </p>
            </div>

            <Link href="/admin/masjid/new" className="btn btn-primary">
              + Create Masjid
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <MasjidStats 
          totalMasjids={masjids.length}
          totalEvents={totalEvents}
          activeEvents={activeEvents}
          totalMembers={totalMembers}
        />

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-sage-50 border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🕌</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Masjid Management System
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Create and organize multiple masjids/Islamic centers</li>
                <li>• Assign admins and moderators with specific permissions</li>
                <li>• Publish and manage events within each masjid</li>
                <li>• Track member registrations and RSVPs</li>
                <li>• Control visibility and access to events</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Masjid List */}
        <div className="mb-8">
          <h2 className="font-display text-3xl font-bold text-charcoal mb-6">
            All Masjids ({masjids.length})
          </h2>
          <MasjidList masjids={masjids} />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/events" className="card p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Manage Events
            </h3>
            <p className="text-sm text-slate">
              View and manage all events across all masjids
            </p>
          </Link>

          <Link href="/admin/roles" className="card p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Assign Roles
            </h3>
            <p className="text-sm text-slate">
              Manage admins, moderators, and permissions
            </p>
          </Link>

          <Link href="/admin/analytics" className="card p-6 hover:shadow-lg transition">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-display text-xl font-bold text-charcoal mb-2">
              Analytics
            </h3>
            <p className="text-sm text-slate">
              View engagement metrics and reports
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}