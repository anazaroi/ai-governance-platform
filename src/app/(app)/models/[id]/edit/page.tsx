import { notFound } from 'next/navigation'
import { ModelForm } from '@/components/models/ModelForm'
import { getModelById } from '@/lib/queries/model.queries'
import { getUseCases } from '@/lib/queries/usecase.queries'
import { getVendors } from '@/lib/queries/vendor.queries'

interface EditModelPageProps {
  params: Promise<{ id: string }>
}

export default async function EditModelPage({ params }: EditModelPageProps) {
  const { id } = await params
  const [model, useCases, vendorsWithCount] = await Promise.all([
    getModelById(id),
    getUseCases(),
    getVendors(),
  ])

  if (!model) notFound()

  const vendors = vendorsWithCount.map((v) => ({ id: v.id, name: v.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Edit Model</h1>
        <p className="text-sm text-slate-400 mt-1">
          Update details for <span className="text-slate-200">{model.name}</span>.
        </p>
      </div>

      <ModelForm
        useCases={useCases}
        vendors={vendors}
        defaultValues={{
          id: model.id,
          name: model.name,
          description: model.description,
          type: model.type,
          businessUnit: model.businessUnit,
          owner: model.owner,
          useCaseId: model.useCaseId,
          vendorId: model.vendorId,
        }}
      />
    </div>
  )
}
