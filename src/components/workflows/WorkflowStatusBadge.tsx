import { Badge } from '@/components/ui/badge'
import { WorkflowStatus } from '@prisma/client'

const variantMap: Record<WorkflowStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  IN_REVIEW: 'default',
  APPROVED: 'outline',
  REJECTED: 'destructive',
}

const labelMap: Record<WorkflowStatus, string> = {
  PENDING: 'Pending',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>
}
