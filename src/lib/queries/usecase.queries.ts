import { db } from '@/lib/db'

export async function getUseCases() {
  return db.useCase.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, regulatoryCategory: true },
  })
}

export async function getUseCaseById(id: string) {
  return db.useCase.findUnique({
    where: { id },
    include: {
      models: {
        select: { id: true, name: true, type: true, status: true },
        orderBy: { name: 'asc' },
      },
    },
  })
}
