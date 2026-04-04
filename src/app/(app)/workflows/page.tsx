import Link from 'next/link'
import { getWorkflows } from '@/lib/queries/workflow.queries'
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge'
import { WorkflowTypeBadge } from '@/components/workflows/WorkflowTypeBadge'

export default async function WorkflowsPage() {
  const workflows = await getWorkflows()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-100">Approval Workflows</h1>

      {workflows.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 text-sm">No workflows initiated yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Start a workflow from a model&apos;s detail page.
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
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Initiated By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Started
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {workflows.map((w) => (
                <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/workflows/${w.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
                    >
                      {w.model.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <WorkflowTypeBadge type={w.type} />
                  </td>
                  <td className="px-4 py-3">
                    <WorkflowStatusBadge status={w.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {w.initiatedBy.slice(0, 12)}…
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {w.dueDate ? new Date(w.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(w.createdAt).toLocaleDateString()}
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
