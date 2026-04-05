import Link from 'next/link'
import { getDashboardStats } from '@/lib/queries/dashboard.queries'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge'

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: 'bg-green-500',
  DRAFT: 'bg-slate-500',
  RETIRED: 'bg-slate-700',
}

const TIER_COLOURS: Record<string, string> = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-green-600',
  UNASSESSED: 'bg-slate-600',
}

function DistributionBar({
  items,
  colourMap,
  total,
}: {
  items: [string, number][]
  colourMap: Record<string, string>
  total: number
}) {
  if (total === 0) return <p className="text-xs text-slate-500">No data</p>
  return (
    <div className="space-y-2">
      {items.map(([key, count]) => {
        const pct = Math.round((count / total) * 100)
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-24 shrink-0">
              {key.replace(/_/g, ' ')}
            </span>
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colourMap[key] ?? 'bg-slate-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-100'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const activeCount = stats.modelsByStatus['ACTIVE'] ?? 0
  const highRiskCount = stats.modelsByTier['HIGH'] ?? 0

  const statusItems = Object.entries(stats.modelsByStatus).sort(
    (a, b) => b[1] - a[1]
  )
  const tierItems = Object.entries(stats.modelsByTier).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">AI Governance overview — CRO / COO view</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total AI Models" value={stats.totalModels} />
        <StatCard
          label="Active Models"
          value={activeCount}
          sub={stats.totalModels > 0 ? `${Math.round((activeCount / stats.totalModels) * 100)}% of inventory` : undefined}
          accent="text-green-400"
        />
        <StatCard
          label="High Risk Models"
          value={highRiskCount}
          accent={highRiskCount > 0 ? 'text-red-400' : undefined}
        />
        <StatCard
          label="Pending Workflows"
          value={stats.activeWorkflowCount}
          accent={stats.activeWorkflowCount > 0 ? 'text-amber-400' : undefined}
        />
      </div>

      {/* Overdue alert */}
      {stats.overdueReviewCount > 0 && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-400 font-semibold text-sm">
            {stats.overdueReviewCount} overdue review{stats.overdueReviewCount !== 1 ? 's' : ''}
          </span>
          <span className="text-amber-300/70 text-xs">
            Models whose risk review date has passed. Schedule assessments.
          </span>
          <Link href="/assessments" className="ml-auto text-xs text-amber-400 hover:underline">
            View Assessments →
          </Link>
        </div>
      )}

      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Models by Status</h2>
          <DistributionBar
            items={statusItems}
            colourMap={STATUS_COLOURS}
            total={stats.totalModels}
          />
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Models by Risk Tier</h2>
          <DistributionBar
            items={tierItems}
            colourMap={TIER_COLOURS}
            total={stats.totalModels}
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent assessments */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-300">Recent Assessments</h2>
            <Link href="/assessments" className="text-xs text-blue-400 hover:underline">
              View all →
            </Link>
          </div>
          {stats.recentAssessments.length === 0 ? (
            <p className="text-xs text-slate-500">No assessments yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentAssessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RiskTierBadge tier={a.tier} />
                    <Link
                      href={`/assessments/${a.id}`}
                      className="text-xs text-slate-300 hover:text-blue-400 hover:underline"
                    >
                      {a.model.name}
                    </Link>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(a.assessedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent workflows */}
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-300">Recent Workflows</h2>
            <Link href="/workflows" className="text-xs text-blue-400 hover:underline">
              View all →
            </Link>
          </div>
          {stats.recentWorkflows.length === 0 ? (
            <p className="text-xs text-slate-500">No workflows yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentWorkflows.map((w) => (
                <div key={w.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <WorkflowStatusBadge status={w.status} />
                    <Link
                      href={`/workflows/${w.id}`}
                      className="text-xs text-slate-300 hover:text-blue-400 hover:underline"
                    >
                      {w.model.name}
                    </Link>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
