/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    vendor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getVendors, getVendorById } from '@/lib/queries/vendor.queries'

const mockFindMany = db.vendor.findMany as jest.Mock
const mockFindUnique = db.vendor.findUnique as jest.Mock

describe('getVendors', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all vendors ordered by name with model count', async () => {
    const mockVendors = [
      { id: 'v1', name: 'Acme AI', type: 'THIRD_PARTY', _count: { models: 3 } },
      { id: 'v2', name: 'Internal ML', type: 'INTERNAL', _count: { models: 1 } },
    ]
    mockFindMany.mockResolvedValue(mockVendors)

    const result = await getVendors()

    expect(result).toEqual(mockVendors)
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: { _count: { select: { models: true } } },
    })
  })

  it('returns empty array when no vendors exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getVendors()

    expect(result).toEqual([])
  })
})

describe('getVendorById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns vendor with linked models', async () => {
    const mockVendor = {
      id: 'v1',
      name: 'Acme AI',
      type: 'THIRD_PARTY',
      country: 'SG',
      contractRef: 'CT-001',
      models: [
        { id: 'm1', name: 'Credit Model', useCase: { id: 'uc1', name: 'Credit Scoring' } },
      ],
    }
    mockFindUnique.mockResolvedValue(mockVendor)

    const result = await getVendorById('v1')

    expect(result).toEqual(mockVendor)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'v1' },
      include: { models: { include: { useCase: true } } },
    })
  })

  it('returns null when vendor not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getVendorById('nonexistent')

    expect(result).toBeNull()
  })
})
