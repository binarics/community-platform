'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      // Successful login
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-clay-100 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-bold text-sage-500">
            Community Platform
          </Link>
          <p className="text-slate mt-2">Sign in to your account</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-semibold text-sm text-charcoal mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-semibold text-sm text-charcoal mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate">
            Don't have an account?{' '}
            <Link href="/register" className="text-sage-500 font-semibold hover:underline">
              Register
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-sage-100">
            <p className="text-xs text-slate mb-3 font-semibold">Test Accounts:</p>
            <div className="space-y-2 text-xs text-slate">
              <div className="flex justify-between bg-sage-50 p-2 rounded">
                <span>Admin</span>
                <span className="font-mono">admin@platform.com</span>
              </div>
              <div className="flex justify-between bg-sage-50 p-2 rounded">
                <span>Masjid</span>
                <span className="font-mono">victoria@masjid.com</span>
              </div>
              <div className="flex justify-between bg-sage-50 p-2 rounded">
                <span>Member</span>
                <span className="font-mono">member@test.com</span>
              </div>
              <div className="flex justify-between bg-sage-50 p-2 rounded">
                <span>Counsellor</span>
                <span className="font-mono">counsellor@eclectic.com</span>
              </div>
              <div className="text-center mt-2 text-slate">
                All passwords: <span className="font-mono font-semibold">password123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-slate hover:text-sage-500 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
