# AI Model Risk Management Platform — Design Spec

**Date:** 2026-04-04
**Status:** Approved for implementation planning
**Author:** Founder + Claude Code

---

## 1. Product Overview

A SaaS platform that governs AI and LLM usage across MAS-licensed financial institutions in Singapore — investment banks, mutual funds, hedge funds, and insurance companies. The platform provides a structured, auditable system for firms to inventory, assess, approve, and monitor their AI models in anticipation of the forthcoming MAS AI governance framework.

**The opportunity:** MAS recently concluded a consultation with major institutions and is expected to release a formal AI governance framework within the next 12 months. Every MAS-licensed financial firm will need to demonstrate compliance. This platform is purpose-built to meet that requirement.

---

## 2. Business Model & Deployment

**Model:** B2B SaaS — annual contracts sold to financial institutions.

**Deployment:** Private tenancy. Each customer receives a fully isolated environment (dedicated compute, dedicated database, dedicated file storage) hosted in AWS ap-southeast-1 (Singapore). No customer data is shared with any other firm's environment. Data never leaves Singapore, satisfying MAS data residency requirements under the Technology Risk Management (TRM) Guidelines.

**Future option:** The data plane architecture is designed to be deployable into a customer's own AWS VPC (bring-your-own-cloud) as a premium enterprise tier, without requiring a platform rewrite.

---

## 3. Target Customers & Buyer Personas

**Target firms:** MAS-licensed investment banks, mutual funds, hedge funds, and insurance companies operating in Singapore.

**Economic buyers:** Chief Risk Officer (CRO) and Chief Operating Officer (COO). These are the budget holders and the people who sign the contract. They need to demonstrate control to MAS examiners and their own boards.

**Day-to-day users:** Model risk analysts, compliance officers, AI/ML engineers registering models, internal audit.

**Sales motion:** Top-down — sell the CRO/COO on the regulatory risk and the board-ready reporting. The platform's CRO Dashboard and MAS Readiness Score are the primary demo hooks.

---

## 4. Phase 1 Scope (MVP)

Six modules ship in Phase 1. They form a complete governance cycle: inventory → assess risk → approve → monitor → report.

| # | Module | Purpose |
|---|--------|---------|
| 1 | System of Record | Authoritative inventory of every AI system in the firm |
| 2 | Model & Vendor Registry | Deeper catalogue — versioning, vendor due diligence, ownership |
| 3 | AI Risk Tiering Engine | Structured assessment → automated High / Medium / Low tier |
| 4 | Approval & Governance Workflow | Review and sign-off flows for model onboarding, changes, retirement |
| 5 | Dashboards & Board Reporting | CRO dashboard, portfolio risk view, one-click board report PDF |
| 6 | Policy & Control Library | MAS-mapped policies, controls, evidence upload, compliance heatmap |

**Phase 2 (post-MVP):** Third-Party AI Vendor Risk Module, Auditor role, periodic review automation engine, customer VPC deployment option.

---

## 5. Architecture

### 5.1 Two-Plane Model

**Control Plane** (shared, operated by you):
- **Clerk** — authentication, SSO, organisation management
- **Stripe** — billing and subscription management
- **Provisioning Service** — Pulumi-based automation that creates new tenant environments
- **Admin Portal** — your internal dashboard for tenant health, billing, support

**Data Plane** (one isolated instance per customer):
- **Next.js App** on AWS ECS Fargate — the customer's application
- **Neon PostgreSQL** (dedicated branch) — the customer's isolated database
- **Inngest** — workflow engine for approval flows and background jobs
- **AWS S3** (dedicated bucket) — evidence vault for model documents and board reports

All data plane resources are provisioned in **AWS ap-southeast-1 (Singapore)**.

### 5.2 Tenant Provisioning Flow

New tenant provisioning is fully automated. Zero manual steps.

1. Customer signs contract → provisioning webhook fires
2. Pulumi creates: ECS service + task definition, Neon DB branch, S3 bucket, Route 53 subdomain (e.g. `acme-bank.platform.com`)
3. Prisma runs migrations on fresh DB and seeds MAS policy templates
4. Clerk creates the customer's organisation and sends an Admin invite to their IT contact
5. Customer accesses their subdomain — fully isolated environment, ready in under 5 minutes

---

## 6. Core Data Model

