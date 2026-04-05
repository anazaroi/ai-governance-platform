import { notFound } from 'next/navigation'
import { getUseCaseById } from '@/lib/queries/usecase.queries'
import { UseCaseForm } from '@/components/use-cases/UseCaseForm'

interface EditUseCasePageProps {
  params: Promise<{ id: string }>
}

export default async function EditUseCasePage({ params }: EditUseCasePageProps) {
  const { id } = await params
  const useCase = await getUseCaseById(id)

  if (!useCase) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Edit Use Case</h1>
        <p className="text-sm text-slate-400 mt-1">{useCase.name}</p>
      </div>
      <UseCaseForm
        useCase={{
          id: useCase.id,
          name: useCase.name,
          description: useCase.description,
          regulatoryCategory: useCase.regulatoryCategory,
        }}
      />
    </div>
  )
}
