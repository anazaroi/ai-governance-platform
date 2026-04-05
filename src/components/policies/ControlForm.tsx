'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createControl } from '@/lib/actions/policy.actions'

interface ControlFormProps {
  policyId: string
}

export function ControlForm({ policyId }: ControlFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState('')
  const [evidenceRequired, setEvidenceRequired] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createControl({
        policyId,
        description,
        frequency: frequency.trim() || null,
        evidenceRequired,
      })
      if ('error' in result) {
        setError(result.error || 'An error occurred')
      } else {
        router.push(`/policies/${policyId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Control Description <span className="text-red-400">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="e.g. Perform annual model validation and document findings"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Frequency</label>
        <input
          type="text"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          placeholder="e.g. Annual, Quarterly, Monthly"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="evidenceRequired"
          checked={evidenceRequired}
          onChange={(e) => setEvidenceRequired(e.target.checked)}
          className="accent-blue-500"
        />
        <label htmlFor="evidenceRequired" className="text-sm text-slate-300 cursor-pointer">
          Evidence required for compliance
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Adding…' : 'Add Control'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-md text-sm font-medium border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
