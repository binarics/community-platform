'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { selectCounsellor } from '@/app/actions/select-counsellor'

interface Counsellor {
  id: string
  user: {
    id: string
    name: string | null
    email: string | null
  }
  verified: boolean
  specializations: string
}

interface Props {
  counsellors: Counsellor[]
  selectedId: string | null
}

export function CounsellorSwitcher({ counsellors, selectedId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const selected = counsellors.find((c) => c.id === selectedId) ?? counsellors[0]

  if (counsellors.length === 0) {
    return (
      <div className="bg-purple-600 text-white px-6 py-2.5 flex items-center gap-3 text-sm">
        <span className="font-bold tracking-wide uppercase text-xs opacity-80">👑 Admin View</span>
        <span className="opacity-70">No counsellor profiles exist yet</span>
      </div>
    )
  }

  async function handleSelect(profileId: string) {
    setOpen(false)
    await selectCounsellor(profileId)
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="bg-purple-700 text-white px-4 py-2 flex items-center gap-3 relative z-30">
      {/* Admin badge */}
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-purple-200 shrink-0">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.7 2h8.6c.4 0 .7.3.7.7v.6c0 .4-.3.7-.7.7H7.7c-.4 0-.7-.3-.7-.7v-.6c0-.4.3-.7.7-.7z" />
        </svg>
        Admin View
      </span>

      <span className="text-purple-400 text-xs">|</span>

      {/* Counsellor selector */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={isPending}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 transition text-sm font-medium"
        >
          {isPending ? (
            <span className="opacity-60">Loading…</span>
          ) : (
            <>
              <span className="w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {selected?.user.name?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span>
                {selected?.user.name ?? 'Select counsellor'}
              </span>
              {selected?.verified && (
                <span className="text-green-300 text-xs">✓</span>
              )}
            </>
          )}
          <svg
            className={`w-3.5 h-3.5 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-sage-100 overflow-hidden z-30">
              <div className="px-3 py-2 border-b border-sage-100 bg-sage-50">
                <p className="text-xs font-semibold text-slate uppercase tracking-wide">
                  Select Counsellor to View
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {counsellors.map((c) => {
                  const isActive = c.id === (selectedId ?? counsellors[0]?.id)
                  let specs: string[] = []
                  try {
                    specs = JSON.parse(c.specializations)
                  } catch {
                    specs = []
                  }
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-sage-50 transition flex items-start gap-3 ${
                        isActive ? 'bg-sage-50 border-l-4 border-sage-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sage-400 to-sage-600 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                        {c.user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-charcoal text-sm truncate">
                            {c.user.name}
                          </span>
                          {c.verified && (
                            <span className="text-xs text-green-600 font-semibold shrink-0">✓ Verified</span>
                          )}
                          {isActive && (
                            <span className="ml-auto text-xs text-sage-600 font-semibold shrink-0">Viewing</span>
                          )}
                        </div>
                        <div className="text-xs text-slate truncate">{c.user.email}</div>
                        {specs.length > 0 && (
                          <div className="text-xs text-slate mt-0.5 truncate">
                            {specs.slice(0, 2).join(' · ')}
                            {specs.length > 2 && ` +${specs.length - 2}`}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <span className="text-xs text-purple-300 ml-auto hidden sm:block">
        Changes visible to you only
      </span>
    </div>
  )
}
