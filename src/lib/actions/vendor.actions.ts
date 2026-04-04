'use server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INTERNAL', 'THIRD_PARTY']),
  country: z.string().optional(),
  contractRef: z.string().optional(),
  dueDiligenceStatus: z.string().optional(),
})

export type CreateVendorInput = z.infer<typeof VendorSchema>

export async function createVendor(data: CreateVendorInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = VendorSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  try {
    const vendor = await db.vendor.create({ data: parsed.data })
    revalidatePath('/registry/vendors')
    return { data: vendor }
  } catch {
    return { error: 'Failed to create vendor' as const }
  }
}

export async function updateVendor(id: string, data: CreateVendorInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = VendorSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  try {
    const vendor = await db.vendor.update({ where: { id }, data: parsed.data })
    revalidatePath('/registry/vendors')
    revalidatePath(`/registry/vendors/${id}`)
    return { data: vendor }
  } catch {
    return { error: 'Failed to update vendor' as const }
  }
}

export async function deleteVendor(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  // Guard against vendors with linked models
  const vendor = await db.vendor.findUnique({
    where: { id },
    include: { _count: { select: { models: true } } },
  })
  if (!vendor) return { error: 'Vendor not found' as const }
  if (vendor._count.models > 0) {
    return { error: `Cannot delete vendor with ${vendor._count.models} linked model(s). Unlink models first.` as const }
  }

  try {
    await db.vendor.delete({ where: { id } })
    revalidatePath('/registry/vendors')
    return { data: { id } }
  } catch {
    return { error: 'Failed to delete vendor' as const }
  }
}
