'use client'

import Link from 'next/link'

export function ClientOnboardingButton({ counsellorId }: { counsellorId: string }) {
  return (
    <Link href="/counsellor/clients/new">
      <button className="btn btn-primary">
        Onboard New Client
      </button>
    </Link>
  )
}