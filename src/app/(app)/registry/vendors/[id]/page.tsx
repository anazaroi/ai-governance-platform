import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { getVendorById } from '@/lib/queries/vendor.queries'
import type { ModelStatus, ModelType } from '@/lib/constants'

interface VendorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params
  const vendor = await getVendorById(id)

  if (!vendor) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{vendor.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'} Vendor
          </p>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Vendor Information</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Country</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.country ?? '--'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contract Reference</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.contractRef ?? '--'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due Diligence Status</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.dueDiligenceStatus ?? '--'}</dd>
          </div>
        </dl>
      </div>

      {/* Linked Models */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">
          Linked Models ({vendor.models.length})
        </h2>
        {vendor.models.length === 0 ? (
          <p className="text-sm text-slate-500">No models linked to this vendor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Use Case</th>
                </tr>
              </thead>
              <tbody>
                {vendor.models.map((model) => (
                  <tr key={model.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/models/${model.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {model.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ModelTypeBadge type={model.type as ModelType} />
                    </td>
                    <td className="px-4 py-3">
                      <ModelStatusBadge status={model.status as ModelStatus} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{model.useCase.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/registry/vendors" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          Back to Vendors
        </Link>
      </div>
    </div>
  )
}
