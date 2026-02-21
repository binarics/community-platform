'use client'

import { useState, useMemo } from 'react'

interface Client {
  id: string
  name: string | null
  email: string
}

interface SearchableClientSelectProps {
  clients: Client[]
  value: string
  onChange: (clientId: string) => void
  required?: boolean
}

export function SearchableClientSelect({
  clients,
  value,
  onChange,
  required = false,
}: SearchableClientSelectProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients

    const searchLower = search.toLowerCase()
    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
    )
  }, [clients, search])

  // Get selected client
  const selectedClient = clients.find((c) => c.id === value)

  return (
    <div className="relative">
      {/* Search Input / Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus-within:border-sage-500 transition cursor-pointer bg-white"
      >
        {selectedClient ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-charcoal">{selectedClient.name}</div>
              <div className="text-xs text-slate">{selectedClient.email}</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
                setSearch('')
              }}
              className="text-slate hover:text-red-500 text-xl"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="text-slate">Select client...</div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-sage-100 rounded-xl shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-sage-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full px-3 py-2 border border-sage-100 rounded-lg focus:border-sage-500 focus:ring-2 focus:ring-sage-50 transition text-sm"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="overflow-y-auto max-h-64">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-slate">
                  <div className="text-4xl mb-2">🔍</div>
                  <div className="text-sm">No clients found</div>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => {
                      onChange(client.id)
                      setIsOpen(false)
                      setSearch('')
                    }}
                    className={`w-full text-left p-3 hover:bg-sage-50 transition border-b border-sage-50 last:border-b-0 ${
                      value === client.id ? 'bg-sage-100' : ''
                    }`}
                  >
                    <div className="font-semibold text-charcoal">{client.name}</div>
                    <div className="text-xs text-slate">{client.email}</div>
                  </button>
                ))
              )}
            </div>

            {/* Results Count */}
            {filteredClients.length > 0 && (
              <div className="p-2 border-t border-sage-100 bg-sage-50 text-xs text-slate text-center">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
            )}
          </div>
        </>
      )}

      {/* Hidden input for form validation */}
      <input type="hidden" name="clientId" value={value} required={required} />
    </div>
  )
}
