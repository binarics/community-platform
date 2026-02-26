'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('No reset token found. Please request a new reset link.')
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setError(data.error || 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="font-display text-3xl font-bold text-charcoal mb-3">
            Password Reset!
          </h1>
          <p className="text-slate mb-6">
            Your password has been updated. Redirecting you to login…
          </p>
          <Link href="/login" className="btn btn-primary w-full justify-center">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-charcoal mb-2">
            Reset Password
          </h1>
          <p className="text-slate">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-charcoal mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
              required
            />
          </div>

          {(error || status === 'error') && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
              {status === 'error' && !error.includes('token') && (
                <div className="mt-2">
                  <Link href="/forgot-password" className="text-red-700 font-semibold underline">
                    Request a new reset link →
                  </Link>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !token}
            className="btn btn-primary w-full justify-center"
          >
            {status === 'loading' ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
