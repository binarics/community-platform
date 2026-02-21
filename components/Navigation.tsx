'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function Navigation() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  // Close menu when clicking outside
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [menuOpen])

  return (
    <nav className="sticky top-0 bg-cream/95 backdrop-blur border-b border-sage-100 z-50">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="font-display text-xl md:text-2xl font-bold text-sage-500 z-50">
          Community Platform
        </Link>
        
        {/* Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative z-50 p-2 hover:bg-sage-50 rounded-lg transition"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 w-full bg-charcoal transition-all duration-300 ${
              menuOpen ? 'rotate-45 translate-y-2' : ''
            }`} />
            <span className={`block h-0.5 w-full bg-charcoal transition-all duration-300 ${
              menuOpen ? 'opacity-0' : ''
            }`} />
            <span className={`block h-0.5 w-full bg-charcoal transition-all duration-300 ${
              menuOpen ? '-rotate-45 -translate-y-2' : ''
            }`} />
          </div>
        </button>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-screen w-80 max-w-[85vw] bg-white shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      } overflow-y-auto`}>
        <div className="p-8 pt-24">
          
          {/* User Section */}
          {status === 'loading' ? (
            <div className="mb-8 animate-pulse">
              <div className="h-12 bg-sage-100 rounded-lg"></div>
            </div>
          ) : session ? (
            <div className="mb-8">
              <div className="flex items-center gap-3 p-4 bg-sage-50 rounded-xl mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-100 to-clay-100 flex items-center justify-center font-semibold text-sage-600">
                  {session.user.name?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal truncate">
                    {session.user.name}
                  </div>
                  <div className="text-xs text-sage-600 truncate">
                    {session.user.email}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-slate uppercase font-semibold mb-2 px-4">
                Role
              </div>
              <div className="px-4 py-2 bg-sage-50 rounded-lg text-sm">
                <span className="capitalize">
                  {session.user.role.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            </div>
          ) : null}

          {/* Navigation Links */}
          <div className="space-y-2 mb-8">
            <div className="text-xs text-slate uppercase font-semibold mb-3 px-4">
              Explore
            </div>
            
            <Link 
              href="/discover" 
              className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
            >
              <span className="text-xl group-hover:scale-110 transition">🔍</span>
              <span className="font-medium">Discover Events</span>
            </Link>

            <Link
              href="/masjids"
              className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
            >
              <span className="text-xl group-hover:scale-110 transition">🕌</span>
              <span className="font-medium">Masjids</span>
            </Link>
            
            <Link 
              href="/courses" 
              className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
            >
              <span className="text-xl group-hover:scale-110 transition">📚</span>
              <span className="font-medium">Courses</span>
            </Link>

            <Link 
              href="/counselling" 
              className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
            >
              <span className="text-xl group-hover:scale-110 transition">💬</span>
              <span className="font-medium">Counselling</span>
            </Link>
          </div>

          {/* Authenticated User Links */}
          {session && (
            <div className="space-y-2 mb-8">
              <div className="text-xs text-slate uppercase font-semibold mb-3 px-4">
                My Account
              </div>

              <Link 
                href="/profile" 
                className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
              >
                <span className="text-xl group-hover:scale-110 transition">👤</span>
                <span className="font-medium">My Profile</span>
              </Link>

              <Link 
                href="/my-rsvps" 
                className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
              >
                <span className="text-xl group-hover:scale-110 transition">📅</span>
                <span className="font-medium">My RSVPs</span>
              </Link>

              <Link 
                href="/request-role" 
                className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
              >
                <span className="text-xl group-hover:scale-110 transition">⬆️</span>
                <span className="font-medium">Request Role Upgrade</span>
              </Link>

              {/* Role-based dashboard links */}
              {['SUPER_ADMIN', 'MASJID_ADMIN', 'ORGANISER'].includes(session.user.role) && (
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
                >
                  <span className="text-xl group-hover:scale-110 transition">📊</span>
                  <span className="font-medium">Dashboard</span>
                </Link>
              )}
              
              {['SUPER_ADMIN', 'COUNSELLOR'].includes(session.user.role) && (
                <Link 
                  href="/counsellor-dashboard" 
                  className="flex items-center gap-3 px-4 py-3 text-charcoal hover:bg-sage-50 rounded-lg transition group"
                >
                  <span className="text-xl group-hover:scale-110 transition">🧠</span>
                  <span className="font-medium">Counsellor Dashboard</span>
                </Link>
              )}
            </div>
          )}

          {/* Auth Actions */}
          <div className="border-t border-sage-100 pt-6">
            {session ? (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition w-full"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            ) : (
              <div className="space-y-2">
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-sage-500 text-sage-500 hover:bg-sage-50 rounded-full transition font-semibold"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-sage-500 text-white hover:bg-sage-600 rounded-full transition font-semibold shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
