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
  isConsultation?: boolean
  client: {
    id: string
    name: string
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
  initialView?: string
  initialDate?: string
  availability?: any
}

type ViewType = 'month' | 'week' | 'day' | 'agenda'

export function FullCalendar({
  bookings: initialBookings,
  clients,
  rooms,
  counsellorId,
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

  // Update URL when view/date changes
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('view', view)
    params.set('date', currentDate.toISOString().split('T')[0])
    router.push(`/counsellor/calendar?${params.toString()}`, { scroll: false })
  }, [view, currentDate])

  // Fetch all bookings when in shared mode
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

  function toggleSharing() {
    setIsShared(!isShared)
  }

  // Navigation functions
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

  // Get bookings for current view
  function getBookingsForView() {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime)
      
      if (view === 'month') {
        return bookingDate.getMonth() === currentDate.getMonth() &&
               bookingDate.getFullYear() === currentDate.getFullYear()
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

  // Drag and drop handlers
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
        {/* Navigation */}
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
              ...(view === 'day' && { day: 'numeric' })
            })}
          </h2>
        </div>

        {/* Sharing Toggle and View Switcher */}
        <div className="flex items-center gap-3">
          {/* Sharing Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-sage-50 rounded-lg">
            <span className="text-sm font-medium text-slate">
              {isShared ? '👥 Public' : '🔒 Private'}
            </span>
            <button
              onClick={toggleSharing}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isShared ? 'bg-sage-500' : 'bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isShared ? 'Switch to private view (your bookings only)' : 'Switch to public view (all counsellors)'}
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

      {/* Info Banner - Shows in shared mode */}
      {isShared && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
          <span className="text-blue-600 text-xl">ℹ️</span>
          <div className="text-sm text-blue-900">
            <span className="font-semibold">Public Calendar View:</span> You're viewing all counsellors' bookings. 
            Client names are hidden for privacy. Only room and counsellor information is shown.
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
          onDateClick={(date) => {
            setQuickAddDate(date)
            setShowQuickAdd(true)
          }}
          getStatusColor={getStatusColor}
        />
      )}

      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          bookings={visibleBookings}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onBookingClick={setSelectedBooking}
          getStatusColor={getStatusColor}
          availability={availability}
        />
      )}

      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          bookings={visibleBookings}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          onBookingClick={setSelectedBooking}
          getStatusColor={getStatusColor}
          availability={availability}
        />
      )}

      {view === 'agenda' && (
        <AgendaView
          bookings={bookings}
          currentDate={currentDate}
          onBookingClick={setSelectedBooking}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
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

// Month View Component
function MonthView({ 
  currentDate, 
  bookings, 
  onDragStart, 
  onDrop, 
  onBookingClick,
  onDateClick,
  getStatusColor 
}: any) {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  const days = []
  const currentDay = new Date(startDate)
  
  while (currentDay <= monthEnd || currentDay.getDay() !== 0) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="border-2 border-sage-100 rounded-xl overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-sage-50 border-b-2 border-sage-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center font-semibold text-sm text-slate">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-b border-sage-100 last:border-b-0">
          {week.map((day, dayIdx) => {
            const dayBookings = bookings.filter((b: any) => 
              new Date(b.startTime).toDateString() === day.toDateString()
            )
            const isToday = day.toDateString() === new Date().toDateString()
            const isCurrentMonth = day.getMonth() === currentDate.getMonth()

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
                      isToday ? 'bg-sage-500 text-white' : 
                      !isCurrentMonth ? 'text-slate' : 'text-charcoal'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                  {dayBookings.length > 0 && (
                    <span className="text-xs text-slate">{dayBookings.length}</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking: any) => (
                    <div
                      key={booking.id}
                      draggable
                      onDragStart={() => onDragStart(booking)}
                      onClick={() => onBookingClick(booking)}
                      className={`text-xs p-1.5 rounded cursor-pointer ${getStatusColor(booking.status, booking.isConsultation)} text-white truncate hover:opacity-80 transition`}
                    >
                      {booking.isConsultation && '📋 '}
                      {new Date(booking.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })} {booking.client.name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-slate pl-1.5">
                      +{dayBookings.length - 3} more
                    </div>
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

// Week View Component
function WeekView({ currentDate, bookings, onDragStart, onDrop, onBookingClick, getStatusColor, availability }: any) {
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
      {/* Header */}
      <div className="grid grid-cols-8 bg-sage-50 border-b-2 border-sage-100">
        <div className="p-3"></div>
        {days.map((day) => {
          const isToday = day.toDateString() === new Date().toDateString()
          return (
            <div key={day.toISOString()} className={`p-3 text-center ${isToday ? 'bg-terracotta-50' : ''}`}>
              <div className="text-xs text-slate">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
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
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            {days.map((day) => {
              const dayHourBookings = bookings.filter((b: any) => {
                const bookingDate = new Date(b.startTime)
                return bookingDate.toDateString() === day.toDateString() &&
                       bookingDate.getHours() === hour
              })

              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-[60px] p-1 border-r border-sage-100 last:border-r-0 hover:bg-sage-50 transition"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const newDate = new Date(day)
                    onDrop(newDate, `${hour.toString().padStart(2, '0')}:00`)
                  }}
                >
                  {dayHourBookings.map((booking: any) => (
                    <div
                      key={booking.id}
                      draggable
                      onDragStart={() => onDragStart(booking)}
                      onClick={() => onBookingClick(booking)}
                      className={`text-xs p-1.5 rounded mb-1 cursor-pointer ${getStatusColor(booking.status, booking.isConsultation)} text-white hover:opacity-80 transition`}
                    >
                      <div className="font-semibold">
                        {booking.isConsultation && '📋 '}
                        {booking.client.name}
                      </div>
                      <div className="opacity-90">
                        {new Date(booking.startTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// Day View Component
function DayView({ currentDate, bookings, onDragStart, onDrop, onBookingClick, getStatusColor, availability }: any) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return (
    <div className="border-2 border-sage-100 rounded-xl overflow-hidden">
      <div className="bg-sage-50 border-b-2 border-sage-100 p-4 text-center">
        <div className="font-display text-2xl font-bold text-charcoal">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        {hours.map((hour) => {
          const hourBookings = bookings.filter((b: any) => {
            const bookingDate = new Date(b.startTime)
            return bookingDate.toDateString() === currentDate.toDateString() &&
                   bookingDate.getHours() === hour
          })

          return (
            <div key={hour} className="flex border-b border-sage-100">
              <div className="w-24 p-4 text-right text-sm text-slate border-r border-sage-100">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div
                className="flex-1 min-h-[80px] p-2 hover:bg-sage-50 transition"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(currentDate, `${hour.toString().padStart(2, '0')}:00`)}
              >
                {hourBookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    draggable
                    onDragStart={() => onDragStart(booking)}
                    onClick={() => onBookingClick(booking)}
                    className={`p-3 rounded-xl mb-2 cursor-pointer ${getStatusColor(booking.status, booking.isConsultation)} text-white hover:opacity-90 transition`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-semibold">
                        {booking.isConsultation && '📋 '}
                        {booking.client.name}
                      </div>
                      <span className="text-xs opacity-90">{booking.isConsultation ? 'CONSULTATION' : booking.sessionType}</span>
                    </div>
                    <div className="text-sm opacity-90">
                      {new Date(booking.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(booking.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                    {booking.room && (
                      <div className="text-xs opacity-80 mt-1">📍 {booking.room.name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Agenda View Component
function AgendaView({ bookings, currentDate, onBookingClick, getStatusColor }: any) {
  const upcomingBookings = bookings
    .filter((b: any) => new Date(b.startTime) >= new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 50)

  return (
    <div className="space-y-4">
      {upcomingBookings.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="font-display text-2xl font-bold text-charcoal mb-2">
            No Upcoming Bookings
          </h3>
          <p className="text-slate">
            Your schedule is clear!
          </p>
        </div>
      ) : (
        upcomingBookings.map((booking: any) => (
          <div
            key={booking.id}
            onClick={() => onBookingClick(booking)}
            className="card p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-start gap-6">
              {/* Date Badge */}
              <div className={`${getStatusColor(booking.status, booking.isConsultation)} text-white px-4 py-3 rounded-xl text-center min-w-[80px]`}>
                <div className="text-xs font-semibold uppercase">
                  {new Date(booking.startTime).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-3xl font-bold">
                  {new Date(booking.startTime).getDate()}
                </div>
                <div className="text-xs">
                  {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>

              {/* Booking Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display text-xl font-bold text-charcoal mb-1">
                      {booking.client.name}
                    </h3>
                    <div className="text-sm text-slate">
                      {new Date(booking.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                      {' - '}
                      {new Date(booking.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(booking.status, booking.isConsultation)} text-white`}>
                    {booking.isConsultation ? 'CONSULTATION' : booking.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate">
                  <span>📋 {booking.isConsultation ? 'Consultation' : booking.sessionType}</span>
                  {booking.room && <span>🏢 {booking.room.name}</span>}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// Booking Detail Modal
function BookingDetailModal({ booking, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-display text-2xl font-bold text-charcoal">
            Session Details
          </h3>
          <button onClick={onClose} className="text-slate hover:text-charcoal text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase text-slate mb-1">Client</div>
            <div className="font-semibold text-charcoal">{booking.client.name}</div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase text-slate mb-1">Date & Time</div>
            <div className="font-semibold text-charcoal">
              {new Date(booking.startTime).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-sm text-slate">
              {new Date(booking.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              })}
              {' - '}
              {new Date(booking.endTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
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
          <Link href={`/counsellor/bookings/${booking.id}`} className="btn btn-primary flex-1 justify-center">
            View Full Details
          </Link>
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Quick Add Modal - UPDATED FOR CLIENT COUNSELLOR RELATIONSHIP
function QuickAddModal({ date, clients, rooms, counsellorId, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientId: '',
    time: '09:00',
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
      
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000)

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-4">
          Quick Add Session
        </h3>
        <p className="text-sm text-slate mb-6">
          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
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
                  <option key={client.id} value={client.id}>{client.name}</option>
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
                <label className="block font-semibold text-charcoal mb-2">
                  Duration
                </label>
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
                  <option key={room.id} value={room.id}>{room.name}</option>
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
