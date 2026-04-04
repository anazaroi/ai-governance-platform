import { Prisma } from '@prisma/client'
import { UserRole } from '@/lib/constants'

interface AuditPayloadInput {
  actorId: string
  actorRole: UserRole
  action: string
  entityType: string
  entityId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  ipAddress?: string
  modelId?: string
}

interface AuditPayload {
  actorId: string
  actorRole: string
  action: string
  entityType: string
  entityId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  ipAddress?: string
  modelId?: string
}

/** Builds an audit payload object (does not write to DB — useful for testing). */
export function buildAuditPayload(input: AuditPayloadInput): AuditPayload {
  return {
    actorId: input.actorId,
    actorRole: input.actorRole,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    before: input.before ?? null,
    after: input.after ?? null,
    ipAddress: input.ipAddress,
    modelId: input.modelId,
  }
}

/**
 * Writes an audit event to the database.
 * Call after every state-changing operation.
 * Import db dynamically to avoid Jest issues with Prisma client.
 */
export async function writeAuditEvent(input: AuditPayloadInput): Promise<void> {
  const { db } = await import('@/lib/db')
  const payload = buildAuditPayload(input)
  // Use spread to conditionally include modelId — avoids Prisma union type conflict
  // between checked (relation) and unchecked (scalar FK) input modes
  await db.auditEvent.create({
    data: {
      actorId: payload.actorId,
      actorRole: payload.actorRole,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      before: payload.before !== null ? (payload.before as Prisma.InputJsonValue) : Prisma.DbNull,
      after: payload.after !== null ? (payload.after as Prisma.InputJsonValue) : Prisma.DbNull,
      ipAddress: payload.ipAddress,
      ...(payload.modelId !== undefined && { modelId: payload.modelId }),
    },
  })
}
