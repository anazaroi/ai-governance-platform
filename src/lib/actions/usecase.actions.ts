'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const useCaseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  regulatoryCategory: z.string().min(1, 'Regulatory category is required'),
})

export type UseCaseInput = z.infer<typeof useCaseSchema>

export async function createUseCase(formData: UseCaseInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = useCaseSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, description, regulatoryCategory } = parsed.data

  try {
    const useCase = await db.useCase.create({
      data: { name, description, regulatoryCategory },
    })
    revalidatePath('/registry/use-cases')
    return { data: useCase }
  } catch {
    return { error: 'Failed to save use case' as const }
  }
}

export async function updateUseCase(
  id: string,
  formData: UseCaseInput
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = useCaseSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, description, regulatoryCategory } = parsed.data

  try {
    const useCase = await db.useCase.update({
      where: { id },
      data: { name, description, regulatoryCategory },
    })
    revalidatePath('/registry/use-cases')
    revalidatePath(`/registry/use-cases/${id}`)
    return { data: useCase }
  } catch {
    return { error: 'Failed to save use case' as const }
  }
}

export async function deleteUseCase(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const useCase = await db.useCase.findUnique({
    where: { id },
    include: { _count: { select: { models: true } } },
  })
  if (!useCase) return { error: 'Use case not found' as const }
  if (useCase._count.models > 0) {
    return {
      error: `Cannot delete use case with ${useCase._count.models} linked model(s). Reassign models first.`,
    }
  }

  try {
    await db.useCase.delete({ where: { id } })
    revalidatePath('/registry/use-cases')
    return { data: { id } }
  } catch {
    return { error: 'Failed to delete use case' as const }
  }
}
