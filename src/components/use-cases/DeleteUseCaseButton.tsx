'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteUseCase } from '@/lib/actions/usecase.actions'

interface DeleteUseCaseButtonProps {
  id: string
}

export function DeleteUseCaseButton({ id }: DeleteUseCaseButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Delete this use case? This cannot be undone.')) return
    startTransition(async () => {
      const result = await deleteUseCase(id)
      if ('error' in result) {
        alert(result.error)
      } else {
        router.push('/registry/use-cases')
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="px-3 py-1.5 rounded-md text-xs font-medium border border-red-800 text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
