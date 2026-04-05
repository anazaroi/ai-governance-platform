/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    aIModel: {
      groupBy: jest.fn(),
    },
    workflowInstance: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    riskAssessment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getDashboardStats } from '@/lib/queries/dashboard.queries'

const mockGroupBy = db.aIModel.groupBy as jest.Mock
const mockWorkflowCount = db.workflowInstance.count as jest.Mock
const mockWorkflowFindMany = db.workflowInstance.findMany as jest.Mock
const mockAssessmentCount = db.riskAssessment.count as jest.Mock
const mockAssessmentFindMany = db.riskAssessment.findMany as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getDashboardStats', () => {
  it('aggregates model counts by status', async () => {
    mockGroupBy
      .mockResolvedValueOnce([
        { status: 'ACTIVE', _count: { _all: 5 } },
        { status: 'DRAFT', _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([])
    mockWorkflowCount.mockResolvedValueOnce(0)
    mockAssessmentCount.mockResolvedValueOnce(0)
    mockAssessmentFindMany.mockResolvedValueOnce([])
    mockWorkflowFindMany.mockResolvedValueOnce([])

    const stats = await getDashboardStats()

    expect(stats.modelsByStatus).toEqual({ ACTIVE: 5, DRAFT: 2 })
    expect(stats.totalModels).toBe(7)
  })

  it('aggregates model counts by risk tier, mapping null to UNASSESSED', async () => {
    mockGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { currentRiskTier: 'HIGH', _count: { _all: 3 } },
        { currentRiskTier: null, _count: { _all: 2 } },
      ])
    mockWorkflowCount.mockResolvedValueOnce(0)
    mockAssessmentCount.mockResolvedValueOnce(0)
    mockAssessmentFindMany.mockResolvedValueOnce([])
    mockWorkflowFindMany.mockResolvedValueOnce([])

    const stats = await getDashboardStats()

    expect(stats.modelsByTier).toEqual({ HIGH: 3, UNASSESSED: 2 })
  })

  it('returns active workflow count', async () => {
    mockGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockWorkflowCount.mockResolvedValueOnce(7)
    mockAssessmentCount.mockResolvedValueOnce(0)
    mockAssessmentFindMany.mockResolvedValueOnce([])
    mockWorkflowFindMany.mockResolvedValueOnce([])

    const stats = await getDashboardStats()

    expect(stats.activeWorkflowCount).toBe(7)
    expect(db.workflowInstance.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ['PENDING', 'IN_REVIEW'] } }),
      })
    )
  })

  it('returns overdue review count', async () => {
    mockGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockWorkflowCount.mockResolvedValueOnce(0)
    mockAssessmentCount.mockResolvedValueOnce(4)
    mockAssessmentFindMany.mockResolvedValueOnce([])
    mockWorkflowFindMany.mockResolvedValueOnce([])

    const stats = await getDashboardStats()

    expect(stats.overdueReviewCount).toBe(4)
    expect(db.riskAssessment.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ nextReviewDate: { not: null, lte: expect.any(Date) } }),
      })
    )
  })

  it('returns recent assessments and workflows', async () => {
    const mockAssessments = [
      { id: 'a1', tier: 'HIGH', assessedAt: new Date(), model: { id: 'm1', name: 'Model A' } },
    ]
    const mockWorkflows = [
      { id: 'w1', type: 'ONBOARDING', status: 'PENDING', createdAt: new Date(), model: { id: 'm1', name: 'Model A' } },
    ]
    mockGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockWorkflowCount.mockResolvedValueOnce(0)
    mockAssessmentCount.mockResolvedValueOnce(0)
    mockAssessmentFindMany.mockResolvedValueOnce(mockAssessments)
    mockWorkflowFindMany.mockResolvedValueOnce(mockWorkflows)

    const stats = await getDashboardStats()

    expect(stats.recentAssessments).toEqual(mockAssessments)
    expect(stats.recentWorkflows).toEqual(mockWorkflows)
    expect(db.riskAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
    expect(db.workflowInstance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    )
  })
})