All entities live within a customer's isolated Neon Postgres database.

### Key Entities

**AIModel** — the central entity. Every other module reads and writes from this.
- `id`, `name`, `description`, `type` (LLM / ML / RPA / Rules), `status` (Draft / Active / Retired)
- `businessUnit`, `owner`, `deployedAt`, `lastReviewedAt`
- `currentRiskTier` — enum (High / Medium / Low), denormalised from the latest RiskAssessment for fast queries
- `vendorId` → FK to Vendor (nullable — internal models have no vendor)
- `useCaseId` → FK to UseCase

**UseCase** — the business purpose a model serves.
- `id`, `name`, `description`, `regulatoryCategory` (Credit / AML / Trading / Customer Service / etc.)

**Vendor** — internal teams or third-party AI providers.
- `id`, `name`, `type` (Internal / Third-party), `country`, `contractRef`, `dueDiligenceStatus`

**RiskAssessment** — time-series record of risk evaluations.
- `id`, `modelId`, `assessedAt`, `assessedBy`, `methodology`
- `scores` (JSONB — score per dimension), `tier` (High / Medium / Low)
- `rationale`, `nextReviewDate`
- One model has many assessments over its lifetime

**WorkflowInstance** — a single approval or review process for a model.
- `id`, `modelId`, `type` (Onboarding / Change / Retirement)
- `status` (Pending / InReview / Approved / Rejected)
- `initiatedBy`, `currentStepId`, `dueDate`, `completedAt`
- Has many **WorkflowStep** records: `stepOrder`, `assignedTo`, `decision`, `decidedAt`, `comments`

**Policy** — a MAS governance requirement, maintained by the platform operator.
- `id`, `name`, `masReference`, `category`, `version`, `applicableTiers` (array)
- Has many **Control** records: `id`, `policyId`, `description`, `frequency`, `evidenceRequired`
- Controls have many **ControlEvidence** records: `modelId`, `controlId`, `fileUrl`, `status`, `reviewedAt`

**AuditEvent** — immutable, append-only log of every state change across all modules.
- `id`, `timestamp`, `actorId`, `actorRole`, `action`, `entityType`, `entityId`
- `before` (JSONB), `after` (JSONB), `ipAddress`
- Never updated or deleted. This is the MAS audit trail.

---

## 7. Module Designs

### 7.1 System of Record

**Purpose:** The authoritative AI inventory. The first thing every new customer populates.

**Key screens:**
- **AI Inventory table** — filterable list of all models with status, risk tier, owner, last review date
- **Register model form** — structured intake: name, type, business unit, use case, vendor, deployment scope
- **Model detail page** — full profile, version history, linked risk assessments, workflow history, evidence files
- **Bulk import** — CSV/Excel upload for firms migrating from spreadsheets (common at go-live)

**Logic:** Registering a model automatically triggers the Risk Tiering Engine to initiate an assessment.

---

### 7.2 Model & Vendor Registry

**Purpose:** Deeper catalogue layer on top of the System of Record — versioning, vendor due diligence, ownership, and dependency mapping.

**Key screens:**
- **Model versions list** — every version with change log and approval record for each
- **Vendor directory** — third-party providers (OpenAI, AWS Bedrock, etc.) and internal teams; contract ref, country, risk status
- **Dependency map** — which business processes depend on which models (impact analysis for decommissioning)
- **Ownership matrix** — model owner, business sponsor, technical owner, periodic reviewer

**Feeds:** Dashboards (vendor concentration exposure, model dependency risk).

---

### 7.3 AI Risk Tiering Engine

**Purpose:** Structured questionnaire-based assessment that produces a weighted score and automated tier (High / Medium / Low). Configurable per firm.

**5 risk dimensions:**
1. **Model Complexity** — black-box vs interpretable, ensemble vs single model
2. **Business Criticality** — revenue impact, operational dependency, customer-facing
3. **Data Sensitivity** — personal data, confidential client data, market-sensitive data
4. **Explainability** — degree to which outputs can be explained to regulators and customers
5. **Regulatory Exposure** — use in regulated decisions (credit, AML, insurance underwriting)

