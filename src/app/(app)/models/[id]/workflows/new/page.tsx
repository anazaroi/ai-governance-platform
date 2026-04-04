import { notFound } from 'next/navigation'
import { getModelById } from '@/lib/queries/model.queries'
import { InitiateWorkflowForm } from '@/components/workflows/InitiateWorkflowForm'

interface NewWorkflowPageProps {
  params: Promise<{ id: string }>
}

export default async function NewWorkflowPage({ params }: NewWorkflowPageProps) {
  const { id } = await params
  const model = await getModelById(id)

  if (!model) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Initiate Workflow</h1>
        <p className="text-sm text-slate-400 mt-1">
          Start a governance approval workflow for this model.
        </p>
      </div>
      <InitiateWorkflowForm modelId={model.id} modelName={model.name} />
    </div>
  )
}
