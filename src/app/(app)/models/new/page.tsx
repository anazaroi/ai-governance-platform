import { ModelForm } from '@/components/models/ModelForm'
import { getUseCases } from '@/lib/queries/usecase.queries'
import { getVendors } from '@/lib/queries/vendor.queries'

export default async function NewModelPage() {
  const [useCases, vendorsWithCount] = await Promise.all([
    getUseCases(),
    getVendors(),
  ])

  const vendors = vendorsWithCount.map((v) => ({ id: v.id, name: v.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Register New Model</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add a new AI/ML model to the inventory.
        </p>
      </div>

      <ModelForm useCases={useCases} vendors={vendors} />
    </div>
  )
}
