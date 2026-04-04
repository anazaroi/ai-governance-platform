'use server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const CreateModelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['LLM', 'ML', 'RPA', 'RULES']),
  businessUnit: z.string().min(1, 'Business unit is required'),
  owner: z.string().min(1, 'Owner is required'),
  useCaseId: z.string().min(1, 'Use case is required'),
  vendorId: z.string().optional(),
})

export type CreateModelInput = z.infer<typeof CreateModelSchema>

const UpdateModelSchema = CreateModelSchema.extend({
  id: z.string().min(1),
})

export type UpdateModelInput = z.infer<typeof UpdateModelSchema>

export async function createModel(data: CreateModelInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = CreateModelSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  try {
    const model = await db.aIModel.create({
      data: {
        ...parsed.data,
        vendorId: parsed.data.vendorId ?? null,
      },
    })
    revalidatePath('/models')
    return { data: model }
  } catch {
    return { error: 'Failed to create model' as const }
  }
}

export async function updateModel(data: UpdateModelInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = UpdateModelSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const { id, ...rest } = parsed.data
  try {
    const model = await db.aIModel.update({
      where: { id },
      data: { ...rest, vendorId: rest.vendorId ?? null },
    })
    revalidatePath('/models')
    revalidatePath(`/models/${id}`)
    return { data: model }
  } catch {
    return { error: 'Failed to update model' as const }
  }
}

export async function retireModel(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  try {
    const model = await db.aIModel.update({
      where: { id },
      data: { status: 'RETIRED', lastReviewedAt: new Date() },
    })
    revalidatePath('/models')
    revalidatePath(`/models/${id}`)
    return { data: model }
  } catch {
    return { error: 'Failed to retire model' as const }
  }
}
