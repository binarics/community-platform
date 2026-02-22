import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { EventForm } from '@/components/masjid/EventForm'
import Link from 'next/link'

export default async function NewEventPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  // Get masjid
  const masjid = await prisma.masjid.findUnique({
    where: { id: params.id },
    include: {
      admins: {
        include: {
          user: {
            select: {
              id: true,
            }
          }
        }
      },
      moderators: {
        include: {
          user: {
            select: {
              id: true,
            }
          }
        }
      }
    },
  })

  if (!masjid) {
    notFound()
  }

  // Check if user has access
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
  const isAdmin = masjid.admins.some(admin => admin.user.id === session.user.id)
  const isModerator = masjid.moderators.some(mod => mod.user.id === session.user.id)

  if (!isSuperAdmin && !isAdmin && !isModerator) {
    redirect(`/admin/masjid/${params.id}`)
  }

  return (
    <>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/admin/masjid/${params.id}`} 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to {masjid.name}
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Create Event
          </h1>
          <p className="text-xl text-slate">
            Add a new event to {masjid.name}
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-sage-50 border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📅</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Event Publishing
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Events are automatically associated with {masjid.name}</li>
                <li>• Members will receive notifications based on their preferences</li>
                <li>• You can set registration limits and RSVP requirements</li>
                <li>• Draft events can be saved and published later</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <EventForm 
            masjidId={masjid.id} 
            masjidName={masjid.name}
            organizerId={session.user.id}
          />
        </div>
      </div>
    </>
  )
}
