import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorkflowById } from '@/lib/queries/workflow.queries'
import { WorkflowStatusBadge } from '@/components/workflows/WorkflowStatusBadge'
import { WorkflowTypeBadge } from '@/components/workflows/WorkflowTypeBadge'
import { StepDecisionForm } from '@/components/workflows/StepDecisionForm'

interface WorkflowDetailPageProps {
  params: Promise<{ id: string }>
}

const stepRoleLabel: Record<string, string> = {
  MODEL_RISK_ANALYST: 'Model Risk Analyst',
  APPROVER: 'Approver',
}

export default async function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const { id } = await params
  const workflow = await getWorkflowById(id)

  if (!workflow) notFound()

  const isActive = workflow.status === 'PENDING' || workflow.status === 'IN_REVIEW'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">
              {workflow.model.name}
            </h1>
            <WorkflowTypeBadge type={workflow.type} />
            <WorkflowStatusBadge status={workflow.status} />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Initiated by{' '}
            <span className="font-mono text-xs text-slate-300">{workflow.initiatedBy}</span>
            {' '}on {new Date(workflow.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/models/${workflow.model.id}`}
          className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
        >
          View Model →
        </Link>
      </div>

      {/* Steps Timeline */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Approval Steps</h2>
        <div className="space-y-4">
          {workflow.steps.map((step, idx) => {
            const isCurrentStep = step.id === workflow.currentStepId
            const isCompleted = !!step.decision
            const stepDecision = step.decision

            return (
              <div
                key={step.id}
                className={`rounded-lg border p-4 ${
                  isCurrentStep
                    ? 'border-blue-600 bg-blue-900/20'
                    : isCompleted
                    ? stepDecision === 'APPROVED'
                      ? 'border-green-700/50 bg-green-900/10'
                      : 'border-red-700/50 bg-red-900/10'
                    : 'border-slate-700 bg-slate-800/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                      Step {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-200">
                      {stepRoleLabel[step.assignedTo] ?? step.assignedTo}
                    </span>
                    {isCurrentStep && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  {isCompleted && (
                    <span
                      className={`text-xs font-semibold ${
                        stepDecision === 'APPROVED' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {stepDecision}
                    </span>
                  )}
                </div>
                {step.comments && (
                  <p className="text-sm text-slate-300 italic">&ldquo;{step.comments}&rdquo;</p>
                )}
                {step.decidedAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Decided on {new Date(step.decidedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Decision Form (only when workflow is active) */}
      {isActive && workflow.currentStepId && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h2 className="text-lg font-medium text-slate-100 mb-4">Submit Decision</h2>
          <StepDecisionForm workflowId={workflow.id} />
        </div>
      )}

      {/* Completion info */}
      {workflow.completedAt && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
          <p className="text-sm text-slate-400">
            Completed on {new Date(workflow.completedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      <div>
        <Link href="/workflows" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          ← Back to Workflows
        </Link>
      </div>
    </div>
  )
}
