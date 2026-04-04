'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { retireModel } from '@/lib/actions/model.actions'
import type { ModelStatus, ModelType, RiskTier } from '@/lib/constants'

interface ModelRow {
  id: string
  name: string
  type: ModelType
  status: ModelStatus
  currentRiskTier: RiskTier | null
  businessUnit: string
  owner: string
  useCase: { id: string; name: string }
  vendor: { id: string; name: string } | null
  _count: { riskAssessments: number; workflows: number }
}

interface ModelTableProps {
  models: ModelRow[]
}

export function ModelTable({ models }: ModelTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false
      if (typeFilter && m.type !== typeFilter) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [models, search, statusFilter, typeFilter])

  function handleRetire(id: string, name: string) {
    if (!confirm(`Are you sure you want to retire model "${name}"? This action sets the model status to RETIRED.`)) return
    startTransition(async () => {
      await retireModel(id)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All types</option>
          <option value="LLM">LLM</option>
          <option value="ML">ML</option>
          <option value="RPA">RPA</option>
          <option value="RULES">Rules</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Risk Tier</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Business Unit</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Use Case</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Vendor</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  {models.length === 0
                    ? 'No models registered yet.'
                    : 'No models match the current filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((model) => (
                <tr key={model.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/models/${model.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {model.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ModelTypeBadge type={model.type} />
                  </td>
                  <td className="px-4 py-3">
                    <ModelStatusBadge status={model.status} />
                  </td>
                  <td className="px-4 py-3">
                    {model.currentRiskTier ? (
                      <RiskTierBadge tier={model.currentRiskTier} />
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{model.businessUnit}</td>
                  <td className="px-4 py-3 text-slate-400">{model.owner}</td>
                  <td className="px-4 py-3 text-slate-400">{model.useCase.name}</td>
                  <td className="px-4 py-3 text-slate-400">{model.vendor?.name ?? '--'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/models/${model.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/models/${model.id}/edit`)}
                      >
                        Edit
                      </Button>
                      {model.status !== 'RETIRED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          disabled={isPending}
                          onClick={() => handleRetire(model.id, model.name)}
                        >
                          Retire
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {models.length} model{models.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
