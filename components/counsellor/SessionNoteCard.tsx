'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SessionNoteCardProps {
  note: {
    id: string
    subjective: string | null
    objective: string | null
    assessment: string | null
    plan: string | null
    content: string | null
    createdAt: Date | string
    updatedAt: Date | string
  }
  bookingId: string
  isLatest: boolean
}

export function SessionNoteCard({ note, bookingId, isLatest }: SessionNoteCardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    subjective: note.subjective || '',
    objective: note.objective || '',
    assessment: note.assessment || '',
    plan: note.plan || '',
  })

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/counsellor/session-notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update note')
        setLoading(false)
        return
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setFormData({
      subjective: note.subjective || '',
      objective: note.objective || '',
      assessment: note.assessment || '',
      plan: note.plan || '',
    })
    setIsEditing(false)
    setError('')
  }

  const createdDate = new Date(note.createdAt)
  const updatedDate = new Date(note.updatedAt)
  const wasEdited = createdDate.getTime() !== updatedDate.getTime()

  return (
    <div className="card p-6">
      {/* Note Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-sm font-semibold text-slate">
              {createdDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              at{' '}
              {createdDate.toLocaleTimeString('en-GB', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
            {isLatest && <span className="badge bg-green-100 text-green-700 text-xs">Latest</span>}
            {wasEdited && (
              <span className="badge bg-blue-100 text-blue-700 text-xs">
                Edited {updatedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-sage-100 text-sage-700 text-xs">🔒 Confidential</span>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-sage-500 hover:text-sage-600 font-semibold"
          >
            ✎ Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* View Mode */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Subjective */}
          {note.subjective && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-blue-500 text-white text-xs">S</span>
                <span className="font-semibold text-charcoal text-sm">Subjective</span>
              </div>
              <p className="text-sm text-slate whitespace-pre-wrap">{note.subjective}</p>
            </div>
          )}

          {/* Objective */}
          {note.objective && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-green-500 text-white text-xs">O</span>
                <span className="font-semibold text-charcoal text-sm">Objective</span>
              </div>
              <p className="text-sm text-slate whitespace-pre-wrap">{note.objective}</p>
            </div>
          )}

          {/* Assessment */}
          {note.assessment && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-amber-500 text-white text-xs">A</span>
                <span className="font-semibold text-charcoal text-sm">Assessment</span>
              </div>
              <p className="text-sm text-slate whitespace-pre-wrap">{note.assessment}</p>
            </div>
          )}

          {/* Plan */}
          {note.plan && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-purple-500 text-white text-xs">P</span>
                <span className="font-semibold text-charcoal text-sm">Plan</span>
              </div>
              <p className="text-sm text-slate whitespace-pre-wrap">{note.plan}</p>
            </div>
          )}

          {/* Legacy content field (if exists) */}
          {note.content && !note.subjective && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate whitespace-pre-wrap">{note.content}</p>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Subjective */}
          <div>
            <label className="block font-semibold text-charcoal mb-2 text-sm">
              <span className="badge bg-blue-500 text-white text-xs mr-2">S</span>
              Subjective
            </label>
            <textarea
              value={formData.subjective}
              onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none text-sm"
              placeholder="What did the client report?"
            />
          </div>

          {/* Objective */}
          <div>
            <label className="block font-semibold text-charcoal mb-2 text-sm">
              <span className="badge bg-green-500 text-white text-xs mr-2">O</span>
              Objective
            </label>
            <textarea
              value={formData.objective}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none text-sm"
              placeholder="What did you observe?"
            />
          </div>

          {/* Assessment */}
          <div>
            <label className="block font-semibold text-charcoal mb-2 text-sm">
              <span className="badge bg-amber-500 text-white text-xs mr-2">A</span>
              Assessment
            </label>
            <textarea
              value={formData.assessment}
              onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none text-sm"
              placeholder="Your clinical analysis..."
            />
          </div>

          {/* Plan */}
          <div>
            <label className="block font-semibold text-charcoal mb-2 text-sm">
              <span className="badge bg-purple-500 text-white text-xs mr-2">P</span>
              Plan
            </label>
            <textarea
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none text-sm"
              placeholder="Next steps, homework, follow-up..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-sage-100">
            <button type="submit" disabled={loading} className="btn btn-primary text-sm flex-1">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="btn btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
