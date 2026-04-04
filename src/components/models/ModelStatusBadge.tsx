import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ModelStatus } from '@/lib/constants'

const statusConfig: Record<ModelStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
  RETIRED: {
    label: 'Retired',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
}

export function ModelStatusBadge({ status }: { status: ModelStatus }) {
  const config = statusConfig[status]
  return (
    <Badge className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
