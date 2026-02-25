'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CancelBookingButtonProps {
  bookingId: string
  clientName: string
  sessionDate: string
}

export function CancelBookingButton({
  bookingId,
  clientName,
  sessionDate,
}: CancelBookingButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/counsellor/bookings/${bookingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel booking')
      }

      router.push('/counsellor/bookings')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="btn btn-outline text-red-600 border-red-200 hover:bg-red-50"
      >
        ✕ Cancel Session
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => !loading && setShowConfirm(false)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-xl">✕</span>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-charcoal mb-1">
                  Cancel Session?
                </h3>
                <p className="text-slate text-sm">
                  You are about to cancel the session with{' '}
                  <span className="font-semibold text-charcoal">{clientName}</span> on{' '}
                  <span className="font-semibold text-charcoal">{sessionDate}</span>.
                </p>
                <p className="text-slate text-sm mt-2">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="btn btn-outline flex-1"
              >
                Keep Session
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
