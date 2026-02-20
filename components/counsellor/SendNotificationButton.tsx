'use client'
export function SendNotificationButton({ clientId, clientEmail }: { clientId: string, clientEmail: string }) {
  return (
    <button className="text-terracotta-500 hover:text-terracotta-600 text-lg">
      📧
    </button>
  )
}
