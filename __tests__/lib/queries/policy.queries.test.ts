/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    policy: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getPolicies, getPolicyById } from '@/lib/queries/policy.queries'

const mockFindMany = db.policy.findMany as jest.Mock
const mockFindUnique = db.policy.findUnique as jest.Mock

describe('getPolicies', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all policies ordered by name asc', async () => {
    const mockData = [
      {
        id: 'p1',
        name: 'Data Governance Policy',
        masReference: 'MAS Notice 655',
        category: 'Data',
        version: '1.0',
        applicableTiers: ['HIGH', 'MEDIUM'],
        _count: { controls: 3 },
      },
    ]
    mockFindMany.mockResolvedValueOnce(mockData)

    const result = await getPolicies()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
        select: expect.objectContaining({
          id: true,
          name: true,
        }),
      })
    )
    expect(result).toEqual(mockData)
  })

  it('returns empty array when no policies exist', async () => {
    mockFindMany.mockResolvedValueOnce([])

    const result = await getPolicies()

    expect(result).toEqual([])
  })
})

describe('getPolicyById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns policy with controls and their evidence counts', async () => {
    const mockData = {
      id: 'p1',
      name: 'Data Governance Policy',
      masReference: 'MAS Notice 655',
      category: 'Data',
      version: '1.0',
      applicableTiers: ['HIGH'],
      controls: [
        {
          id: 'c1',
          policyId: 'p1',
          description: 'Annual model validation',
          frequency: 'Annual',
          evidenceRequired: true,
          _count: { evidences: 2 },
        },
      ],
    }
    mockFindUnique.mockResolvedValueOnce(mockData)

    const result = await getPolicyById('p1')

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'p1' },
      include: {
        controls: {
          orderBy: { createdAt: 'asc' },
          include: {
            _count: { select: { evidences: true } },
          },
        },
      },
    })
    expect(result).toEqual(mockData)
  })

  it('returns null for non-existent policy', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await getPolicyById('nonexistent')

    expect(result).toBeNull()
  })
})
