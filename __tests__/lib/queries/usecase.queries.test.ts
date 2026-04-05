/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    useCase: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getUseCases, getUseCaseById } from '@/lib/queries/usecase.queries'

const mockFindMany = db.useCase.findMany as jest.Mock
const mockFindUnique = db.useCase.findUnique as jest.Mock

describe('getUseCases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all use cases ordered by name', async () => {
    const mockUseCases = [
      { id: 'uc1', name: 'Credit Scoring', regulatoryCategory: 'MAS_TRAT' },
      { id: 'uc2', name: 'Fraud Detection', regulatoryCategory: 'MAS_TRAT' },
    ]
    mockFindMany.mockResolvedValue(mockUseCases)

    const result = await getUseCases()

    expect(result).toEqual(mockUseCases)
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, regulatoryCategory: true },
    })
  })

  it('returns empty array when no use cases exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getUseCases()

    expect(result).toEqual([])
  })
})

describe('getUseCaseById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns use case with linked models', async () => {
    const mockData = {
      id: 'uc1',
      name: 'Credit Scoring',
      description: 'Automated credit decisioning',
      regulatoryCategory: 'MAS_TRAT',
      createdAt: new Date(),
      updatedAt: new Date(),
      models: [
        {
          id: 'm1',
          name: 'Credit Model v2',
          type: 'ML',
          status: 'ACTIVE',
        },
      ],
    }
    mockFindUnique.mockResolvedValueOnce(mockData)

    const result = await getUseCaseById('uc1')

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'uc1' },
      include: {
        models: {
          select: { id: true, name: true, type: true, status: true },
          orderBy: { name: 'asc' },
        },
      },
    })
    expect(result).toEqual(mockData)
  })

  it('returns null for non-existent use case', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await getUseCaseById('nonexistent')

    expect(result).toBeNull()
  })
})
