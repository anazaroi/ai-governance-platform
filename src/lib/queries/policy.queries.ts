import { db } from '@/lib/db'

export async function getPolicies() {
  return db.policy.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      masReference: true,
      category: true,
      version: true,
      applicableTiers: true,
      _count: { select: { controls: true } },
    },
  })
}

export async function getPolicyById(id: string) {
  return db.policy.findUnique({
    where: { id },
    include: {
      controls: {
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { evidences: true } },
        },
      },
    },
  })
}
