import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { getModelById } from '@/lib/queries/model.queries'
import { retireModel } from '@/lib/actions/model.actions'

interface ModelDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params
  const model = await getModelById(id)

  if (!model) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">{model.name}</h1>
            <ModelStatusBadge status={model.status} />
            <ModelTypeBadge type={model.type} />
            {model.currentRiskTier && <RiskTierBadge tier={model.currentRiskTier} />}
          </div>
          {model.description && (
            <p className="text-sm text-slate-400 mt-2">{model.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/models/${model.id}/workflows/new`}>
            <Button variant="outline" size="sm">Initiate Workflow</Button>
          </Link>
          <Link href={`/models/${model.id}/assess`}>
            <Button variant="outline" size="sm">Assess Risk</Button>
          </Link>
          <Link href={`/models/${model.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          {model.status !== 'RETIRED' && (
            <form
              action={async () => {
                'use server'
                await retireModel(model.id)
              }}
            >
              <Button type="submit" variant="destructive">
                Retire Model
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Model Information Card */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Model Information</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Unit</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.businessUnit}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.owner}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Use Case</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.useCase.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.vendor ? (
                <Link
                  href={`/registry/vendors/${model.vendor.id}`}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {model.vendor.name}
                </Link>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deployed At</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.deployedAt
                ? new Date(model.deployedAt).toLocaleDateString()
                : '--'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Reviewed</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.lastReviewedAt
                ? new Date(model.lastReviewedAt).toLocaleDateString()
                : '--'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Version History */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Version History</h2>
        {model.modelVersions.length === 0 ? (
          <p className="text-sm text-slate-500">No versions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {model.modelVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    v{version.version}
                  </span>
                  {version.changeLog && (
                    <p className="text-xs text-slate-400 mt-0.5">{version.changeLog}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                  {version.approvedBy && (
                    <p className="text-xs text-green-400">
                      Approved by {version.approvedBy}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Risk Assessments */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Recent Risk Assessments</h2>
        {model.riskAssessments.length === 0 ? (
          <p className="text-sm text-slate-500">No risk assessments completed yet.</p>
        ) : (
          <div className="space-y-3">
            {model.riskAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <RiskTierBadge tier={assessment.tier} />
                  <Link
                    href={`/assessments/${assessment.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Assessed by {assessment.assessedBy}
                  </Link>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(assessment.assessedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Workflows */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Workflow Status</h2>
        {model.workflows.length === 0 ? (
          <p className="text-sm text-slate-500">No workflows initiated yet.</p>
        ) : (
          <div className="space-y-3">
            {model.workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div>
                  <Link
                    href={`/workflows/${workflow.id}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {workflow.type.replace(/_/g, ' ')}
                  </Link>
                  <span className="ml-2 text-xs text-slate-400">
                    by {workflow.initiatedBy}
                  </span>
                </div>
                <span className={`text-xs font-medium ${
                  workflow.status === 'APPROVED' ? 'text-green-400' :
                  workflow.status === 'REJECTED' ? 'text-red-400' :
                  workflow.status === 'IN_REVIEW' ? 'text-amber-400' :
                  'text-slate-400'
                }`}>
                  {workflow.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/models" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          Back to AI Inventory
        </Link>
      </div>
    </div>
  )
}
