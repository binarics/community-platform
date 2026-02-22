'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PaymentUpdatePanelProps {
  bookingId: string
  paymentStatus: string
  paymentAmount: number | null
  referralFeePaid: boolean
  referralFeeAmount: number | null
  isConsultation: boolean
  sessionCompleted: boolean
}

const STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
}

const STATUS_STYLES: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
}

export function PaymentUpdatePanel({
  bookingId,
  paymentStatus: initialStatus,
  paymentAmount: initialAmount,
  referralFeePaid: initialReferralFeePaid,
  referralFeeAmount: initialReferralFeeAmount,
  isConsultation,
  sessionCompleted,
}: PaymentUpdatePanelProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(initialStatus)
  const [paymentAmount, setPaymentAmount] = useState<string>(
    initialAmount !== null && initialAmount !== undefined ? String(initialAmount) : ''
  )
  const [referralFeePaid, setReferralFeePaid] = useState(initialReferralFeePaid)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Current display values (before editing)
  const [displayStatus, setDisplayStatus] = useState(initialStatus)
  const [displayAmount, setDisplayAmount] = useState(initialAmount)
  const [displayReferralFeePaid, setDisplayReferralFeePaid] = useState(initialReferralFeePaid)
  const [displayReferralFeeAmount, setDisplayReferralFeeAmount] = useState(initialReferralFeeAmount)

  const CONSULTATION_FEE = 30
  const REFERRAL_FEE = 10

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const amount = paymentAmount !== '' ? parseFloat(paymentAmount) : null

    if (amount !== null && isNaN(amount)) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/counsellor/bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus,
          paymentAmount: amount,
          referralFeePaid,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update payment')
        return
      }

      setDisplayStatus(paymentStatus)
      setDisplayAmount(amount)
      setDisplayReferralFeePaid(referralFeePaid)
      if (referralFeePaid && isConsultation) {
        setDisplayReferralFeeAmount(REFERRAL_FEE)
      }

      setSuccess(true)
      setIsOpen(false)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    // Reset form to current display values
    setPaymentStatus(displayStatus)
    setPaymentAmount(displayAmount !== null && displayAmount !== undefined ? String(displayAmount) : '')
    setReferralFeePaid(displayReferralFeePaid)
    setError('')
    setIsOpen(false)
  }

  const counsellorKeeps = isConsultation && displayAmount !== null
    ? displayAmount - REFERRAL_FEE
    : displayAmount

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-charcoal">Payment</h3>
        {success && (
          <span className="text-xs text-green-600 font-semibold">Updated</span>
        )}
      </div>

      {/* Current Payment Status Display */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate">Status</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[displayStatus] || 'bg-gray-100 text-gray-700'}`}>
            {STATUS_LABELS[displayStatus] || displayStatus}
          </span>
        </div>

        {displayAmount !== null && displayAmount !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate">Amount received</span>
            <span className="text-sm font-semibold text-charcoal">£{displayAmount.toFixed(2)}</span>
          </div>
        )}

        {isConsultation && (
          <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
            <div className="text-xs font-semibold text-violet-700 mb-2 uppercase">Consultation Referral Fee</div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate">Consultation fee</span>
              <span className="text-xs font-medium text-charcoal">£{CONSULTATION_FEE.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate">Eclectic House fee</span>
              <span className="text-xs font-medium text-charcoal">£{REFERRAL_FEE.toFixed(2)}</span>
            </div>
            {displayAmount !== null && displayAmount !== undefined && (
              <div className="flex items-center justify-between border-t border-violet-100 mt-2 pt-2">
                <span className="text-xs font-semibold text-slate">You keep</span>
                <span className="text-xs font-bold text-violet-700">
                  £{Math.max(0, displayAmount - REFERRAL_FEE).toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate">Referral fee sent</span>
              {displayReferralFeePaid ? (
                <span className="text-xs font-semibold text-green-600">
                  ✓ Sent {displayReferralFeeAmount ? `(£${displayReferralFeeAmount.toFixed(2)})` : ''}
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-600">Pending</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-outline w-full justify-center text-sm"
        >
          {displayStatus === 'PAID' ? 'Update Payment' : 'Record Payment'}
        </button>
      )}

      {/* Payment Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-sage-100 pt-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate mb-2">
              Payment Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UNPAID', 'PARTIAL', 'PAID'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPaymentStatus(s)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    paymentStatus === s
                      ? s === 'PAID'
                        ? 'bg-green-500 text-white border-green-500'
                        : s === 'PARTIAL'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-red-400 text-white border-red-400'
                      : 'bg-white text-slate border-sage-200 hover:border-sage-400'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate mb-2">
              Amount Received (£)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate font-semibold">£</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={isConsultation ? '30.00' : '0.00'}
                className="input pl-8 w-full"
              />
            </div>
            {isConsultation && (
              <p className="text-xs text-slate mt-1">Standard consultation fee is £{CONSULTATION_FEE}</p>
            )}
          </div>

          {isConsultation && (
            <div className="p-3 bg-violet-50 rounded-xl border border-violet-100">
              <div className="text-xs font-semibold text-violet-700 mb-2 uppercase">Eclectic House Referral Fee</div>
              <p className="text-xs text-slate mb-3">
                A £{REFERRAL_FEE} referral fee is owed to Eclectic House for each consultation.
              </p>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={referralFeePaid}
                  onChange={(e) => setReferralFeePaid(e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <span className="text-sm font-medium text-charcoal">
                  I have sent the £{REFERRAL_FEE} referral fee to Eclectic House
                </span>
              </label>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 justify-center text-sm"
            >
              {loading ? 'Saving...' : 'Save Payment'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline flex-1 justify-center text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
