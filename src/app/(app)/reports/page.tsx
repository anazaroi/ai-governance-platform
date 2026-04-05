import Link from 'next/link'
import { getModels } from '@/lib/queries/model.queries'
import { getRiskAssessments } from '@/lib/queries/assessment.queries'
import { getWorkflows } from '@/lib/queries/workflow.queries'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge'

export default async function ReportsPage() {
  const [models, assessments, workflows] = await Promise.all([
    getModels(),
    getRiskAssessments(),
    getWorkflows(),
  ])

  const activeModels = models.filter((m) => m.status === 'ACTIVE')
  const highRisk = models.filter((m) => m.currentRiskTier === 'HIGH')
  const pendingWorkflows = workflows.filter(
    (w) => w.status === 'PENDING' || w.status === 'IN_REVIEW'
  )
  const completedWorkflows = workflows.filter(
    (w) => w.status === 'APPROVED' || w.status === 'REJECTED'
  )

  const reportDate = new Date().toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Report header */}
      <div className="border-b border-slate-700 pb-6">
        <h1 className="text-2xl font-semibold text-slate-100">AI Model Governance Report</h1>
        <p className="text-sm text-slate-400 mt-1">
          Board-level summary · Generated {reportDate}
        </p>
      </div>

      {/* Executive summary */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total AI Models', value: models.length },
            { label: 'Active in Production', value: activeModels.length },
            { label: 'High Risk Models', value: highRisk.length },
            { label: 'Pending Approvals', value: pendingWorkflows.length },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-slate-100">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active model inventory */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-4">
          Active Model Inventory ({activeModels.length})
        </h2>
        {activeModels.length === 0 ? (
          <p className="text-sm text-slate-500">No active models.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Model</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Business Unit</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Risk Tier</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Last Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeModels.map((m) => (
                <tr key={m.id}>
                  <td className="py-2">
                    <Link
                      href={`/models/${m.id}`}
                      className="text-blue-400 hover:underline text-sm"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-400 text-sm">{m.businessUnit}</td>
                  <td className="py-2">
                    {m.currentRiskTier ? (
                      <RiskTierBadge tier={m.currentRiskTier} />
                    ) : (
                      <span className="text-xs text-slate-500">Unassessed</span>
                    )}
                  </td>
                  <td className="py-2 text-slate-400 text-sm">
                    {m.lastReviewedAt
                      ? new Date(m.lastReviewedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent assessments */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-4">
          Risk Assessments ({assessments.length} total)
        </h2>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-500">No assessments completed yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Model</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Tier</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Assessed</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Next Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {assessments.slice(0, 20).map((a) => (
                <tr key={a.id}>
                  <td className="py-2">
                    <Link href={`/assessments/${a.id}`} className="text-blue-400 hover:underline text-sm">
                      {a.model.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    <RiskTierBadge tier={a.tier} />
                  </td>
                  <td className="py-2 text-slate-400 text-sm">
                    {new Date(a.assessedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 text-slate-400 text-sm">
                    {a.nextReviewDate ? new Date(a.nextReviewDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed workflows */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-base font-semibold text-slate-100 mb-4">
          Approval Workflows ({completedWorkflows.length} completed)
        </h2>
        {completedWorkflows.length === 0 ? (
          <p className="text-sm text-slate-500">No completed workflows yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Model</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Decision</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {completedWorkflows.slice(0, 20).map((w) => (
                <tr key={w.id}>
                  <td className="py-2">
                    <Link href={`/workflows/${w.id}`} className="text-blue-400 hover:underline text-sm">
                      {w.model.name}
                    </Link>
                  </td>
                  <td className="py-2 text-slate-400 text-sm">
                    {w.type.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2">
                    <WorkflowStatusBadge status={w.status} />
                  </td>
                  <td className="py-2 text-slate-400 text-sm">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
