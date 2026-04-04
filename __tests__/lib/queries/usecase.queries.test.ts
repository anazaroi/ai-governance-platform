/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    useCase: {
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getUseCases } from '@/lib/queries/usecase.queries'

const mockFindMany = db.useCase.findMany as jest.Mock

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
