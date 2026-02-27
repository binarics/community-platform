'use client'

import { useEffect, useState } from 'react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  expiresAt: string | null
  revokedAt: string | null
  lastUsedAt: string | null
  lastRotatedAt: string | null
  rotationIntervalDays: number | null
  createdAt: string
  createdBy: { name: string | null; email: string | null }
}

function nextRotationDate(key: ApiKey): Date | null {
  if (!key.rotationIntervalDays) return null
  const baseline = key.lastRotatedAt ?? key.createdAt
  return new Date(new Date(baseline).getTime() + key.rotationIntervalDays * 24 * 60 * 60 * 1000)
}

function KeyStatusBadge({ apiKey }: { apiKey: ApiKey }) {
  const now = new Date()
  const revoked = apiKey.revokedAt && new Date(apiKey.revokedAt) < now
  const expired = apiKey.expiresAt && new Date(apiKey.expiresAt) < now
  const gracePeriod = apiKey.revokedAt && new Date(apiKey.revokedAt) > now

  if (!apiKey.isActive || revoked || expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
        Revoked
      </span>
    )
  }
  if (gracePeriod) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        Rotating (grace)
      </span>
    )
  }
  if (apiKey.rotationIntervalDays) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
        Auto-rotating
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sage-100 text-sage-700">
      Active
    </span>
  )
}

function fmt(date: string | Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [rotationIntervalDays, setRotationIntervalDays] = useState('30')
  const [creating, setCreating] = useState(false)

  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/api-keys')
    const data = await res.json()
    setKeys(data.keys ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newName,
        expiresInDays: expiresInDays ? Number(expiresInDays) : null,
        rotationIntervalDays: rotationIntervalDays ? Number(rotationIntervalDays) : null,
      }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setRevealedKey(data.key)
      setNewName('')
      setExpiresInDays('')
      setRotationIntervalDays('30')
      setShowCreate(false)
      load()
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this key immediately? It will stop working at once.')) return
    await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' })
    load()
  }

  async function copyKey() {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal">API Keys</h1>
          <p className="text-slate mt-1 text-sm max-w-xl">
            Keys are hashed on creation — the plaintext is never stored. Auto-rotating keys are
            regenerated on schedule by the system; the new key is emailed to all super admins
            before the old one expires.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary shrink-0">
          Create key
        </button>
      </div>

      {/* One-time key reveal */}
      {revealedKey && (
        <div className="mb-6 bg-sage-50 border-2 border-sage-300 rounded-xl p-5">
          <p className="font-semibold text-sage-800 mb-1">Key created — copy it now</p>
          <p className="text-sm text-sage-700 mb-3">
            This is the only time this key will be shown. Future rotations are delivered via email.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white border border-sage-200 rounded-lg px-3 py-2 text-sm font-mono text-charcoal break-all">
              {revealedKey}
            </code>
            <button onClick={copyKey} className="btn btn-outline shrink-0 text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-sage-600 underline"
          >
            I&apos;ve saved my key — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 card p-6">
          <h2 className="font-semibold text-charcoal mb-1">New API key</h2>
          <p className="text-sm text-slate mb-4">
            Set a rotation interval and the system handles rotation automatically. You&apos;ll
            receive the new key by email before the old one expires.
          </p>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              placeholder="Key name (e.g. Mobile App)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-sage-400"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate mb-1">
                  Auto-rotation interval
                </label>
                <select
                  value={rotationIntervalDays}
                  onChange={(e) => setRotationIntervalDays(e.target.value)}
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-sage-400 bg-white"
                >
                  <option value="">No auto-rotation</option>
                  <option value="7">Every 7 days</option>
                  <option value="14">Every 14 days</option>
                  <option value="30">Every 30 days (recommended)</option>
                  <option value="90">Every 90 days</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate mb-1">Hard expiry</label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="w-full px-4 py-2.5 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-sage-400 bg-white"
                >
                  <option value="">No hard expiry</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={creating} className="btn btn-primary text-sm">
                {creating ? 'Creating…' : 'Create key'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="btn btn-outline text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keys table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate text-sm">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="p-10 text-center text-slate text-sm">No API keys yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-sage-50 border-b border-sage-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-charcoal">Name</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal">Prefix</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden md:table-cell">
                  Next rotation
                </th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden md:table-cell">
                  Last used
                </th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden lg:table-cell">
                  Created
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {keys.map((k) => {
                const now = new Date()
                const inactive =
                  !k.isActive ||
                  (k.revokedAt && new Date(k.revokedAt) < now) ||
                  (k.expiresAt && new Date(k.expiresAt) < now)
                const next = nextRotationDate(k)
                return (
                  <tr key={k.id} className={inactive ? 'opacity-50' : ''}>
                    <td className="px-5 py-3.5 font-medium text-charcoal">{k.name}</td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs bg-sage-50 px-2 py-1 rounded font-mono">
                        {k.keyPrefix}…
                      </code>
                    </td>
                    <td className="px-5 py-3.5">
                      <KeyStatusBadge apiKey={k} />
                    </td>
                    <td className="px-5 py-3.5 text-slate hidden md:table-cell">
                      {next ? (
                        <span className={next < now ? 'text-amber-600 font-medium' : ''}>
                          {fmt(next)}
                        </span>
                      ) : (
                        <span className="text-slate/40 text-xs">Manual only</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate hidden md:table-cell">
                      {fmt(k.lastUsedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-slate hidden lg:table-cell">
                      {fmt(k.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      {!inactive && (
                        <button
                          onClick={() => handleRevoke(k.id)}
                          className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-sage-50 border border-sage-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-charcoal mb-1">How auto-rotation works</p>
          <p className="text-slate">
            Every day at 03:00 UTC the system checks for keys past their rotation interval.
            Due keys are regenerated automatically — the old key stays valid for 24 hours
            while the new key is emailed to all super admins.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
          <p className="font-semibold text-charcoal mb-1">Using an API key</p>
          <p className="text-slate mb-2">Pass it as a Bearer token:</p>
          <code className="block bg-white border border-amber-200 rounded px-3 py-2 font-mono text-xs break-all">
            Authorization: Bearer cp_live_…
          </code>
        </div>
      </div>
    </div>
  )
}
