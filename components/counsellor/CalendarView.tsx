'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  startTime: Date | string
  endTime: Date | string
  status: string
  client: {
    name: string | null
  }
  room: {
    name: string
  } | null
  counsellor?: {
    user: {
      name: string | null
    }
  }
}

interface CalendarViewProps {
  bookings: Booking[]
  counsellorId: string
}

export function CalendarView({ bookings: initialBookings, counsellorId }: CalendarViewProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [isShared, setIsShared] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState(initialBookings)

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

  // Get week dates
  const getWeekDates = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay()) // Start from Sunday
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  // Get month dates (for month view)
  const getMonthDates = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const dates = []
    const currentDay = new Date(startDate)
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0 || dates.length < 35) {
      dates.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
      if (dates.length >= 42) break // Max 6 weeks
    }
    
    return dates
  }

  const weekDates = getWeekDates()
  const monthDates = getMonthDates()

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime)
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Toggle between private and public view
  function toggleSharing() {
    setIsShared(!isShared)
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
            className="p-2 hover:bg-sage-50 rounded-lg transition"
          >
            ←
          </button>
          <div className="font-semibold text-charcoal">
            {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
            className="p-2 hover:bg-sage-50 rounded-lg transition"
          >
            →
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm bg-sage-50 text-sage-700 rounded-full hover:bg-sage-100 transition"
          >
            Today
          </button>
        </div>

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

          {/* View Mode Toggle - FIXED */}
          <div className="flex gap-1 bg-sage-50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === 'week'
                  ? 'bg-white text-charcoal font-semibold shadow-sm'
                  : 'text-slate hover:text-charcoal'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === 'month'
                  ? 'bg-white text-charcoal font-semibold shadow-sm'
                  : 'text-slate hover:text-charcoal'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner - Shows in shared mode */}
      {isShared && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-900">
            <span className="font-semibold">Public Calendar View:</span> You're viewing all counsellors' bookings. 
            Client names are hidden for privacy. Only room and counsellor information is shown.
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-4 text-slate text-sm">
          Loading {isShared ? 'all counsellors' : 'your'} bookings...
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dayBookings = getBookingsForDate(date)
            const isToday = 
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear()

            return (
              <div
                key={i}
                className={`border rounded-lg p-3 min-h-[120px] ${
                  isToday
                    ? 'border-sage-500 bg-sage-50'
                    : 'border-sage-100 bg-white'
                }`}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-slate font-medium">
                    {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-bold ${
                    isToday ? 'text-sage-600' : 'text-charcoal'
                  }`}>
                    {date.getDate()}
                  </div>
                </div>

                <div className="space-y-1">
                  {dayBookings.length === 0 ? (
                    <div className="text-center text-xs text-slate py-2">
                      {isShared ? 'No sessions' : 'Free'}
                    </div>
                  ) : (
                    dayBookings.slice(0, 3).map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/counsellor/bookings/${booking.id}`}
                        className="block p-2 bg-sage-100 rounded text-xs hover:bg-sage-200 transition"
                      >
                        <div className="font-medium truncate">
                          {isShared ? (
                            booking.counsellor?.user.name || 'Counsellor'
                          ) : (
                            booking.client.name
                          )}
                        </div>
                        <div className="text-slate">
                          {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </Link>
                    ))
                  )}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-center text-sage-600 font-medium">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MONTH VIEW - FIXED: Now actually renders */}
      {viewMode === 'month' && (
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-slate py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDates.map((date, i) => {
              const dayBookings = getBookingsForDate(date)
              const isToday = 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear()
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()

              return (
                <div
                  key={i}
                  className={`border rounded-lg p-2 min-h-[80px] ${
                    isToday
                      ? 'border-sage-500 bg-sage-50'
                      : isCurrentMonth
                      ? 'border-sage-100 bg-white'
                      : 'border-sage-50 bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-bold mb-1 ${
                    isToday 
                      ? 'text-sage-600' 
                      : isCurrentMonth 
                      ? 'text-charcoal' 
                      : 'text-slate'
                  }`}>
                    {date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <Link
                        key={booking.id}
                        href={`/counsellor/bookings/${booking.id}`}
                        className="block p-1 bg-sage-100 rounded text-xs hover:bg-sage-200 transition truncate"
                        title={`${isShared ? booking.counsellor?.user.name : booking.client.name} - ${new Date(booking.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        <div className="font-medium truncate">
                          {new Date(booking.startTime).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </Link>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-center text-sage-600 font-medium">
                        +{dayBookings.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
