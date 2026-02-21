import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'
import { SignInForm } from '@/components/counsellor/SignInForm'
import Link from 'next/link'

export default async function SignInPage({ params }: { params: { id: string } }) {
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

  // Check if already signed in
  if (booking.signedIn) {
    redirect(`/counsellor/bookings/${booking.id}`)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

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
            Client Check-In
          </h1>
          <p className="text-xl text-slate">
            {booking.client.name} • {new Date(booking.startTime).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                Pre-Session Check-In
              </div>
              <p className="text-sm text-slate mb-3">
                This brief check-in helps you understand how your client is feeling before the session starts.
              </p>
              <ul className="text-sm text-slate space-y-1">
                <li>• Ask the client how they&apos;re feeling today (1-10 scale)</li>
                <li>• Note any immediate concerns or topics they want to discuss</li>
                <li>• This information helps guide the session</li>
                <li>• Takes less than 2 minutes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Session Info Card */}
        <div className="card p-6 mb-8">
          <h3 className="font-display text-xl font-bold text-charcoal mb-4">
            Session Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">
                Client
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display text-lg font-bold text-terracotta-600">
                  {booking.client.name?.[0] || 'C'}
                </div>
                <div>
                  <div className="font-semibold text-charcoal">{booking.client.name}</div>
                  <div className="text-sm text-slate">{booking.client.email}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">
                Time
              </div>
              <div className="font-semibold text-charcoal">
                {new Date(booking.startTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
                {' - '}
                {new Date(booking.endTime).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
              <div className="text-sm text-slate">{booking.sessionType}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">
                Room
              </div>
              <div className="font-semibold text-charcoal">
                {booking.room?.name || 'No room assigned'}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">
                Date
              </div>
              <div className="font-semibold text-charcoal">
                {new Date(booking.startTime).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Check-In Form */}
        <div className="card p-8">
          <h3 className="font-display text-2xl font-bold text-charcoal mb-6">
            Check-In Form
          </h3>
          <SignInForm bookingId={booking.id} clientName={booking.client.name || 'Client'} />
        </div>
      </div>
    </div>
  )
}
