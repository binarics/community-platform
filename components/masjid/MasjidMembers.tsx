'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MasjidMembersProps {
  members: any[]
  admins: any[]
  moderators: any[]
  masjidId: string
  canManage: boolean
}

export function MasjidMembers({ members, admins, moderators, masjidId, canManage }: MasjidMembersProps) {
  const router = useRouter()
  const [showAddRole, setShowAddRole] = useState(false)

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-charcoal">
          Team & Members
        </h3>
        {canManage && (
          <button 
            onClick={() => setShowAddRole(true)}
            className="text-sm text-sage-500 hover:text-sage-600 font-semibold"
          >
            + Add Role
          </button>
        )}
      </div>

      {/* Admins */}
      {admins.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-slate mb-2">
            Admins ({admins.length})
          </div>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 p-2 bg-sage-50 rounded-lg">
                <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center text-sm font-semibold text-sage-700">
                  {admin.user.name?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-charcoal truncate">
                    {admin.user.name}
                  </div>
                  <div className="text-xs text-slate truncate">
                    {admin.user.email}
                  </div>
                </div>
                <span className="badge bg-sage-500 text-white text-xs">Admin</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderators */}
      {moderators.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-slate mb-2">
            Moderators ({moderators.length})
          </div>
          <div className="space-y-2">
            {moderators.map((mod) => (
              <div key={mod.id} className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                  {mod.user.name?.[0] || 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-charcoal truncate">
                    {mod.user.name}
                  </div>
                  <div className="text-xs text-slate truncate">
                    {mod.user.email}
                  </div>
                </div>
                <span className="badge bg-blue-500 text-white text-xs">Moderator</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div>
        <div className="text-sm font-semibold text-slate mb-2">
          Members ({members.length})
        </div>
        {members.length === 0 ? (
          <p className="text-xs text-slate py-4 text-center">
            No members yet
          </p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {members.slice(0, 10).map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 hover:bg-sage-50 rounded">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-700">
                  {member.user.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-charcoal truncate">
                    {member.user.name}
                  </div>
                </div>
              </div>
            ))}
            {members.length > 10 && (
              <div className="text-xs text-slate text-center pt-2">
                +{members.length - 10} more members
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}