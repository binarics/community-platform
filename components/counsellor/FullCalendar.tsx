'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  startTime: string
  endTime: string
  status: string
  sessionType: string
  counsellorId?: string
  isConsultation?: boolean
  client: {
    id?: string | null
    name: string | null
  }
  counsellor?: {
    user: {
      name: string
    }
  }
  room?: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  name: string
  email: string
}

interface Room {
  id: string
  name: string
  capacity: number
}

interface FullCalendarProps {
  bookings: Booking[]
  clients: Client[]
  rooms: Room[]
  counsellorId: string
  isSuperAdmin?: boolean
  initialView?: string
  initialDate?: string
  availability?: any
}

type ViewType = 'month' | 'week' | 'day' | 'agenda'

// In shared mode: SUPER_ADMIN or own booking → show client name; otherwise → 'Private'
function getClientDisplay(
  booking: Booking,
  isShared: boolean,
  counsellorId: string,
  isSuperAdmin: boolean
): string {
  if (!isShared) return booking.client.name ?? 'Unknown'
  if (isSuperAdmin || booking.counsellorId === counsellorId) {
    return booking.client.name ?? 'Unknown'
  }
  return 'Private'
}

// Is this booking owned by the current counsellor (or are we SUPER_ADMIN)?
function isOwnBooking(booking: Booking, counsellorId: string, isSuperAdmin: boolean): boolean {
  if (isSuperAdmin) return true
  if (!booking.counsellorId) return true // private mode: all bookings are own
  return booking.counsellorId === counsellorId
}

