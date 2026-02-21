'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EventRSVPButtonProps {
  eventId: string
  userRSVP: any
  isLoggedIn: boolean
  capacity?: number | null
  currentCount: number
}

export function EventRSVPButton({
  eventId,
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
      router.push(`/login?redirect=/events/${eventId}`)
      return
    }

    setLoading(true)

    try {
      if (rsvpStatus) {
        // Cancel RSVP
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setRsvpStatus(null)
          router.refresh()
        }
      } else {
        // Create RSVP
        const response = await fetch(`/api/events/${eventId}/rsvp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'GOING' }),
        })

        if (response.ok) {
          setRsvpStatus('GOING')
          router.refresh()
        }
      }
    } catch (error) {
      console.error('RSVP error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href={`/login?redirect=/events/${eventId}`} className="btn btn-primary w-full justify-center">
        Sign in to RSVP
      </Link>
    )
  }

  if (isFull && !rsvpStatus) {
    return (
      <button disabled className="btn btn-outline w-full justify-center opacity-50 cursor-not-allowed">
        Event Full
      </button>
    )
  }

  return (
    <button
      onClick={handleRSVP}
      disabled={loading}
      className={`btn w-full justify-center ${
        rsvpStatus ? 'bg-green-500 hover:bg-red-500 text-white' : 'btn-primary'
      }`}
    >
      {loading ? 'Loading...' : rsvpStatus ? '✓ Going (Click to Cancel)' : 'RSVP'}
    </button>
  )
}
