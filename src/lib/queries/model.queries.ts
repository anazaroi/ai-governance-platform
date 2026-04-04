import { db } from '@/lib/db'
import type { ModelStatus, RiskTier, ModelType } from '@/lib/constants'

export interface ModelFilters {
  status?: ModelStatus
  tier?: RiskTier
  type?: ModelType
  businessUnit?: string
}

export async function getModels(filters: ModelFilters = {}) {
  return db.aIModel.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.tier && { currentRiskTier: filters.tier }),
      ...(filters.type && { type: filters.type }),
      ...(filters.businessUnit && { businessUnit: filters.businessUnit }),
    },
    include: {
      useCase: true,
      vendor: true,
      _count: { select: { riskAssessments: true, workflows: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getModelById(id: string) {
  return db.aIModel.findUnique({
    where: { id },
    include: {
      useCase: true,
      vendor: true,
      modelVersions: { orderBy: { createdAt: 'desc' } },
      riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 3 },
      workflows: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}
