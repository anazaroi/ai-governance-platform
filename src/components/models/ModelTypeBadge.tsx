import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ModelType } from '@/lib/constants'

const typeConfig: Record<ModelType, { label: string; className: string }> = {
  LLM: {
    label: 'LLM',
    className: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  },
  ML: {
    label: 'ML',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  RPA: {
    label: 'RPA',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  RULES: {
    label: 'Rules',
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
}

export function ModelTypeBadge({ type }: { type: ModelType }) {
  const config = typeConfig[type]
  return (
    <Badge className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
