import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MasjidForm } from '@/components/masjid/MasjidForm'
import Link from 'next/link'

export default async function NewMasjidPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/')
  }

  return (
    <>

      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/masjid" 
            className="text-sage-500 hover:text-sage-600 font-semibold text-sm mb-4 inline-block"
          >
            ← Back to Masjid Management
          </Link>
          <h1 className="font-display text-5xl font-bold text-charcoal mb-2">
            Create New Masjid
          </h1>
          <p className="text-xl text-slate">
            Set up a new mosque or Islamic center
          </p>
        </div>

        {/* Info Card */}
        <div className="card p-6 mb-8 bg-terracotta-50 border border-terracotta-100">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div>
              <div className="font-semibold text-charcoal mb-2">
                What You'll Set Up
              </div>
              <ul className="text-sm text-slate space-y-1">
                <li>• Basic information (name, location, description)</li>
                <li>• Contact details and social media links</li>
                <li>• Prayer times and facilities</li>
                <li>• Admins who can manage the masjid</li>
                <li>• Visibility and access settings</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <MasjidForm />
        </div>
      </div>
    </>
  )
}
