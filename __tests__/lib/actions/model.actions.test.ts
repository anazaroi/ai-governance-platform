/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    aIModel: {
      create: jest.fn(),
      update: jest.fn(),
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
import { createModel, updateModel, retireModel } from '@/lib/actions/model.actions'

const mockCreate = db.aIModel.create as jest.Mock
const mockUpdate = db.aIModel.update as jest.Mock
const mockAuth = auth as unknown as jest.Mock
const mockRevalidate = revalidatePath as jest.Mock

const validInput = {
  name: 'Credit Scoring Model',
  type: 'ML' as const,
  businessUnit: 'Retail Banking',
  owner: 'Jane Doe',
  useCaseId: 'uc1',
}

describe('createModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('creates a model and revalidates /models', async () => {
    const created = { id: 'm1', ...validInput, vendorId: null }
    mockCreate.mockResolvedValue(created)

    const result = await createModel(validInput)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...validInput, vendorId: null },
    })
    expect(mockRevalidate).toHaveBeenCalledWith('/models')
  })

  it('sets vendorId to null when not provided', async () => {
    mockCreate.mockResolvedValue({ id: 'm1', ...validInput, vendorId: null })

    await createModel(validInput)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: null }),
      })
    )
  })

  it('passes vendorId when provided', async () => {
    const inputWithVendor = { ...validInput, vendorId: 'v1' }
    mockCreate.mockResolvedValue({ id: 'm1', ...inputWithVendor })

    await createModel(inputWithVendor)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: 'v1' }),
      })
    )
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await createModel(validInput)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input -- missing name', async () => {
    const result = await createModel({ ...validInput, name: '' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input -- bad type', async () => {
    const result = await createModel({ ...validInput, type: 'INVALID' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('updateModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('updates a model and revalidates both paths', async () => {
    const input = { id: 'm1', ...validInput }
    const updated = { ...input, vendorId: null }
    mockUpdate.mockResolvedValue(updated)

    const result = await updateModel(input)

    expect(result).toEqual({ data: updated })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { ...validInput, vendorId: null },
    })
    expect(mockRevalidate).toHaveBeenCalledWith('/models')
    expect(mockRevalidate).toHaveBeenCalledWith('/models/m1')
  })

  it('sets vendorId to null when not provided on update', async () => {
    const input = { id: 'm1', ...validInput }
    mockUpdate.mockResolvedValue({ ...input, vendorId: null })

    await updateModel(input)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: null }),
      })
    )
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await updateModel({ id: 'm1', ...validInput })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await updateModel({ id: '', ...validInput })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('retireModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('sets status to RETIRED and updates lastReviewedAt', async () => {
    const retired = { id: 'm1', status: 'RETIRED', lastReviewedAt: new Date() }
    mockUpdate.mockResolvedValue(retired)

    const beforeCall = new Date()
    const result = await retireModel('m1')
    const afterCall = new Date()

    expect(result).toEqual({ data: retired })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {
        status: 'RETIRED',
        lastReviewedAt: expect.any(Date),
      },
    })

    // Verify the date is reasonable (between before and after call)
    const calledData = mockUpdate.mock.calls[0][0].data
    expect(calledData.lastReviewedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(calledData.lastReviewedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime())
  })

  it('revalidates both /models and /models/:id', async () => {
    mockUpdate.mockResolvedValue({ id: 'm1', status: 'RETIRED' })

    await retireModel('m1')

    expect(mockRevalidate).toHaveBeenCalledWith('/models')
    expect(mockRevalidate).toHaveBeenCalledWith('/models/m1')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await retireModel('m1')

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
