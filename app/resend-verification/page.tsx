'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage('Verification email sent! Please check your inbox.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-md mx-auto px-8 py-20">
        <div className="card p-8">
          <h1 className="font-display text-3xl font-bold text-charcoal mb-2 text-center">
            Resend Verification Email
          </h1>
          <p className="text-slate text-center mb-8">
            Enter your email address and we'll send you a new verification link.
          </p>

          {status === 'success' ? (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-sage-600 font-semibold mb-6">{message}</p>
              <Link href="/login" className="btn btn-primary w-full">
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-charcoal mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                  placeholder="your@email.com"
                />
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn btn-primary w-full"
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Sending...
                  </span>
                ) : (
                  'Send Verification Email'
                )}
              </button>

              <div className="text-center text-sm text-slate">
                <Link href="/login" className="text-sage-500 hover:text-sage-600 font-semibold">
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="mt-8 card p-6 bg-sage-50">
          <h3 className="font-semibold text-charcoal mb-2">Haven't received the email?</h3>
          <ul className="text-sm text-slate space-y-1">
            <li>• Check your spam/junk folder</li>
            <li>• Make sure you entered the correct email address</li>
            <li>• Wait a few minutes for the email to arrive</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
