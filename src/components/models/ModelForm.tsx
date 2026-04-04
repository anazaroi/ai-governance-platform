'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

import { createModel, updateModel } from '@/lib/actions/model.actions'
import type { CreateModelInput } from '@/lib/actions/model.actions'

const ModelFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['LLM', 'ML', 'RPA', 'RULES']),
  businessUnit: z.string().min(1, 'Business unit is required'),
  owner: z.string().min(1, 'Owner is required'),
  useCaseId: z.string().min(1, 'Use case is required'),
  vendorId: z.string().optional(),
})

interface UseCaseOption {
  id: string
  name: string
  regulatoryCategory: string
}

interface VendorOption {
  id: string
  name: string
}

interface ModelFormProps {
  useCases: UseCaseOption[]
  vendors: VendorOption[]
  defaultValues?: {
    id: string
    name: string
    description?: string | null
    type: 'LLM' | 'ML' | 'RPA' | 'RULES'
    businessUnit: string
    owner: string
    useCaseId: string
    vendorId?: string | null
  }
}

export function ModelForm({ useCases, vendors, defaultValues }: ModelFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!defaultValues

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data: CreateModelInput = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      type: formData.get('type') as 'LLM' | 'ML' | 'RPA' | 'RULES',
      businessUnit: formData.get('businessUnit') as string,
      owner: formData.get('owner') as string,
      useCaseId: formData.get('useCaseId') as string,
      vendorId: (formData.get('vendorId') as string) || undefined,
    }

    const parsed = ModelFormSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateModel({ id: defaultValues!.id, ...data })
        : await createModel(data)

      if ('error' in result) {
        setError(result.error ?? 'An error occurred')
      } else {
        router.push(isEditing ? `/models/${defaultValues!.id}` : '/models')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-200">
          Model Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter model name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-200">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ''}
          className="flex w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe what this model does and its purpose"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-200">
            Model Type *
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={defaultValues?.type ?? ''}
            className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>Select type...</option>
            <option value="LLM">LLM</option>
            <option value="ML">ML</option>
            <option value="RPA">RPA</option>
            <option value="RULES">Rules-based</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="businessUnit" className="text-sm font-medium text-slate-200">
            Business Unit *
          </label>
          <input
            id="businessUnit"
            name="businessUnit"
            type="text"
            required
            defaultValue={defaultValues?.businessUnit ?? ''}
            className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Retail Banking"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="owner" className="text-sm font-medium text-slate-200">
          Model Owner *
        </label>
        <input
          id="owner"
          name="owner"
          type="text"
          required
          defaultValue={defaultValues?.owner ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter model owner name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="useCaseId" className="text-sm font-medium text-slate-200">
          Use Case *
        </label>
        <select
          id="useCaseId"
          name="useCaseId"
          required
          defaultValue={defaultValues?.useCaseId ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>Select use case...</option>
          {useCases.map((uc) => (
            <option key={uc.id} value={uc.id}>
              {uc.name} ({uc.regulatoryCategory})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="vendorId" className="text-sm font-medium text-slate-200">
          Vendor (optional)
        </label>
        <select
          id="vendorId"
          name="vendorId"
          defaultValue={defaultValues?.vendorId ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">No vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Model' : 'Register Model'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(isEditing ? `/models/${defaultValues!.id}` : '/models')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
