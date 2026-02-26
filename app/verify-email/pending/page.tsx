'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function VerifyEmailPendingPage() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleResend() {
    setResendStatus('loading')
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendStatus(response.ok ? 'sent' : 'error')
    } catch {
      setResendStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="card p-10 text-center">
          <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="font-display text-3xl font-bold text-charcoal mb-3">
            Check your email
          </h1>

          <p className="text-slate mb-2">
            We&apos;ve sent a verification link to
          </p>
          {email && (
            <p className="font-semibold text-charcoal mb-6">{email}</p>
          )}

          <p className="text-sm text-slate mb-8">
            Click the link in the email to verify your account. The link expires in 24 hours.
          </p>

          <div className="bg-sage-50 rounded-xl p-4 text-left mb-8 text-sm text-slate space-y-1">
            <p className="font-semibold text-charcoal mb-2">Can&apos;t find the email?</p>
            <p>• Check your spam or junk folder</p>
            <p>• Make sure you entered the right address</p>
            <p>• Wait a minute and check again</p>
          </div>

          {resendStatus === 'sent' ? (
            <p className="text-sage-600 font-semibold text-sm mb-6">Email resent — check your inbox.</p>
          ) : resendStatus === 'error' ? (
            <p className="text-red-600 text-sm mb-6">Failed to resend. Please try again.</p>
          ) : null}

          <button
            onClick={handleResend}
            disabled={resendStatus === 'loading' || resendStatus === 'sent'}
            className="btn btn-outline w-full mb-4"
          >
            {resendStatus === 'loading' ? 'Sending…' : 'Resend verification email'}
          </button>

          <Link href="/login" className="text-sm text-slate hover:text-charcoal transition-colors">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
