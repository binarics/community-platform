'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  description?: string
}

export function ShareButton({ title, description }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || '',
          url,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled')
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  return (
    <button onClick={handleShare} className="btn btn-outline w-full justify-center text-sm">
      {copied ? '✓ Link Copied!' : '📤 Share'}
    </button>
  )
}
