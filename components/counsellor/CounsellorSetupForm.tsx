'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CounsellorSetupFormProps {
  userId: string
  userName: string
  userEmail: string
  organisations: Array<{ id: string; name: string }>
}

const SPECIALIZATIONS = [
  'Depression',
  'Anxiety',
  'Stress Management',
  'Trauma & PTSD',
  'Relationship Issues',
  'Family Therapy',
  'Islamic Counselling',
  'Youth Counselling',
  'Career Counselling',
  'Grief & Loss',
  'Addiction',
  'Anger Management',
  'Self-Esteem',
  'Life Transitions',
  'Mindfulness',
]

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function CounsellorSetupForm({ userId, userName, userEmail, organisations }: CounsellorSetupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    bio: '',
    specializations: [] as string[],
    customSpecialization: '',
    hourlyRate: '',
    qualifications: '',
    yearsExperience: '',
    languages: '',
    organisationId: organisations[0]?.id || '',
  })

  // Availability state (simplified for setup, can be expanded later)
  const [availability, setAvailability] = useState<Record<string, { enabled: boolean; hours: string }>>({
    Monday: { enabled: false, hours: '09:00-17:00' },
    Tuesday: { enabled: false, hours: '09:00-17:00' },
    Wednesday: { enabled: false, hours: '09:00-17:00' },
    Thursday: { enabled: false, hours: '09:00-17:00' },
    Friday: { enabled: false, hours: '09:00-17:00' },
    Saturday: { enabled: false, hours: '09:00-17:00' },
    Sunday: { enabled: false, hours: '09:00-17:00' },
  })

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }))
  }

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }))
  }

  const updateDayHours = (day: string, hours: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], hours }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validation
    if (step === 1) {
      if (!formData.bio || formData.bio.length < 50) {
        setError('Bio must be at least 50 characters')
        return
      }
      if (formData.specializations.length === 0) {
        setError('Please select at least one specialization')
        return
      }
      if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
        setError('Please enter a valid hourly rate')
        return
      }
      // Move to step 2
      setStep(2)
      return
    }

    // Step 2: Submit everything
    setLoading(true)

    try {
      // Add custom specialization if provided
      let allSpecializations = [...formData.specializations]
      if (formData.customSpecialization.trim()) {
        allSpecializations.push(formData.customSpecialization.trim())
      }

      // Build availability object
      const availabilityData: Record<string, string[]> = {}
      Object.entries(availability).forEach(([day, data]) => {
        if (data.enabled) {
          availabilityData[day.toLowerCase()] = [data.hours]
        }
      })

      const response = await fetch('/api/counsellor/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          bio: formData.bio,
          specializations: allSpecializations,
          hourlyRate: parseFloat(formData.hourlyRate),
          qualifications: formData.qualifications,
          yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : null,
          languages: formData.languages,
          organisationId: formData.organisationId || null,
          availability: availabilityData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create profile')
        setLoading(false)
        return
      }

      // Success - redirect to dashboard
      router.push('/counsellor-dashboard?setup=complete')
    } catch (error) {
      console.error('Setup error:', error)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  if (step === 2) {
    return (
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <h3 className="font-display text-xl font-bold text-charcoal mb-6">
          Step 2: Set Your Availability
        </h3>

        <p className="text-slate mb-6">
          Select the days you&apos;re available and set your working hours. You can always update this later.
        </p>

        <div className="space-y-4 mb-8">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="flex items-center gap-4 p-4 bg-sage-50 rounded-xl">
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability[day].enabled}
                  onChange={() => toggleDay(day)}
                  className="w-5 h-5 rounded border-2 border-sage-300 text-sage-600 focus:ring-sage-500"
                />
                <span className="font-semibold text-charcoal w-24">{day}</span>
              </label>

              {availability[day].enabled && (
                <input
                  type="text"
                  value={availability[day].hours}
                  onChange={(e) => updateDayHours(day, e.target.value)}
                  placeholder="09:00-17:00"
                  className="px-4 py-2 border-2 border-sage-100 rounded-lg focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-terracotta-50 p-4 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>
            <div className="text-sm text-terracotta-900">
              <div className="font-semibold mb-1">Pending Verification</div>
              <p>
                Your profile will be reviewed by an administrator before it goes live. 
                You&apos;ll receive an email notification once approved.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn btn-outline"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={loading || Object.values(availability).every(d => !d.enabled)}
            className="btn btn-primary flex-1"
          >
            {loading ? 'Creating Profile...' : 'Complete Setup'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={userName}
          disabled
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl bg-sage-50 text-slate"
        />
        <p className="text-xs text-slate mt-1">
          To change your name, update your profile settings
        </p>
      </div>

      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Email
        </label>
        <input
          type="email"
          value={userEmail}
          disabled
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl bg-sage-50 text-slate"
        />
      </div>

      {/* Organisation */}
      {organisations.length > 0 && (
        <div className="mb-8">
          <label className="block font-semibold text-charcoal mb-2">
            Organisation (Optional)
          </label>
          <select
            value={formData.organisationId}
            onChange={(e) => setFormData({ ...formData, organisationId: e.target.value })}
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
          >
            <option value="">Independent Counsellor</option>
            {organisations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Bio */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Professional Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={6}
          placeholder="Tell us about your background, approach to therapy, and what makes you unique as a counsellor..."
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
          required
        />
        <p className="text-xs text-slate mt-1">
          {formData.bio.length} / 50 characters minimum
        </p>
      </div>

      {/* Specializations */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-3">
          Specializations <span className="text-red-500">*</span>
        </label>
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          {SPECIALIZATIONS.map(spec => (
            <label
              key={spec}
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition ${
                formData.specializations.includes(spec)
                  ? 'bg-sage-500 text-white'
                  : 'bg-sage-50 text-charcoal hover:bg-sage-100'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.specializations.includes(spec)}
                onChange={() => toggleSpecialization(spec)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{spec}</span>
            </label>
          ))}
        </div>
        <input
          type="text"
          value={formData.customSpecialization}
          onChange={(e) => setFormData({ ...formData, customSpecialization: e.target.value })}
          placeholder="Other specialization (optional)"
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
        />
      </div>

      {/* Qualifications */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Qualifications & Certifications
        </label>
        <textarea
          value={formData.qualifications}
          onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
          rows={3}
          placeholder="e.g., MA in Counselling Psychology, BACP Accredited, Islamic Psychology Certification"
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition resize-none"
        />
      </div>

      {/* Experience & Rate */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block font-semibold text-charcoal mb-2">
            Years of Experience
          </label>
          <input
            type="number"
            value={formData.yearsExperience}
            onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
            min="0"
            max="50"
            placeholder="5"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
          />
        </div>

        <div>
          <label className="block font-semibold text-charcoal mb-2">
            Hourly Rate (£) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.hourlyRate}
            onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
            min="0"
            step="0.01"
            placeholder="50.00"
            className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
            required
          />
        </div>
      </div>

      {/* Languages */}
      <div className="mb-8">
        <label className="block font-semibold text-charcoal mb-2">
          Languages Spoken
        </label>
        <input
          type="text"
          value={formData.languages}
          onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
          placeholder="e.g., English, Arabic, Urdu"
          className="w-full px-4 py-3 border-2 border-sage-100 rounded-xl focus:border-sage-500 focus:ring-4 focus:ring-sage-50 transition"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        Continue to Availability →
      </button>
    </form>
  )
}
