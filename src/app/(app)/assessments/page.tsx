import Link from 'next/link'
import { getRiskAssessments } from '@/lib/queries/assessment.queries'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'

export default async function AssessmentsPage() {
  const assessments = await getRiskAssessments()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Risk Assessments</h1>

      {assessments.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 text-sm">No risk assessments completed yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Start an assessment from a model&apos;s detail page.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Assessed By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Assessed At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Next Review
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                    >
                      {a.model.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RiskTierBadge tier={a.tier} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {a.assessedBy.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(a.assessedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {a.nextReviewDate ? new Date(a.nextReviewDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
