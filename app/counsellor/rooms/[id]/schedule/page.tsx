import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

type View = 'day' | 'week' | 'month'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function parseDate(str: string | undefined): Date {
  const d = str ? new Date(str + 'T00:00:00') : new Date()
  return isNaN(d.getTime()) ? new Date() : d
}

function getRangeForView(view: View, base: Date): { start: Date; end: Date } {
  if (view === 'day') {
    const start = new Date(base)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { start, end }
  }

  if (view === 'week') {
    const start = new Date(base)
    start.setHours(0, 0, 0, 0)
    const dow = start.getDay() // 0=Sun
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1)) // back to Monday
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }

  // month
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1)
  return { start, end }
}

function getNavDate(view: View, base: Date, dir: -1 | 1): Date {
  const d = new Date(base)
  if (view === 'day') d.setDate(d.getDate() + dir)
  else if (view === 'week') d.setDate(d.getDate() + dir * 7)
  else d.setMonth(d.getMonth() + dir)
  return d
}

function formatHour(h: number) {
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${ampm}`
}

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED: 'bg-sage-100 border-sage-300 text-sage-800',
  IN_PROGRESS: 'bg-blue-100 border-blue-300 text-blue-800',
  COMPLETED: 'bg-green-100 border-green-300 text-green-800',
  CANCELLED: 'bg-red-100 border-red-300 text-red-700',
}

const DAY_START = 8   // 8 am
const DAY_END   = 20  // 8 pm
const SLOT_H    = 56  // px per hour slot

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function RoomSchedulePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { view?: string; date?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || !['COUNSELLOR', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/')
  }

  const view: View = (['day', 'week', 'month'].includes(searchParams.view ?? '') ? searchParams.view : 'week') as View
  const baseDate = parseDate(searchParams.date)
  const { start: rangeStart, end: rangeEnd } = getRangeForView(view, baseDate)

  const room = await prisma.room.findUnique({
    where: { id: params.id },
    include: { organisation: true },
  })

  if (!room) notFound()

  const bookings = await prisma.booking.findMany({
    where: {
      roomId: room.id,
      startTime: { gte: rangeStart, lt: rangeEnd },
      status: { not: 'CANCELLED' },
    },
    include: {
      client: { select: { id: true, name: true } },
      counsellor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { startTime: 'asc' },
  })

  const prevDate = getNavDate(view, baseDate, -1)
  const nextDate = getNavDate(view, baseDate, 1)
  const navUrl = (v: View, d: Date) =>
    `/counsellor/rooms/${room.id}/schedule?view=${v}&date=${toDateStr(d)}`

  // ── Period label ──
  const periodLabel = (() => {
    if (view === 'day') {
      return baseDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
    if (view === 'week') {
      const weekEnd = new Date(rangeStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      return `${rangeStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    return baseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  })()

  // ── Parse facilities ──
  let facilities: string[] = []
  try {
    if (room.facilities) facilities = JSON.parse(room.facilities)
  } catch {
    if (room.facilities) facilities = [room.facilities]
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-8 py-12">

        {/* Back link */}
        <Link
          href="/counsellor/rooms"
          className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-6 inline-block"
        >
          ← Back to Rooms
        </Link>

        {/* Room info header */}
        <div className="card p-6 mb-8 flex flex-col md:flex-row md:items-start gap-6">
          <div className="text-5xl">🏠</div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-bold text-charcoal mb-1">{room.name}</h1>
            <div className="text-slate text-sm mb-3">{room.organisation.name}</div>
            <div className="flex flex-wrap gap-4 text-sm">
              {room.capacity && (
                <span className="flex items-center gap-1.5 text-slate">
                  👥 <span className="font-medium text-charcoal">{room.capacity} people</span>
                </span>
              )}
              {facilities.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-full text-xs font-medium bg-sage-50 text-sage-700 border border-sage-100">
                  {f}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/counsellor/bookings/new?roomId=${room.id}`}
            className="btn btn-primary shrink-0"
          >
            Book This Room
          </Link>
        </div>

        {/* Schedule toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {/* View switcher */}
          <div className="inline-flex rounded-xl border border-sage-200 overflow-hidden">
            {(['day', 'week', 'month'] as View[]).map((v) => (
              <Link
                key={v}
                href={navUrl(v, baseDate)}
                className={`px-4 py-2 text-sm font-semibold capitalize transition ${
                  view === v
                    ? 'bg-sage-600 text-white'
                    : 'bg-white text-slate hover:bg-sage-50'
                }`}
              >
                {v}
              </Link>
            ))}
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-3 ml-auto">
            <Link
              href={navUrl(view, prevDate)}
              className="p-2 rounded-lg border border-sage-200 hover:bg-sage-50 transition text-slate"
              aria-label="Previous"
            >
              ‹
            </Link>
            <span className="font-semibold text-charcoal text-sm min-w-[14rem] text-center">
              {periodLabel}
            </span>
            <Link
              href={navUrl(view, nextDate)}
              className="p-2 rounded-lg border border-sage-200 hover:bg-sage-50 transition text-slate"
              aria-label="Next"
            >
              ›
            </Link>
            <Link
              href={navUrl(view, new Date())}
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-sage-200 hover:bg-sage-50 transition text-slate"
            >
              Today
            </Link>
          </div>
        </div>

        {/* ── DAY VIEW ────────────────────────────────────── */}
        {view === 'day' && (
          <DayView bookings={bookings} date={baseDate} />
        )}

        {/* ── WEEK VIEW ───────────────────────────────────── */}
        {view === 'week' && (
          <WeekView bookings={bookings} weekStart={rangeStart} roomId={room.id} />
        )}

        {/* ── MONTH VIEW ──────────────────────────────────── */}
        {view === 'month' && (
          <MonthView bookings={bookings} baseDate={baseDate} roomId={room.id} />
        )}
      </div>
    </>
  )
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ bookings, date }: { bookings: any[]; date: Date }) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
  const totalH = (DAY_END - DAY_START) * SLOT_H

  const getTop = (d: Date) => {
    const h = d.getHours() + d.getMinutes() / 60
    return Math.max(0, (h - DAY_START) * SLOT_H)
  }
  const getHeight = (start: Date, end: Date) => {
    const dur = (end.getTime() - start.getTime()) / 3_600_000
    return Math.max(SLOT_H * 0.5, dur * SLOT_H)
  }

  const dayBookings = bookings.filter((b) => {
    const d = new Date(b.startTime)
    return (
      d.getFullYear() === date.getFullYear() &&
      d.getMonth() === date.getMonth() &&
      d.getDate() === date.getDate()
    )
  })

  return (
    <div className="card overflow-hidden">
      {dayBookings.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-slate font-semibold">No bookings on this day</p>
        </div>
      )}
      {dayBookings.length > 0 && (
        <div className="flex">
          {/* Time axis */}
          <div className="w-16 shrink-0 border-r border-sage-100" style={{ height: totalH }}>
            {hours.map((h) => (
              <div
                key={h}
                className="relative text-xs text-slate text-right pr-3"
                style={{ height: SLOT_H }}
              >
                <span className="absolute -top-2 right-3">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Booking canvas */}
          <div className="flex-1 relative bg-white" style={{ height: totalH }}>
            {/* Hour grid lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-sage-100"
                style={{ top: (h - DAY_START) * SLOT_H }}
              />
            ))}

            {/* Bookings */}
            {dayBookings.map((b) => {
              const start = new Date(b.startTime)
              const end = new Date(b.endTime)
              const top = getTop(start)
              const height = getHeight(start, end)
              const colour = STATUS_COLOURS[b.status] ?? STATUS_COLOURS.SCHEDULED

              return (
                <Link
                  key={b.id}
                  href={`/counsellor/bookings/${b.id}`}
                  className={`absolute left-2 right-2 rounded-xl border px-3 py-2 overflow-hidden hover:opacity-90 transition ${colour}`}
                  style={{ top: top + 1, height: height - 2 }}
                >
                  <div className="font-semibold text-sm truncate">{b.client.name}</div>
                  <div className="text-xs opacity-80">
                    {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {height >= SLOT_H * 1.2 && (
                    <div className="text-xs opacity-70 mt-1 truncate">
                      {b.counsellor.user.name}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({
  bookings,
  weekStart,
  roomId,
}: {
  bookings: any[]
  weekStart: Date
  roomId: string
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookingsForDay = (day: Date) =>
    bookings.filter((b) => {
      const d = new Date(b.startTime)
      return (
        d.getFullYear() === day.getFullYear() &&
        d.getMonth() === day.getMonth() &&
        d.getDate() === day.getDate()
      )
    })

  return (
    <div className="card overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-sage-100">
        {days.map((day) => {
          const isToday = day.getTime() === today.getTime()
          return (
            <div
              key={day.toISOString()}
              className={`px-3 py-3 text-center border-r border-sage-100 last:border-r-0 ${
                isToday ? 'bg-sage-50' : 'bg-white'
              }`}
            >
              <div className="text-xs font-semibold uppercase text-slate mb-1">
                {day.toLocaleDateString('en-GB', { weekday: 'short' })}
              </div>
              <Link
                href={`/counsellor/rooms/${roomId}/schedule?view=day&date=${toDateStr(day)}`}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition hover:bg-sage-100 ${
                  isToday ? 'bg-sage-600 text-white hover:bg-sage-700' : 'text-charcoal'
                }`}
              >
                {day.getDate()}
              </Link>
            </div>
          )
        })}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((day) => {
          const dayB = bookingsForDay(day)
          const isToday = day.getTime() === today.getTime()
          return (
            <div
              key={day.toISOString()}
              className={`border-r border-sage-100 last:border-r-0 p-2 ${
                isToday ? 'bg-sage-50/50' : ''
              }`}
            >
              {dayB.length === 0 && (
                <div className="flex items-center justify-center h-20 text-xs text-slate/50">
                  Free
                </div>
              )}
              <div className="space-y-1.5">
                {dayB.map((b) => {
                  const start = new Date(b.startTime)
                  const end = new Date(b.endTime)
                  const colour = STATUS_COLOURS[b.status] ?? STATUS_COLOURS.SCHEDULED
                  return (
                    <Link
                      key={b.id}
                      href={`/counsellor/bookings/${b.id}`}
                      className={`block rounded-lg border px-2 py-1.5 hover:opacity-90 transition ${colour}`}
                    >
                      <div className="text-xs font-semibold truncate">{b.client.name}</div>
                      <div className="text-xs opacity-75">
                        {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        –
                        {end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  bookings,
  baseDate,
  roomId,
}: {
  bookings: any[]
  baseDate: Date
  roomId: string
}) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-aligned grid: pad start
  const startPad = (firstDay.getDay() + 6) % 7 // 0=Mon offset
  const totalCells = startPad + lastDay.getDate()
  const rows = Math.ceil(totalCells / 7)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const bookingsOnDay = (d: number) => {
    const date = new Date(year, month, d)
    return bookings.filter((b) => {
      const bd = new Date(b.startTime)
      return bd.getFullYear() === year && bd.getMonth() === month && bd.getDate() === d
    })
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="card overflow-hidden">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-sage-100 bg-sage-50">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase text-slate">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - startPad + 1
          const isCurrentMonth = dayNum >= 1 && dayNum <= lastDay.getDate()
          const cellDate = new Date(year, month, dayNum)
          const isToday = isCurrentMonth && cellDate.getTime() === today.getTime()
          const dayBookings = isCurrentMonth ? bookingsOnDay(dayNum) : []
          const maxShow = 3

          return (
            <div
              key={i}
              className={`min-h-[100px] border-r border-b border-sage-100 last-of-type:border-r-0 p-2 ${
                !isCurrentMonth ? 'bg-sage-50/30' : ''
              } ${isToday ? 'bg-sage-50' : ''}`}
            >
              {isCurrentMonth && (
                <>
                  {/* Date number */}
                  <Link
                    href={`/counsellor/rooms/${roomId}/schedule?view=day&date=${toDateStr(cellDate)}`}
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold mb-1 hover:bg-sage-100 transition ${
                      isToday
                        ? 'bg-sage-600 text-white hover:bg-sage-700'
                        : 'text-charcoal'
                    }`}
                  >
                    {dayNum}
                  </Link>

                  {/* Booking chips */}
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, maxShow).map((b) => {
                      const start = new Date(b.startTime)
                      const colour = STATUS_COLOURS[b.status] ?? STATUS_COLOURS.SCHEDULED
                      return (
                        <Link
                          key={b.id}
                          href={`/counsellor/bookings/${b.id}`}
                          className={`block rounded px-1.5 py-0.5 text-xs font-medium truncate border hover:opacity-90 transition ${colour}`}
                        >
                          {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} {b.client.name}
                        </Link>
                      )
                    })}
                    {dayBookings.length > maxShow && (
                      <Link
                        href={`/counsellor/rooms/${roomId}/schedule?view=day&date=${toDateStr(cellDate)}`}
                        className="block text-xs text-sage-600 font-semibold pl-1 hover:underline"
                      >
                        +{dayBookings.length - maxShow} more
                      </Link>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
