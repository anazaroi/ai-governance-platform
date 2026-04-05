'use client'

import { useState, useTransition } from 'react'
import { submitEvidence } from '@/lib/actions/evidence.actions'

interface EvidenceSubmitFormProps {
  modelId: string
  controlId: string
  currentFileUrl?: string | null
  currentStatus?: string
}

export function EvidenceSubmitForm({ modelId, controlId, currentFileUrl, currentStatus }: EvidenceSubmitFormProps) {
  const [isPending, startTransition] = useTransition()
  const [fileUrl, setFileUrl] = useState(currentFileUrl ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await submitEvidence({
        modelId,
        controlId,
        fileUrl: fileUrl.trim() || undefined,
      })
      if ('error' in result) {
        setError(result.error || 'An error occurred')
      } else {
        setSuccess(true)
        setFileUrl('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="Evidence URL (optional)"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? 'Submitting…' : currentStatus === 'SUBMITTED' ? 'Resubmit' : 'Submit Evidence'}
        </button>
      </div>
      {success && (
        <p className="text-xs text-green-400">Evidence submitted successfully.</p>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </form>
  )
}
