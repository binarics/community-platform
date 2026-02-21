'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams?.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }

    // Verify the token
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      <div className="max-w-2xl mx-auto px-8 py-20">
        <div className="card p-12 text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sage-500 mx-auto mb-6"></div>
              <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
                Verifying Your Email...
              </h1>
              <p className="text-slate">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-6">✅</div>
              <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
                Email Verified!
              </h1>
              <p className="text-slate mb-6">{message}</p>
              <p className="text-sm text-slate mb-6">
                Redirecting you to login in a few seconds...
              </p>
              <Link href="/login" className="btn btn-primary">
                Go to Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-6">❌</div>
              <h1 className="font-display text-3xl font-bold text-charcoal mb-4">
                Verification Failed
              </h1>
              <p className="text-slate mb-6">{message}</p>
              
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-bold text-charcoal mb-2">Common issues:</h3>
                <ul className="text-sm text-slate space-y-2">
                  <li>• The verification link may have expired (valid for 24 hours)</li>
                  <li>• The link may have already been used</li>
                  <li>• The link may be invalid or corrupted</li>
                </ul>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href="/resend-verification" className="btn btn-primary">
                  Resend Verification Email
                </Link>
                <Link href="/login" className="btn btn-outline">
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
