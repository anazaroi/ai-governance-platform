/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    vendor: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user_test123' }),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createVendor, updateVendor, deleteVendor } from '@/lib/actions/vendor.actions'

const mockCreate = db.vendor.create as unknown as jest.Mock
const mockUpdate = db.vendor.update as unknown as jest.Mock
const mockDelete = db.vendor.delete as unknown as jest.Mock
const mockFindUnique = db.vendor.findUnique as unknown as jest.Mock
const mockAuth = auth as unknown as jest.Mock
const mockRevalidate = revalidatePath as jest.Mock

describe('createVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('creates a vendor and revalidates path', async () => {
    const input = { name: 'Acme AI', type: 'THIRD_PARTY' as const }
    const created = { id: 'v1', ...input }
    mockCreate.mockResolvedValue(created)

    const result = await createVendor(input)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({ data: input })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await createVendor({ name: 'Acme', type: 'INTERNAL' as const })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await createVendor({ name: '', type: 'INVALID' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('accepts optional fields', async () => {
    const input = {
      name: 'Vendor Corp',
      type: 'THIRD_PARTY' as const,
      country: 'SG',
      contractRef: 'CT-001',
      dueDiligenceStatus: 'COMPLETE',
    }
    const created = { id: 'v2', ...input }
    mockCreate.mockResolvedValue(created)

    const result = await createVendor(input)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({ data: input })
  })
})

describe('updateVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('updates a vendor and revalidates paths', async () => {
    const input = { name: 'Updated Vendor', type: 'INTERNAL' as const }
    const updated = { id: 'v1', ...input }
    mockUpdate.mockResolvedValue(updated)

    const result = await updateVendor('v1', input)

    expect(result).toEqual({ data: updated })
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'v1' }, data: input })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors/v1')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await updateVendor('v1', { name: 'X', type: 'INTERNAL' as const })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await updateVendor('v1', { name: '', type: 'BAD' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('deleteVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
    mockFindUnique.mockResolvedValue({ id: 'v1', _count: { models: 0 } })
  })

  it('deletes a vendor and revalidates path', async () => {
    mockDelete.mockResolvedValue({ id: 'v1' })

    const result = await deleteVendor('v1')

    expect(result).toEqual({ data: { id: 'v1' } })
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'v1' } })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await deleteVendor('v1')

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns error when vendor not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await deleteVendor('v1')

    expect(result).toEqual({ error: 'Vendor not found' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns error when vendor has linked models', async () => {
    mockFindUnique.mockResolvedValue({ id: 'v1', _count: { models: 3 } })

    const result = await deleteVendor('v1')

    expect(result).toEqual({ error: 'Cannot delete vendor with 3 linked model(s). Unlink models first.' })
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
