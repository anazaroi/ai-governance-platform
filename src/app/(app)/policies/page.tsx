import Link from 'next/link'
import { getPolicies } from '@/lib/queries/policy.queries'
import { Button } from '@/components/ui/button'

export default async function PoliciesPage() {
  const policies = await getPolicies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Policy & Control Library</h1>
        <Link href="/policies/new">
          <Button>New Policy</Button>
        </Link>
      </div>

      {policies.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 text-sm">No policies yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Create policies to define controls that models must comply with.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Policy</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">MAS Ref</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Applicable Tiers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/policies/${p.id}`}
                      className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-500">v{p.version}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p.category}</td>
                  <td className="px-4 py-3 text-slate-400">{p.masReference ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.applicableTiers.length === 0 ? (
                        <span className="text-xs text-slate-500">All</span>
                      ) : (
                        p.applicableTiers.map((tier) => (
                          <span
                            key={tier}
                            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              tier === 'HIGH'
                                ? 'bg-red-900/50 text-red-300'
                                : tier === 'MEDIUM'
                                ? 'bg-amber-900/50 text-amber-300'
                                : 'bg-green-900/50 text-green-300'
                            }`}
                          >
                            {tier}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{p._count.controls}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
