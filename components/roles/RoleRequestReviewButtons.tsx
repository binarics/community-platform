'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RoleRequestReviewButtons({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [notes, setNotes] = useState('')

  async function handleApprove() {
    setLoading(true)
    try {
      const response = await fetch(`/api/role-request/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: notes }),
      })

      if (response.ok) {
        router.refresh()
        setShowApprove(false)
      } else {
        alert('Failed to approve request')
      }
    } catch (error) {
      console.error('Approve error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/role-request/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes: notes }),
      })

      if (response.ok) {
        router.refresh()
        setShowReject(false)
      } else {
        alert('Failed to reject request')
      }
    } catch (error) {
      console.error('Reject error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (showApprove) {
    return (
      <div className="border-t border-sage-100 pt-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Review Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Approved on trial basis. Active member with good engagement."
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Approving...' : 'Confirm Approval'}
          </button>
          <button
            onClick={() => setShowApprove(false)}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (showReject) {
    return (
      <div className="border-t border-sage-100 pt-6">
        <div className="mb-4">
          <label className="block text-sm font-semibold text-charcoal mb-2">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g., Insufficient activity history. Please engage more with the community first."
            className="w-full px-4 py-3 border-2 border-red-100 rounded-xl focus:border-red-500 transition resize-none"
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={loading || !notes.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition"
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
          <button
            onClick={() => setShowReject(false)}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => setShowApprove(true)}
        className="btn btn-primary"
      >
        ✓ Approve
      </button>
      <button
        onClick={() => setShowReject(true)}
        className="px-4 py-2 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition border border-red-200"
      >
        ✗ Reject
      </button>
    </div>
  )
}
