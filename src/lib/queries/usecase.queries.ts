import { db } from '@/lib/db'

export async function getUseCases() {
  return db.useCase.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, regulatoryCategory: true },
  })
}
