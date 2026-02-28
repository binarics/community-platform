'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Member {
  id: string
  userId: string
  joinedAt: string
  receiveNotifications: boolean
  favorited: boolean
  staffRole: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    createdAt: string
  }
}

interface Props {
  members: Member[]
  masjidId: string
  canManage: boolean
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  MODERATOR: 'bg-blue-100 text-blue-700',
}

export function MasjidMembersClient({ members, masjidId, canManage }: Props) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from this masjid?`)) return
    setRemoving(memberId)
    setError('')
    try {
      const res = await fetch(`/api/masjid/${masjidId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        router.refresh()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to remove member')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setRemoving(null)
    }
  }

  if (members.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h3 className="font-display text-2xl font-bold text-charcoal mb-2">No Members Found</h3>
        <p className="text-slate">No members match your current filters.</p>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6">{error}</div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sage-50 border-b-2 border-sage-100">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-slate">Member</th>
                <th className="text-left p-4 font-semibold text-sm text-slate">Role</th>
                <th className="text-left p-4 font-semibold text-sm text-slate">Joined</th>
                <th className="text-left p-4 font-semibold text-sm text-slate">Notifications</th>
                {canManage && (
                  <th className="text-left p-4 font-semibold text-sm text-slate">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-sage-100 hover:bg-sage-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {m.user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-charcoal text-sm">{m.user.name}</div>
                        <div className="text-xs text-slate">{m.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {m.staffRole ? (
                      <span className={`badge text-xs ${ROLE_BADGE[m.staffRole]}`}>
                        {m.staffRole}
                      </span>
                    ) : (
                      <span className="text-sm text-slate">Member</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-charcoal">
                      {new Date(m.joinedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`badge text-xs ${
                        m.receiveNotifications ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {m.receiveNotifications ? 'On' : 'Off'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-4">
                      <button
                        onClick={() => handleRemove(m.id, m.user.name ?? 'this member')}
                        disabled={removing === m.id}
                        className="text-sm text-red-500 hover:text-red-600 font-semibold disabled:opacity-50"
                      >
                        {removing === m.id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
