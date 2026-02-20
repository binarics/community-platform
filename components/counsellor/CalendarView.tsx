'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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

  const weekDates = getWeekDates()

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

  return (
    <div>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-sage-50 rounded-lg transition"
          >
            ←
          </button>
          <div className="font-semibold text-charcoal">
            {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          <button
            onClick={() => navigateWeek('next')}
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

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-sage-50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'week'
                  ? 'bg-white text-charcoal font-semibold shadow-sm'
                  : 'text-slate'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'month'
                  ? 'bg-white text-charcoal font-semibold shadow-sm'
                  : 'text-slate'
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

      {/* Week View */}
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
                    {isShared ? 'No bookings' : 'Free'}
                  </div>
                ) : (
                  dayBookings.map((booking) => {
                    const time = new Date(booking.startTime).toLocaleTimeString('en-GB', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })

                    // In shared mode, only show "Busy" and room info
                    // In private mode, show client name
                    const displayName = isShared ? 'Busy' : (booking.client.name || 'Client')
                    const counsellorName = booking.counsellor?.user.name

                    return (
                      <button
                        key={booking.id}
                        onClick={() => {
                          // Only allow clicking own bookings in private mode
                          if (!isShared) {
                            router.push(`/counsellor/bookings/${booking.id}`)
                          }
                        }}
                        disabled={isShared}
                        className={`w-full text-left p-2 rounded text-xs transition ${
                          isShared 
                            ? 'bg-slate-100 cursor-not-allowed'
                            : 'bg-terracotta-50 hover:bg-terracotta-100 cursor-pointer'
                        }`}
                        title={isShared && counsellorName ? `${counsellorName}'s booking` : undefined}
                      >
                        <div className={`font-semibold truncate ${
                          isShared ? 'text-slate-700' : 'text-terracotta-700'
                        }`}>
                          {time}
                        </div>
                        <div className={`truncate ${
                          isShared ? 'text-slate-600' : 'text-terracotta-600'
                        }`}>
                          {displayName}
                        </div>
                        {booking.room && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            📍 {booking.room.name}
                          </div>
                        )}
                        {isShared && counsellorName && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            👤 {counsellorName}
                          </div>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Calendar Legend */}
      <div className="mt-6 p-4 bg-sage-50 rounded-lg">
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${
              isShared ? 'bg-slate-100 border border-slate-200' : 'bg-terracotta-50 border border-terracotta-200'
            }`}></div>
            <span className="text-slate font-medium">{isShared ? 'Occupied' : 'Your Bookings'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-sage-50 border-2 border-sage-500 rounded"></div>
            <span className="text-slate font-medium">Today</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-sage-200">
          {isShared ? (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-lg">🔓</span>
              <div>
                <div className="font-semibold text-slate mb-1">Public View Active</div>
                <ul className="text-xs text-slate space-y-0.5">
                  <li>• Viewing all counsellors' bookings</li>
                  <li>• Client names hidden for privacy (HIPAA/GDPR compliant)</li>
                  <li>• Room and counsellor names visible for coordination</li>
                  <li>• Click bookings disabled to protect client privacy</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm">
              <span className="text-lg">🔒</span>
              <div>
                <div className="font-semibold text-slate mb-1">Private View Active</div>
                <ul className="text-xs text-slate space-y-0.5">
                  <li>• Viewing only your bookings</li>
                  <li>• Client names visible</li>
                  <li>• Click any booking to view full details</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}