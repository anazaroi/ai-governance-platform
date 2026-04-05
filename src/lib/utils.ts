import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type RiskScores = {
  dataSensitivity: 1 | 2 | 3
  customerImpact: 1 | 2 | 3
  modelComplexity: 1 | 2 | 3
  explainability: 1 | 2 | 3
  operationalCriticality: 1 | 2 | 3
}

export function calculateTier(scores: RiskScores): 'HIGH' | 'MEDIUM' | 'LOW' {
  const total =
    scores.dataSensitivity +
    scores.customerImpact +
    scores.modelComplexity +
    scores.explainability +
    scores.operationalCriticality
  if (total >= 12) return 'HIGH'
  if (total >= 9) return 'MEDIUM'
  return 'LOW'
}
