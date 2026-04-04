'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { initiateWorkflow } from '@/lib/actions/workflow.actions'

interface InitiateWorkflowFormProps {
  modelId: string
  modelName: string
}

const WORKFLOW_TYPES = [
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'MATERIAL_CHANGE', label: 'Material Change' },
  { value: 'PERIODIC_REVIEW', label: 'Periodic Review' },
  { value: 'RETIREMENT', label: 'Retirement' },
] as const

export function InitiateWorkflowForm({ modelId, modelName }: InitiateWorkflowFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<(typeof WORKFLOW_TYPES)[number]['value']>('ONBOARDING')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await initiateWorkflow({
        modelId,
        type,
        dueDate: dueDate || undefined,
      })
      if ('error' in result) {
        setError(result.error || 'An error occurred')
      } else {
        router.push(`/workflows/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Model</span>
        <p className="text-sm font-medium text-slate-200 mt-0.5">{modelName}</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Workflow Type <span className="text-red-400">*</span>
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
        >
          {WORKFLOW_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Initiating…' : 'Initiate Workflow'}
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
