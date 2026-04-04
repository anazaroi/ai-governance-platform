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

    // Check if already seeded (idempotent by name)
    const existing = await db.policy.findFirst({ where: { name: policyData.name } })
    if (existing) {
      console.log(`  – ${policyData.name} (already exists, skipping)`)
      continue
    }

    const created = await db.policy.create({
      data: {
        ...policyData,
        controls: {
          create: controls,
        },
      },
    })

    console.log(`  ✓ ${created.name}`)
  }

  console.log(`\nSeed complete.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
