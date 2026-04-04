'use client'

import { useState, useTransition } from 'react'
import { submitStep } from '@/lib/actions/workflow.actions'

interface StepDecisionFormProps {
  workflowId: string
}

export function StepDecisionForm({ workflowId }: StepDecisionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | ''>('')
  const [comments, setComments] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!decision) return
    setError(null)
    startTransition(async () => {
      const result = await submitStep(workflowId, {
        decision,
        comments: comments.trim() || undefined,
      })
      if ('error' in result) {
        setError(String(result.error))
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="decision"
            value="APPROVED"
            checked={decision === 'APPROVED'}
            onChange={() => setDecision('APPROVED')}
            className="accent-green-500"
          />
          <span className="text-sm text-green-400 font-medium">Approve</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="decision"
            value="REJECTED"
            checked={decision === 'REJECTED'}
            onChange={() => setDecision('REJECTED')}
            className="accent-red-500"
          />
          <span className="text-sm text-red-400 font-medium">Reject</span>
        </label>
      </div>
      <textarea
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Comments (optional)"
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!decision || isPending}
        className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Submitting…' : 'Submit Decision'}
      </button>
    </form>
  )
}
