import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AdminEventForm } from '@/components/admin/AdminEventForm'
import Link from 'next/link'

export default async function AdminEventEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      masjid: true,
      organiser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          rsvps: true,
          comments: true,
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  // Get all masjids for dropdown
  const masjids = await prisma.masjid.findMany({
    select: {
      id: true,
      name: true,
      city: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <>

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/events"
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Edit Event
          </h1>
          <p className="text-xl text-slate">
            Modify event details and approve/reject submissions
          </p>
        </div>

        {/* Event Stats */}
        <div className="card p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold uppercase text-slate mb-2">Event Info</div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-slate">Created by:</span>{' '}
                  <span className="font-semibold text-charcoal">{event.organiser?.name}</span>
                </div>
                <div>
                  <span className="text-slate">Created:</span>{' '}
                  <span className="text-charcoal">
                    {new Date(event.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate">Masjid:</span>{' '}
                  <span className="text-charcoal">{event.masjid?.name || 'None'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold uppercase text-slate mb-2">Engagement</div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-charcoal">
                    {event._count.rsvps}
                  </div>
                  <div className="text-xs text-slate">RSVPs</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-charcoal">
                    {event._count.comments}
                  </div>
                  <div className="text-xs text-slate">Comments</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card p-8">
          <AdminEventForm event={event} masjids={masjids} />
        </div>
      </div>
    </>
  )
}
