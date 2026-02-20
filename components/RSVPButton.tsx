'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface RSVPButtonProps {
  eventId: string
  initialRSVPCount: number
  size?: 'sm' | 'md' | 'lg'
}

export function RSVPButton({ eventId, initialRSVPCount, size = 'md' }: RSVPButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasRSVPd, setHasRSVPd] = useState(false)
  const [rsvpCount, setRsvpCount] = useState(initialRSVPCount)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      checkRSVPStatus()
    } else {
      setChecking(false)
    }
  }, [status, eventId])

  async function checkRSVPStatus() {
    try {
      const response = await fetch(`/api/rsvp?eventId=${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setHasRSVPd(data.hasRSVPd)
      }
    } catch (error) {
      console.error('Error checking RSVP:', error)
    } finally {
      setChecking(false)
    }
  }

  async function handleRSVP() {
    if (status !== 'authenticated') {
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      if (hasRSVPd) {
        // Cancel RSVP
        const response = await fetch(`/api/rsvp?eventId=${eventId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setHasRSVPd(false)
          setRsvpCount(prev => prev - 1)
        }
      } else {
        // Create RSVP
        const response = await fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        })

        if (response.ok) {
          setHasRSVPd(true)
          setRsvpCount(prev => prev + 1)
        } else {
          const data = await response.json()
          alert(data.error || 'Failed to RSVP')
        }
      }
    } catch (error) {
      console.error('RSVP error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <button 
        className={`btn btn-outline ${size === 'sm' ? 'btn-sm' : ''}`}
        disabled
      >
        Loading...
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleRSVP}
        disabled={loading}
        className={`btn ${hasRSVPd ? 'btn-outline' : 'btn-primary'} ${size === 'sm' ? 'btn-sm' : ''}`}
      >
        {loading ? (
          'Loading...'
        ) : hasRSVPd ? (
          <>✓ RSVP'd</>
        ) : (
          'RSVP'
        )}
      </button>
      <span className="text-sm text-slate">
        <strong className="text-sage-500">{rsvpCount}</strong> attending
      </span>
    </div>
  )
}
