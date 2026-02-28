import { redirect } from 'next/navigation'

// Legacy redirect — the masjid dashboard moved to /masjid/dashboard
export default function DashboardRedirectPage() {
  redirect('/masjid/dashboard')
}
