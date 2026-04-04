'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

import { createVendor, updateVendor } from '@/lib/actions/vendor.actions'
import type { CreateVendorInput } from '@/lib/actions/vendor.actions'

const VendorFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INTERNAL', 'THIRD_PARTY']),
  country: z.string().optional(),
  contractRef: z.string().optional(),
  dueDiligenceStatus: z.string().optional(),
})

interface VendorFormProps {
  defaultValues?: {
    id: string
    name: string
    type: 'INTERNAL' | 'THIRD_PARTY'
    country?: string | null
    contractRef?: string | null
    dueDiligenceStatus?: string | null
  }
}

export function VendorForm({ defaultValues }: VendorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!defaultValues

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data: CreateVendorInput = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'INTERNAL' | 'THIRD_PARTY',
      country: (formData.get('country') as string) || undefined,
      contractRef: (formData.get('contractRef') as string) || undefined,
      dueDiligenceStatus: (formData.get('dueDiligenceStatus') as string) || undefined,
    }

    const parsed = VendorFormSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message
      setError(firstError ?? 'Invalid input')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateVendor(defaultValues!.id, data)
        : await createVendor(data)

      if ('error' in result && result.error) {
        setError(result.error)
      } else {
        router.push('/registry/vendors')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-200">
          Vendor Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter vendor name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium text-slate-200">
          Vendor Type *
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={defaultValues?.type ?? 'THIRD_PARTY'}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="THIRD_PARTY">Third Party</option>
          <option value="INTERNAL">Internal</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="country" className="text-sm font-medium text-slate-200">
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          defaultValue={defaultValues?.country ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. SG, US, UK"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contractRef" className="text-sm font-medium text-slate-200">
          Contract Reference
        </label>
        <input
          id="contractRef"
          name="contractRef"
          type="text"
          defaultValue={defaultValues?.contractRef ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. CT-2026-001"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="dueDiligenceStatus" className="text-sm font-medium text-slate-200">
          Due Diligence Status
        </label>
        <select
          id="dueDiligenceStatus"
          name="dueDiligenceStatus"
          defaultValue={defaultValues?.dueDiligenceStatus ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Not started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETE">Complete</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/registry/vendors')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
