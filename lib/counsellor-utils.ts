// Utility functions for the counsellor module

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time to readable string
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

/**
 * Get duration between two times in minutes
 */
export function getDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

/**
 * Check if a booking is happening now
 */
export function isBookingNow(startTime: Date, endTime: Date): boolean {
  const now = new Date()
  return now >= startTime && now <= endTime
}

/**
 * Check if a booking is in the past
 */
export function isBookingPast(endTime: Date): boolean {
  return new Date() > endTime
}

/**
 * Check if a booking is in the future
 */
export function isBookingFuture(startTime: Date): boolean {
  return new Date() < startTime
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Get status color class for bookings
 */
export function getBookingStatusColor(status: string): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-sage-100 text-sage-700'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700'
    case 'COMPLETED':
      return 'bg-green-100 text-green-700'
    case 'CANCELLED':
      return 'bg-red-100 text-red-700'
    case 'NO_SHOW':
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Get payment status color class
 */
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-700'
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-700'
    case 'UNPAID':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

/**
 * Calculate session statistics
 */
export interface SessionStats {
  total: number
  completed: number
  scheduled: number
  cancelled: number
  completionRate: number
}

export function calculateSessionStats(bookings: any[]): SessionStats {
  const total = bookings.length
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length
  const scheduled = bookings.filter((b) => b.status === 'SCHEDULED').length
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length
  const completionRate = total > 0 ? (completed / total) * 100 : 0

  return {
    total,
    completed,
    scheduled,
    cancelled,
    completionRate,
  }
}

/**
 * Group bookings by date
 */
export function groupBookingsByDate(bookings: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>()

  bookings.forEach((booking) => {
    const dateKey = new Date(booking.startTime).toISOString().split('T')[0]
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, [])
    }
    grouped.get(dateKey)!.push(booking)
  })

  return grouped
}

/**
 * Sort bookings by start time
 */
export function sortBookingsByStartTime(bookings: any[], ascending = true): any[] {
  return [...bookings].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime()
    const timeB = new Date(b.startTime).getTime()
    return ascending ? timeA - timeB : timeB - timeA
  })
}

/**
 * Get upcoming bookings (future bookings only)
 */
export function getUpcomingBookings(bookings: any[], limit?: number): any[] {
  const now = new Date()
  const upcoming = bookings.filter(
    (b) => new Date(b.startTime) > now && b.status !== 'CANCELLED'
  )
  const sorted = sortBookingsByStartTime(upcoming, true)
  return limit ? sorted.slice(0, limit) : sorted
}

/**
 * Get past bookings
 */
export function getPastBookings(bookings: any[], limit?: number): any[] {
  const now = new Date()
  const past = bookings.filter(
    (b) => new Date(b.endTime) < now
  )
  const sorted = sortBookingsByStartTime(past, false)
  return limit ? sorted.slice(0, limit) : sorted
}

/**
 * Generate time slots for a given day
 */
export function generateTimeSlots(
  date: Date,
  startHour: number = 9,
  endHour: number = 17,
  intervalMinutes: number = 60
): Date[] {
  const slots: Date[] []
  const start = new Date(date)
  start.setHours(startHour, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(endHour, 0, 0, 0)

  let current = new Date(start)
  
  while (current < end) {
    slots.push(new Date(current))
    current.setMinutes(current.getMinutes() + intervalMinutes)
  }

  return slots
}

/**
 * Check if a time slot is available
 */
export function isTimeSlotAvailable(
  slotStart: Date,
  durationMinutes: number,
  existingBookings: any[]
): boolean {
  const slotEnd = new Date(slotStart)
  slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes)

  return !existingBookings.some((booking) => {
    if (booking.status === 'CANCELLED') return false
    return timeRangesOverlap(
      slotStart,
      slotEnd,
      new Date(booking.startTime),
      new Date(booking.endTime)
    )
  })
}

/**
 * Parse availability JSON string
 */
export interface Availability {
  [day: string]: {
    enabled: boolean
    hours: string
  }
}

export function parseAvailability(availabilityJson: string): Availability {
  try {
    return JSON.parse(availabilityJson)
  } catch {
    return {}
  }
}

/**
 * Check if counsellor is available on a given day/time
 */
export function isCounsellorAvailable(
  date: Date,
  availability: Availability
): boolean {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dayAvailability = availability[dayName]
  
  if (!dayAvailability || !dayAvailability.enabled) {
    return false
  }

  // Could add time range checking here if needed
  return true
}
