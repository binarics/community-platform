import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { SignOutForm } from '@/components/counsellor/SignOutForm'
import Link from 'next/link'

export default async function SignOutPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  // Get booking with details
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      room: true,
      counsellor: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!booking) {
    redirect('/counsellor/dashboard')
  }

  // Check authorization
  if (session.user.role !== 'SUPER_ADMIN' && booking.counsellor.userId !== session.user.id) {
    redirect('/counsellor/dashboard')
  }

  // Must be signed in first
  if (!booking.signedIn) {
    redirect(`/counsellor/bookings/${booking.id}/sign-in`)
  }

  // Check if already signed out
  if (booking.signedOut) {
    redirect(`/counsellor/bookings/${booking.id}`)
  }

  return (
    <>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/counsellor/bookings/${booking.id}`}
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Booking
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Complete Session
          </h1>
          <p className="text-xl text-slate">
            {booking.client.name} • {new Date(booking.startTime).toLocaleDateString()}
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-sage-50 border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✅</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Session Feedback
              </div>
              <p className="text-sm text-slate mb-3">
                Collect brief feedback from your client about today&apos;s session. This helps track progress and improve your service.
              </p>
              <ul className="text-sm text-slate space-y-1">
                <li>• How helpful was the session? (1-5 stars)</li>
                <li>• What was most helpful today?</li>
                <li>• Any additional feedback</li>
                <li>• Takes 2-3 minutes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Check-In Info */}
        {booking.signInMood && (
          <div className="card p-6 mb-8">
            <h3 className="font-display text-xl font-bold text-charcoal mb-4">
              Pre-Session Check-In
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold uppercase text-slate mb-1">
                  Mood at Start
                </div>
                <div className="font-semibold text-charcoal text-2xl">
                  {booking.signInMood}/10
                </div>
              </div>
              {booking.signInConcerns && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate mb-1">
                    Concerns Noted
                  </div>
                  <div className="text-slate">{booking.signInConcerns}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sign-Out Form */}
        <div className="card p-8">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Session Feedback Form
          </h3>
          <SignOutForm bookingId={booking.id} clientName={booking.client.name || 'Client'} />
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-6 bg-terracotta-50 rounded-2xl border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📝</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                After Completing Session
              </div>
              <p className="text-sm text-slate mb-3">
                Don&apos;t forget to:
              </p>
              <ul className="text-sm text-slate space-y-1">
                <li>• Add your clinical notes (SOAP format)</li>
                <li>• Record any homework or action items</li>
                <li>• Schedule the next session if needed</li>
                <li>• Update treatment plan if necessary</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
