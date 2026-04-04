import { notFound } from 'next/navigation'
import { getModelById } from '@/lib/queries/model.queries'
import { RiskAssessmentForm } from '@/components/assessments/RiskAssessmentForm'

interface AssessPageProps {
  params: Promise<{ id: string }>
}

export default async function AssessModelPage({ params }: AssessPageProps) {
  const { id } = await params
  const model = await getModelById(id)

  if (!model) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Risk Assessment</h1>
        <p className="text-sm text-slate-400 mt-1">
          Score this model across 5 MAS-relevant risk dimensions.
        </p>
      </div>
      <RiskAssessmentForm modelId={model.id} modelName={model.name} />
    </div>
  )
}
