'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EventRSVPButtonProps {
  eventId: string
  eventSlug: string
  userRSVP: any
  isLoggedIn: boolean
  capacity?: number | null
  currentCount: number
}

export function EventRSVPButton({
  eventId,
  eventSlug,
  userRSVP,
  isLoggedIn,
  capacity,
  currentCount,
}: EventRSVPButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rsvpStatus, setRsvpStatus] = useState(userRSVP?.status || null)

  const isFull = capacity ? currentCount >= capacity : false

  async function handleRSVP() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/events/${eventSlug}`)
      return
    }

    setLoading(true)

    try {
      if (rsvpStatus) {
        // Cancel RSVP - using slug-based endpoint
        const response = await fetch(`/api/events/${eventSlug}/rsvp`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setRsvpStatus(null)
          router.refresh()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to cancel RSVP')
        }
      } else {
        // Create RSVP - using slug-based endpoint
        const response = await fetch(`/api/events/${eventSlug}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ATTENDING' }),
        })

        if (response.ok) {
          setRsvpStatus('ATTENDING')
          router.refresh()
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to RSVP')
        }
      }
    } catch (error) {
      console.error('RSVP error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Link 
        href={`/login?redirect=/events/${eventSlug}`} 
        className="btn btn-primary w-full justify-center"
      >
        Sign in to RSVP
      </Link>
    )
  }

  if (isFull && !rsvpStatus) {
    return (
      <button 
        disabled 
        className="btn btn-outline w-full justify-center opacity-50 cursor-not-allowed"
      >
        Event Full
      </button>
    )
  }

  return (
    <button
      onClick={handleRSVP}
      disabled={loading}
      className={`btn w-full justify-center transition-colors ${
        rsvpStatus 
          ? 'bg-green-500 hover:bg-red-500 text-white border-green-500 hover:border-red-500' 
          : 'btn-primary'
      }`}
    >
      {loading ? 'Loading...' : rsvpStatus ? '✓ Attending (Click to Cancel)' : 'RSVP to Event'}
    </button>
  )
}
