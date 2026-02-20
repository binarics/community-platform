'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function UserDeleteButton({ userId, userName }: { userId: string, userName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to delete user')
      }
    } catch (error) {
      console.error('Delete error:', error)
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
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          {loading ? '...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="text-red-500 hover:text-red-600 text-lg"
      title="Delete user"
    >
      🗑️
    </button>
  )
}
