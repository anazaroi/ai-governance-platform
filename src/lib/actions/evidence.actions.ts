'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function submitEvidence(formData: {
  modelId: string
  controlId: string
  fileUrl?: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const { modelId, controlId, fileUrl } = formData

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
