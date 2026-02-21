'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  return (
    <nav className="sticky top-0 bg-cream/95 backdrop-blur border-b border-sage-100 z-50">
      <div className="max-w-7xl mx-auto px-8 py-5">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-2xl font-bold text-sage-500 hover:text-sage-600 transition"
          >
            Community Platform
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/discover"
              className={`font-medium transition ${
                isActive('/discover')
                  ? 'text-sage-600'
                  : 'text-slate hover:text-sage-500'
              }`}
            >
              Discover Events
            </Link>
            <Link
              href="/courses"
              className={`font-medium transition ${
                isActive('/courses')
                  ? 'text-sage-600'
                  : 'text-slate hover:text-sage-500'
              }`}
            >
              Courses
            </Link>
            <Link
              href="/counselling"
              className={`font-medium transition ${
                isActive('/counselling')
                  ? 'text-sage-600'
                  : 'text-slate hover:text-sage-500'
              }`}
            >
              Counselling
            </Link>

            {session ? (
              <>
                {/* Role-specific links */}
                {session.user.role === 'MASJID_ADMIN' && (
                  <Link
                    href="/dashboard"
                    className={`btn btn-outline btn-sm ${
                      isActive('/dashboard') ? 'bg-sage-50' : ''
                    }`}
                  >
                    Masjid Dashboard
                  </Link>
                )}

                {(session.user.role === 'COUNSELLOR' ||
                  session.user.role === 'SUPER_ADMIN') && (
                  <Link
                    href="/counsellor/dashboard"
                    className={`btn btn-outline btn-sm ${
                      isActive('/counsellor') ? 'bg-sage-50' : ''
                    }`}
                  >
                    Counsellor Dashboard
                  </Link>
                )}

                {session.user.role === 'SUPER_ADMIN' && (
                  <Link
                    href="/admin"
                    className={`btn btn-outline btn-sm ${
                      isActive('/admin') ? 'bg-sage-50' : ''
                    }`}
                  >
                    Admin Panel
                  </Link>
                )}

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-sage-50 transition">
                    <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center font-bold text-sage-600">
                      {session.user.name?.[0] || 'U'}
                    </div>
                    <span className="font-medium text-charcoal">
                      {session.user.name}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-sage-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                    <div className="p-4 border-b border-sage-100">
                      <div className="font-semibold text-charcoal">
                        {session.user.name}
                      </div>
                      <div className="text-sm text-slate">{session.user.email}</div>
                      <div className="text-xs text-terracotta-500 mt-1">
                        {session.user.role.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 rounded-lg hover:bg-sage-50 transition text-charcoal"
                      >
                        👤 My Profile
                      </Link>
                      <Link
                        href="/my-rsvps"
                        className="block px-4 py-2 rounded-lg hover:bg-sage-50 transition text-charcoal"
                      >
                        🎫 My RSVPs
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 rounded-lg hover:bg-sage-50 transition text-charcoal"
                      >
                        ⚙️ Settings
                      </Link>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 transition text-red-600 font-medium"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn btn-outline btn-sm">
                  Sign In
                </Link>
                <Link href="/register" className="btn btn-primary btn-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-sage-50 rounded-lg transition"
          >
            <svg
              className="w-6 h-6 text-charcoal"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-sage-100 pt-4">
            <div className="space-y-2">
              <Link
                href="/discover"
                className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                🔍 Discover Events
              </Link>
              <Link
                href="/courses"
                className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                📚 Courses
              </Link>
              <Link
                href="/counselling"
                className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                💬 Counselling
              </Link>

              {session ? (
                <>
                  <div className="border-t border-sage-100 my-2 pt-2">
                    <div className="px-4 py-2 text-xs text-slate uppercase font-semibold">
                      My Account
                    </div>
                  </div>

                  {session.user.role === 'MASJID_ADMIN' && (
                    <Link
                      href="/dashboard"
                      className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🏛️ Masjid Dashboard
                    </Link>
                  )}

                  {(session.user.role === 'COUNSELLOR' ||
                    session.user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/counsellor/dashboard"
                      className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🧠 Counsellor Dashboard
                    </Link>
                  )}

                  {session.user.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      👑 Admin Panel
                    </Link>
                  )}

                  <Link
                    href="/profile"
                    className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👤 My Profile
                  </Link>

                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/' })
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 transition text-red-600 font-medium"
                  >
                    🚪 Sign Out
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-sage-100 my-2 pt-2"></div>
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-lg hover:bg-sage-50 transition text-charcoal font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block px-4 py-3 rounded-lg bg-sage-500 hover:bg-sage-600 transition text-white font-medium text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
