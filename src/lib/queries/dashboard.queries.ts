import { db } from '@/lib/db'
import { RiskTier, WorkflowType, WorkflowStatus } from '@prisma/client'

export type DashboardStats = {
  totalModels: number
  modelsByStatus: Record<string, number>
  modelsByTier: Record<string, number>
  activeWorkflowCount: number
  overdueReviewCount: number
  recentAssessments: {
    id: string
    tier: RiskTier
    assessedAt: Date
    model: { id: string; name: string }
  }[]
  recentWorkflows: {
    id: string
    type: WorkflowType
    status: WorkflowStatus
    createdAt: Date
    model: { id: string; name: string }
  }[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    byStatus,
    byTier,
    activeWorkflowCount,
    overdueReviewCount,
    recentAssessments,
    recentWorkflows,
  ] = await Promise.all([
    db.aIModel.groupBy({ by: ['status'], _count: { _all: true } }),
    db.aIModel.groupBy({ by: ['currentRiskTier'], _count: { _all: true } }),
    db.workflowInstance.count({
      where: { status: { in: ['PENDING', 'IN_REVIEW'] } },
    }),
    db.riskAssessment.count({
      where: { nextReviewDate: { not: null, lte: new Date() } },
    }),
    db.riskAssessment.findMany({
      take: 5,
      orderBy: { assessedAt: 'desc' },
      select: {
        id: true,
        tier: true,
        assessedAt: true,
        model: { select: { id: true, name: true } },
      },
    }),
    db.workflowInstance.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        model: { select: { id: true, name: true } },
      },
    }),
  ])

  const modelsByStatus: Record<string, number> = {}
  for (const row of byStatus) {
    modelsByStatus[row.status] = row._count._all
  }

  const modelsByTier: Record<string, number> = {}
  for (const row of byTier) {
    const key = row.currentRiskTier ?? 'UNASSESSED'
    modelsByTier[key] = row._count._all
  }

  return {
    totalModels: Object.values(modelsByStatus).reduce((a, b) => a + b, 0),
    modelsByStatus,
    modelsByTier,
    activeWorkflowCount,
    overdueReviewCount,
    recentAssessments,
    recentWorkflows,
  }
}
