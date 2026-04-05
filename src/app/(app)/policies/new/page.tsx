import { PolicyForm } from '@/components/policies/PolicyForm'

export default function NewPolicyPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">New Policy</h1>
        <p className="text-sm text-slate-400 mt-1">
          Create a governance policy with applicable controls.
        </p>
      </div>
      <PolicyForm />
    </div>
  )
}