export function FullCalendar({
  bookings: initialBookings,
  clients,
  rooms,
  counsellorId,
  isSuperAdmin = false,
  initialView = 'month',
  initialDate,
  availability,
}: FullCalendarProps) {
  const router = useRouter()
  const [view, setView] = useState<ViewType>(initialView as ViewType)
  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate) : new Date())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddDate, setQuickAddDate] = useState<Date | null>(null)
  const [isShared, setIsShared] = useState(false)
  const [bookings, setBookings] = useState(initialBookings)
  const [loading, setLoading] = useState(false)
  const [dayDetail, setDayDetail] = useState<{ date: Date; bookings: Booking[] } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', view)
    params.set('date', currentDate.toISOString().split('T')[0])
    router.push(`/counsellor/calendar?${params.toString()}`, { scroll: false })
  }, [view, currentDate])

  useEffect(() => {
    if (isShared) {
      fetchAllBookings()
    } else {
      setBookings(initialBookings)
    }
  }, [isShared, initialBookings])

  async function fetchAllBookings() {
    setLoading(true)
    try {
      const response = await fetch('/api/counsellor/calendar/all-bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Failed to fetch all bookings:', error)
      setBookings(initialBookings)
    } finally {
      setLoading(false)
    }
  }

  function goToToday() {
    setCurrentDate(new Date())
  }

  function goToPrevious() {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  function goToNext() {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  function getBookingsForView() {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.startTime)
      if (view === 'month') {
        return (
          bookingDate.getMonth() === currentDate.getMonth() &&
          bookingDate.getFullYear() === currentDate.getFullYear()
        )
      } else if (view === 'week') {
        const weekStart = getWeekStart(currentDate)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        return bookingDate >= weekStart && bookingDate < weekEnd
      } else if (view === 'day') {
        return bookingDate.toDateString() === currentDate.toDateString()
      }
      return true
    })
  }

  function getWeekStart(date: Date) {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  async function handleDragStart(booking: Booking) {
    setDraggedBooking(booking)
  }

  async function handleDrop(newDate: Date, newTime?: string) {
    if (!draggedBooking) return

    const oldStart = new Date(draggedBooking.startTime)
    const oldEnd = new Date(draggedBooking.endTime)
    const duration = oldEnd.getTime() - oldStart.getTime()

    let newStart: Date
    if (newTime) {
      const [hours, minutes] = newTime.split(':').map(Number)
      newStart = new Date(newDate)
      newStart.setHours(hours, minutes, 0, 0)
    } else {
      newStart = new Date(newDate)
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)
    }

    const newEnd = new Date(newStart.getTime() + duration)

    try {
      const response = await fetch(`/api/counsellor/bookings/${draggedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      })
      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update booking')
    }

    setDraggedBooking(null)
  }

  function handleSlotClick(date: Date) {
    setQuickAddDate(date)
    setShowQuickAdd(true)
  }

  function handleShowAllForDay(date: Date, dayBookings: Booking[]) {
    setDayDetail({ date, bookings: dayBookings })
  }

  function getStatusColor(status: string, isConsultation?: boolean) {
    if (isConsultation) return 'bg-violet-500'
    switch (status) {
      case 'SCHEDULED': return 'bg-sage-500'
      case 'COMPLETED': return 'bg-green-500'
      case 'CANCELLED': return 'bg-red-500'
      case 'NO_SHOW': return 'bg-slate-400'
      default: return 'bg-amber-500'
    }
  }

  const visibleBookings = getBookingsForView()

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={goToToday} className="btn btn-outline text-sm">
            Today
          </button>
          <div className="flex items-center gap-2">
            <button onClick={goToPrevious} className="btn btn-outline text-sm px-3">
              ←
            </button>
            <button onClick={goToNext} className="btn btn-outline text-sm px-3">
              →
            </button>
          </div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(view === 'day' && { day: 'numeric' }),
            })}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Sharing Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-sage-50 rounded-lg">
            <span className="text-sm font-medium text-slate">
              {isShared ? '👥 Public' : '🔒 Private'}
            </span>
            <button
              onClick={() => setIsShared(!isShared)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isShared ? 'bg-sage-500' : 'bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={
                isShared
                  ? 'Switch to private view (your bookings only)'
                  : 'Switch to public view (all counsellors)'
              }
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isShared ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex gap-2">
            {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                  view === v
                    ? 'bg-sage-500 text-white'
                    : 'bg-sage-50 text-slate hover:bg-sage-100'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Banner for shared mode */}
      {isShared && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="text-sm text-blue-900">
            <span className="font-semibold">Public Calendar View:</span> You&apos;re viewing all
            counsellors&apos; bookings.{' '}
            {isSuperAdmin
              ? 'As a Super Admin, you can see all booking details.'
              : "Client names are hidden for other counsellors' bookings. Only room and counsellor information is shown."}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8 text-slate">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
          <p className="mt-2">Loading {isShared ? 'all counsellors' : 'your'} bookings...</p>
        </div>
      )}

      {/* Calendar Views */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          bookings={visibleBookings}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onBookingClick={setSelectedBooking}
          onDateClick={handleSlotClick}
          onShowAll={handleShowAllForDay}
          getStatusColor={getStatusColor}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          bookings={visibleBookings}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onBookingClick={setSelectedBooking}
          onSlotClick={handleSlotClick}
          getStatusColor={getStatusColor}
          availability={availability}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          bookings={visibleBookings}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onBookingClick={setSelectedBooking}
          onSlotClick={handleSlotClick}
          getStatusColor={getStatusColor}
          availability={availability}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {view === 'agenda' && (
        <AgendaView
          bookings={bookings}
          currentDate={currentDate}
          onBookingClick={setSelectedBooking}
          getStatusColor={getStatusColor}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Day Detail Modal (overflow) */}
      {dayDetail && (
        <DayDetailModal
          date={dayDetail.date}
          bookings={dayDetail.bookings}
          onClose={() => setDayDetail(null)}
          onBookingClick={(b: Booking) => {
            setDayDetail(null)
            setSelectedBooking(b)
          }}
          getStatusColor={getStatusColor}
          isShared={isShared}
          counsellorId={counsellorId}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Quick Add Modal */}
      {showQuickAdd && quickAddDate && (
        <QuickAddModal
          date={quickAddDate}
          clients={clients}
          rooms={rooms}
          counsellorId={counsellorId}
          onClose={() => {
            setShowQuickAdd(false)
            setQuickAddDate(null)
          }}
          onSuccess={() => {
            setShowQuickAdd(false)
            setQuickAddDate(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({
  currentDate,
  bookings,
  onDragStart,
  onDrop,
  onBookingClick,
  onDateClick,
  onShowAll,
  getStatusColor,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days: Date[] = []
  const current = new Date(startDate)
  while (current <= monthEnd || current.getDay() !== 0) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="border-2 border-sage-100 rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-sage-50 border-b-2 border-sage-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-sm text-slate">
            {day}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-b border-sage-100 last:border-b-0">
          {week.map((day, dayIdx) => {
            const dayBookings: Booking[] = bookings.filter(
              (b: any) => new Date(b.startTime).toDateString() === day.toDateString()
            )
            const isToday = day.toDateString() === new Date().toDateString()
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()
            const overflow = dayBookings.length - 3

            return (
              <div
                key={dayIdx}
                className={`min-h-[120px] p-2 border-r border-sage-100 last:border-r-0 ${
                  !isCurrentMonth ? 'bg-sage-50/30' : ''
                } ${isToday ? 'bg-terracotta-50' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(day)}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => onDateClick(day)}
                    className={`text-sm font-semibold hover:bg-sage-100 px-2 py-1 rounded-lg transition ${
                      isToday
                        ? 'bg-sage-500 text-white'
                        : !isCurrentMonth
                        ? 'text-slate'
                        : 'text-charcoal'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                  {dayBookings.length > 0 && (
                    <span className="text-xs text-slate">{dayBookings.length}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking: Booking) => {
                    const label = getClientDisplay(booking, isShared, counsellorId, isSuperAdmin)
                    const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
                    return (
                      <div
                        key={booking.id}
                        draggable={own}
                        onDragStart={() => own && onDragStart(booking)}
                        onClick={() => onBookingClick(booking)}
                        className={`text-xs p-1.5 rounded cursor-pointer ${getStatusColor(
                          booking.status,
                          booking.isConsultation
                        )} text-white truncate hover:opacity-80 transition`}
                      >
                        {booking.isConsultation && '📋 '}
                        {new Date(booking.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}{' '}
                        {label}
                        {isShared && !own && booking.counsellor && (
                          <span className="opacity-75"> · {booking.counsellor.user.name}</span>
                        )}
                      </div>
                    )
                  })}

                  {overflow > 0 && (
                    <button
                      onClick={() => onShowAll(day, dayBookings)}
                      className="text-xs text-sage-600 hover:text-sage-800 font-semibold pl-1.5 hover:underline"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Week View ─────────────────────────────────────────────────────────────────
function WeekView({
  currentDate,
  bookings,
  onDragStart,
  onDrop,
  onBookingClick,
  onSlotClick,
  getStatusColor,
  availability,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="border-2 border-sage-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-8 bg-sage-50 border-b-2 border-sage-100">
        <div className="p-3" />
        {days.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div
              key={day.toISOString()}
              className={`p-3 text-center ${isToday ? 'bg-terracotta-50' : ''}`}
            >
              <div className="text-xs text-slate">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className={`font-semibold ${isToday ? 'text-sage-600' : 'text-charcoal'}`}>
                {day.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-sage-100">
            <div className="p-2 text-right text-xs text-slate border-r border-sage-100">
              {hour === 0
                ? '12 AM'
                : hour < 12
                ? `${hour} AM`
                : hour === 12
                ? '12 PM'
                : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const dayHourBookings: Booking[] = bookings.filter((b: any) => {
                const bd = new Date(b.startTime)
                return bd.toDateString() === day.toDateString() && bd.getHours() === hour
              })
              const slotDate = new Date(day)
              slotDate.setHours(hour, 0, 0, 0)

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-[60px] p-1 border-r border-sage-100 last:border-r-0 hover:bg-sage-50 transition cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation()
                    onDrop(new Date(day), `${hour.toString().padStart(2, '0')}:00`)
                  }}
                  onClick={() => {
                    if (dayHourBookings.length === 0) {
                      onSlotClick(slotDate)
                    }
                  }}
                >
                  {dayHourBookings.map((booking: Booking) => {
                    const label = getClientDisplay(booking, isShared, counsellorId, isSuperAdmin)
                    const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
                    return (
                      <div
                        key={booking.id}
                        draggable={own}
                        onDragStart={(e) => {
                          e.stopPropagation()
                          if (own) onDragStart(booking)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onBookingClick(booking)
                        }}
                        className={`text-xs p-1.5 rounded mb-1 cursor-pointer ${getStatusColor(
                          booking.status,
                          booking.isConsultation
                        )} text-white hover:opacity-80 transition`}
                      >
                        <div className="font-semibold truncate">
                          {booking.isConsultation && '📋 '}
                          {label}
                        </div>
                        {isShared && !own && booking.counsellor && (
                          <div className="opacity-75 truncate">{booking.counsellor.user.name}</div>
                        )}
                        <div className="opacity-90">
                          {new Date(booking.startTime).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({
  currentDate,
  bookings,
  onDragStart,
  onDrop,
  onBookingClick,
  onSlotClick,
  getStatusColor,
  availability,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="border-2 border-sage-100 rounded-xl overflow-hidden">
      <div className="bg-sage-50 border-b-2 border-sage-100 p-4 text-center">
        <div className="font-display text-2xl font-bold text-charcoal">
          {currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourBookings: Booking[] = bookings.filter((b: any) => {
            const bd = new Date(b.startTime)
            return (
              bd.toDateString() === currentDate.toDateString() && bd.getHours() === hour
            )
          })
          const slotDate = new Date(currentDate)
          slotDate.setHours(hour, 0, 0, 0)

          return (
            <div key={hour} className="flex border-b border-sage-100">
              <div className="w-24 p-4 text-right text-sm text-slate border-r border-sage-100 flex-shrink-0">
                {hour === 0
                  ? '12 AM'
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? '12 PM'
                  : `${hour - 12} PM`}
              </div>
              <div
                className="flex-1 min-h-[80px] p-2 hover:bg-sage-50 transition cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.stopPropagation()
                  onDrop(currentDate, `${hour.toString().padStart(2, '0')}:00`)
                }}
                onClick={() => {
                  if (hourBookings.length === 0) {
                    onSlotClick(slotDate)
                  }
                }}
              >
                {hourBookings.map((booking: Booking) => {
                  const label = getClientDisplay(booking, isShared, counsellorId, isSuperAdmin)
                  const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
                  return (
                    <div
                      key={booking.id}
                      draggable={own}
                      onDragStart={(e) => {
                        e.stopPropagation()
                        if (own) onDragStart(booking)
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onBookingClick(booking)
                      }}
                      className={`p-3 rounded-xl mb-2 cursor-pointer ${getStatusColor(
                        booking.status,
                        booking.isConsultation
                      )} text-white hover:opacity-90 transition`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-semibold">
                          {booking.isConsultation && '📋 '}
                          {label}
                        </div>
                        <span className="text-xs opacity-90">
                          {booking.isConsultation ? 'CONSULTATION' : booking.sessionType}
                        </span>
                      </div>
                      {isShared && !own && booking.counsellor && (
                        <div className="text-sm opacity-80 mb-1">
                          Counsellor: {booking.counsellor.user.name}
                        </div>
                      )}
                      <div className="text-sm opacity-90">
                        {new Date(booking.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {' – '}
                        {new Date(booking.endTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                      {booking.room && (
                        <div className="text-xs opacity-80 mt-1">📍 {booking.room.name}</div>
                      )}
                    </div>
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

// ─── Agenda View ───────────────────────────────────────────────────────────────
function AgendaView({
  bookings,
  currentDate,
  onBookingClick,
  getStatusColor,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const upcomingBookings = bookings
    .filter((b: any) => new Date(b.startTime) >= new Date())
    .sort(
      (a: any, b: any) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 50)

  return (
    <div className="space-y-4">
      {upcomingBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
            No Upcoming Bookings
          </h3>
          <p className="text-slate">Your schedule is clear!</p>
        </div>
      ) : (
        upcomingBookings.map((booking: Booking) => {
          const label = getClientDisplay(booking, isShared, counsellorId, isSuperAdmin)
          const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
          return (
            <div
              key={booking.id}
              onClick={() => onBookingClick(booking)}
              className="card p-6 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-start gap-6">
                {/* Date badge */}
                <div
                  className={`${getStatusColor(
                    booking.status,
                    booking.isConsultation
                  )} text-white px-4 py-3 rounded-xl text-center min-w-[80px]`}
                >
                  <div className="text-xs font-semibold uppercase">
                    {new Date(booking.startTime).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })}
                  </div>
                  <div className="text-3xl font-bold">
                    {new Date(booking.startTime).getDate()}
                  </div>
                  <div className="text-xs">
                    {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-display text-xl font-bold text-charcoal mb-1">
                        {label}
                      </h3>
                      {isShared && !own && booking.counsellor && (
                        <p className="text-sm text-slate mb-1">
                          Counsellor: {booking.counsellor.user.name}
                        </p>
                      )}
                      <div className="text-sm text-slate">
                        {new Date(booking.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {' – '}
                        {new Date(booking.endTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <span
                      className={`badge ${getStatusColor(
                        booking.status,
                        booking.isConsultation
                      )} text-white`}
                    >
                      {booking.isConsultation ? 'CONSULTATION' : booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate">
                    <span>
                      📋 {booking.isConsultation ? 'Consultation' : booking.sessionType}
                    </span>
                    {booking.room && <span>🏢 {booking.room.name}</span>}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Day Detail Modal (overflow) ───────────────────────────────────────────────
function DayDetailModal({
  date,
  bookings,
  onClose,
  onBookingClick,
  getStatusColor,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const sorted: Booking[] = [...bookings].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="card p-6 max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-2xl font-bold text-charcoal">
              {date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>
            <p className="text-sm text-slate">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-slate hover:text-charcoal text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-2">
          {sorted.map((booking) => {
            const label = getClientDisplay(booking, isShared, counsellorId, isSuperAdmin)
            const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
            return (
              <div
                key={booking.id}
                onClick={() => onBookingClick(booking)}
                className={`p-3 rounded-xl cursor-pointer ${getStatusColor(
                  booking.status,
                  booking.isConsultation
                )} text-white hover:opacity-90 transition`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {booking.isConsultation && '📋 '}
                      {label}
                    </div>
                    {isShared && !own && booking.counsellor && (
                      <div className="text-xs opacity-80 truncate">
                        {booking.counsellor.user.name}
                      </div>
                    )}
                  </div>
                  <div className="text-xs opacity-90 text-right ml-3 flex-shrink-0">
                    <div>
                      {new Date(booking.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    <div>
                      {new Date(booking.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                {booking.room && (
                  <div className="text-xs opacity-80 mt-1">📍 {booking.room.name}</div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-sage-100">
          <button onClick={onClose} className="btn btn-outline w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Booking Detail Modal ──────────────────────────────────────────────────────
function BookingDetailModal({
  booking,
  onClose,
  isShared,
  counsellorId,
  isSuperAdmin,
}: any) {
  const own = isOwnBooking(booking, counsellorId, isSuperAdmin)
  const showClientDetails = !isShared || own

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display text-2xl font-bold text-charcoal">Session Details</h3>
          <button onClick={onClose} className="text-slate hover:text-charcoal text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Client info — hidden for other counsellors in shared mode */}
          {showClientDetails ? (
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">Client</div>
              <div className="font-semibold text-charcoal">{booking.client.name}</div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">Session</div>
              <div className="font-semibold text-slate italic">Client details are private</div>
            </div>
          )}

          {/* Counsellor info — shown in shared mode */}
          {isShared && booking.counsellor && (
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">Counsellor</div>
              <div className="font-semibold text-charcoal">{booking.counsellor.user.name}</div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase text-slate mb-1">Date & Time</div>
            <div className="font-semibold text-charcoal">
              {new Date(booking.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="text-sm text-slate">
              {new Date(booking.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {' – '}
              {new Date(booking.endTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
          </div>

          {booking.room && (
            <div>
              <div className="text-xs font-semibold uppercase text-slate mb-1">Room</div>
              <div className="font-semibold text-charcoal">{booking.room.name}</div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase text-slate mb-1">Status</div>
            <span className="badge bg-sage-100 text-sage-700">{booking.status}</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {showClientDetails && (
            <Link
              href={`/counsellor/bookings/${booking.id}`}
              className="btn btn-primary flex-1 justify-center"
            >
              View Full Details
            </Link>
          )}
          <button onClick={onClose} className="btn btn-outline flex-1">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Add Modal ───────────────────────────────────────────────────────────
function QuickAddModal({
  date,
  clients,
  rooms,
  counsellorId,
  onClose,
  onSuccess,
}: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    time: date
      ? `${date.getHours().toString().padStart(2, '0')}:${date
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      : '09:00',
    duration: '60',
    roomId: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const startDateTime = new Date(date)
      const [hours, minutes] = formData.time.split(':')
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const endDateTime = new Date(
        startDateTime.getTime() + parseInt(formData.duration) * 60000
      )

      const response = await fetch('/api/counsellor/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          clientId: formData.clientId,
          roomId: formData.roomId || null,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          sessionType: 'INDIVIDUAL',
          status: 'SCHEDULED',
          paymentStatus: 'UNPAID',
        }),
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
          Quick Add Session
        </h3>
        <p className="text-sm text-slate mb-6">
          {date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">👥</div>
            <h4 className="font-semibold text-charcoal mb-2">No Clients Yet</h4>
            <p className="text-sm text-slate mb-4">
              You need to onboard a client before booking a session
            </p>
            <Link href="/counsellor/clients/onboard" className="btn btn-primary">
              + Onboard First Client
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                required
              >
                <option value="">Select client...</option>
                {clients.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-charcoal mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal mb-2">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-charcoal mb-2">
                Room (Optional)
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              >
                <option value="">No room</option>
                {rooms.map((room: any) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex-1">
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