**Key screens:**
- **Assessment questionnaire** — 20–30 questions across the 5 dimensions, scored and weighted
- **Scoring breakdown** — dimension scores, final tier, auto-generated rationale
- **Tiering configuration** — Admin can adjust dimension weights, score thresholds, add custom questions
- **Review scheduler** — auto-triggers reassessment based on tier: High = 6 months, Medium = 12 months, Low = 24 months

---

### 7.4 Approval & Governance Workflow

**Purpose:** Structured review and sign-off flows for model onboarding, material changes, and retirement. Powered by Inngest for reliable state machine execution.

**Workflow types:** Onboarding, Material Change, Periodic Review, Retirement.

**Step sequencing by risk tier:**
- High-tier models: Model Risk Analyst → Compliance Officer → CRO sign-off (3-step minimum)
- Medium-tier models: Model Risk Analyst → Compliance Officer (2-step)
- Low-tier models: Model Risk Analyst sign-off (1-step, lightweight)

**Key screens:**
- **My Tasks inbox** — items awaiting your review or decision, sorted by due date, overdue flagged
- **Workflow templates** — Admin-configurable step sequences per workflow type and risk tier
- **Workflow tracker** — visual step-by-step progress for any model currently in review
- **Decision panel** — approve / reject with mandatory written comments, auto-recorded to AuditEvent

**Four-eyes principle:** The analyst who submits a model for approval cannot be the same person who approves it. Enforced at the API level.

---

### 7.5 Dashboards & Board Reporting

**Purpose:** What the CRO and COO see. The platform's primary sales hook and retention driver.

**Key screens:**
- **CRO Dashboard** — risk tier distribution (donut chart), open workflows by age, overdue periodic reviews, top 5 highest-risk models
- **Portfolio risk view** — models broken down by business unit, vendor concentration, risk trend over 12 months
- **Board report generator** — one-click PDF export formatted for board/BRMC meeting packs: executive summary, AI risk heatmap, open issues, management actions
- **MAS Readiness Score** — a single 0–100% score showing: % of models assessed, % of controls evidenced, % of workflows complete, gaps flagged with remediation actions

**Technology:** Tremor (React chart components), React PDF for board report generation. All charts read directly from the customer's Postgres DB — no separate analytics warehouse needed at Phase 1 scale.

---

### 7.6 Policy & Control Library

**Purpose:** Pre-built MAS-mapped policies and controls, maintained by the platform operator as MAS guidance evolves. This is the platform's primary competitive moat.

**Key screens:**
- **Policy catalogue** — library of MAS AI governance policies, pre-loaded and version-controlled by the operator
- **Model-policy linker** — assign relevant policies to each AI model based on tier and use case (can be auto-suggested)
- **Evidence manager** — upload validation docs, test results, monitoring reports per control; stored in S3
- **Compliance heatmap** — model × control matrix showing Green / Amber / Red status at a glance

**Operator responsibility:** The platform operator (you) maintains and updates the policy templates as MAS releases formal guidance. This content layer is difficult for competitors to replicate and justifies the subscription price.

---

## 8. Access Control (RBAC)

Managed via Clerk organisations (SSO, user provisioning) + a `user_role` enum in the customer's database. Every API route enforces role checks server-side.

| Role | Description |
|------|-------------|
| **Executive** | CRO, COO, CIO — read-only access to all modules, can generate board reports |
| **Model Risk Analyst** | Registers models, runs assessments, uploads evidence, initiates workflows |
| **Approver** | Participates in workflow steps — approve or reject with mandatory comments |
| **Compliance Officer** | Manages policies, links controls, uploads evidence, views audit trail |
| **Admin** | Manages users, configures workflow templates and tiering weights |

**Key constraints enforced at API level:**
- Executives cannot write any data — fully read-only
- Approvers cannot approve their own submissions (four-eyes)
- Only Admin can configure tiering weights and workflow templates
- Only Executives and Compliance Officers can generate board report PDFs
- Only Compliance Officers, Executives, and Admins can view the audit trail

**Phase 2 addition:** Read-only Auditor role for internal audit and MAS examiners.

---

