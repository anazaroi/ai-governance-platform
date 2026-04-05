import { UseCaseForm } from '@/components/use-cases/UseCaseForm'

export default function NewUseCasePage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">New Use Case</h1>
        <p className="text-sm text-slate-400 mt-1">
          Define a business use case for AI model classification.
        </p>
      </div>
      <UseCaseForm />
    </div>
  )
}
