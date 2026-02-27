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
  createdAt: string
  createdBy: { name: string | null; email: string | null }
}

function KeyStatusBadge({ apiKey }: { apiKey: ApiKey }) {
  const now = new Date()
  const revoked = apiKey.revokedAt && new Date(apiKey.revokedAt) < now
  const expired = apiKey.expiresAt && new Date(apiKey.expiresAt) < now
  const gracePeriod = apiKey.revokedAt && new Date(apiKey.revokedAt) > now

  if (!apiKey.isActive || revoked || expired) {
    return <span className="badge bg-red-100 text-red-700">Revoked</span>
  }
  if (gracePeriod) {
    return <span className="badge bg-amber-100 text-amber-700">Grace period</span>
  }
  return <span className="badge bg-sage-100 text-sage-700">Active</span>
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [creating, setCreating] = useState(false)

  // Revealed key after create/roll
  const [revealedKey, setRevealedKey] = useState<{ key: string; action: 'created' | 'rolled' } | null>(null)
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
      body: JSON.stringify({ name: newName, expiresInDays: expiresInDays ? Number(expiresInDays) : null }),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setRevealedKey({ key: data.key, action: 'created' })
      setNewName('')
      setExpiresInDays('')
      setShowCreate(false)
      load()
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this key immediately? It will stop working at once.')) return
    await fetch(`/api/admin/api-keys/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleRoll(id: string) {
    if (!confirm('Roll this key? The old key will remain valid for 24 hours, then expire.')) return
    const res = await fetch(`/api/admin/api-keys/${id}/roll`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setRevealedKey({ key: data.key, action: 'rolled' })
      load()
    }
  }

  async function copyKey() {
    if (!revealedKey) return
    await navigator.clipboard.writeText(revealedKey.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal">API Keys</h1>
          <p className="text-slate mt-1">
            Keys are hashed on creation and never stored in plain text. Copy your key now — it won&apos;t be shown again.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary">
          Create key
        </button>
      </div>

      {/* Revealed key banner */}
      {revealedKey && (
        <div className="mb-6 bg-sage-50 border-2 border-sage-300 rounded-xl p-5">
          <p className="font-semibold text-sage-800 mb-1">
            {revealedKey.action === 'created' ? 'New key created' : 'New key issued — old key valid for 24 h'}
          </p>
          <p className="text-sm text-sage-700 mb-3">Copy this key now. It will not be shown again.</p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white border border-sage-200 rounded-lg px-3 py-2 text-sm font-mono text-charcoal break-all">
              {revealedKey.key}
            </code>
            <button onClick={copyKey} className="btn btn-outline shrink-0 text-sm">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button onClick={() => setRevealedKey(null)} className="mt-3 text-xs text-sage-600 underline">
            I&apos;ve saved my key — dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 card p-6">
          <h2 className="font-semibold text-charcoal mb-4">New API key</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Key name (e.g. Cron job)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-sage-400"
            />
            <select
              value={expiresInDays}
              onChange={e => setExpiresInDays(e.target.value)}
              className="px-4 py-2.5 border border-sage-200 rounded-xl text-sm focus:outline-none focus:border-sage-400 bg-white"
            >
              <option value="">No expiry</option>
              <option value="30">Expires in 30 days</option>
              <option value="90">Expires in 90 days</option>
              <option value="365">Expires in 1 year</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="btn btn-primary text-sm">
                {creating ? 'Creating…' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline text-sm">
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
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden md:table-cell">Last used</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden md:table-cell">Expires</th>
                <th className="text-left px-5 py-3 font-semibold text-charcoal hidden lg:table-cell">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {keys.map(k => {
                const now = new Date()
                const inactive = !k.isActive || (k.revokedAt && new Date(k.revokedAt) < now) || (k.expiresAt && new Date(k.expiresAt) < now)
                return (
                  <tr key={k.id} className={inactive ? 'opacity-50' : ''}>
                    <td className="px-5 py-3.5 font-medium text-charcoal">{k.name}</td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs bg-sage-50 px-2 py-1 rounded font-mono">{k.keyPrefix}…</code>
                    </td>
                    <td className="px-5 py-3.5"><KeyStatusBadge apiKey={k} /></td>
                    <td className="px-5 py-3.5 text-slate hidden md:table-cell">{fmt(k.lastUsedAt)}</td>
                    <td className="px-5 py-3.5 text-slate hidden md:table-cell">{fmt(k.expiresAt)}</td>
                    <td className="px-5 py-3.5 text-slate hidden lg:table-cell">{fmt(k.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      {!inactive && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleRoll(k.id)}
                            className="text-xs px-3 py-1.5 border border-sage-200 rounded-lg hover:bg-sage-50 text-charcoal transition-colors"
                          >
                            Roll
                          </button>
                          <button
                            onClick={() => handleRevoke(k.id)}
                            className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            Revoke
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">How to use an API key</p>
        <p>Pass it as a Bearer token in the <code className="font-mono">Authorization</code> header:</p>
        <code className="block mt-2 bg-white border border-amber-200 rounded px-3 py-2 font-mono text-xs">
          Authorization: Bearer cp_live_…
        </code>
      </div>
    </div>
  )
}
