import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Navigation } from '@/components/Navigation'

export const dynamic = 'force-dynamic'


export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      organisation: true,
      _count: { select: { sessions: true } },
    },
    orderBy: { startDate: 'asc' },
  })

  return (
    <div className="min-h-screen bg-cream">
            <Navigation />
      {/* <nav className="bg-white border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <Link href="/" className="font-display text-xl font-bold text-sage-500">
            Community Platform
          </Link>
          <div className="flex gap-4">
            <Link href="/discover" className="text-slate hover:text-sage-500">Events</Link>
            <Link href="/counselling" className="text-slate hover:text-sage-500">Counselling</Link>
          </div>
        </div>
      </nav> */}

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-charcoal mb-4">
            Therapeutic Courses
          </h1>
          <p className="text-xl text-slate">
            Structured programmes for wellbeing, mindfulness, and personal growth
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {courses.map((course) => {
            const startDate = new Date(course.startDate)
            return (
              <div key={course.id} className="card p-8">
                <div className="flex gap-2 mb-4">
                  <span className="badge bg-terracotta-100 text-terracotta-600">{course.duration}</span>
                  <span className="badge bg-sage-50 text-sage-700">£{course.price}</span>
                </div>
                
                <h2 className="font-display text-2xl font-bold text-charcoal mb-3">
                  {course.title}
                </h2>
                
                <div className="text-sage-500 font-semibold mb-4">
                  {course.organisation.name}
                </div>

                <p className="text-slate leading-relaxed mb-6">
                  {course.description}
                </p>

                <div className="space-y-2 mb-6 text-sm text-slate">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Starts {startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{course.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📚</span>
                    <span>{course._count.sessions} sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{course.capacity} places available</span>
                  </div>
                </div>

                <button className="btn btn-primary w-full">
                  Enroll Now
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
