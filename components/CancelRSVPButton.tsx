'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelRSVPButtonProps {
  eventId: string
}

export function CancelRSVPButton({ eventId }: CancelRSVPButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleCancel() {
    setLoading(true)

    try {
      const response = await fetch(`/api/rsvp?eventId=${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel RSVP')
      }
    } catch (error) {
      console.error('Cancel RSVP error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-3 py-2 rounded-full bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition"
        >
          {loading ? 'Canceling...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-2 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm hover:bg-gray-200 transition"
        >
          Keep
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 rounded-full bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition border border-red-200"
    >
      Cancel RSVP
    </button>
  )
}
