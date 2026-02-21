import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function CounsellingPage() {
  const session = await getServerSession(authOptions)
  
  // Get available counsellors
  const counsellors = await prisma.counsellorProfile.findMany({
    where: {
      verified: true,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    take: 6,
  })

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-sage-50 to-terracotta-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-6xl font-bold text-charcoal mb-6">
              Professional Counselling Services
            </h1>
            <p className="text-2xl text-slate leading-relaxed mb-10">
              Connect with qualified counsellors for compassionate, confidential support
            </p>
            
            {session ? (
              session.user.role === 'COUNSELLOR' || session.user.role === 'SUPER_ADMIN' ? (
                <Link href="/counsellor/dashboard" className="btn btn-primary text-lg px-8 py-4">
                  Go to Counsellor Dashboard
                </Link>
              ) : (
                <Link href="/counselling/book" className="btn btn-primary text-lg px-8 py-4">
                  Book a Session
                </Link>
              )
            ) : (
              <div className="flex gap-4 justify-center">
                <Link href="/login" className="btn btn-primary text-lg px-8 py-4">
                  Sign In to Book
                </Link>
                <Link href="/register" className="btn btn-outline text-lg px-8 py-4">
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
              Why Choose Our Service
            </h2>
            <p className="text-xl text-slate">
              Professional support when you need it most
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Confidential
              </h3>
              <p className="text-slate leading-relaxed">
                Your privacy is our priority. All sessions are completely confidential and secure.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">👨‍⚕️</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Qualified Professionals
              </h3>
              <p className="text-slate leading-relaxed">
                Work with experienced, verified counsellors who truly care about your wellbeing.
              </p>
            </div>

            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">📅</div>
              <h3 className="font-display text-2xl font-bold text-charcoal mb-3">
                Flexible Scheduling
              </h3>
              <p className="text-slate leading-relaxed">
                Book sessions at times that work for you, with easy online booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Counsellors */}
      {counsellors.length > 0 && (
        <section className="py-20 bg-sage-50">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
                Our Counsellors
              </h2>
              <p className="text-xl text-slate">
                Meet our team of qualified professionals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {counsellors.map((counsellor) => {
                // Safely parse specializations with fallback
                let specializations: string[] = []
                try {
                  if (counsellor.specializations) {
                    specializations = JSON.parse(counsellor.specializations as string)
                  }
                } catch (error) {
                  console.error('Error parsing specializations:', error)
                  specializations = []
                }
                
                return (
                  <div key={counsellor.id} className="card p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center font-display text-2xl font-bold text-sage-600">
                        {counsellor.user.name?.[0] || 'C'}
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-charcoal">
                          {counsellor.user.name}
                        </h3>
                        <div className="text-sm text-sage-500 flex items-center gap-1">
                          <span>✓</span>
                          <span>Verified Counsellor</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate leading-relaxed mb-4 line-clamp-3">
                      {counsellor.bio}
                    </p>

                    {specializations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {specializations.slice(0, 3).map((spec: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-terracotta-50 text-terracotta-600 rounded-full text-xs font-semibold"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-sm text-slate mb-4">
                      <span className="font-semibold">£{counsellor.hourlyRate}</span> per hour
                    </div>

                    {session && session.user.role !== 'COUNSELLOR' && (
                      <Link
                        href={`/counselling/book?counsellor=${counsellor.id}`}
                        className="btn btn-primary w-full"
                      >
                        Book with {counsellor.user.name?.split(' ')[0]}
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            {counsellors.length === 6 && (
              <div className="text-center mt-12">
                <Link href="/counselling/counsellors" className="btn btn-outline">
                  View All Counsellors
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-charcoal mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate">
              Getting started is simple
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-display text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                Create Account
              </h3>
              <p className="text-slate">
                Sign up with your email to get started
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-display text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                Choose Counsellor
              </h3>
              <p className="text-slate">
                Browse profiles and select the right fit
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-display text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                Book Session
              </h3>
              <p className="text-slate">
                Pick a time that works for you
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center font-display text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-display text-xl font-bold text-charcoal mb-2">
                Attend Session
              </h3>
              <p className="text-slate">
                Meet your counsellor and begin your journey
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-sage-500 to-sage-600 text-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="font-display text-5xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-2xl mb-10 opacity-90">
            Take the first step towards better mental health today
          </p>
          {session ? (
            <Link href="/counselling/book" className="btn bg-white text-sage-600 hover:bg-cream text-lg px-8 py-4">
              Book Your First Session
            </Link>
          ) : (
            <Link href="/register" className="btn bg-white text-sage-600 hover:bg-cream text-lg px-8 py-4">
              Get Started Now
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
