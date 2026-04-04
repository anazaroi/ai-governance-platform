import { buildAuditPayload } from '@/lib/audit'
import { UserRole } from '@/lib/constants'

describe('buildAuditPayload', () => {
  it('constructs a valid audit payload from inputs', () => {
    const payload = buildAuditPayload({
      actorId: 'user_123',
      actorRole: UserRole.MODEL_RISK_ANALYST,
      action: 'MODEL_CREATED',
      entityType: 'AIModel',
      entityId: 'model_abc',
      after: { name: 'Credit Scoring Model', status: 'DRAFT' },
    })

    expect(payload.actorId).toBe('user_123')
    expect(payload.actorRole).toBe('MODEL_RISK_ANALYST')
    expect(payload.action).toBe('MODEL_CREATED')
    expect(payload.entityType).toBe('AIModel')
    expect(payload.entityId).toBe('model_abc')
    expect(payload.before).toBeNull()
    expect(payload.after).toEqual({ name: 'Credit Scoring Model', status: 'DRAFT' })
  })

  it('includes before state when provided', () => {
    const payload = buildAuditPayload({
      actorId: 'user_456',
      actorRole: UserRole.ADMIN,
      action: 'MODEL_UPDATED',
      entityType: 'AIModel',
      entityId: 'model_abc',
      before: { status: 'DRAFT' },
      after: { status: 'ACTIVE' },
    })

    expect(payload.before).toEqual({ status: 'DRAFT' })
    expect(payload.after).toEqual({ status: 'ACTIVE' })
  })

  it('captures modelId when provided', () => {
    const payload = buildAuditPayload({
      actorId: 'user_123',
      actorRole: UserRole.MODEL_RISK_ANALYST,
      action: 'RISK_ASSESSMENT_CREATED',
      entityType: 'RiskAssessment',
      entityId: 'assessment_xyz',
      modelId: 'model_abc',
    })

    expect(payload.modelId).toBe('model_abc')
  })
})
