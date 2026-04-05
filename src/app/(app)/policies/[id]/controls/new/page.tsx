import { notFound } from 'next/navigation'
import { getPolicyById } from '@/lib/queries/policy.queries'
import { ControlForm } from '@/components/policies/ControlForm'

interface NewControlPageProps {
  params: Promise<{ id: string }>
}

export default async function NewControlPage({ params }: NewControlPageProps) {
  const { id } = await params
  const policy = await getPolicyById(id)

  if (!policy) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Add Control</h1>
        <p className="text-sm text-slate-400 mt-1">{policy.name}</p>
      </div>
      <ControlForm policyId={policy.id} />
    </div>
  )
}
