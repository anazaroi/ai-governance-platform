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

  const vendor = await db.vendor.create({ data: parsed.data })
  revalidatePath('/registry/vendors')
  return { data: vendor }
}

export async function updateVendor(id: string, data: CreateVendorInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = VendorSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const vendor = await db.vendor.update({ where: { id }, data: parsed.data })
  revalidatePath('/registry/vendors')
  revalidatePath(`/registry/vendors/${id}`)
  return { data: vendor }
}

export async function deleteVendor(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  await db.vendor.delete({ where: { id } })
  revalidatePath('/registry/vendors')
  return { data: { id } }
}
