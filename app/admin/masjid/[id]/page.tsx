import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MasjidDetails } from '@/components/masjid/MasjidDetails'
import { MasjidEvents } from '@/components/masjid/MasjidEvents'
import { MasjidMembers } from '@/components/masjid/MasjidMembers'
import { MasjidSettings } from '@/components/masjid/MasjidSettings'
import Link from 'next/link'

export default async function MasjidDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  // Get masjid with full details
  const masjid = await prisma.masjid.findUnique({
    where: { id: params.id },
    include: {
      admins: {
        include: {
          user: {
            select: {
              id: true,
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
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      events: {
        orderBy: {
          startDate: 'desc',  // Changed from 'date' to 'startDate'
        },
        take: 10,
        include: {
          _count: {
            select: {
              rsvps: true,
            }
          },
          organiser: {  // Changed from 'organizer' to 'organiser' (matches your schema)
            select: {
              name: true,
            }
          }
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          joinedAt: 'desc',
        },
        take: 20,
      },
      _count: {
        select: {
          events: true,
          members: true,
        }
      }
    },
  })

  if (!masjid) {
    notFound()
  }

  // Check if user has access
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const isAdmin = masjid.admins.some(admin => admin.userId === session.user.id)
  const isModerator = masjid.moderators.some(mod => mod.userId === session.user.id)

  if (!isSuperAdmin && !isAdmin && !isModerator) {
    redirect('/admin/masjid')
  }

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/masjid" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to All Masjids
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                {masjid.name}
              </h1>
              <div className="flex items-center gap-4 text-slate">
                <span>📍 {masjid.city}, {masjid.country}</span>
                <span>•</span>
                <span>📅 {masjid._count.events} events</span>
                <span>•</span>
                <span>👥 {masjid._count.members} members</span>
              </div>
            </div>

            {(isSuperAdmin || isAdmin) && (
              <div className="flex gap-3">
                <Link href={`/admin/masjid/${masjid.id}/edit`} className="btn btn-outline">
                  ✏️ Edit
                </Link>
                <Link href={`/admin/masjid/${masjid.id}/events/new`} className="btn btn-primary">
                  + New Event
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Role Badge */}
        <div className="mb-6">
          {isSuperAdmin && (
            <span className="badge bg-purple-500 text-white">Super Admin</span>
          )}
          {isAdmin && !isSuperAdmin && (
            <span className="badge bg-sage-500 text-white">Masjid Admin</span>
          )}
          {isModerator && !isAdmin && !isSuperAdmin && (
            <span className="badge bg-blue-500 text-white">Moderator</span>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            <MasjidDetails masjid={masjid} />
            <MasjidEvents events={masjid.events} masjidId={masjid.id} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <MasjidMembers 
              members={masjid.members}
              admins={masjid.admins}
              moderators={masjid.moderators}
              masjidId={masjid.id}
              canManage={isSuperAdmin || isAdmin}
            />
            
            {(isSuperAdmin || isAdmin) && (
              <MasjidSettings masjid={masjid} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}