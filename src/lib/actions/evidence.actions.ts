'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

const submitEvidenceSchema = z.object({
  modelId: z.string().min(1, 'Model ID is required'),
  controlId: z.string().min(1, 'Control ID is required'),
  fileUrl: z.string().url('Invalid URL').optional(),
})

export async function submitEvidence(formData: {
  modelId: string
  controlId: string
  fileUrl?: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = submitEvidenceSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { modelId, controlId, fileUrl } = parsed.data

  try {
    const existing = await db.controlEvidence.findFirst({
      where: { modelId, controlId },
    })

    let evidence
    if (existing) {
      evidence = await db.controlEvidence.update({
        where: { id: existing.id },
        data: {
          status: 'SUBMITTED',
          fileUrl: fileUrl ?? null,
          reviewedAt: null,
          reviewedBy: null,
        },
      })
    } else {
      evidence = await db.controlEvidence.create({
        data: {
          modelId,
          controlId,
          status: 'SUBMITTED',
          fileUrl: fileUrl ?? null,
        },
      })
    }

    revalidatePath(`/models/${modelId}/compliance`)
    return { data: evidence }
  } catch {
    return { error: 'Failed to submit evidence' as const }
  }
}

export async function reviewEvidence(
  evidenceId: string,
  decision: 'APPROVED' | 'REJECTED'
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  try {
    const evidence = await db.controlEvidence.findUnique({ where: { id: evidenceId } })
    if (!evidence) return { error: 'Evidence not found' as const }

    const updated = await db.controlEvidence.update({
      where: { id: evidenceId },
      data: { status: decision, reviewedBy: userId, reviewedAt: new Date() },
    })
    revalidatePath(`/models/${evidence.modelId}/compliance`)
    return { data: updated }
  } catch {
    return { error: 'Failed to review evidence' as const }
  }
}
