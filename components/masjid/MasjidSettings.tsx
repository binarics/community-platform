'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MasjidSettingsProps {
  masjid: any
}

export function MasjidSettings({ masjid }: MasjidSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/masjid/${masjid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !masjid.isActive,
        }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to toggle active status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h3 className="font-display text-xl font-bold text-charcoal mb-4">
        Settings
      </h3>

      <div className="space-y-4">
        {/* Status */}
        <div>
          <div className="text-sm font-semibold text-slate mb-2">Status</div>
          <button
            onClick={toggleActive}
            disabled={loading}
            className={`badge ${
              masjid.isActive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            } cursor-pointer hover:opacity-80`}
          >
            {masjid.isActive ? '✓ Active' : '○ Inactive'}
          </button>
        </div>

        {/* Visibility */}
        <div>
          <div className="text-sm font-semibold text-slate mb-2">Visibility</div>
          <div className="text-sm text-charcoal">
            {masjid.isPublic ? '🌍 Public' : '🔒 Private'}
          </div>
        </div>

        {/* Events */}
        <div>
          <div className="text-sm font-semibold text-slate mb-2">Events</div>
          <div className="text-sm text-charcoal">
            {masjid.allowEvents ? '✓ Enabled' : '✗ Disabled'}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t border-sage-100 space-y-2">
          <button
            onClick={() => router.push(`/admin/masjid/${masjid.id}/edit`)}
            className="w-full btn btn-outline text-sm justify-center"
          >
            ✏️ Edit Settings
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this masjid? This action cannot be undone.')) {
                // Delete functionality
              }
            }}
            className="w-full btn btn-outline text-sm justify-center text-red-600 border-red-200 hover:bg-red-50"
          >
            🗑️ Delete Masjid
          </button>
        </div>
      </div>
    </div>
  )
}