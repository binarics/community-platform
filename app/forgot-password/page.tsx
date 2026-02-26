'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setStatus('sent')
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong')
        setStatus('error')
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="card p-8 max-w-md w-full">
        {status === 'sent' ? (
          <div className="text-center">
            <div className="text-6xl mb-4">📬</div>
            <h1 className="font-display text-3xl font-bold text-charcoal mb-3">
              Check Your Email
            </h1>
            <p className="text-slate mb-6">
              If an account exists for <span className="font-semibold text-charcoal">{email}</span>,
              we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link href="/login" className="btn btn-outline w-full justify-center">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold text-charcoal mb-2">
                Forgot Password?
              </h1>
              <p className="text-slate">
                Enter the email address linked to your account and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-charcoal mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition"
                  required
                  autoFocus
                />
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary w-full justify-center"
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate">
              Remember your password?{' '}
              <Link href="/login" className="text-sage-600 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
