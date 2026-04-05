import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const MAS_POLICIES = [
  {
    name: 'Model Risk Management Policy',
    masReference: 'MAS TRM 2021 – 9.1',
    category: 'Model Governance',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM', 'LOW'],
    controls: [
      {
        description: 'Maintain a complete and current inventory of all AI/ML models in production.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
      {
        description: 'Assign a named model owner and business sponsor for each model.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
      {
        description: 'Document the intended use case, business objective, and target population for each model.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
    ],
  },
  {
    name: 'AI Risk Tiering and Classification',
    masReference: 'MAS FEAT Principles 2019 – P1',
    category: 'Risk Assessment',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM', 'LOW'],
    controls: [
      {
        description: 'Classify each AI model into a risk tier (High / Medium / Low) using an approved methodology.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Document rationale for tier assignment, including scoring across all five risk dimensions.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Re-assess tier classification on any material change to the model or its operating environment.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
    ],
  },
  {
    name: 'Third-Party AI Vendor Due Diligence',
    masReference: 'MAS Outsourcing Guidelines 2016 – 6.1',
    category: 'Vendor Risk',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM'],
    controls: [
      {
        description: 'Conduct due diligence on all third-party AI model providers before deployment.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Review vendor contractual terms for data residency, confidentiality, and audit rights.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Maintain an up-to-date register of all third-party AI vendors and their contract expiry dates.',
        frequency: 'ONGOING',
        evidenceRequired: false,
      },
    ],
  },
  {
    name: 'Model Validation and Testing',
    masReference: 'MAS TRM 2021 – 9.3',
    category: 'Model Validation',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM'],
    controls: [
      {
        description: 'Conduct independent model validation before production deployment for High and Medium tier models.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
      {
        description: 'Document model performance benchmarks and acceptable thresholds prior to deployment.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
      {
        description: 'Perform periodic backtesting and benchmarking against defined thresholds.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
    ],
  },
  {
    name: 'Model Explainability and Fairness',
    masReference: 'MAS FEAT Principles 2019 – P2, P3',
    category: 'Fairness & Ethics',
    version: '1.0',
    applicableTiers: ['HIGH'],
    controls: [
      {
        description: 'Document explainability approach: how model decisions can be interpreted and communicated to customers.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
      {
        description: 'Test for discriminatory outcomes against protected customer attributes before deployment.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Maintain human oversight mechanisms for High-tier model decisions affecting customers.',
        frequency: 'ONGOING',
        evidenceRequired: true,
      },
    ],
  },
  {
    name: 'Periodic Model Review',
    masReference: 'MAS TRM 2021 – 9.4',
    category: 'Model Monitoring',
    version: '1.0',
    applicableTiers: ['HIGH', 'MEDIUM', 'LOW'],
    controls: [
      {
        description: 'Perform periodic review of High-tier models at least every 6 months.',
        frequency: 'SEMI_ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Perform periodic review of Medium-tier models at least annually.',
        frequency: 'ANNUAL',
        evidenceRequired: true,
      },
      {
        description: 'Monitor model performance metrics continuously and trigger alert on material degradation.',
        frequency: 'ONGOING',
        evidenceRequired: false,
      },
    ],
  },
]

async function main() {
  console.log('Seeding MAS policy templates...')

  for (const policy of MAS_POLICIES) {
    const { controls, ...policyData } = policy
    const existing = await db.policy.findFirst({ where: { name: policyData.name } })
    if (existing) {
      console.log(`  – ${policyData.name} (already exists, skipping)`)
      continue
    }
    const created = await db.policy.create({
      data: { ...policyData, controls: { create: controls } },
    })
    console.log(`  ✓ ${created.name}`)
  }

  // ── Demo data ──────────────────────────────────────────────────────────────

  const existingVendor = await db.vendor.findFirst({ where: { name: 'OpenAI' } })
  if (existingVendor) {
    console.log('\nDemo data already seeded, skipping.')
    console.log('\nSeed complete.')
    return
  }

  console.log('\nSeeding demo data...')

  // Vendors
  const [openai, aws, internalAI] = await Promise.all([
    db.vendor.create({
      data: {
        name: 'OpenAI',
        type: 'THIRD_PARTY',
        country: 'US',
        contractRef: 'CONTRACT-2023-OAI-001',
        dueDiligenceStatus: 'COMPLETED',
      },
    }),
    db.vendor.create({
      data: {
        name: 'Amazon Web Services',
        type: 'THIRD_PARTY',
        country: 'US',
        contractRef: 'CONTRACT-2022-AWS-007',
        dueDiligenceStatus: 'COMPLETED',
      },
    }),
    db.vendor.create({
      data: {
        name: 'Internal AI Platform',
        type: 'INTERNAL',
        country: 'SG',
        dueDiligenceStatus: 'N/A',
      },
    }),
  ])
  console.log('  ✓ Vendors (3)')

  // Use Cases
  const [creditScoring, fraudDetection, customerService, amlScreening] = await Promise.all([
    db.useCase.create({
      data: {
        name: 'Credit Scoring',
        description: 'Automated credit risk assessment for retail and SME lending decisions.',
        regulatoryCategory: 'MAS_NOTICE_635',
      },
    }),
    db.useCase.create({
      data: {
        name: 'Fraud Detection',
        description: 'Real-time transaction monitoring and fraud pattern identification.',
        regulatoryCategory: 'MAS_NOTICE_626',
      },
    }),
    db.useCase.create({
      data: {
        name: 'Customer Service Automation',
        description: 'AI-assisted customer support via chat, handling enquiries and complaints.',
        regulatoryCategory: 'MAS_FEAT',
      },
    }),
    db.useCase.create({
      data: {
        name: 'AML Screening',
        description: 'Anti-money laundering transaction screening and suspicious activity detection.',
        regulatoryCategory: 'MAS_NOTICE_626',
      },
    }),
  ])
  console.log('  ✓ Use cases (4)')

  // AI Models
  const now = new Date()
  const deployedAt = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // 6 months ago

  const [creditModel, fraudModel, chatbot, amlModel, creditModelV2, rulesEngine] =
    await Promise.all([
      db.aIModel.create({
        data: {
          name: 'RetailCredit v3.1',
          description: 'Gradient boosting model for retail loan credit decisioning. Uses 42 features including bureau data, transaction history, and behavioural signals.',
          type: 'ML',
          status: 'ACTIVE',
          businessUnit: 'Retail Banking',
          owner: 'sarah.tan@bank.sg',
          deployedAt,
          lastReviewedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          currentRiskTier: 'HIGH',
          vendorId: internalAI.id,
          useCaseId: creditScoring.id,
        },
      }),
      db.aIModel.create({
        data: {
          name: 'FraudGuard ML',
          description: 'Real-time fraud detection ensemble using gradient boosting and neural network components. Processes 1.2M transactions daily.',
          type: 'ML',
          status: 'ACTIVE',
          businessUnit: 'Risk & Compliance',
          owner: 'james.lim@bank.sg',
          deployedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
          lastReviewedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          currentRiskTier: 'HIGH',
          vendorId: internalAI.id,
          useCaseId: fraudDetection.id,
        },
      }),
      db.aIModel.create({
        data: {
          name: 'CustomerAssist GPT',
          description: 'OpenAI GPT-4 based customer service assistant for handling tier-1 support queries via the mobile app and internet banking portal.',
          type: 'LLM',
          status: 'ACTIVE',
          businessUnit: 'Digital Banking',
          owner: 'mei.chen@bank.sg',
          deployedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          currentRiskTier: 'MEDIUM',
          vendorId: openai.id,
          useCaseId: customerService.id,
        },
      }),
      db.aIModel.create({
        data: {
          name: 'AML Sentinel',
          description: 'Anti-money laundering transaction monitoring system using graph neural networks to detect suspicious fund flows and layering patterns.',
          type: 'ML',
          status: 'ACTIVE',
          businessUnit: 'Financial Crime',
          owner: 'david.wong@bank.sg',
          deployedAt: new Date(now.getTime() - 540 * 24 * 60 * 60 * 1000),
          lastReviewedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          currentRiskTier: 'HIGH',
          vendorId: aws.id,
          useCaseId: amlScreening.id,
        },
      }),
      db.aIModel.create({
        data: {
          name: 'SMECredit v1.0',
          description: 'SME lending credit model in development. Extends retail credit signals with business financial statement analysis.',
          type: 'ML',
          status: 'DRAFT',
          businessUnit: 'Business Banking',
          owner: 'sarah.tan@bank.sg',
          currentRiskTier: null,
          vendorId: internalAI.id,
          useCaseId: creditScoring.id,
        },
      }),
      db.aIModel.create({
        data: {
          name: 'FX Rules Engine',
          description: 'Rule-based FX transaction routing and limit enforcement system.',
          type: 'RULES',
          status: 'ACTIVE',
          businessUnit: 'Treasury',
          owner: 'peter.ng@bank.sg',
          deployedAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
          lastReviewedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
          currentRiskTier: 'LOW',
          vendorId: internalAI.id,
          useCaseId: fraudDetection.id,
        },
      }),
    ])
  console.log('  ✓ AI models (6)')

  // Model versions
  await Promise.all([
    db.modelVersion.create({ data: { modelId: creditModel.id, version: '3.0', changeLog: 'Added bureau tradeline features. Improved Gini by 4pp.', approvedBy: 'risk-committee@bank.sg', approvedAt: new Date(now.getTime() - 270 * 24 * 60 * 60 * 1000) } }),
    db.modelVersion.create({ data: { modelId: creditModel.id, version: '3.1', changeLog: 'Recalibrated scorecard post-COVID portfolio shift. Updated cut-off thresholds.', approvedBy: 'risk-committee@bank.sg', approvedAt: deployedAt } }),
    db.modelVersion.create({ data: { modelId: fraudModel.id, version: '2.0', changeLog: 'Retrained on 18-month data window. Added device fingerprint features.', approvedBy: 'risk-committee@bank.sg', approvedAt: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } }),
    db.modelVersion.create({ data: { modelId: chatbot.id, version: '1.0', changeLog: 'Initial deployment with product FAQ and account enquiry intents.', approvedBy: 'digital-risk@bank.sg', approvedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } }),
  ])
  console.log('  ✓ Model versions')

  // Risk assessments
  const assessedBy = 'model-risk@bank.sg'

  const [creditAssessment, fraudAssessment, chatbotAssessment, amlAssessment, fxAssessment] =
    await Promise.all([
      db.riskAssessment.create({
        data: {
          modelId: creditModel.id,
          assessedBy,
          assessedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          scores: { dataSensitivity: 3, customerImpact: 3, modelComplexity: 2, explainability: 2, operationalCriticality: 3 },
          tier: 'HIGH',
          rationale: 'High data sensitivity (bureau + income data), direct impact on lending decisions, critical to retail revenue.',
          methodology: 'MAS FEAT 5-dimension scoring',
          nextReviewDate: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000),
        },
      }),
      db.riskAssessment.create({
        data: {
          modelId: fraudModel.id,
          assessedBy,
          assessedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          scores: { dataSensitivity: 3, customerImpact: 3, modelComplexity: 3, explainability: 1, operationalCriticality: 3 },
          tier: 'HIGH',
          rationale: 'Processes all card and digital transactions. False positives directly impact customer experience. Low explainability due to ensemble complexity.',
          methodology: 'MAS FEAT 5-dimension scoring',
          nextReviewDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
        },
      }),
      db.riskAssessment.create({
        data: {
          modelId: chatbot.id,
          assessedBy,
          assessedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          scores: { dataSensitivity: 2, customerImpact: 2, modelComplexity: 2, explainability: 2, operationalCriticality: 2 },
          tier: 'MEDIUM',
          rationale: 'Handles customer PII but limited to tier-1 queries. Human escalation path in place. No financial decisions made autonomously.',
          methodology: 'MAS FEAT 5-dimension scoring',
          nextReviewDate: new Date(now.getTime() + 350 * 24 * 60 * 60 * 1000),
        },
      }),
      db.riskAssessment.create({
        data: {
          modelId: amlModel.id,
          assessedBy,
          assessedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
          scores: { dataSensitivity: 3, customerImpact: 3, modelComplexity: 3, explainability: 2, operationalCriticality: 3 },
          tier: 'HIGH',
          rationale: 'Regulatory requirement under MAS Notice 626. Failures could result in regulatory breach and financial penalties.',
          methodology: 'MAS FEAT 5-dimension scoring',
          nextReviewDate: new Date(now.getTime() + 135 * 24 * 60 * 60 * 1000),
        },
      }),
      db.riskAssessment.create({
        data: {
          modelId: rulesEngine.id,
          assessedBy,
          assessedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
          scores: { dataSensitivity: 1, customerImpact: 2, modelComplexity: 1, explainability: 3, operationalCriticality: 2 },
          tier: 'LOW',
          rationale: 'Deterministic rules-based system. Fully auditable, no customer-facing decisions.',
          methodology: 'MAS FEAT 5-dimension scoring',
          nextReviewDate: new Date(now.getTime() + 245 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

  // Update models with current risk tier (already set above, assessments confirm)
  console.log('  ✓ Risk assessments (5)')

  // Workflows
  const initiatedBy = 'sarah.tan@bank.sg'

  // Completed onboarding for RetailCredit
  const completedOnboarding = await db.workflowInstance.create({
    data: {
      modelId: creditModel.id,
      type: 'ONBOARDING',
      status: 'APPROVED',
      initiatedBy,
      dueDate: new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000),
      completedAt: new Date(deployedAt.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  })
  const step1 = await db.workflowStep.create({ data: { workflowInstanceId: completedOnboarding.id, stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST', decision: 'APPROVED', comments: 'Validation report reviewed. Model performance meets thresholds. GINI 0.68 on holdout sample.', decidedAt: new Date(deployedAt.getTime() - 5 * 24 * 60 * 60 * 1000) } })
  const step2 = await db.workflowStep.create({ data: { workflowInstanceId: completedOnboarding.id, stepOrder: 2, assignedTo: 'APPROVER', decision: 'APPROVED', comments: 'Approved for production deployment. Risk committee sign-off obtained.', decidedAt: new Date(deployedAt.getTime() - 2 * 24 * 60 * 60 * 1000) } })
  console.log('  ✓ Completed onboarding workflow (RetailCredit)')

  // Active periodic review for FraudGuard
  const activeReview = await db.workflowInstance.create({
    data: {
      modelId: fraudModel.id,
      type: 'PERIODIC_REVIEW',
      status: 'IN_REVIEW',
      initiatedBy: 'james.lim@bank.sg',
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    },
  })
  const reviewStep1 = await db.workflowStep.create({ data: { workflowInstanceId: activeReview.id, stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST', decision: 'APPROVED', comments: 'Annual performance review completed. Precision 94.2%, recall 89.1%. Slight drift noted in cross-border transactions — recommend feature update in next version.', decidedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } })
  const reviewStep2 = await db.workflowStep.create({ data: { workflowInstanceId: activeReview.id, stepOrder: 2, assignedTo: 'APPROVER' } })
  await db.workflowInstance.update({ where: { id: activeReview.id }, data: { currentStepId: reviewStep2.id } })
  console.log('  ✓ Active periodic review workflow (FraudGuard)')

  // Pending onboarding for SMECredit (draft model)
  const pendingOnboarding = await db.workflowInstance.create({
    data: {
      modelId: creditModelV2.id,
      type: 'ONBOARDING',
      status: 'PENDING',
      initiatedBy,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  const smcStep1 = await db.workflowStep.create({ data: { workflowInstanceId: pendingOnboarding.id, stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST' } })
  const smcStep2 = await db.workflowStep.create({ data: { workflowInstanceId: pendingOnboarding.id, stepOrder: 2, assignedTo: 'APPROVER' } })
  await db.workflowInstance.update({ where: { id: pendingOnboarding.id }, data: { currentStepId: smcStep1.id } })
  console.log('  ✓ Pending onboarding workflow (SMECredit)')

  // Completed material change for AML Sentinel
  const materialChange = await db.workflowInstance.create({
    data: {
      modelId: amlModel.id,
      type: 'MATERIAL_CHANGE',
      status: 'APPROVED',
      initiatedBy: 'david.wong@bank.sg',
      completedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
    },
  })
  const amlStep1 = await db.workflowStep.create({ data: { workflowInstanceId: materialChange.id, stepOrder: 1, assignedTo: 'MODEL_RISK_ANALYST', decision: 'APPROVED', comments: 'Graph neural network upgrade validated. SAR hit rate improved 12%. No regression on false positive rate.', decidedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000) } })
  const amlStep2 = await db.workflowStep.create({ data: { workflowInstanceId: materialChange.id, stepOrder: 2, assignedTo: 'APPROVER', decision: 'APPROVED', comments: 'Material change approved. MAS notification filed.', decidedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000) } })
  console.log('  ✓ Completed material change workflow (AML Sentinel)')

  console.log('\nSeed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
