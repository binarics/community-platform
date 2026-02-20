'use client'

interface MasjidStatsProps {
  totalMasjids: number
  totalEvents: number
  activeEvents: number
  totalMembers: number
}

export function MasjidStats({ totalMasjids, totalEvents, activeEvents, totalMembers }: MasjidStatsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <div className="card p-6">
        <div className="text-sm font-semibold uppercase text-slate mb-2">
          Total Masjids
        </div>
        <div className="font-display text-4xl font-bold text-charcoal">
          {totalMasjids}
        </div>
        <div className="text-sm text-sage-600 mt-1">active organizations</div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold uppercase text-slate mb-2">
          Total Events
        </div>
        <div className="font-display text-4xl font-bold text-charcoal">
          {totalEvents}
        </div>
        <div className="text-sm text-slate mt-1">all time</div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold uppercase text-slate mb-2">
          Active Events
        </div>
        <div className="font-display text-4xl font-bold text-sage-600">
          {activeEvents}
        </div>
        <div className="text-sm text-slate mt-1">upcoming</div>
      </div>

      <div className="card p-6">
        <div className="text-sm font-semibold uppercase text-slate mb-2">
          Total Members
        </div>
        <div className="font-display text-4xl font-bold text-charcoal">
          {totalMembers}
        </div>
        <div className="text-sm text-slate mt-1">community size</div>
      </div>
    </div>
  )
}