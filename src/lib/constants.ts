export const UserRole = {
  EXECUTIVE: 'EXECUTIVE',
  MODEL_RISK_ANALYST: 'MODEL_RISK_ANALYST',
  APPROVER: 'APPROVER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  ADMIN: 'ADMIN',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const RiskTier = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const

export type RiskTier = (typeof RiskTier)[keyof typeof RiskTier]

export const ModelStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
} as const

export type ModelStatus = (typeof ModelStatus)[keyof typeof ModelStatus]

export const ModelType = {
  LLM: 'LLM',
  ML: 'ML',
  RPA: 'RPA',
  RULES: 'RULES',
} as const

export type ModelType = (typeof ModelType)[keyof typeof ModelType]

export const WorkflowType = {
  ONBOARDING: 'ONBOARDING',
  MATERIAL_CHANGE: 'MATERIAL_CHANGE',
  PERIODIC_REVIEW: 'PERIODIC_REVIEW',
  RETIREMENT: 'RETIREMENT',
} as const

export type WorkflowType = (typeof WorkflowType)[keyof typeof WorkflowType]

export const WorkflowStatus = {
  PENDING: 'PENDING',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]

// Higher number = more privileged
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.MODEL_RISK_ANALYST]: 1,
  [UserRole.APPROVER]: 2,
  [UserRole.COMPLIANCE_OFFICER]: 3,
  [UserRole.EXECUTIVE]: 4,
  [UserRole.ADMIN]: 5,
}

// Review intervals in months by tier
export const REVIEW_INTERVAL_MONTHS: Record<RiskTier, number> = {
  [RiskTier.HIGH]: 6,
  [RiskTier.MEDIUM]: 12,
  [RiskTier.LOW]: 24,
}

// Navigation links for the sidebar
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/models', label: 'AI Inventory', icon: 'Database' },
  { href: '/registry', label: 'Registry', icon: 'BookOpen' },
  { href: '/assessments', label: 'Risk Tiering', icon: 'ShieldAlert' },
  { href: '/workflows', label: 'Workflows', icon: 'GitBranch' },
  { href: '/policies', label: 'Policies', icon: 'FileText' },
  { href: '/reports', label: 'Reports', icon: 'BarChart3' },
] as const
