'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [nameInitialized, setNameInitialized] = useState(false)

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-slate">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  // Initialise name field once session loads
  if (!nameInitialized && session?.user?.name) {
    setName(session.user.name)
    setNameInitialized(true)
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setNameLoading(true)
    setNameMsg(null)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        setNameMsg({ type: 'success', text: 'Name updated successfully.' })
      } else {
        const data = await res.json()
        setNameMsg({ type: 'error', text: data.error || 'Failed to update name.' })
      }
    } catch {
      setNameMsg({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setNameLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setPasswordMsg({ type: 'error', text: data.error || 'Failed to update password.' })
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Something went wrong.' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    MASJID_ADMIN: 'Masjid Admin',
    COUNSELLOR: 'Counsellor',
    ORGANISER: 'Organiser',
    COMMUNITY_MEMBER: 'Community Member',
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">Settings</h1>
          <p className="text-xl text-slate">Manage your account preferences</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-sage-100 flex items-center justify-center font-display text-3xl font-bold text-sage-600 mx-auto mb-3">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="font-display text-xl font-bold text-charcoal mb-1">
                {session.user.name}
              </div>
              <div className="text-sm text-slate mb-3">{session.user.email}</div>
              <span className="badge bg-sage-100 text-sage-700">
                {roleLabels[session.user.role] || session.user.role}
              </span>
            </div>

            {/* Quick links */}
            <div className="card p-4 space-y-1">
              <Link href="/profile" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                👤 My Profile
              </Link>
              <Link href="/my-rsvps" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                🎫 My RSVPs
              </Link>
              {session.user.role === 'COMMUNITY_MEMBER' && (
                <Link href="/request-role" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                  ⬆️ Request Role Upgrade
                </Link>
              )}
              {['SUPER_ADMIN', 'MASJID_ADMIN', 'ORGANISER'].includes(session.user.role) && (
                <Link href="/dashboard" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                  📊 Organiser Dashboard
                </Link>
              )}
              {['SUPER_ADMIN', 'COUNSELLOR'].includes(session.user.role) && (
                <Link href="/counsellor/dashboard" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                  🧠 Counsellor Dashboard
                </Link>
              )}
              {session.user.role === 'SUPER_ADMIN' && (
                <Link href="/admin" className="block px-3 py-2 rounded-lg hover:bg-sage-50 transition text-sm text-charcoal">
                  👑 Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Update Name */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">Display Name</h2>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Email</label>
                  <input
                    type="email"
                    value={session.user.email || ''}
                    disabled
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl bg-sage-50 text-slate cursor-not-allowed"
                  />
                  <p className="text-xs text-slate mt-1">Email cannot be changed</p>
                </div>
                {nameMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    nameMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {nameMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={nameLoading}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {nameLoading ? 'Saving…' : 'Save Name'}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="card p-8">
              <h2 className="font-display text-2xl font-bold text-charcoal mb-6">Change Password</h2>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                    placeholder="Repeat new password"
                    required
                  />
                </div>
                {passwordMsg && (
                  <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                    passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {passwordMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className="card p-8 border-2 border-red-100">
              <h2 className="font-display text-2xl font-bold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-slate mb-6 text-sm">
                Once you sign out all devices, you will need to log in again. Account deletion is permanent and cannot be undone.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
