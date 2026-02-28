'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TeamMember {
  id: string
  userId: string
  assignedAt: Date | string
  user: { id: string; name: string | null; email: string | null }
}

interface AdminMember extends TeamMember {
  canEditMasjid: boolean
  canManageEvents: boolean
  canManageMembers: boolean
  canAssignRoles: boolean
}

interface ModMember extends TeamMember {
  canCreateEvents: boolean
  canEditEvents: boolean
  canDeleteEvents: boolean
  canApproveMembers: boolean
  canSendNotifications: boolean
}

interface Props {
  admins: AdminMember[]
  moderators: ModMember[]
  masjidId: string
  canManage: boolean
}

function TeamCard({
  member,
  label,
  permissions,
  badgeClass,
  onRemove,
  removing,
  canManage,
  type,
}: {
  member: TeamMember
  label: string
  permissions: string[]
  badgeClass: string
  onRemove: () => void
  removing: boolean
  canManage: boolean
  type: string
}) {
  const initials = member.user.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${type === 'admin' ? 'bg-gradient-to-br from-purple-400 to-purple-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="font-semibold text-charcoal">{member.user.name}</div>
          <span className={`badge text-xs ${badgeClass}`}>{label}</span>
        </div>
        <div className="text-sm text-slate mb-2">{member.user.email}</div>
        <div className="flex flex-wrap gap-1.5">
          {permissions.map((p) => (
            <span key={p} className="px-2 py-0.5 bg-sage-50 text-sage-600 rounded-md text-xs font-medium">
              {p}
            </span>
          ))}
        </div>
        <div className="text-xs text-slate mt-2">
          Assigned {new Date(member.assignedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
      {canManage && (
        <button
          onClick={onRemove}
          disabled={removing}
          className="text-sm text-red-500 hover:text-red-600 font-semibold shrink-0 disabled:opacity-50"
        >
          {removing ? 'Removing…' : 'Remove'}
        </button>
      )}
    </div>
  )
}

export function MasjidTeamClient({ admins, moderators, masjidId, canManage }: Props) {
  const router = useRouter()
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [addForm, setAddForm] = useState<'admin' | 'moderator' | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  async function handleRemove(id: string, type: 'admin' | 'moderator', name: string) {
    if (!confirm(`Remove ${name} as ${type}?`)) return
    setRemoving(id)
    setError('')
    try {
      const res = await fetch(`/api/masjid/${masjidId}/team/${id}?type=${type}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to remove team member')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setRemoving(null)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addForm) return
    setAddLoading(true)
    setAddError('')
    try {
      // First look up user by email
      const userRes = await fetch(`/api/users/lookup?email=${encodeURIComponent(addEmail)}`)
      if (!userRes.ok) {
        setAddError('User not found with that email address.')
        setAddLoading(false)
        return
      }
      const { userId } = await userRes.json()

      const res = await fetch(`/api/masjid/${masjidId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamRole: addForm === 'admin' ? 'ADMIN' : 'MODERATOR' }),
      })
      if (res.ok) {
        setAddForm(null)
        setAddEmail('')
        router.refresh()
      } else {
        const d = await res.json()
        setAddError(d.error || 'Failed to add team member')
      }
    } catch {
      setAddError('Something went wrong')
    } finally {
      setAddLoading(false)
    }
  }

  const adminPerms = (a: AdminMember) =>
    [
      a.canEditMasjid && 'Edit Masjid',
      a.canManageEvents && 'Manage Events',
      a.canManageMembers && 'Manage Members',
      a.canAssignRoles && 'Assign Roles',
    ].filter(Boolean) as string[]

  const modPerms = (m: ModMember) =>
    [
      m.canCreateEvents && 'Create Events',
      m.canEditEvents && 'Edit Events',
      m.canDeleteEvents && 'Delete Events',
      m.canApproveMembers && 'Approve Members',
      m.canSendNotifications && 'Send Notifications',
    ].filter(Boolean) as string[]

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Admins */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-charcoal">Administrators</h2>
          {canManage && (
            <button
              onClick={() => { setAddForm('admin'); setAddError('') }}
              className="btn btn-outline btn-sm"
            >
              + Add Admin
            </button>
          )}
        </div>

        {addForm === 'admin' && (
          <form onSubmit={handleAdd} className="card p-5 mb-4 border-2 border-purple-100">
            <div className="font-semibold text-charcoal mb-3">Add Administrator</div>
            {addError && <div className="text-red-600 text-sm mb-3">{addError}</div>}
            <div className="flex gap-3">
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="User email address"
                className="flex-1 px-4 py-2.5 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition text-sm"
                required
                autoFocus
              />
              <button type="submit" disabled={addLoading} className="btn btn-primary btn-sm">
                {addLoading ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => setAddForm(null)} className="btn btn-outline btn-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {admins.length === 0 ? (
          <div className="card p-8 text-center text-slate">No administrators assigned yet.</div>
        ) : (
          <div className="space-y-3">
            {admins.map((a) => (
              <TeamCard
                key={a.id}
                member={a}
                label="Admin"
                permissions={adminPerms(a)}
                badgeClass="bg-purple-100 text-purple-700"
                onRemove={() => handleRemove(a.id, 'admin', a.user.name ?? 'this admin')}
                removing={removing === a.id}
                canManage={canManage}
                type="admin"
              />
            ))}
          </div>
        )}
      </div>

      {/* Moderators */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-charcoal">Moderators</h2>
          {canManage && (
            <button
              onClick={() => { setAddForm('moderator'); setAddError('') }}
              className="btn btn-outline btn-sm"
            >
              + Add Moderator
            </button>
          )}
        </div>

        {addForm === 'moderator' && (
          <form onSubmit={handleAdd} className="card p-5 mb-4 border-2 border-blue-100">
            <div className="font-semibold text-charcoal mb-3">Add Moderator</div>
            {addError && <div className="text-red-600 text-sm mb-3">{addError}</div>}
            <div className="flex gap-3">
              <input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="User email address"
                className="flex-1 px-4 py-2.5 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition text-sm"
                required
                autoFocus
              />
              <button type="submit" disabled={addLoading} className="btn btn-primary btn-sm">
                {addLoading ? 'Adding…' : 'Add'}
              </button>
              <button type="button" onClick={() => setAddForm(null)} className="btn btn-outline btn-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        {moderators.length === 0 ? (
          <div className="card p-8 text-center text-slate">No moderators assigned yet.</div>
        ) : (
          <div className="space-y-3">
            {moderators.map((m) => (
              <TeamCard
                key={m.id}
                member={m}
                label="Moderator"
                permissions={modPerms(m)}
                badgeClass="bg-blue-100 text-blue-700"
                onRemove={() => handleRemove(m.id, 'moderator', m.user.name ?? 'this moderator')}
                removing={removing === m.id}
                canManage={canManage}
                type="moderator"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
