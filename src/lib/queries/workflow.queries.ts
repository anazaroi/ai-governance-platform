import { db } from '@/lib/db'
import { WorkflowStatus, WorkflowType } from '@prisma/client'

export type WorkflowFilters = {
  status?: WorkflowStatus
  type?: WorkflowType
  modelId?: string
}

export async function getWorkflows(filters: WorkflowFilters = {}) {
  const where: Partial<{ status: WorkflowStatus; type: WorkflowType; modelId: string }> = {}
  if (filters.status) where.status = filters.status
  if (filters.type) where.type = filters.type
  if (filters.modelId) where.modelId = filters.modelId

  return db.workflowInstance.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      status: true,
      initiatedBy: true,
      dueDate: true,
      completedAt: true,
      createdAt: true,
      model: { select: { id: true, name: true } },
      _count: { select: { steps: true } },
    },
  })
}

export async function getWorkflowById(id: string) {
  return db.workflowInstance.findUnique({
    where: { id },
    include: {
      model: { select: { id: true, name: true, status: true } },
      steps: { orderBy: { stepOrder: 'asc' } },
    },
  })
}
