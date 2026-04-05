'use client'

import { useState, useTransition } from 'react'
import { reviewEvidence } from '@/lib/actions/evidence.actions'

interface EvidenceReviewFormProps {
  evidenceId: string
}

export function EvidenceReviewForm({ evidenceId }: EvidenceReviewFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleReview(decision: 'APPROVED' | 'REJECTED') {
    setError(null)
    startTransition(async () => {
      const result = await reviewEvidence(evidenceId, decision)
      if ('error' in result) {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handleReview('APPROVED')}
        disabled={isPending}
        className="px-3 py-1 rounded text-xs font-medium bg-green-700 hover:bg-green-600 disabled:opacity-50 transition-colors"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={() => handleReview('REJECTED')}
        disabled={isPending}
        className="px-3 py-1 rounded text-xs font-medium bg-red-800 hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
