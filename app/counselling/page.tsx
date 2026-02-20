import Link from 'next/link'
import { Navigation } from '@/components/Navigation'


export default function CounsellingPage() {
  return (
    <div className="min-h-screen bg-cream">
            <Navigation />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Counselling Services
          </h1>
          <p className="text-xl text-slate">
            Book sessions with qualified Islamic counsellors
          </p>
        </div>

        <div className="card p-12 text-center">
          <div className="text-6xl mb-6">💬</div>
          <h2 className="font-display text-3xl font-bold text-charcoal mb-4">
            Counselling Booking System
          </h2>
          <p className="text-lg text-slate mb-8 max-w-2xl mx-auto">
            Book one-to-one sessions with our qualified counsellors. Choose your preferred counsellor, date, and time slot.
          </p>
          <button className="btn btn-primary text-lg px-8 py-4">
            Book a Session
          </button>
        </div>
      </div>
    </div>
  )
}
