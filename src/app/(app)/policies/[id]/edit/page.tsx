import { notFound } from 'next/navigation'
import { getPolicyById } from '@/lib/queries/policy.queries'
import { PolicyForm } from '@/components/policies/PolicyForm'

interface EditPolicyPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPolicyPage({ params }: EditPolicyPageProps) {
  const { id } = await params
  const policy = await getPolicyById(id)

  if (!policy) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Edit Policy</h1>
        <p className="text-sm text-slate-400 mt-1">{policy.name}</p>
      </div>
      <PolicyForm
        policy={{
          id: policy.id,
          name: policy.name,
          category: policy.category,
          masReference: policy.masReference,
          version: policy.version,
          applicableTiers: policy.applicableTiers,
        }}
      />
    </div>
  )
}
