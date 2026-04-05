'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const policySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  masReference: z.string().nullable().optional(),
  version: z.string().min(1, 'Version is required'),
  applicableTiers: z.array(z.string()),
})

const controlSchema = z.object({
  policyId: z.string().min(1, 'Policy is required'),
  description: z.string().min(1, 'Description is required'),
  frequency: z.string().nullable().optional(),
  evidenceRequired: z.boolean(),
})

export async function createPolicy(formData: {
  name: string
  category: string
  masReference?: string | null
  version: string
  applicableTiers: string[]
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = policySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, category, masReference, version, applicableTiers } = parsed.data

  try {
    const policy = await db.policy.create({
      data: { name, category, masReference: masReference ?? null, version, applicableTiers },
    })
    revalidatePath('/policies')
    return { data: policy }
  } catch {
    return { error: 'Failed to save policy' as const }
  }
}

export async function updatePolicy(
  id: string,
  formData: {
    name: string
    category: string
    masReference?: string | null
    version: string
    applicableTiers: string[]
  }
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = policySchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, category, masReference, version, applicableTiers } = parsed.data

  try {
    const policy = await db.policy.update({
      where: { id },
      data: { name, category, masReference: masReference ?? null, version, applicableTiers },
    })
    revalidatePath('/policies')
    revalidatePath(`/policies/${id}`)
    return { data: policy }
  } catch {
    return { error: 'Failed to save policy' as const }
  }
}

export async function deletePolicy(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  try {
    const policy = await db.policy.findUnique({
      where: { id },
      include: { _count: { select: { controls: true } } },
    })
    if (!policy) return { error: 'Policy not found' as const }
    if (policy._count.controls > 0) {
      return { error: `Cannot delete policy with ${policy._count.controls} control(s). Delete controls first.` }
    }
    await db.policy.delete({ where: { id } })
    revalidatePath('/policies')
    return { data: { id } }
  } catch {
    return { error: 'Failed to delete policy' as const }
  }
}

export async function createControl(formData: {
  policyId: string
  description: string
  frequency?: string | null
  evidenceRequired: boolean
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = controlSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { policyId, description, frequency, evidenceRequired } = parsed.data

  try {
    const control = await db.control.create({
      data: { policyId, description, frequency: frequency ?? null, evidenceRequired },
    })
    revalidatePath(`/policies/${policyId}`)
    return { data: control }
  } catch {
    return { error: 'Failed to create control' as const }
  }
}

export async function deleteControl(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  try {
    const control = await db.control.findUnique({ where: { id } })
    if (!control) return { error: 'Control not found' as const }
    await db.control.delete({ where: { id } })
    revalidatePath(`/policies/${control.policyId}`)
    revalidatePath('/policies')
    return { data: { id } }
  } catch {
    return { error: 'Failed to delete control' as const }
  }
}
