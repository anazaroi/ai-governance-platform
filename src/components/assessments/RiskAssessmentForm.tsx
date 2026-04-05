'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createRiskAssessment } from '@/lib/actions/assessment.actions'
import { calculateTier, type RiskScores } from '@/lib/utils'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'

const DIMENSIONS = [
  {
    key: 'dataSensitivity' as const,
    label: 'Data Sensitivity',
    descriptions: ['', 'Public / anonymised data', 'Internal data with limited PII', 'Confidential / full PII or regulated data'],
  },
  {
    key: 'customerImpact' as const,
    label: 'Customer Impact',
    descriptions: ['', 'No direct customer impact', 'Indirect or limited customer impact', 'Direct and significant customer impact'],
  },
  {
    key: 'modelComplexity' as const,
    label: 'Model Complexity',
    descriptions: ['', 'Simple rules-based logic', 'Moderate ML with well-understood features', 'Deep learning or complex ensemble model'],
  },
  {
    key: 'explainability' as const,
    label: 'Explainability',
    descriptions: ['', 'Fully explainable (rules/decision trees)', 'Partially explainable with SHAP/LIME', 'Black-box model with limited explainability'],
  },
  {
    key: 'operationalCriticality' as const,
    label: 'Operational Criticality',
    descriptions: ['', 'Low-frequency batch process', 'Important but non-critical workflow', 'Core real-time operations / revenue-critical'],
  },
]

type ScoreKey = (typeof DIMENSIONS)[number]['key']

const DEFAULT_SCORES: RiskScores = {
  dataSensitivity: 1,
  customerImpact: 1,
  modelComplexity: 1,
  explainability: 1,
  operationalCriticality: 1,
}

interface RiskAssessmentFormProps {
  modelId: string
  modelName: string
}

export function RiskAssessmentForm({ modelId, modelName }: RiskAssessmentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scores, setScores] = useState<RiskScores>(DEFAULT_SCORES)
  const [rationale, setRationale] = useState('')
  const [methodology, setMethodology] = useState('')
  const [error, setError] = useState<string | null>(null)

  const tier = calculateTier(scores)

  function setScore(key: ScoreKey, value: 1 | 2 | 3) {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createRiskAssessment({
        modelId,
        scores,
        rationale: rationale.trim() || undefined,
        methodology: methodology.trim() || undefined,
      })
      if ('error' in result) {
        setError(String(result.error))
      } else {
        router.push(`/assessments/${result.data.id}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Model info */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3">
        <span className="text-xs text-slate-500 uppercase tracking-wide">Model</span>
        <p className="text-sm font-medium text-slate-200 mt-0.5">{modelName}</p>
      </div>

      {/* Tier preview */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/30 px-4 py-3">
        <span className="text-sm text-slate-400">Calculated Risk Tier:</span>
        <RiskTierBadge tier={tier} />
        <span className="text-xs text-slate-500">
          (total: {scores.dataSensitivity + scores.customerImpact + scores.modelComplexity + scores.explainability + scores.operationalCriticality} / 15)
        </span>
      </div>

      {/* Scoring dimensions */}
      <div className="space-y-6">
        {DIMENSIONS.map((dim) => (
          <div key={dim.key} className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              {dim.label}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {([1, 2, 3] as const).map((value) => (
                <label
                  key={value}
                  className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                    scores[dim.key] === value
                      ? 'border-blue-500 bg-blue-900/20 text-blue-200'
                      : 'border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={dim.key}
                    value={value}
                    checked={scores[dim.key] === value}
                    onChange={() => setScore(dim.key, value)}
                    className="sr-only"
                  />
                  <span className="text-xs font-semibold block mb-1">Score {value}</span>
                  <span className="text-xs">{dim.descriptions[value]}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Methodology */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Methodology</label>
        <input
          type="text"
          value={methodology}
          onChange={(e) => setMethodology(e.target.value)}
          placeholder="e.g. MAS Notice 655 scoring framework"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {/* Rationale */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Rationale</label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Explain the scoring decisions..."
          rows={4}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
          {isPending ? 'Saving…' : 'Save Assessment'}
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
