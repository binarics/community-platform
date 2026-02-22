import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminMasjidPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const masjids = await prisma.masjid.findMany({
    include: {
      _count: {
        select: {
          events: true,
          members: true,
          admins: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
              Masjid Management
            </h1>
            <p className="text-xl text-slate">
              Manage all mosques and Islamic centers on the platform
            </p>
          </div>
          <Link href="/admin/masjid/new" className="btn btn-primary">
            + Create Masjid
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Total Masjids
            </div>
            <div className="font-display text-4xl font-bold text-charcoal">
              {masjids.length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Active
            </div>
            <div className="font-display text-4xl font-bold text-green-600">
              {masjids.filter((m) => m.isActive).length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Public
            </div>
            <div className="font-display text-4xl font-bold text-sage-600">
              {masjids.filter((m) => m.isPublic).length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              With Events
            </div>
            <div className="font-display text-4xl font-bold text-terracotta-600">
              {masjids.filter((m) => m._count.events > 0).length}
            </div>
          </div>
        </div>

        {/* Masjids List */}
        <div className="space-y-4">
          {masjids.map((masjid) => (
            <Link
              key={masjid.id}
              href={`/admin/masjid/${masjid.id}`}
              className="card p-6 hover:-translate-y-0.5 transition block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
                    {masjid.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-slate">
                    <span>📍 {masjid.city}, {masjid.country}</span>
                    {masjid.capacity && <span>👥 Capacity: {masjid.capacity}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`badge ${
                      masjid.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {masjid.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="badge bg-sage-100 text-sage-700">
                    {masjid.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>

              {masjid.description && (
                <p className="text-slate mb-4 line-clamp-2">{masjid.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate">Events:</span>
                  <span className="font-semibold text-charcoal">
                    {masjid._count.events}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate">Admins:</span>
                  <span className="font-semibold text-charcoal">
                    {masjid._count.admins}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate">Members:</span>
                  <span className="font-semibold text-charcoal">
                    {masjid._count.members}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {masjids.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🕌</div>
            <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
              No Masjids Yet
            </h3>
            <p className="text-slate mb-6">
              Get started by creating your first masjid
            </p>
            <Link href="/admin/masjid/new" className="btn btn-primary inline-flex">
              Create First Masjid
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
