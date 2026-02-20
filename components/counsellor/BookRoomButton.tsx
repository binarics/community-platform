'use client'

import Link from 'next/link'

export function BookRoomButton({ roomId, counsellorId }: { roomId: string, counsellorId: string }) {
  return (
    <Link 
      href={`/counsellor/rooms/book?roomId=${roomId}&counsellorId=${counsellorId}`}
      className="flex-1"
    >
      <button className="btn btn-primary btn-sm w-full">
        Book Room
      </button>
    </Link>
  )
}