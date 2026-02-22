'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ email: '', password: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      router.push('/discover')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-sage-600 via-sage-500 to-sage-700 relative overflow-hidden flex-col justify-between p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/[0.03]" />

        <Link href="/" className="font-display text-2xl font-bold text-white relative z-10">
          Community Platform
        </Link>

        <div className="relative z-10">
          <blockquote className="font-display text-3xl font-bold text-white leading-snug mb-8">
            &ldquo;Building stronger communities through real-world connection.&rdquo;
          </blockquote>

          <ul className="space-y-4">
            {[
              'Discover local events and courses',
              'Connect with Islamic counsellors',
              'Find mosques and community centres',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-white/85 text-sm font-medium">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          Trusted by communities across the UK
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-cream">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden font-display text-xl font-bold text-sage-600 mb-8">
          Community Platform
        </Link>

        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-charcoal mb-2">Welcome back</h1>
            <p className="text-slate text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="input"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="input"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-sage-600 hover:text-sage-700 font-semibold">
              Create one free
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-slate/60">
            <Link href="/" className="hover:text-slate transition-colors">← Back to site</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
