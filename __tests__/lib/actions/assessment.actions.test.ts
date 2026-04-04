/** @jest-environment node */

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  db: {
    riskAssessment: {
      create: jest.fn(),
    },
    aIModel: {
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
import { calculateTier, createRiskAssessment } from '@/lib/actions/assessment.actions'

const mockAuth = auth as unknown as jest.Mock
const mockCreate = db.riskAssessment.create as jest.Mock
const mockModelUpdate = db.aIModel.update as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ userId: 'user_test' })
})

// ── calculateTier ─────────────────────────────────────────────────────────────

describe('calculateTier', () => {
  it('returns HIGH when total >= 12', () => {
    expect(calculateTier({ dataSensitivity: 3, customerImpact: 3, modelComplexity: 2, explainability: 2, operationalCriticality: 2 })).toBe('HIGH') // 12
    expect(calculateTier({ dataSensitivity: 3, customerImpact: 3, modelComplexity: 3, explainability: 3, operationalCriticality: 3 })).toBe('HIGH') // 15
  })

  it('returns MEDIUM when total is 9-11', () => {
    expect(calculateTier({ dataSensitivity: 2, customerImpact: 2, modelComplexity: 2, explainability: 2, operationalCriticality: 2 })).toBe('MEDIUM') // 10
    expect(calculateTier({ dataSensitivity: 3, customerImpact: 2, modelComplexity: 2, explainability: 2, operationalCriticality: 2 })).toBe('MEDIUM') // 11
    expect(calculateTier({ dataSensitivity: 2, customerImpact: 2, modelComplexity: 2, explainability: 1, operationalCriticality: 2 })).toBe('MEDIUM') // 9
  })

  it('returns LOW when total <= 8', () => {
    expect(calculateTier({ dataSensitivity: 1, customerImpact: 1, modelComplexity: 1, explainability: 1, operationalCriticality: 1 })).toBe('LOW') // 5
    expect(calculateTier({ dataSensitivity: 2, customerImpact: 2, modelComplexity: 2, explainability: 1, operationalCriticality: 1 })).toBe('LOW') // 8
  })
})

// ── createRiskAssessment ──────────────────────────────────────────────────────

describe('createRiskAssessment', () => {
  const validData = {
    modelId: 'm1',
    scores: {
      dataSensitivity: 3 as const,
      customerImpact: 3 as const,
      modelComplexity: 2 as const,
      explainability: 2 as const,
      operationalCriticality: 2 as const,
    },
    rationale: 'High risk due to sensitive data',
    methodology: 'MAS scoring',
  }

  it('creates assessment and updates model currentRiskTier', async () => {
    const mockAssessment = { id: 'a1', tier: 'HIGH', modelId: 'm1' }
    mockCreate.mockResolvedValueOnce(mockAssessment)
    mockModelUpdate.mockResolvedValueOnce({})

    const result = await createRiskAssessment(validData)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelId: 'm1',
          assessedBy: 'user_test',
          tier: 'HIGH',
        }),
      })
    )
    expect(mockModelUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'm1' },
        data: { currentRiskTier: 'HIGH' },
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/assessments')
    expect(revalidatePath).toHaveBeenCalledWith('/models/m1')
    expect(result).toEqual({ data: mockAssessment })
  })

  it('returns Unauthorized when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null })

    const result = await createRiskAssessment(validData)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns validation error for invalid scores', async () => {
    const result = await createRiskAssessment({
      ...validData,
      scores: { ...validData.scores, dataSensitivity: 5 as unknown as 1 },
    })

    expect(result).toHaveProperty('error')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error on database failure', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'))

    const result = await createRiskAssessment(validData)

    expect(result).toEqual({ error: 'Failed to create assessment' })
  })
})
