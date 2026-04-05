import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModelById } from '@/lib/queries/model.queries'
import { getPolicies } from '@/lib/queries/policy.queries'
import { db } from '@/lib/db'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { EvidenceSubmitForm } from '@/components/policies/EvidenceSubmitForm'
import { EvidenceReviewForm } from '@/components/policies/EvidenceReviewForm'

interface CompliancePageProps {
  params: Promise<{ id: string }>
}

const EVIDENCE_STATUS_STYLE: Record<string, string> = {
  PENDING: 'text-slate-500',
  SUBMITTED: 'text-amber-400',
  APPROVED: 'text-green-400',
  REJECTED: 'text-red-400',
}

export default async function ModelCompliancePage({ params }: CompliancePageProps) {
  const { id } = await params
  const [model, allPolicies] = await Promise.all([getModelById(id), getPolicies()])

  if (!model) notFound()

  const applicablePolicies = allPolicies.filter(
    (p) =>
      p.applicableTiers.length === 0 ||
      (model.currentRiskTier && p.applicableTiers.includes(model.currentRiskTier))
  )

  const applicablePolicyIds = applicablePolicies.map((p) => p.id)

  const policiesWithControls = await db.policy.findMany({
    where: { id: { in: applicablePolicyIds } },
    include: {
      controls: { orderBy: { createdAt: 'asc' } },
    },
  })

  const allControlIds = policiesWithControls.flatMap((p) => p.controls.map((c) => c.id))
  const evidenceRecords = await db.controlEvidence.findMany({
    where: { modelId: id, controlId: { in: allControlIds } },
  })
  const evidenceByControlId = new Map(evidenceRecords.map((e) => [e.controlId, e]))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">Compliance</h1>
            {model.currentRiskTier && <RiskTierBadge tier={model.currentRiskTier} />}
          </div>
          <p className="text-sm text-slate-400 mt-1">{model.name}</p>
        </div>
        <Link
          href={`/models/${id}`}
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Model
        </Link>
      </div>

      {!model.currentRiskTier && (
        <div className="rounded-lg border border-amber-700 bg-amber-900/20 px-4 py-3">
          <p className="text-sm text-amber-400">
            This model has no risk tier assigned. Complete a{' '}
            <Link href={`/models/${id}/assess`} className="underline">
              risk assessment
            </Link>{' '}
            to determine applicable policies.
          </p>
        </div>
      )}

      {model.currentRiskTier && policiesWithControls.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 text-sm">No policies apply to this model&apos;s risk tier.</p>
          <Link href="/policies" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
            View all policies →
          </Link>
        </div>
      )}

      {policiesWithControls.map((policy) => (
        <div key={policy.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Link
                href={`/policies/${policy.id}`}
                className="text-base font-medium text-blue-400 hover:underline"
              >
                {policy.name}
              </Link>
              {policy.masReference && (
                <span className="ml-2 text-xs text-slate-500">{policy.masReference}</span>
              )}
            </div>
            <span className="text-xs text-slate-500">{policy.controls.length} control(s)</span>
          </div>

          <div className="space-y-4">
            {policy.controls.map((control, idx) => {
              const evidence = evidenceByControlId.get(control.id)
              const status = evidence?.status ?? 'PENDING'
              return (
                <div
                  key={control.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs text-slate-500">Control {idx + 1}</span>
                      {control.frequency && (
                        <span className="ml-2 text-xs text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                          {control.frequency}
                        </span>
                      )}
                      <p className="text-sm text-slate-200 mt-1">{control.description}</p>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${EVIDENCE_STATUS_STYLE[status]}`}>
                      {status}
                    </span>
                  </div>

                  {evidence?.fileUrl && (
                    <a
                      href={evidence.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline block truncate"
                    >
                      {evidence.fileUrl}
                    </a>
                  )}

                  {control.evidenceRequired && status !== 'APPROVED' && (
                    <EvidenceSubmitForm
                      modelId={id}
                      controlId={control.id}
                      currentFileUrl={evidence?.fileUrl}
                    />
                  )}

                  {status === 'SUBMITTED' && evidence && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-slate-500">Compliance officer review:</span>
                      <EvidenceReviewForm evidenceId={evidence.id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
