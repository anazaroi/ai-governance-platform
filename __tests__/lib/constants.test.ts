import { UserRole, RiskTier, ROLE_HIERARCHY } from '@/lib/constants'

describe('UserRole', () => {
  it('defines all five roles', () => {
    expect(UserRole.EXECUTIVE).toBe('EXECUTIVE')
    expect(UserRole.MODEL_RISK_ANALYST).toBe('MODEL_RISK_ANALYST')
    expect(UserRole.APPROVER).toBe('APPROVER')
    expect(UserRole.COMPLIANCE_OFFICER).toBe('COMPLIANCE_OFFICER')
    expect(UserRole.ADMIN).toBe('ADMIN')
  })
})

describe('RiskTier', () => {
  it('defines three tiers', () => {
    expect(RiskTier.HIGH).toBe('HIGH')
    expect(RiskTier.MEDIUM).toBe('MEDIUM')
    expect(RiskTier.LOW).toBe('LOW')
  })
})

describe('ROLE_HIERARCHY', () => {
  it('assigns higher numbers to more privileged roles', () => {
    expect(ROLE_HIERARCHY[UserRole.ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[UserRole.EXECUTIVE])
    expect(ROLE_HIERARCHY[UserRole.COMPLIANCE_OFFICER]).toBeGreaterThan(ROLE_HIERARCHY[UserRole.MODEL_RISK_ANALYST])
  })
})
