'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createUseCase, updateUseCase } from '@/lib/actions/usecase.actions'

interface UseCaseFormProps {
  useCase?: {
    id: string
    name: string
    description: string | null
    regulatoryCategory: string
  }
}

export function UseCaseForm({ useCase }: UseCaseFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(useCase?.name ?? '')
  const [description, setDescription] = useState(useCase?.description ?? '')
  const [regulatoryCategory, setRegulatoryCategory] = useState(
    useCase?.regulatoryCategory ?? ''
  )
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = {
      name,
      description: description.trim() || null,
      regulatoryCategory,
    }
    startTransition(async () => {
      const result = useCase
        ? await updateUseCase(useCase.id, formData)
        : await createUseCase(formData)
      if ('error' in result) {
        setError(result.error ?? null)
      } else {
        router.push(`/registry/use-cases/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="uc-name" className="block text-sm font-medium text-slate-300">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          id="uc-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Credit Scoring"
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="uc-description" className="block text-sm font-medium text-slate-300">Description</label>
        <textarea
          id="uc-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe the business purpose of this use case"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="uc-regulatory-category" className="block text-sm font-medium text-slate-300">
          Regulatory Category <span className="text-red-400">*</span>
        </label>
        <input
          id="uc-regulatory-category"
          type="text"
          value={regulatoryCategory}
          onChange={(e) => setRegulatoryCategory(e.target.value)}
          placeholder="e.g. MAS_TRAT, MAS_NOTICE_655"
          required
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
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
          {isPending ? 'Saving…' : useCase ? 'Save Changes' : 'Create Use Case'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/registry/use-cases')}
          className="px-4 py-2 rounded-md text-sm font-medium border border-slate-700 hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
