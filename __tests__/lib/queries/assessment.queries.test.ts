/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    riskAssessment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getRiskAssessments, getRiskAssessmentById } from '@/lib/queries/assessment.queries'

const mockFindMany = db.riskAssessment.findMany as jest.Mock
const mockFindUnique = db.riskAssessment.findUnique as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getRiskAssessments', () => {
  it('returns all assessments ordered by assessedAt desc', async () => {
    const mockData = [
      {
        id: 'a1',
        modelId: 'm1',
        tier: 'HIGH',
        assessedBy: 'user_abc',
        assessedAt: new Date('2026-01-01'),
        nextReviewDate: null,
        model: { id: 'm1', name: 'Model A' },
      },
    ]
    mockFindMany.mockResolvedValueOnce(mockData)

    const result = await getRiskAssessments()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { assessedAt: 'desc' } })
    )
    expect(result).toEqual(mockData)
  })

  it('filters by modelId when provided', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await getRiskAssessments({ modelId: 'm1' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ modelId: 'm1' }),
      })
    )
  })

  it('filters by tier when provided', async () => {
    mockFindMany.mockResolvedValueOnce([])

    await getRiskAssessments({ tier: 'HIGH' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tier: 'HIGH' }),
      })
    )
  })
})

describe('getRiskAssessmentById', () => {
  it('returns assessment with model', async () => {
    const mockData = {
      id: 'a1',
      modelId: 'm1',
      tier: 'HIGH',
      scores: { dataSensitivity: 3, customerImpact: 3, modelComplexity: 2, explainability: 2, operationalCriticality: 3 },
      model: { id: 'm1', name: 'Model A', status: 'ACTIVE' },
    }
    mockFindUnique.mockResolvedValueOnce(mockData)

    const result = await getRiskAssessmentById('a1')

    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a1' } })
    )
    expect(result).toEqual(mockData)
  })

  it('returns null for non-existent assessment', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await getRiskAssessmentById('nonexistent')

    expect(result).toBeNull()
  })
})
