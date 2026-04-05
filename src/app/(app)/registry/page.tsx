import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getModels } from '@/lib/queries/model.queries'
import { getVendors } from '@/lib/queries/vendor.queries'
import { getUseCases } from '@/lib/queries/usecase.queries'

export default async function RegistryPage() {
  const [models, vendors, useCases] = await Promise.all([
    getModels(),
    getVendors(),
    getUseCases(),
  ])

  const modelsByType = models.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const modelsByStatus = models.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Model & Vendor Registry</h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of all registered AI models, vendors, and use cases.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Total Models</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">{models.length}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            {Object.entries(modelsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Models by Type</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(modelsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-slate-300">{type}</span>
                <span className="text-slate-100 font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(modelsByType).length === 0 && (
              <p className="text-sm text-slate-500">No models registered</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Total Vendors</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">{vendors.length}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Third Party</span>
              <span className="text-slate-300">
                {vendors.filter((v) => v.type === 'THIRD_PARTY').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Internal</span>
              <span className="text-slate-300">
                {vendors.filter((v) => v.type === 'INTERNAL').length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Use Cases</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">{useCases.length}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <p>
              {useCases.length === 0
                ? 'No use cases defined'
                : `${useCases.length} regulatory categor${useCases.length === 1 ? 'y' : 'ies'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <Link href="/models">
          <Button variant="outline">View All Models</Button>
        </Link>
        <Link href="/models/new">
          <Button>Register Model</Button>
        </Link>
        <Link href="/registry/vendors">
          <Button variant="outline">View All Vendors</Button>
        </Link>
        <Link href="/registry/vendors/new">
          <Button variant="outline">Register Vendor</Button>
        </Link>
        <Link href="/registry/use-cases">
          <Button variant="outline">View All Use Cases</Button>
        </Link>
        <Link href="/registry/use-cases/new">
          <Button variant="outline">New Use Case</Button>
        </Link>
      </div>
    </div>
  )
}
