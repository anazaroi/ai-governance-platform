import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RiskTier } from '@/lib/constants'

const tierConfig: Record<RiskTier, { label: string; className: string }> = {
  HIGH: {
    label: 'High',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  MEDIUM: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  LOW: {
    label: 'Low',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
}

export function RiskTierBadge({ tier }: { tier: RiskTier }) {
  const config = tierConfig[tier]
  return (
    <Badge className={cn(config.className)}>
      {config.label}
    </Badge>
  )
}
