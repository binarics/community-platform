'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AvailabilityEditorProps {
  counsellorId: string
  currentAvailability: any
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function AvailabilityEditor({ counsellorId, currentAvailability }: AvailabilityEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [availability, setAvailability] = useState(currentAvailability || {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  })

  function toggleDay(day: string) {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        enabled: !availability[day].enabled,
      },
    })
  }

  function updateTime(day: string, field: 'start' | 'end', value: string) {
    setAvailability({
      ...availability,
      [day]: {
        ...availability[day],
        [field]: value,
      },
    })
  }

  async function handleSave() {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/counsellor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counsellorId,
          availability: JSON.stringify(availability),
        }),
      })

      if (response.ok) {
        router.push('/counsellor/calendar')
        router.refresh()
      } else {
        setError('Failed to save availability')
      }
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-8">
        {DAYS.map((day, index) => (
          <div key={day} className="p-4 border-2 border-sage-100 rounded-xl">
            <div className="flex items-center gap-4">
              {/* Toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availability[day].enabled}
                  onChange={() => toggleDay(day)}
                  className="w-5 h-5 text-sage-500 rounded focus:ring-sage-500"
                />
                <span className={`ml-3 font-semibold ${availability[day].enabled ? 'text-charcoal' : 'text-slate'}`}>
                  {DAY_LABELS[index]}
                </span>
              </label>

              {/* Time inputs */}
              {availability[day].enabled && (
                <div className="flex items-center gap-4 ml-auto">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate">From</label>
                    <input
                      type="time"
                      value={availability[day].start}
                      onChange={(e) => updateTime(day, 'start', e.target.value)}
                      className="px-3 py-2 border-2 border-sage-100 rounded-lg focus:border-sage-500 transition"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate">To</label>
                    <input
                      type="time"
                      value={availability[day].end}
                      onChange={(e) => updateTime(day, 'end', e.target.value)}
                      className="px-3 py-2 border-2 border-sage-100 rounded-lg focus:border-sage-500 transition"
                    />
                  </div>
                </div>
              )}

              {!availability[day].enabled && (
                <span className="ml-auto text-sm text-slate">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Presets */}
      <div className="mb-8 p-4 bg-sage-50 rounded-xl">
        <div className="text-sm font-semibold text-charcoal mb-3">Quick Presets:</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              const weekdayAvailability = {
                monday: { enabled: true, start: '09:00', end: '17:00' },
                tuesday: { enabled: true, start: '09:00', end: '17:00' },
                wednesday: { enabled: true, start: '09:00', end: '17:00' },
                thursday: { enabled: true, start: '09:00', end: '17:00' },
                friday: { enabled: true, start: '09:00', end: '17:00' },
                saturday: { enabled: false, start: '09:00', end: '17:00' },
                sunday: { enabled: false, start: '09:00', end: '17:00' },
              }
              setAvailability(weekdayAvailability)
            }}
            className="btn btn-outline text-sm"
          >
            Weekdays Only (9-5)
          </button>

          <button
            type="button"
            onClick={() => {
              const fullWeek = {
                monday: { enabled: true, start: '08:00', end: '18:00' },
                tuesday: { enabled: true, start: '08:00', end: '18:00' },
                wednesday: { enabled: true, start: '08:00', end: '18:00' },
                thursday: { enabled: true, start: '08:00', end: '18:00' },
                friday: { enabled: true, start: '08:00', end: '18:00' },
                saturday: { enabled: true, start: '10:00', end: '16:00' },
                sunday: { enabled: true, start: '10:00', end: '16:00' },
              }
              setAvailability(fullWeek)
            }}
            className="btn btn-outline text-sm"
          >
            Full Week (Extended Hours)
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary flex-1"
        >
          {loading ? 'Saving...' : 'Save Availability'}
        </button>
      </div>
    </div>
  )
}