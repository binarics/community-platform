'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
  }
  replies?: Comment[]
}

interface EventCommentsProps {
  eventId: string
  comments: Comment[]
  currentUserId?: string
}

export function EventComments({ eventId, comments, currentUserId }: EventCommentsProps) {
  const router = useRouter()
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  async function handleSubmitComment(e: React.FormEvent, parentId?: string) {
    e.preventDefault()

    if (!currentUserId) {
      router.push(`/login?redirect=/events/${eventId}`)
      return
    }

    const content = parentId ? replyContent : newComment

    if (!content.trim()) return

    setLoading(true)

    try {
      const response = await fetch(`/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parentId: parentId || null,
        }),
      })

      if (response.ok) {
        if (parentId) {
          setReplyContent('')
          setReplyingTo(null)
        } else {
          setNewComment('')
        }
        router.refresh()
      }
    } catch (error) {
      console.error('Comment error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* New Comment Form */}
      {currentUserId ? (
        <form onSubmit={(e) => handleSubmitComment(e)} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="btn btn-primary"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-sage-50 border border-sage-100 rounded-xl text-center">
          <p className="text-slate mb-3">Sign in to join the discussion</p>
          <Link href={`/login?redirect=/events/${eventId}`} className="btn btn-primary">
            Sign In
          </Link>
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">💬</div>
          <p className="text-slate">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-2 border-sage-100 pl-6">
              {/* Comment Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage-100 to-terracotta-100 flex items-center justify-center font-display font-bold text-sage-600 flex-shrink-0">
                  {comment.user.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-charcoal">
                      {comment.user.name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-slate">
                      {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="text-slate leading-relaxed">{comment.content}</p>

                  {/* Reply Button */}
                  {currentUserId && (
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === comment.id ? null : comment.id)
                      }
                      className="text-sm text-sage-500 hover:text-sage-600 font-semibold mt-2"
                    >
                      {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                  )}
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="ml-13 mb-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 transition resize-none text-sm"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null)
                        setReplyContent('')
                      }}
                      className="btn btn-outline text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !replyContent.trim()}
                      className="btn btn-primary text-sm"
                    >
                      {loading ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </form>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-13 mt-4 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center font-display font-bold text-terracotta-600 flex-shrink-0 text-sm">
                        {reply.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-charcoal text-sm">
                            {reply.user.name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-slate">
                            {new Date(reply.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                        <p className="text-slate text-sm leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
