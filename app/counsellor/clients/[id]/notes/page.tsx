import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { SessionNoteCard } from '@/components/counsellor/SessionNoteCard'
import { getActiveCounsellorWhere } from '@/lib/counsellor-auth'

export default async function ClientNotesPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  let profile = await prisma.counsellorProfile.findFirst({
    where: { userId: session.user.id },
  })

  // SUPER_ADMIN: respect the cookie-selected counsellor
  if (session.user.role === 'SUPER_ADMIN') {
    const where = await getActiveCounsellorWhere(session.user.id, session.user.role)
    if (where) {
      profile = await prisma.counsellorProfile.findFirst({ where })
    } else if (!profile) {
      profile = await prisma.counsellorProfile.findFirst()
    }
  }

  if (!profile) {
    redirect('/counsellor/setup')
  }

  // Get client with all session notes
  const client = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      clientBookings: {
        where: {
          counsellorId: profile?.id,
        },
        include: {
          sessionNotes: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          room: true,
        },
        orderBy: {
          startTime: 'desc',
        },
      },
    },
  })

  if (!client) {
    notFound()
  }

  // Get all notes with session info
  const notesWithSessions = client.clientBookings
    .filter((booking) => booking.sessionNotes.length > 0)
    .map((booking) => ({
      booking,
      notes: booking.sessionNotes,
    }))

  const totalNotes = notesWithSessions.reduce((sum, item) => sum + item.notes.length, 0)

  return (
    <>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/counsellor/clients/${client.id}`}
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Client Profile
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
                Session Notes: {client.name}
              </h1>
              <p className="text-xl text-slate">
                Complete clinical notes history
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Notes</div>
            <div className="font-display text-4xl font-bold text-charcoal">{totalNotes}</div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">
              Sessions with Notes
            </div>
            <div className="font-display text-4xl font-bold text-sage-600">
              {notesWithSessions.length}
            </div>
          </div>
          <div className="card p-6">
            <div className="text-sm font-semibold uppercase text-slate mb-2">Total Sessions</div>
            <div className="font-display text-4xl font-bold text-slate">
              {client.clientBookings.length}
            </div>
          </div>
        </div>

        {/* SOAP Guide */}
        <div className="card p-6 mb-8 bg-sage-50 border border-sage-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📋</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">SOAP Format Guide</div>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong className="text-charcoal">S - Subjective:</strong>
                  <span className="text-slate"> Client's words, feelings, experiences</span>
                </div>
                <div>
                  <strong className="text-charcoal">O - Objective:</strong>
                  <span className="text-slate"> Your observations, behavior, mood</span>
                </div>
                <div>
                  <strong className="text-charcoal">A - Assessment:</strong>
                  <span className="text-slate"> Clinical analysis, impressions</span>
                </div>
                <div>
                  <strong className="text-charcoal">P - Plan:</strong>
                  <span className="text-slate"> Next steps, homework, follow-up</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Timeline */}
        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-charcoal mb-6">
            Clinical Notes Timeline
          </h2>

          {notesWithSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📝</div>
              <p className="text-slate mb-4">No session notes yet</p>
              <Link
                href={`/counsellor/clients/${client.id}`}
                className="btn btn-primary"
              >
                View Client Sessions
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {notesWithSessions.map(({ booking, notes }) => (
                <div key={booking.id} className="border-l-4 border-sage-200 pl-6 pb-6 last:pb-0 relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-sage-500 border-4 border-cream" />

                  {/* Session Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-display text-xl font-bold text-charcoal">
                          {new Date(booking.startTime).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </h3>
                        <div className="text-sage-600 font-semibold">
                          {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(booking.endTime).toLocaleTimeString('en-GB', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge bg-sage-100 text-sage-700">
                          {booking.sessionType}
                        </span>
                        <Link
                          href={`/counsellor/bookings/${booking.id}`}
                          className="text-sm text-sage-500 hover:text-sage-600 font-semibold"
                        >
                          View Session →
                        </Link>
                      </div>
                    </div>
                    {booking.room && (
                      <div className="text-sm text-slate">📍 {booking.room.name}</div>
                    )}
                  </div>

                  {/* Notes for this session */}
                  <div className="space-y-4">
                    {notes.map((note, index) => (
                      <SessionNoteCard
                        key={note.id}
                        note={note}
                        bookingId={booking.id}
                        isLatest={index === 0}
                      />
                    ))}
                  </div>

                  {/* Add Note Button */}
                  <div className="mt-4">
                    <Link
                      href={`/counsellor/bookings/${booking.id}/notes`}
                      className="btn btn-outline text-sm"
                    >
                      + Add Note to This Session
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions Without Notes */}
        {client.clientBookings.filter((b) => b.sessionNotes.length === 0).length > 0 && (
          <div className="card p-6 mt-8 bg-amber-50 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <div className="font-semibold text-charcoal mb-2">
                  Sessions Without Notes
                </div>
                <p className="text-sm text-slate mb-4">
                  The following sessions don't have clinical notes yet:
                </p>
                <div className="space-y-2">
                  {client.clientBookings
                    .filter((b) => b.sessionNotes.length === 0)
                    .slice(0, 5)
                    .map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg"
                      >
                        <div className="text-sm">
                          <div className="font-semibold text-charcoal">
                            {new Date(booking.startTime).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-slate">{booking.sessionType}</div>
                        </div>
                        <Link
                          href={`/counsellor/bookings/${booking.id}/notes`}
                          className="btn btn-primary text-sm"
                        >
                          Add Notes
                        </Link>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
