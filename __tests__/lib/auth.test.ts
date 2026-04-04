import { hasPermission, canWrite, canApprove, canConfigure } from '@/lib/auth'
import { UserRole } from '@/lib/constants'

describe('hasPermission', () => {
  it('returns true when user role meets minimum required role', () => {
    expect(hasPermission(UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER)).toBe(true)
    expect(hasPermission(UserRole.COMPLIANCE_OFFICER, UserRole.COMPLIANCE_OFFICER)).toBe(true)
  })

  it('returns false when user role is below minimum required role', () => {
    expect(hasPermission(UserRole.MODEL_RISK_ANALYST, UserRole.COMPLIANCE_OFFICER)).toBe(false)
    expect(hasPermission(UserRole.EXECUTIVE, UserRole.ADMIN)).toBe(false)
  })
})

describe('canWrite', () => {
  it('allows MODEL_RISK_ANALYST and above to write', () => {
    expect(canWrite(UserRole.MODEL_RISK_ANALYST)).toBe(true)
    expect(canWrite(UserRole.COMPLIANCE_OFFICER)).toBe(true)
    expect(canWrite(UserRole.ADMIN)).toBe(true)
  })

  it('prevents EXECUTIVE from writing', () => {
    expect(canWrite(UserRole.EXECUTIVE)).toBe(false)
  })
})

describe('canApprove', () => {
  it('allows APPROVER and above to approve', () => {
    expect(canApprove(UserRole.APPROVER)).toBe(true)
    expect(canApprove(UserRole.COMPLIANCE_OFFICER)).toBe(true)
    expect(canApprove(UserRole.ADMIN)).toBe(true)
  })

  it('prevents MODEL_RISK_ANALYST from approving', () => {
    expect(canApprove(UserRole.MODEL_RISK_ANALYST)).toBe(false)
  })
})

describe('canConfigure', () => {
  it('allows only ADMIN to configure', () => {
    expect(canConfigure(UserRole.ADMIN)).toBe(true)
  })

  it('prevents all non-ADMIN roles from configuring', () => {
    expect(canConfigure(UserRole.EXECUTIVE)).toBe(false)
    expect(canConfigure(UserRole.COMPLIANCE_OFFICER)).toBe(false)
    expect(canConfigure(UserRole.MODEL_RISK_ANALYST)).toBe(false)
    expect(canConfigure(UserRole.APPROVER)).toBe(false)
  })
})
