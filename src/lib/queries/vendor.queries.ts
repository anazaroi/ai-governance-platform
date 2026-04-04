import { db } from '@/lib/db'

export async function getVendors() {
  return db.vendor.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { models: true } } },
  })
}

export async function getVendorById(id: string) {
  return db.vendor.findUnique({
    where: { id },
    include: { models: { include: { useCase: true } } },
  })
}
