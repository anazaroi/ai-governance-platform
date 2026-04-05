'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPolicy, updatePolicy } from '@/lib/actions/policy.actions'

const TIER_OPTIONS = ['HIGH', 'MEDIUM', 'LOW'] as const

interface PolicyFormProps {
  policy?: {
    id: string
    name: string
    category: string
    masReference: string | null
    version: string
    applicableTiers: string[]
  }
}

export function PolicyForm({ policy }: PolicyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(policy?.name ?? '')
  const [category, setCategory] = useState(policy?.category ?? '')
  const [masReference, setMasReference] = useState(policy?.masReference ?? '')
  const [version, setVersion] = useState(policy?.version ?? '1.0')
  const [applicableTiers, setApplicableTiers] = useState<string[]>(
    policy?.applicableTiers ?? []
  )
  const [error, setError] = useState<string | null>(null)

  function toggleTier(tier: string) {
    setApplicableTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const formData = {
      name,
      category,
      masReference: masReference.trim() || null,
      version,
      applicableTiers,
    }
    startTransition(async () => {
      const result = policy
        ? await updatePolicy(policy.id, formData)
        : await createPolicy(formData)
      if ('error' in result) {
        setError(result.error || 'An error occurred')
      } else {
        router.push(`/policies/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Policy Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Model Risk Management Policy"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Category <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Model Risk, Data Governance, Compliance"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">MAS Reference</label>
        <input
          type="text"
          value={masReference}
          onChange={(e) => setMasReference(e.target.value)}
          placeholder="e.g. MAS Notice 655"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Version <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="1.0"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Applicable Risk Tiers</label>
        <div className="flex gap-3">
          {TIER_OPTIONS.map((tier) => (
            <label key={tier} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={applicableTiers.includes(tier)}
                onChange={() => toggleTier(tier)}
                className="accent-blue-500"
              />
              <span className={`text-sm font-medium ${
                tier === 'HIGH' ? 'text-red-400' :
                tier === 'MEDIUM' ? 'text-amber-400' : 'text-green-400'
              }`}>
                {tier}
              </span>
            </label>
          ))}
        </div>
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
          {isPending ? 'Saving…' : policy ? 'Save Changes' : 'Create Policy'}
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
