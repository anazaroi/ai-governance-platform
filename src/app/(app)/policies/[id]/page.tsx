import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPolicyById } from '@/lib/queries/policy.queries'
import { Button } from '@/components/ui/button'
import { deleteControl } from '@/lib/actions/policy.actions'

interface PolicyDetailPageProps {
  params: Promise<{ id: string }>
}

async function handleDeleteControl(controlId: string) {
  'use server'
  await deleteControl(controlId)
}

export default async function PolicyDetailPage({ params }: PolicyDetailPageProps) {
  const { id } = await params
  const policy = await getPolicyById(id)

  if (!policy) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">{policy.name}</h1>
            <span className="text-xs text-slate-500 border border-slate-700 px-2 py-0.5 rounded">
              v{policy.version}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {policy.category}
            {policy.masReference && ` · ${policy.masReference}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/policies/${policy.id}/controls/new`}>
            <Button variant="outline" size="sm">Add Control</Button>
          </Link>
          <Link href={`/policies/${policy.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      {/* Applicable tiers */}
      {policy.applicableTiers.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Applies to:</span>
          {policy.applicableTiers.map((tier) => (
            <span
              key={tier}
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                tier === 'HIGH'
                  ? 'bg-red-900/50 text-red-300'
                  : tier === 'MEDIUM'
                  ? 'bg-amber-900/50 text-amber-300'
                  : 'bg-green-900/50 text-green-300'
              }`}
            >
              {tier}
            </span>
          ))}
        </div>
      )}

      {/* Controls list */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">
          Controls ({policy.controls.length})
        </h2>
        {policy.controls.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No controls yet.</p>
            <Link
              href={`/policies/${policy.id}/controls/new`}
              className="text-xs text-blue-400 hover:underline mt-1 inline-block"
            >
              Add the first control →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {policy.controls.map((control, idx) => (
              <div
                key={control.id}
                className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">
                        Control {idx + 1}
                      </span>
                      {control.frequency && (
                        <span className="text-xs text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                          {control.frequency}
                        </span>
                      )}
                      {control.evidenceRequired && (
                        <span className="text-xs text-amber-400">Evidence required</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-200">{control.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {control._count.evidences} evidence record{control._count.evidences !== 1 ? 's' : ''} submitted
                    </p>
                  </div>
                  <form action={handleDeleteControl.bind(null, control.id)}>
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Link href="/policies" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to Policies
        </Link>
      </div>
    </div>
  )
}
