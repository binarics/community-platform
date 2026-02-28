'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { selectMasjid } from '@/app/actions/select-masjid'

interface MasjidOption {
  id: string
  name: string
  city: string
  country: string
  _count: { members: number; events: number }
}

interface Props {
  masjids: MasjidOption[]
  selectedId: string | null
  isSuperAdmin: boolean
}

export function MasjidSwitcher({ masjids, selectedId, isSuperAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const selected = masjids.find((m) => m.id === selectedId) ?? masjids[0]

  if (masjids.length === 0) {
    return (
      <div className={`${isSuperAdmin ? 'bg-purple-600' : 'bg-terracotta-600'} text-white px-6 py-2.5 flex items-center gap-3 text-sm`}>
        <span className="font-bold tracking-wide uppercase text-xs opacity-80">
          {isSuperAdmin ? '👑 Admin View' : '🕌 Masjid Portal'}
        </span>
        <span className="opacity-70">No masjids available</span>
      </div>
    )
  }

  // Only show switcher if multiple masjids or is super admin
  if (masjids.length === 1 && !isSuperAdmin) return null

  async function handleSelect(masjidId: string) {
    setOpen(false)
    await selectMasjid(masjidId)
    startTransition(() => {
      router.refresh()
    })
  }

  const barColor = isSuperAdmin ? 'bg-purple-700' : 'bg-terracotta-700'
  const btnColor = isSuperAdmin ? 'bg-purple-600 hover:bg-purple-500' : 'bg-terracotta-600 hover:bg-terracotta-500'

  return (
    <div className={`${barColor} text-white px-4 py-2 flex items-center gap-3 relative z-30`}>
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/70 shrink-0">
        {isSuperAdmin ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm2.7 2h8.6c.4 0 .7.3.7.7v.6c0 .4-.3.7-.7.7H7.7c-.4 0-.7-.3-.7-.7v-.6c0-.4.3-.7.7-.7z" />
          </svg>
        ) : (
          <span>🕌</span>
        )}
        {isSuperAdmin ? 'Admin View' : 'Masjid'}
      </span>

      <span className="text-white/40 text-xs">|</span>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          disabled={isPending}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${btnColor} transition text-sm font-medium`}
        >
          {isPending ? (
            <span className="opacity-60">Loading…</span>
          ) : (
            <>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {selected?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span>{selected?.name ?? 'Select masjid'}</span>
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
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-sage-100 overflow-hidden z-30">
              <div className="px-3 py-2 border-b border-sage-100 bg-sage-50">
                <p className="text-xs font-semibold text-slate uppercase tracking-wide">
                  Select Masjid to Manage
                </p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {masjids.map((m) => {
                  const isActive = m.id === (selectedId ?? masjids[0]?.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-sage-50 transition flex items-start gap-3 ${
                        isActive ? 'bg-sage-50 border-l-4 border-sage-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                        {m.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-charcoal text-sm truncate">{m.name}</span>
                          {isActive && (
                            <span className="text-xs text-sage-600 font-semibold shrink-0">Viewing</span>
                          )}
                        </div>
                        <div className="text-xs text-slate truncate">{m.city}, {m.country}</div>
                        <div className="text-xs text-slate mt-0.5">
                          {m._count.members} members · {m._count.events} events
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <span className="text-xs text-white/50 ml-auto hidden sm:block">
        Changes visible to you only
      </span>
    </div>
  )
}
