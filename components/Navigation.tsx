'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + '/')

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { href: '/discover', label: 'Discover' },
    { href: '/courses', label: 'Courses' },
    { href: '/counselling', label: 'Counselling' },
    { href: '/masjids', label: 'Masjids' },
  ]

  const initials =
    session?.user.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  return (
    <>
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-sage-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              href="/"
              className="font-display text-xl font-bold text-sage-600 hover:text-sage-700 transition-colors shrink-0"
            >
              Community Platform
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(link.href)
                      ? 'bg-sage-100 text-sage-700 font-semibold'
                      : 'text-slate hover:bg-sage-50 hover:text-sage-700'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-2">
              {session ? (
                <>
                  {session.user.role === 'MASJID_ADMIN' && (
                    <Link
                      href="/masjid/dashboard"
                      className={`btn btn-outline btn-sm text-xs ${isActive('/masjid') ? 'bg-sage-50' : ''}`}
                    >
                      Masjid
                    </Link>
                  )}
                  {(session.user.role === 'COUNSELLOR' || session.user.role === 'SUPER_ADMIN') && (
                    <Link
                      href="/counsellor/dashboard"
                      className={`btn btn-outline btn-sm text-xs ${isActive('/counsellor') ? 'bg-sage-50' : ''}`}
                    >
                      Counsellor
                    </Link>
                  )}
                  {session.user.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/masjid/dashboard"
                      className={`btn btn-outline btn-sm text-xs ${isActive('/masjid') ? 'bg-sage-50' : ''}`}
                    >
                      Masjid
                    </Link>
                  )}
                  {session.user.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/admin"
                      className={`btn btn-outline btn-sm text-xs ${isActive('/admin') ? 'bg-sage-50' : ''}`}
                    >
                      Admin
                    </Link>
                  )}

                  {/* User dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full transition-all duration-150 ${
                        userMenuOpen ? 'bg-sage-100' : 'hover:bg-sage-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-charcoal max-w-[100px] truncate">
                        {session.user.name?.split(' ')[0]}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-slate transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-sage-100 overflow-hidden animate-slide-down">
                        <div className="px-4 py-3 bg-sage-50 border-b border-sage-100">
                          <div className="font-semibold text-charcoal text-sm leading-tight">
                            {session.user.name}
                          </div>
                          <div className="text-xs text-slate mt-0.5 truncate">{session.user.email}</div>
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white border border-sage-200 text-sage-700">
                            {session.user.role.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="p-1.5">
                          {[
                            { href: '/profile', label: 'My Profile' },
                            { href: '/my-rsvps', label: 'My RSVPs' },
                            { href: '/settings', label: 'Settings' },
                          ].map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center px-3 py-2.5 rounded-xl hover:bg-sage-50 transition-colors text-sm text-charcoal font-medium"
                            >
                              {item.label}
                            </Link>
                          ))}
                          <div className="my-1.5 border-t border-sage-100" />
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full text-left flex items-center px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-600 font-medium"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                  <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-sage-50 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-sage-100 bg-white animate-slide-down">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-sage-100 text-sage-700 font-semibold'
                      : 'text-charcoal hover:bg-sage-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-sage-100 pt-3 mt-3">
                {session ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-charcoal truncate">{session.user.name}</div>
                        <div className="text-xs text-slate">{session.user.role.replace(/_/g, ' ')}</div>
                      </div>
                    </div>

                    {session.user.role === 'MASJID_ADMIN' && (
                      <Link href="/masjid/dashboard" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-sage-50">
                        Masjid Dashboard
                      </Link>
                    )}
                    {session.user.role === 'SUPER_ADMIN' && (
                      <Link href="/masjid/dashboard" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-sage-50">
                        Masjid Dashboard
                      </Link>
                    )}
                    {(session.user.role === 'COUNSELLOR' || session.user.role === 'SUPER_ADMIN') && (
                      <Link href="/counsellor/dashboard" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-sage-50">
                        Counsellor Dashboard
                      </Link>
                    )}
                    {session.user.role === 'SUPER_ADMIN' && (
                      <Link href="/admin" className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-sage-50">
                        Admin Panel
                      </Link>
                    )}

                    {[
                      { href: '/profile', label: 'My Profile' },
                      { href: '/my-rsvps', label: 'My RSVPs' },
                      { href: '/settings', label: 'Settings' },
                    ].map((item) => (
                      <Link key={item.href} href={item.href} className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-charcoal hover:bg-sage-50">
                        {item.label}
                      </Link>
                    ))}

                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 mt-1"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-1">
                    <Link href="/login" className="btn btn-outline w-full">Sign In</Link>
                    <Link href="/register" className="btn btn-primary w-full">Get Started</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