## 9. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14+ (App Router, TypeScript) | Full-stack in one repo, React server components for fast loads |
| UI components | shadcn/ui + Tremor | Professional financial UI out of the box, built-in chart components |
| Data fetching | TanStack Query | Caching, background refresh, optimistic updates |
| Report export | React PDF | Server-side PDF generation for board reports |
| API | Next.js API Routes | Same repo, same language, no separate service |
| ORM | Prisma | Type-safe DB access, migration management |
| Database | Neon (serverless Postgres) | Per-tenant branching, scales to zero, no DB admin |
| Workflow engine | Inngest | Reliable background jobs and multi-step approval workflows without Temporal's complexity |
| Auth | Clerk | Org management, SSO (SAML/OIDC for enterprise banks), MFA |
| Input validation | Zod | Runtime type safety at API boundaries |
| Compute | AWS ECS Fargate | Containerised, no servers to manage, auto-scales |
| File storage | AWS S3 | Evidence vault, one bucket per tenant |
| Email | Resend | Transactional emails (workflow notifications, report delivery) |
| IaC | Pulumi (TypeScript) | Tenant provisioning in the same language as the rest of the codebase |
| CI/CD | GitHub Actions | Build, test, push to ECR, rolling deploy to all tenant ECS services |
| Error tracking | Sentry | Production error monitoring with release tracking |
| Logs | Axiom | Structured log management across all tenant environments |
| Billing | Stripe | Subscription management, usage-based pricing later |
| DNS | AWS Route 53 | Subdomain per tenant (acme-bank.platform.com) |

---

## 10. Infrastructure & Operations

### Tenant Lifecycle

**Provisioning (automated, ~3–5 minutes):**
1. Contract signed → webhook triggers provisioning pipeline
2. Pulumi creates: ECS service, Neon DB branch, S3 bucket, Route 53 subdomain
3. Prisma runs migrations + seeds MAS policy templates on fresh DB
4. Clerk creates customer org, sends Admin invite
5. Customer accesses their subdomain — environment live

**Updates (zero-downtime rolling deploy):**
- GitHub Actions builds Docker image → pushes to ECR
- Pulumi updates ECS task definitions across all tenant services
- Rolling deploy: one tenant at a time
- Prisma migrations run on startup — always backwards-compatible for safe rollbacks

**Deprovisioning:** Pulumi tears down compute resources. S3 data retained for contractual period before deletion.

### Day-to-Day Operations (Solo Founder)

- **Error alerts:** Sentry → Slack notification
- **Infra monitoring:** AWS CloudWatch for ECS health, Neon dashboard for DB
- **Billing:** Stripe dashboard
- **Tenant health:** Admin portal showing all tenant uptime, active users, last login
- **Policy updates:** When MAS releases guidance, update the policy templates in the seed file — next provisioning cycle and existing tenants via a migration

**No servers to patch.** ECS Fargate, Neon, Clerk, Inngest, and Axiom are all fully managed. Operational burden is minimal for a solo founder.

---

## 11. Phase 2 Roadmap

| Feature | Rationale |
|---------|-----------|
| Third-Party AI Vendor Risk Module | Full due diligence workflow for vendors like OpenAI, AWS Bedrock — separate buyer (Procurement/IT) but high value |
| Auditor role | Read-only access for internal audit and MAS examiners — frequently requested by enterprise buyers |
| Periodic review automation engine | Auto-triggers assessments on schedule, sends reminders, escalates overdue items |
| Customer VPC deployment | Same Pulumi stack, deployed into customer's own AWS account — unlocks tier-1 banks who won't accept any external hosting |
| API / integration layer | REST API for customers to push model metadata from their MLOps pipelines (reduces manual data entry) |
| Multi-regulator support | Expand beyond MAS to MAS + HKMA + APRA for regional growth |

---

## 12. Key Design Decisions & Rationale

| Decision | Rationale |
|----------|-----------|
| Private tenancy (not multi-tenant) | Banks will not accept shared environments for AI governance data — kills deals at procurement |
| AWS Singapore | MAS TRM data residency compliance out of the box |
| TypeScript end-to-end | Solo founder — one language across frontend, backend, and IaC reduces cognitive overhead |
| Inngest over Temporal | Temporal operational complexity is too high for a solo founder; Inngest covers all Phase 1 workflow needs |
| Neon over RDS | Per-tenant DB branching is purpose-built for this use case; scales to zero reduces cost for inactive tenants |
| React PDF for board reports | Avoids third-party PDF services with their own data residency questions; generated server-side in the customer's environment |
| Policy library as operator-maintained content | Keeps MAS mapping current as guidance evolves; creates a content moat that competitors cannot quickly replicate |
