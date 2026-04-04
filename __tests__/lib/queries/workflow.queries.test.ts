/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    workflowInstance: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getWorkflows, getWorkflowById } from '@/lib/queries/workflow.queries'

const mockFindMany = db.workflowInstance.findMany as jest.Mock
const mockFindUnique = db.workflowInstance.findUnique as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getWorkflows', () => {
  it('returns all workflows ordered by createdAt desc', async () => {
    const mockData = [
      {
        id: 'w1',
        type: 'ONBOARDING',
        status: 'PENDING',
        initiatedBy: 'user_abc',
        dueDate: null,
        completedAt: null,
        createdAt: new Date('2026-01-01'),
        model: { id: 'm1', name: 'Model A' },
        _count: { steps: 2 },
      },
    ]
    mockFindMany.mockResolvedValueOnce(mockData)

    const result = await getWorkflows()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } })
    )
    expect(result).toEqual(mockData)
  })

  it('filters by status when provided', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await getWorkflows({ status: 'PENDING' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING' }),
      })
    )
  })

  it('filters by type when provided', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await getWorkflows({ type: 'ONBOARDING' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'ONBOARDING' }),
      })
    )
  })

  it('filters by modelId when provided', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await getWorkflows({ modelId: 'm1' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ modelId: 'm1' }),
      })
    )
  })
})

describe('getWorkflowById', () => {
  it('returns workflow with steps and model', async () => {
    const mockData = {
      id: 'w1',
      type: 'ONBOARDING',
      status: 'PENDING',
      currentStepId: 's1',
      model: { id: 'm1', name: 'Model A', status: 'ACTIVE' },
      steps: [
        { id: 's1', stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST', decision: null },
        { id: 's2', stepOrder: 2, assignedTo: 'APPROVER', decision: null },
      ],
    }
    mockFindUnique.mockResolvedValueOnce(mockData)

    const result = await getWorkflowById('w1')

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'w1' } })
    )
    expect(result).toEqual(mockData)
  })

  it('returns null for non-existent workflow', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await getWorkflowById('nonexistent')

    expect(result).toBeNull()
  })
})
