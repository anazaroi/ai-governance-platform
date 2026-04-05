import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getUseCases } from '@/lib/queries/usecase.queries'

export default async function UseCasesPage() {
  const useCases = await getUseCases()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Use Cases</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage AI use cases and their regulatory categories.
          </p>
        </div>
        <Link href="/registry/use-cases/new">
          <Button>New Use Case</Button>
        </Link>
      </div>

      {useCases.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 text-sm">No use cases yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Use cases categorise your AI models by business purpose and regulatory scope.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/50">
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Regulatory Category
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {useCases.map((uc) => (
                <tr key={uc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/registry/use-cases/${uc.id}`}
                      className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {uc.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {uc.regulatoryCategory}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <Link
          href="/registry"
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Registry
        </Link>
      </div>
    </div>
  )
}
