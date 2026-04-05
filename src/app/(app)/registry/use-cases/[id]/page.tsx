import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUseCaseById } from '@/lib/queries/usecase.queries'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { DeleteUseCaseButton } from '@/components/use-cases/DeleteUseCaseButton'
import type { ModelStatus, ModelType } from '@/lib/constants'

interface UseCaseDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UseCaseDetailPage({ params }: UseCaseDetailPageProps) {
  const { id } = await params
  const useCase = await getUseCaseById(id)

  if (!useCase) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{useCase.name}</h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">{useCase.regulatoryCategory}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/registry/use-cases/${useCase.id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
          <DeleteUseCaseButton id={useCase.id} />
        </div>
      </div>

      {/* Description */}
      {useCase.description && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
          <p className="text-sm text-slate-300">{useCase.description}</p>
        </div>
      )}

      {/* Linked models */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">
          Linked Models ({useCase.models.length})
        </h2>
        {useCase.models.length === 0 ? (
          <p className="text-sm text-slate-500">No models linked to this use case.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Model</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Type</th>
                <th className="pb-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {useCase.models.map((model) => (
                <tr key={model.id}>
                  <td className="py-2">
                    <Link
                      href={`/models/${model.id}`}
                      className="text-blue-400 hover:underline text-sm"
                    >
                      {model.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    <ModelTypeBadge type={model.type as ModelType} />
                  </td>
                  <td className="py-2">
                    <ModelStatusBadge status={model.status as ModelStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <Link
          href="/registry/use-cases"
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          ← Back to Use Cases
        </Link>
      </div>
    </div>
  )
}
