import { UserRole, ROLE_HIERARCHY } from '@/lib/constants'

/**
 * Returns true if userRole is at least as privileged as requiredRole.
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

/** Executives are read-only. Everyone else can write. */
export function canWrite(role: UserRole): boolean {
  return hasPermission(role, UserRole.MODEL_RISK_ANALYST) && role !== UserRole.EXECUTIVE
}

/** Only APPROVER and above can make approval decisions. */
export function canApprove(role: UserRole): boolean {
  return hasPermission(role, UserRole.APPROVER)
}

/** Only ADMIN can configure tiering weights, workflow templates, and users. */
export function canConfigure(role: UserRole): boolean {
  return role === UserRole.ADMIN
}

// ---- Server-only helpers (Next.js App Router context required) ----
// These are imported dynamically in server components/actions — do not import
// @clerk/nextjs/server or next/navigation at the top level of this file.

/**
 * Get the current user's OrgUser record from the database.
 * Import and call this only in server components or API routes.
 */
export async function getCurrentUser() {
  const { auth } = await import('@clerk/nextjs/server')
  const { redirect } = await import('next/navigation')
  const { db } = await import('@/lib/db')

  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  const user = await db.orgUser.findUnique({ where: { clerkId: userId } })
  return user
}

/**
 * Get current user and enforce minimum role.
 * Import and call this only in server components or API routes.
 */
export async function requireRole(minimumRole: UserRole) {
  const { redirect } = await import('next/navigation')
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  if (!hasPermission(user.role, minimumRole)) {
    throw new Error(`Insufficient role. Required: ${minimumRole}, got: ${user.role}`)
  }

  return user
}
