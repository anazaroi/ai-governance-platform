import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModelTable } from '@/components/models/ModelTable'
import { getModels } from '@/lib/queries/model.queries'
import type { ModelStatus, ModelType } from '@/lib/constants'

interface ModelsPageProps {
  searchParams: Promise<{
    status?: string
    type?: string
    businessUnit?: string
  }>
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = await searchParams
  const models = await getModels({
    status: params.status as ModelStatus | undefined,
    type: params.type as ModelType | undefined,
    businessUnit: params.businessUnit,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">AI Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register and manage all AI/ML models across the organisation.
          </p>
        </div>
        <Link href="/models/new">
          <Button>Register Model</Button>
        </Link>
      </div>

      <ModelTable models={models} />
    </div>
  )
}
