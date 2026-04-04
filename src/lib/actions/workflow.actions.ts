'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { WorkflowStatus } from '@prisma/client'

// ── initiateWorkflow ──────────────────────────────────────────────────────────

const initiateSchema = z.object({
  modelId: z.string().min(1, 'Model is required'),
  type: z.enum(['ONBOARDING', 'MATERIAL_CHANGE', 'PERIODIC_REVIEW', 'RETIREMENT']),
  dueDate: z.string().optional(),
})

export async function initiateWorkflow(formData: {
  modelId: string
  type: 'ONBOARDING' | 'MATERIAL_CHANGE' | 'PERIODIC_REVIEW' | 'RETIREMENT'
  dueDate?: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = initiateSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { modelId, type, dueDate } = parsed.data

  try {
    const workflow = await db.workflowInstance.create({
      data: {
        modelId,
        type,
        initiatedBy: userId,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        steps: {
          create: [
            { stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST' },
            { stepOrder: 2, assignedTo: 'APPROVER' },
          ],
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })

    const updated = await db.workflowInstance.update({
      where: { id: workflow.id },
      data: { currentStepId: workflow.steps[0].id },
    })

    revalidatePath('/workflows')
    revalidatePath(`/models/${modelId}`)
    return { data: updated }
  } catch {
    return { error: 'Failed to initiate workflow' as const }
  }
}

// ── submitStep ────────────────────────────────────────────────────────────────

const submitSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  comments: z.string().optional(),
})

export async function submitStep(
  workflowId: string,
  formData: { decision: 'APPROVED' | 'REJECTED'; comments?: string }
) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = submitSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { decision, comments } = parsed.data

  try {
    const workflow = await db.workflowInstance.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    })
    if (!workflow) return { error: 'Workflow not found' as const }
    if (!workflow.currentStepId) return { error: 'No active step' as const }

    const currentStep = workflow.steps.find((s) => s.id === workflow.currentStepId)
    if (!currentStep) return { error: 'Current step not found' as const }

    await db.workflowStep.update({
      where: { id: currentStep.id },
      data: {
        decision,
        decidedAt: new Date(),
        comments: comments ?? null,
      },
    })

    let newStatus: WorkflowStatus
    let nextStepId: string | null = null
    let completedAt: Date | undefined

    if (decision === 'REJECTED') {
      newStatus = 'REJECTED'
      completedAt = new Date()
    } else {
      const nextStep = workflow.steps.find((s) => s.stepOrder === currentStep.stepOrder + 1)
      if (nextStep) {
        newStatus = 'IN_REVIEW'
        nextStepId = nextStep.id
      } else {
        newStatus = 'APPROVED'
        completedAt = new Date()
      }
    }

    await db.workflowInstance.update({
      where: { id: workflowId },
      data: {
        status: newStatus,
        currentStepId: nextStepId,
        ...(completedAt ? { completedAt } : {}),
      },
    })

    revalidatePath(`/workflows/${workflowId}`)
    revalidatePath('/workflows')
    return { data: { id: workflowId, status: newStatus } }
  } catch {
    return { error: 'Failed to submit step' as const }
  }
}
