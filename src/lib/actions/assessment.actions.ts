'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { REVIEW_INTERVAL_MONTHS } from '@/lib/constants'
import { Prisma } from '@prisma/client'
import { calculateTier, type RiskScores } from '@/lib/utils'

// ── createRiskAssessment ──────────────────────────────────────────────────────

const scoreField = z.union([z.literal(1), z.literal(2), z.literal(3)])

const createSchema = z.object({
  modelId: z.string().min(1, 'Model is required'),
  scores: z.object({
    dataSensitivity: scoreField,
    customerImpact: scoreField,
    modelComplexity: scoreField,
    explainability: scoreField,
    operationalCriticality: scoreField,
  }),
  rationale: z.string().optional(),
  methodology: z.string().optional(),
})

export async function createRiskAssessment(formData: {
  modelId: string
  scores: RiskScores
  rationale?: string
  methodology?: string
}) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = createSchema.safeParse(formData)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { modelId, scores, rationale, methodology } = parsed.data
  const tier = calculateTier(scores as RiskScores)

  const nextReviewDate = new Date()
  nextReviewDate.setMonth(nextReviewDate.getMonth() + REVIEW_INTERVAL_MONTHS[tier])

  try {
    const assessment = await db.riskAssessment.create({
      data: {
        modelId,
        assessedBy: userId,
        scores: scores as unknown as Prisma.InputJsonValue,
        tier,
        rationale: rationale ?? null,
        methodology: methodology ?? null,
        nextReviewDate,
      },
    })

    await db.aIModel.update({
      where: { id: modelId },
      data: { currentRiskTier: tier },
    })

    revalidatePath('/assessments')
    revalidatePath(`/models/${modelId}`)
    return { data: assessment }
  } catch {
    return { error: 'Failed to create assessment' as const }
  }
}
