/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    aIModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getModels, getModelById } from '@/lib/queries/model.queries'

const mockFindMany = db.aIModel.findMany as jest.Mock
const mockFindUnique = db.aIModel.findUnique as jest.Mock

describe('getModels', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all models with no filters', async () => {
    const mockModels = [
      { id: 'm1', name: 'Credit Model', type: 'ML', status: 'ACTIVE' },
    ]
    mockFindMany.mockResolvedValue(mockModels)

    const result = await getModels()

    expect(result).toEqual(mockModels)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      include: {
        useCase: true,
        vendor: true,
        _count: { select: { riskAssessments: true, workflows: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('applies status filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ status: 'ACTIVE' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE' },
      })
    )
  })

  it('applies risk tier filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ tier: 'HIGH' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { currentRiskTier: 'HIGH' },
      })
    )
  })

  it('applies type filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ type: 'LLM' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'LLM' },
      })
    )
  })

  it('applies businessUnit filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ businessUnit: 'Retail Banking' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessUnit: 'Retail Banking' },
      })
    )
  })

  it('applies multiple filters simultaneously', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ status: 'ACTIVE', type: 'ML', businessUnit: 'Risk' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', type: 'ML', businessUnit: 'Risk' },
      })
    )
  })
})

describe('getModelById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns model with all relations', async () => {
    const mockModel = {
      id: 'm1',
      name: 'Credit Model',
      useCase: { id: 'uc1', name: 'Credit Scoring' },
      vendor: { id: 'v1', name: 'Acme AI' },
      modelVersions: [{ id: 'mv1', version: '1.0' }],
      riskAssessments: [{ id: 'ra1', tier: 'HIGH' }],
      workflows: [{ id: 'w1', status: 'PENDING' }],
    }
    mockFindUnique.mockResolvedValue(mockModel)

    const result = await getModelById('m1')

    expect(result).toEqual(mockModel)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: {
        useCase: true,
        vendor: true,
        modelVersions: { orderBy: { createdAt: 'desc' } },
        riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 3 },
        workflows: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
  })

  it('returns null when model not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getModelById('nonexistent')

    expect(result).toBeNull()
  })
})
