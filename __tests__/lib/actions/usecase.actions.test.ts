/** @jest-environment node */

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    useCase: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { createUseCase, updateUseCase, deleteUseCase } from '@/lib/actions/usecase.actions'

const mockAuth = auth as unknown as jest.Mock
const mockCreate = db.useCase.create as jest.Mock
const mockUpdate = db.useCase.update as jest.Mock
const mockDelete = db.useCase.delete as jest.Mock
const mockFindUnique = db.useCase.findUnique as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: 'user_test' })
})

// ── createUseCase ─────────────────────────────────────────────────────────────

describe('createUseCase', () => {
  const validData = {
    name: 'Credit Scoring',
    description: 'Automated credit decisioning',
    regulatoryCategory: 'MAS_TRAT',
  }

  it('creates a use case and revalidates', async () => {
    const mockUseCase = { id: 'uc1', ...validData }
    mockCreate.mockResolvedValueOnce(mockUseCase)

    const result = await createUseCase(validData)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Credit Scoring',
          regulatoryCategory: 'MAS_TRAT',
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/registry/use-cases')
    expect(result).toEqual({ data: mockUseCase })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await createUseCase(validData)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for missing name', async () => {
    const result = await createUseCase({ ...validData, name: '' })

    expect(result).toHaveProperty('error')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for missing regulatoryCategory', async () => {
    const result = await createUseCase({ ...validData, regulatoryCategory: '' })

    expect(result).toHaveProperty('error')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'))

    const result = await createUseCase(validData)

    expect(result).toEqual({ error: 'Failed to save use case' })
  })
})

// ── updateUseCase ─────────────────────────────────────────────────────────────

describe('updateUseCase', () => {
  it('updates a use case and revalidates list and detail', async () => {
    const mockUseCase = { id: 'uc1', name: 'Updated' }
    mockUpdate.mockResolvedValueOnce(mockUseCase)

    const result = await updateUseCase('uc1', {
      name: 'Updated',
      description: null,
      regulatoryCategory: 'MAS_TRAT',
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'uc1' } })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/registry/use-cases')
    expect(revalidatePath).toHaveBeenCalledWith('/registry/use-cases/uc1')
    expect(result).toEqual({ data: mockUseCase })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await updateUseCase('uc1', {
      name: 'Updated',
      description: null,
      regulatoryCategory: 'MAS_TRAT',
    })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns validation error for missing name', async () => {
    const result = await updateUseCase('uc1', {
      name: '',
      description: null,
      regulatoryCategory: 'MAS_TRAT',
    })

    expect(result).toHaveProperty('error')
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

// ── deleteUseCase ─────────────────────────────────────────────────────────────

describe('deleteUseCase', () => {
  it('deletes a use case and revalidates', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'uc1', _count: { models: 0 } })
    mockDelete.mockResolvedValueOnce({ id: 'uc1' })

    const result = await deleteUseCase('uc1')

    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'uc1' } })
    expect(revalidatePath).toHaveBeenCalledWith('/registry/use-cases')
    expect(result).toEqual({ data: { id: 'uc1' } })
  })

  it('returns error when use case has linked models', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'uc1', _count: { models: 3 } })

    const result = await deleteUseCase('uc1')

    expect(result).toHaveProperty('error')
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns error when use case not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await deleteUseCase('uc1')

    expect(result).toEqual({ error: 'Use case not found' })
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await deleteUseCase('uc1')

    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('returns error on database failure', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'uc1', _count: { models: 0 } })
    mockDelete.mockRejectedValueOnce(new Error('DB error'))

    const result = await deleteUseCase('uc1')

    expect(result).toEqual({ error: 'Failed to delete use case' })
  })
})
