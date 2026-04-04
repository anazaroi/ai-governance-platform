import { db } from '@/lib/db'
import { RiskTier } from '@prisma/client'

export type AssessmentFilters = {
  modelId?: string
  tier?: RiskTier
}

export async function getRiskAssessments(filters: AssessmentFilters = {}) {
  const where: Partial<{ modelId: string; tier: RiskTier }> = {}
  if (filters.modelId) where.modelId = filters.modelId
  if (filters.tier) where.tier = filters.tier

  return db.riskAssessment.findMany({
    where,
    orderBy: { assessedAt: 'desc' },
    select: {
      id: true,
      modelId: true,
      tier: true,
      assessedBy: true,
      assessedAt: true,
      nextReviewDate: true,
      model: { select: { id: true, name: true } },
    },
  })
}

export async function getRiskAssessmentById(id: string) {
  return db.riskAssessment.findUnique({
    where: { id },
    include: {
      model: { select: { id: true, name: true, status: true } },
    },
  })
}
