import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRiskAssessmentById } from '@/lib/queries/assessment.queries'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'

interface AssessmentDetailPageProps {
  params: Promise<{ id: string }>
}

const DIMENSION_LABELS: Record<string, string> = {
  dataSensitivity: 'Data Sensitivity',
  customerImpact: 'Customer Impact',
  modelComplexity: 'Model Complexity',
  explainability: 'Explainability',
  operationalCriticality: 'Operational Criticality',
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params
  const assessment = await getRiskAssessmentById(id)

  if (!assessment) notFound()

  const scores = assessment.scores as Record<string, number>
  const totalScore = Object.values(scores).reduce((sum, v) => sum + v, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">Risk Assessment</h1>
            <RiskTierBadge tier={assessment.tier} />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            <Link
              href={`/models/${assessment.model.id}`}
              className="text-blue-400 hover:text-blue-300 hover:underline"
            >
              {assessment.model.name}
            </Link>
            {' '}· Assessed on {new Date(assessment.assessedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Score summary */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-100">Score Breakdown</h2>
          <span className="text-sm text-slate-400">
            Total: <span className="font-semibold text-slate-200">{totalScore} / 15</span>
          </span>
        </div>
        <div className="space-y-3">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const score = scores[key] ?? 0
            return (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{label}</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((v) => (
                      <div
                        key={v}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                          v <= score
                            ? score >= 3
                              ? 'bg-red-600 text-white'
                              : score >= 2
                              ? 'bg-amber-600 text-white'
                              : 'bg-green-700 text-white'
                            : 'bg-slate-700 text-slate-500'
                        }`}
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {score} / 3
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Details</h2>
        <dl className="space-y-4">
          {assessment.methodology && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Methodology</dt>
              <dd className="mt-1 text-sm text-slate-200">{assessment.methodology}</dd>
            </div>
          )}
          {assessment.rationale && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Rationale</dt>
              <dd className="mt-1 text-sm text-slate-200">{assessment.rationale}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Assessed By</dt>
            <dd className="mt-1 text-sm font-mono text-slate-200">{assessment.assessedBy}</dd>
          </div>
          {assessment.nextReviewDate && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Next Review Date</dt>
              <dd className="mt-1 text-sm text-slate-200">
                {new Date(assessment.nextReviewDate).toLocaleDateString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div>
        <Link
          href="/assessments"
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Assessments
        </Link>
      </div>
    </div>
  )
}
