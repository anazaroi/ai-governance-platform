/** @jest-environment node */

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    policy: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    control: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  createPolicy,
  updatePolicy,
  deletePolicy,
  createControl,
  deleteControl,
} from '@/lib/actions/policy.actions'

const mockAuth = auth as unknown as jest.Mock
const mockPolicyCreate = db.policy.create as jest.Mock
const mockPolicyUpdate = db.policy.update as jest.Mock
const mockPolicyDelete = db.policy.delete as jest.Mock
const mockPolicyFindUnique = db.policy.findUnique as jest.Mock
const mockControlCreate = db.control.create as jest.Mock
const mockControlDelete = db.control.delete as jest.Mock
const mockControlFindUnique = db.control.findUnique as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: 'user_test' })
})

describe('createPolicy', () => {
  const validData = {
    name: 'Model Risk Policy',
    category: 'Model Risk',
    masReference: 'MAS Notice 655',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM'] as string[],
  }

  it('creates a policy and revalidates', async () => {
    const mockPolicy = { id: 'p1', ...validData }
    mockPolicyCreate.mockResolvedValueOnce(mockPolicy)

    const result = await createPolicy(validData)

    expect(mockPolicyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Model Risk Policy',
          category: 'Model Risk',
          applicableTiers: ['HIGH', 'MEDIUM'],
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/policies')
    expect(result).toEqual({ data: mockPolicy })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await createPolicy(validData)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockPolicyCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for missing name', async () => {
    const result = await createPolicy({ ...validData, name: '' })

    expect(result).toHaveProperty('error')
    expect(mockPolicyCreate).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    mockPolicyCreate.mockRejectedValueOnce(new Error('DB error'))

    const result = await createPolicy(validData)

    expect(result).toEqual({ error: 'Failed to save policy' })
  })
})

describe('updatePolicy', () => {
  it('updates policy fields and revalidates', async () => {
    const mockPolicy = { id: 'p1', name: 'Updated Policy' }
    mockPolicyUpdate.mockResolvedValueOnce(mockPolicy)

    const result = await updatePolicy('p1', {
      name: 'Updated Policy',
      category: 'Data',
      masReference: null,
      version: '2.0',
      applicableTiers: ['HIGH'],
    })

    expect(mockPolicyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' } })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/policies')
    expect(revalidatePath).toHaveBeenCalledWith('/policies/p1')
    expect(result).toEqual({ data: mockPolicy })
  })
})

describe('deletePolicy', () => {
  it('deletes policy and revalidates', async () => {
    mockPolicyFindUnique.mockResolvedValueOnce({
      id: 'p1',
      _count: { controls: 0 },
    })
    mockPolicyDelete.mockResolvedValueOnce({ id: 'p1' })

    const result = await deletePolicy('p1')

    expect(mockPolicyDelete).toHaveBeenCalledWith({ where: { id: 'p1' } })
    expect(result).toEqual({ data: { id: 'p1' } })
  })

  it('returns error when policy has controls', async () => {
    mockPolicyFindUnique.mockResolvedValueOnce({
      id: 'p1',
      _count: { controls: 3 },
    })

    const result = await deletePolicy('p1')

    expect(result).toHaveProperty('error')
    expect(mockPolicyDelete).not.toHaveBeenCalled()
  })
})

describe('createControl', () => {
  it('creates a control under a policy', async () => {
    const mockControl = { id: 'c1', policyId: 'p1', description: 'Annual validation' }
    mockControlCreate.mockResolvedValueOnce(mockControl)

    const result = await createControl({
      policyId: 'p1',
      description: 'Annual validation',
      frequency: 'Annual',
      evidenceRequired: true,
    })

    expect(mockControlCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          policyId: 'p1',
          description: 'Annual validation',
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/policies/p1')
    expect(result).toEqual({ data: mockControl })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await createControl({
      policyId: 'p1',
      description: 'Test',
      frequency: null,
      evidenceRequired: true,
    })

    expect(result).toEqual({ error: 'Unauthorized' })
  })
})

describe('deleteControl', () => {
  it('deletes control and revalidates policy', async () => {
    mockControlFindUnique.mockResolvedValueOnce({ id: 'c1', policyId: 'p1' })
    mockControlDelete.mockResolvedValueOnce({ id: 'c1' })

    const result = await deleteControl('c1')

    expect(mockControlDelete).toHaveBeenCalledWith({ where: { id: 'c1' } })
    expect(revalidatePath).toHaveBeenCalledWith('/policies/p1')
    expect(revalidatePath).toHaveBeenCalledWith('/policies')
    expect(result).toEqual({ data: { id: 'c1' } })
  })

  it('returns error when control not found', async () => {
    mockControlFindUnique.mockResolvedValueOnce(null)

    const result = await deleteControl('nonexistent')

    expect(result).toEqual({ error: 'Control not found' })
  })
})
