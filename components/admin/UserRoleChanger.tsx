'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLES = ['SUPER_ADMIN', 'MASJID_ADMIN', 'ORGANISER', 'COMMUNITY_MEMBER', 'COUNSELLOR', 'CLIENT']

export function UserRoleChanger({ user }: { user: { id: string, role: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentRole, setCurrentRole] = useState(user.role)

  async function handleRoleChange(newRole: string) {
    if (newRole === currentRole) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, role: newRole }),
      })

      if (response.ok) {
        setCurrentRole(newRole)
        router.refresh()
      } else {
        alert('Failed to update role')
      }
    } catch (error) {
      console.error('Role change error:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={currentRole}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={loading}
      className="px-3 py-2 border-2 border-sage-100 rounded-lg focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition text-sm font-semibold"
    >
      {ROLES.map(role => (
        <option key={role} value={role}>
          {role.replace('_', ' ')}
        </option>
      ))}
    </select>
  )
}
