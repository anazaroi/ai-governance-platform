/** @jest-environment node */

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    workflowInstance: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    workflowStep: {
      update: jest.fn(),
    },
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { initiateWorkflow, submitStep } from '@/lib/actions/workflow.actions'

const mockAuth = auth as unknown as jest.Mock
const mockCreate = db.workflowInstance.create as jest.Mock
const mockUpdate = db.workflowInstance.update as jest.Mock
const mockFindUnique = db.workflowInstance.findUnique as jest.Mock
const mockStepUpdate = db.workflowStep.update as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: 'user_test' })
})

// ── initiateWorkflow ──────────────────────────────────────────────────────────

describe('initiateWorkflow', () => {
  it('creates workflow with two steps and sets currentStepId to first step', async () => {
    const mockWorkflow = {
      id: 'w1',
      steps: [
        { id: 's1', stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST' },
        { id: 's2', stepOrder: 2, assignedTo: 'APPROVER' },
      ],
    }
    const mockUpdated = { id: 'w1', currentStepId: 's1', status: 'PENDING' }
    mockCreate.mockResolvedValueOnce(mockWorkflow)
    mockUpdate.mockResolvedValueOnce(mockUpdated)

    const result = await initiateWorkflow({ modelId: 'm1', type: 'ONBOARDING' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelId: 'm1',
          type: 'ONBOARDING',
          initiatedBy: 'user_test',
          status: 'PENDING',
          steps: {
            create: [
              { stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST' },
              { stepOrder: 2, assignedTo: 'APPROVER' },
            ],
          },
        }),
      })
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'w1' },
        data: { currentStepId: 's1' },
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/workflows')
    expect(revalidatePath).toHaveBeenCalledWith('/models/m1')
    expect(result).toEqual({ data: mockUpdated })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await initiateWorkflow({ modelId: 'm1', type: 'ONBOARDING' })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for missing modelId', async () => {
    const result = await initiateWorkflow({ modelId: '', type: 'ONBOARDING' })

    expect(result).toHaveProperty('error')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'))

    const result = await initiateWorkflow({ modelId: 'm1', type: 'ONBOARDING' })

    expect(result).toEqual({ error: 'Failed to initiate workflow' })
  })
})

// ── submitStep ────────────────────────────────────────────────────────────────

describe('submitStep', () => {
  const makeWorkflow = (currentStepId: string) => ({
    id: 'w1',
    currentStepId,
    steps: [
      { id: 's1', stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST' },
      { id: 's2', stepOrder: 2, assignedTo: 'APPROVER' },
    ],
  })

  it('rejects workflow when decision is REJECTED', async () => {
    mockFindUnique.mockResolvedValueOnce(makeWorkflow('s1'))
    mockStepUpdate.mockResolvedValueOnce({})
    mockUpdate.mockResolvedValueOnce({ id: 'w1', status: 'REJECTED' })

    const result = await submitStep('w1', { decision: 'REJECTED', comments: 'Not ready' })

    expect(mockStepUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ decision: 'REJECTED', comments: 'Not ready' }),
      })
    )
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REJECTED', currentStepId: null }),
      })
    )
    expect(result).toEqual({ data: { id: 'w1', status: 'REJECTED' } })
  })

  it('advances to step 2 (IN_REVIEW) when step 1 is approved', async () => {
    mockFindUnique.mockResolvedValueOnce(makeWorkflow('s1'))
    mockStepUpdate.mockResolvedValueOnce({})
    mockUpdate.mockResolvedValueOnce({ id: 'w1', status: 'IN_REVIEW' })

    const result = await submitStep('w1', { decision: 'APPROVED' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'IN_REVIEW', currentStepId: 's2' }),
      })
    )
    expect(result).toEqual({ data: { id: 'w1', status: 'IN_REVIEW' } })
  })

  it('finalizes as APPROVED when last step is approved', async () => {
    mockFindUnique.mockResolvedValueOnce(makeWorkflow('s2'))
    mockStepUpdate.mockResolvedValueOnce({})
    mockUpdate.mockResolvedValueOnce({ id: 'w1', status: 'APPROVED' })

    const result = await submitStep('w1', { decision: 'APPROVED' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'APPROVED', currentStepId: null }),
      })
    )
    expect(result).toEqual({ data: { id: 'w1', status: 'APPROVED' } })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await submitStep('w1', { decision: 'APPROVED' })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockFindUnique).not.toHaveBeenCalled()
  })

  it('returns error when workflow not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null)

    const result = await submitStep('nonexistent', { decision: 'APPROVED' })

    expect(result).toEqual({ error: 'Workflow not found' })
  })

  it('returns error when no active step', async () => {
    mockFindUnique.mockResolvedValueOnce({ id: 'w1', currentStepId: null, steps: [] })

    const result = await submitStep('w1', { decision: 'APPROVED' })

    expect(result).toEqual({ error: 'No active step' })
  })

  it('returns error on database failure', async () => {
    mockFindUnique.mockRejectedValueOnce(new Error('DB error'))

    const result = await submitStep('w1', { decision: 'APPROVED' })

    expect(result).toEqual({ error: 'Failed to submit step' })
  })
})
