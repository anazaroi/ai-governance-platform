/** @jest-environment node */

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    controlEvidence: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { submitEvidence, reviewEvidence } from '@/lib/actions/evidence.actions'

const mockAuth = auth as unknown as jest.Mock
const mockFindFirst = db.controlEvidence.findFirst as jest.Mock
const mockCreate = db.controlEvidence.create as jest.Mock
const mockUpdate = db.controlEvidence.update as jest.Mock
const mockFindUnique = db.controlEvidence.findUnique as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: 'user_test' })
})

describe('submitEvidence', () => {
  it('creates evidence record when none exists', async () => {
    const mockEvidence = {
      id: 'e1',
      modelId: 'm1',
      controlId: 'c1',
      status: 'SUBMITTED',
      fileUrl: 'https://example.com/doc.pdf',
    }
    mockFindFirst.mockResolvedValueOnce(null)
    mockCreate.mockResolvedValueOnce(mockEvidence)

    const result = await submitEvidence({
      modelId: 'm1',
      controlId: 'c1',
      fileUrl: 'https://example.com/doc.pdf',
    })

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { modelId: 'm1', controlId: 'c1' },
      })
    )
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelId: 'm1',
          controlId: 'c1',
          status: 'SUBMITTED',
          fileUrl: 'https://example.com/doc.pdf',
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/models/m1/compliance')
    expect(result).toEqual({ data: mockEvidence })
  })

  it('updates evidence record when one already exists', async () => {
    const existing = { id: 'e1', modelId: 'm1', controlId: 'c1', status: 'PENDING' }
    const updated = { ...existing, status: 'SUBMITTED', fileUrl: 'https://example.com/doc.pdf' }
    mockFindFirst.mockResolvedValueOnce(existing)
    mockUpdate.mockResolvedValueOnce(updated)

    const result = await submitEvidence({
      modelId: 'm1',
      controlId: 'c1',
      fileUrl: 'https://example.com/doc.pdf',
    })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({
          status: 'SUBMITTED',
          fileUrl: 'https://example.com/doc.pdf',
        }),
      })
    )
    expect(mockCreate).not.toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/models/m1/compliance')
    expect(result).toEqual({ data: updated })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await submitEvidence({ modelId: 'm1', controlId: 'c1' })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    mockFindFirst.mockRejectedValueOnce(new Error('DB error'))

    const result = await submitEvidence({ modelId: 'm1', controlId: 'c1' })

    expect(result).toEqual({ error: 'Failed to submit evidence' })
  })
})

describe('reviewEvidence', () => {
  it('approves evidence and sets reviewedAt', async () => {
    const mockEvidence = { id: 'e1', modelId: 'm1', status: 'APPROVED' }
    mockFindUnique.mockResolvedValueOnce({ id: 'e1', modelId: 'm1' })
    mockUpdate.mockResolvedValueOnce(mockEvidence)

    const result = await reviewEvidence('e1', 'APPROVED')

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'e1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedBy: 'user_test',
          reviewedAt: expect.any(Date),
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/models/m1/compliance')
    expect(result).toEqual({ data: mockEvidence })
  })

  it('returns error when evidence not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await reviewEvidence('nonexistent', 'APPROVED')

    expect(result).toEqual({ error: 'Evidence not found' })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await reviewEvidence('e1', 'APPROVED')

    expect(result).toEqual({ error: 'Unauthorized' })
  })
})
