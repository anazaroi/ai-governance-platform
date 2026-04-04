import { Badge } from '@/components/ui/badge'
import { WorkflowType } from '@prisma/client'

const labelMap: Record<WorkflowType, string> = {
  ONBOARDING: 'Onboarding',
  MATERIAL_CHANGE: 'Material Change',
  PERIODIC_REVIEW: 'Periodic Review',
  RETIREMENT: 'Retirement',
}

export function WorkflowTypeBadge({ type }: { type: WorkflowType }) {
  return <Badge variant="outline">{labelMap[type]}</Badge>
}
