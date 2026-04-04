# System of Record + Model & Vendor Registry

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core AI inventory where financial institutions register and manage all AI/ML models and vendors in production. This is Plan 2 of the AI Model Risk Management SaaS platform.

**Architecture:** Server Components fetch data via query functions (`src/lib/queries/`). State-changing operations use Server Actions (`src/lib/actions/`) with Zod validation and Clerk auth checks. Client Components handle forms and interactive tables. All mutations call `revalidatePath` to keep the UI fresh.

**Tech Stack (established in Plan 1):** Next.js 16.2.2 (App Router), React 19, TypeScript strict, Prisma v5, Clerk v7, shadcn/ui v4 (base-nova, `@base-ui/react`), Tailwind v4 (CSS-based), Zod v4, Jest 30.

**Out of scope:** Risk tiering (Plan 3), approval workflows (Plan 4), dashboard reporting (Plan 5), policy library (Plan 6).

---

## File Map

```
src/
  lib/
    queries/
      usecase.queries.ts         # getUseCases()
      vendor.queries.ts          # getVendors(), getVendorById()
      model.queries.ts           # getModels(filters), getModelById()
    actions/
      vendor.actions.ts          # createVendor, updateVendor, deleteVendor
      model.actions.ts           # createModel, updateModel, retireModel
  components/
    models/
      ModelStatusBadge.tsx       # Colored badge for DRAFT/ACTIVE/RETIRED
      ModelTypeBadge.tsx         # Badge for LLM/ML/RPA/RULES
      RiskTierBadge.tsx          # Badge for HIGH/MEDIUM/LOW
      ModelTable.tsx             # Client component: filterable table of models
      ModelForm.tsx              # Client component: create/edit model form
    vendors/
      VendorForm.tsx             # Client component: create/edit vendor form
      VendorTable.tsx            # Client component: vendor list table
  app/(app)/
    models/
      page.tsx                   # REPLACE placeholder: model list (Server Component)
      new/page.tsx               # New model page
      [id]/page.tsx              # Model detail page
      [id]/edit/page.tsx         # Edit model page
    registry/
      page.tsx                   # REPLACE placeholder: registry overview
      vendors/
        page.tsx                 # Vendor list
        new/page.tsx             # New vendor page
        [id]/page.tsx            # Vendor detail
__tests__/
  lib/
    queries/
      usecase.queries.test.ts
      model.queries.test.ts
      vendor.queries.test.ts
    actions/
      model.actions.test.ts
      vendor.actions.test.ts
```

---

## Codebase Reminders

- **Prisma accessors:** `db.aIModel`, `db.useCase`, `db.vendor`, `db.modelVersion`
- **Nullable FKs:** Set to `null` (not `undefined`) in Prisma mutations
- **searchParams:** Is a `Promise<{...}>` in Next.js 16 page components -- must be `await`ed
- **Auth:** `const { userId } = await auth()` from `@clerk/nextjs/server`
- **revalidatePath:** Import from `next/cache`
- **Jest:** `node node_modules/.bin/jest --testPathPatterns <pattern> --forceExit`
- **Typecheck:** `node node_modules/.bin/tsc --noEmit`
- **npm install:** Always use `--registry https://registry.npmjs.org`
- **Test env:** `/** @jest-environment node */` at top of tests using Next.js server utilities
- **shadcn/ui v4:** Uses `@base-ui/react` primitives, not Radix. Badge uses `useRender` pattern.
- **Existing UI components:** `button`, `badge`, `avatar`, `dropdown-menu`, `separator`, `tooltip`

---

## Task 1: Install shadcn UI Components + Form Dependencies

**Files:** None created manually -- shadcn CLI generates into `src/components/ui/`.

- [ ] **Step 1.1: Add shadcn components needed for tables, forms, and dialogs**

```bash
npx shadcn@latest add table input select form label textarea card alert-dialog
```

> If any component prompts for overwrite (e.g. `badge`), skip it -- it is already installed.

- [ ] **Step 1.2: Install react-hook-form and its zod resolver**

```bash
npm install --registry https://registry.npmjs.org react-hook-form @hookform/resolvers
```

- [ ] **Step 1.3: Run typecheck to verify nothing is broken**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 1.4: Commit**

```bash
git add -A
git commit -m "chore: add shadcn table/form/card components and react-hook-form"
```

---

## Task 2: UseCase Queries (TDD)

**Files:**
- Create: `__tests__/lib/queries/usecase.queries.test.ts`
- Create: `src/lib/queries/usecase.queries.ts`

- [ ] **Step 2.1: Write the test**

Create `__tests__/lib/queries/usecase.queries.test.ts`:

```typescript
/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    useCase: {
      findMany: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getUseCases } from '@/lib/queries/usecase.queries'

const mockFindMany = db.useCase.findMany as jest.Mock

describe('getUseCases', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all use cases ordered by name', async () => {
    const mockUseCases = [
      { id: 'uc1', name: 'Credit Scoring', regulatoryCategory: 'MAS_TRAT' },
      { id: 'uc2', name: 'Fraud Detection', regulatoryCategory: 'MAS_TRAT' },
    ]
    mockFindMany.mockResolvedValue(mockUseCases)

    const result = await getUseCases()

    expect(result).toEqual(mockUseCases)
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, regulatoryCategory: true },
    })
  })

  it('returns empty array when no use cases exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getUseCases()

    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2.2: Run the test (should fail -- module not found)**

```bash
node node_modules/.bin/jest --testPathPatterns usecase.queries.test --forceExit
```

Expect: FAIL (cannot find module `@/lib/queries/usecase.queries`).

- [ ] **Step 2.3: Implement the query**

Create `src/lib/queries/usecase.queries.ts`:

```typescript
import { db } from '@/lib/db'

export async function getUseCases() {
  return db.useCase.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, regulatoryCategory: true },
  })
}
```

- [ ] **Step 2.4: Run the test (should pass)**

```bash
node node_modules/.bin/jest --testPathPatterns usecase.queries.test --forceExit
```

Expect: PASS.

- [ ] **Step 2.5: Commit**

```bash
git add src/lib/queries/usecase.queries.ts __tests__/lib/queries/usecase.queries.test.ts
git commit -m "feat: add UseCase query with tests"
```

---

## Task 3: Vendor Queries (TDD)

**Files:**
- Create: `__tests__/lib/queries/vendor.queries.test.ts`
- Create: `src/lib/queries/vendor.queries.ts`

- [ ] **Step 3.1: Write the test**

Create `__tests__/lib/queries/vendor.queries.test.ts`:

```typescript
/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    vendor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getVendors, getVendorById } from '@/lib/queries/vendor.queries'

const mockFindMany = db.vendor.findMany as jest.Mock
const mockFindUnique = db.vendor.findUnique as jest.Mock

describe('getVendors', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all vendors ordered by name with model count', async () => {
    const mockVendors = [
      { id: 'v1', name: 'Acme AI', type: 'THIRD_PARTY', _count: { models: 3 } },
      { id: 'v2', name: 'Internal ML', type: 'INTERNAL', _count: { models: 1 } },
    ]
    mockFindMany.mockResolvedValue(mockVendors)

    const result = await getVendors()

    expect(result).toEqual(mockVendors)
    expect(mockFindMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: { _count: { select: { models: true } } },
    })
  })

  it('returns empty array when no vendors exist', async () => {
    mockFindMany.mockResolvedValue([])

    const result = await getVendors()

    expect(result).toEqual([])
  })
})

describe('getVendorById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns vendor with linked models', async () => {
    const mockVendor = {
      id: 'v1',
      name: 'Acme AI',
      type: 'THIRD_PARTY',
      country: 'SG',
      contractRef: 'CT-001',
      models: [
        { id: 'm1', name: 'Credit Model', useCase: { id: 'uc1', name: 'Credit Scoring' } },
      ],
    }
    mockFindUnique.mockResolvedValue(mockVendor)

    const result = await getVendorById('v1')

    expect(result).toEqual(mockVendor)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'v1' },
      include: { models: { include: { useCase: true } } },
    })
  })

  it('returns null when vendor not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getVendorById('nonexistent')

    expect(result).toBeNull()
  })
})
```

- [ ] **Step 3.2: Run the test (should fail -- module not found)**

```bash
node node_modules/.bin/jest --testPathPatterns vendor.queries.test --forceExit
```

Expect: FAIL.

- [ ] **Step 3.3: Implement the queries**

Create `src/lib/queries/vendor.queries.ts`:

```typescript
import { db } from '@/lib/db'

export async function getVendors() {
  return db.vendor.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { models: true } } },
  })
}

export async function getVendorById(id: string) {
  return db.vendor.findUnique({
    where: { id },
    include: { models: { include: { useCase: true } } },
  })
}
```

- [ ] **Step 3.4: Run the test (should pass)**

```bash
node node_modules/.bin/jest --testPathPatterns vendor.queries.test --forceExit
```

Expect: PASS.

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/queries/vendor.queries.ts __tests__/lib/queries/vendor.queries.test.ts
git commit -m "feat: add Vendor queries with tests"
```

---

## Task 4: Vendor Server Actions (TDD)

**Files:**
- Create: `__tests__/lib/actions/vendor.actions.test.ts`
- Create: `src/lib/actions/vendor.actions.ts`

- [ ] **Step 4.1: Write the test**

Create `__tests__/lib/actions/vendor.actions.test.ts`:

```typescript
/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    vendor: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user_test123' }),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createVendor, updateVendor, deleteVendor } from '@/lib/actions/vendor.actions'

const mockCreate = db.vendor.create as jest.Mock
const mockUpdate = db.vendor.update as jest.Mock
const mockDelete = db.vendor.delete as jest.Mock
const mockAuth = auth as jest.Mock
const mockRevalidate = revalidatePath as jest.Mock

describe('createVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('creates a vendor and revalidates path', async () => {
    const input = { name: 'Acme AI', type: 'THIRD_PARTY' as const }
    const created = { id: 'v1', ...input }
    mockCreate.mockResolvedValue(created)

    const result = await createVendor(input)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({ data: input })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await createVendor({ name: 'Acme', type: 'INTERNAL' as const })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await createVendor({ name: '', type: 'INVALID' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('accepts optional fields', async () => {
    const input = {
      name: 'Vendor Corp',
      type: 'THIRD_PARTY' as const,
      country: 'SG',
      contractRef: 'CT-001',
      dueDiligenceStatus: 'COMPLETE',
    }
    const created = { id: 'v2', ...input }
    mockCreate.mockResolvedValue(created)

    const result = await createVendor(input)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({ data: input })
  })
})

describe('updateVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('updates a vendor and revalidates paths', async () => {
    const input = { name: 'Updated Vendor', type: 'INTERNAL' as const }
    const updated = { id: 'v1', ...input }
    mockUpdate.mockResolvedValue(updated)

    const result = await updateVendor('v1', input)

    expect(result).toEqual({ data: updated })
    expect(mockUpdate).toHaveBeenCalledWith({ where: { id: 'v1' }, data: input })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors/v1')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await updateVendor('v1', { name: 'X', type: 'INTERNAL' as const })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await updateVendor('v1', { name: '', type: 'BAD' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('deleteVendor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('deletes a vendor and revalidates path', async () => {
    mockDelete.mockResolvedValue({ id: 'v1' })

    const result = await deleteVendor('v1')

    expect(result).toEqual({ data: { id: 'v1' } })
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'v1' } })
    expect(mockRevalidate).toHaveBeenCalledWith('/registry/vendors')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await deleteVendor('v1')

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockDelete).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 4.2: Run the test (should fail -- module not found)**

```bash
node node_modules/.bin/jest --testPathPatterns vendor.actions.test --forceExit
```

Expect: FAIL.

- [ ] **Step 4.3: Implement the Server Actions**

Create `src/lib/actions/vendor.actions.ts`:

```typescript
'use server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INTERNAL', 'THIRD_PARTY']),
  country: z.string().optional(),
  contractRef: z.string().optional(),
  dueDiligenceStatus: z.string().optional(),
})

export type CreateVendorInput = z.infer<typeof VendorSchema>

export async function createVendor(data: CreateVendorInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = VendorSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const vendor = await db.vendor.create({ data: parsed.data })
  revalidatePath('/registry/vendors')
  return { data: vendor }
}

export async function updateVendor(id: string, data: CreateVendorInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = VendorSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const vendor = await db.vendor.update({ where: { id }, data: parsed.data })
  revalidatePath('/registry/vendors')
  revalidatePath(`/registry/vendors/${id}`)
  return { data: vendor }
}

export async function deleteVendor(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  await db.vendor.delete({ where: { id } })
  revalidatePath('/registry/vendors')
  return { data: { id } }
}
```

- [ ] **Step 4.4: Run the test (should pass)**

```bash
node node_modules/.bin/jest --testPathPatterns vendor.actions.test --forceExit
```

Expect: PASS.

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/actions/vendor.actions.ts __tests__/lib/actions/vendor.actions.test.ts
git commit -m "feat: add Vendor Server Actions with tests"
```

---

## Task 5: Model Queries (TDD)

**Files:**
- Create: `__tests__/lib/queries/model.queries.test.ts`
- Create: `src/lib/queries/model.queries.ts`

- [ ] **Step 5.1: Write the test**

Create `__tests__/lib/queries/model.queries.test.ts`:

```typescript
/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    aIModel: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getModels, getModelById } from '@/lib/queries/model.queries'

const mockFindMany = db.aIModel.findMany as jest.Mock
const mockFindUnique = db.aIModel.findUnique as jest.Mock

describe('getModels', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all models with no filters', async () => {
    const mockModels = [
      { id: 'm1', name: 'Credit Model', type: 'ML', status: 'ACTIVE' },
    ]
    mockFindMany.mockResolvedValue(mockModels)

    const result = await getModels()

    expect(result).toEqual(mockModels)
    expect(mockFindMany).toHaveBeenCalledWith({
      where: {},
      include: {
        useCase: true,
        vendor: true,
        _count: { select: { riskAssessments: true, workflows: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('applies status filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ status: 'ACTIVE' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE' },
      })
    )
  })

  it('applies risk tier filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ tier: 'HIGH' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { currentRiskTier: 'HIGH' },
      })
    )
  })

  it('applies type filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ type: 'LLM' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: 'LLM' },
      })
    )
  })

  it('applies businessUnit filter', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ businessUnit: 'Retail Banking' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessUnit: 'Retail Banking' },
      })
    )
  })

  it('applies multiple filters simultaneously', async () => {
    mockFindMany.mockResolvedValue([])

    await getModels({ status: 'ACTIVE', type: 'ML', businessUnit: 'Risk' })

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', type: 'ML', businessUnit: 'Risk' },
      })
    )
  })
})

describe('getModelById', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns model with all relations', async () => {
    const mockModel = {
      id: 'm1',
      name: 'Credit Model',
      useCase: { id: 'uc1', name: 'Credit Scoring' },
      vendor: { id: 'v1', name: 'Acme AI' },
      modelVersions: [{ id: 'mv1', version: '1.0' }],
      riskAssessments: [{ id: 'ra1', tier: 'HIGH' }],
      workflows: [{ id: 'w1', status: 'PENDING' }],
    }
    mockFindUnique.mockResolvedValue(mockModel)

    const result = await getModelById('m1')

    expect(result).toEqual(mockModel)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
      include: {
        useCase: true,
        vendor: true,
        modelVersions: { orderBy: { createdAt: 'desc' } },
        riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 3 },
        workflows: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })
  })

  it('returns null when model not found', async () => {
    mockFindUnique.mockResolvedValue(null)

    const result = await getModelById('nonexistent')

    expect(result).toBeNull()
  })
})
```

- [ ] **Step 5.2: Run the test (should fail -- module not found)**

```bash
node node_modules/.bin/jest --testPathPatterns model.queries.test --forceExit
```

Expect: FAIL.

- [ ] **Step 5.3: Implement the queries**

Create `src/lib/queries/model.queries.ts`:

```typescript
import { db } from '@/lib/db'
import type { ModelStatus, RiskTier, ModelType } from '@/lib/constants'

export interface ModelFilters {
  status?: ModelStatus
  tier?: RiskTier
  type?: ModelType
  businessUnit?: string
}

export async function getModels(filters: ModelFilters = {}) {
  return db.aIModel.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.tier && { currentRiskTier: filters.tier }),
      ...(filters.type && { type: filters.type }),
      ...(filters.businessUnit && { businessUnit: filters.businessUnit }),
    },
    include: {
      useCase: true,
      vendor: true,
      _count: { select: { riskAssessments: true, workflows: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getModelById(id: string) {
  return db.aIModel.findUnique({
    where: { id },
    include: {
      useCase: true,
      vendor: true,
      modelVersions: { orderBy: { createdAt: 'desc' } },
      riskAssessments: { orderBy: { assessedAt: 'desc' }, take: 3 },
      workflows: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}
```

- [ ] **Step 5.4: Run the test (should pass)**

```bash
node node_modules/.bin/jest --testPathPatterns model.queries.test --forceExit
```

Expect: PASS.

- [ ] **Step 5.5: Commit**

```bash
git add src/lib/queries/model.queries.ts __tests__/lib/queries/model.queries.test.ts
git commit -m "feat: add Model queries with filters and tests"
```

---

## Task 6: Model Server Actions (TDD)

**Files:**
- Create: `__tests__/lib/actions/model.actions.test.ts`
- Create: `src/lib/actions/model.actions.ts`

- [ ] **Step 6.1: Write the test**

Create `__tests__/lib/actions/model.actions.test.ts`:

```typescript
/** @jest-environment node */

jest.mock('@/lib/db', () => ({
  db: {
    aIModel: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({ userId: 'user_test123' }),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createModel, updateModel, retireModel } from '@/lib/actions/model.actions'

const mockCreate = db.aIModel.create as jest.Mock
const mockUpdate = db.aIModel.update as jest.Mock
const mockAuth = auth as jest.Mock
const mockRevalidate = revalidatePath as jest.Mock

const validInput = {
  name: 'Credit Scoring Model',
  type: 'ML' as const,
  businessUnit: 'Retail Banking',
  owner: 'Jane Doe',
  useCaseId: 'uc1',
}

describe('createModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('creates a model and revalidates /models', async () => {
    const created = { id: 'm1', ...validInput, vendorId: null }
    mockCreate.mockResolvedValue(created)

    const result = await createModel(validInput)

    expect(result).toEqual({ data: created })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { ...validInput, vendorId: null },
    })
    expect(mockRevalidate).toHaveBeenCalledWith('/models')
  })

  it('sets vendorId to null when not provided', async () => {
    mockCreate.mockResolvedValue({ id: 'm1', ...validInput, vendorId: null })

    await createModel(validInput)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: null }),
      })
    )
  })

  it('passes vendorId when provided', async () => {
    const inputWithVendor = { ...validInput, vendorId: 'v1' }
    mockCreate.mockResolvedValue({ id: 'm1', ...inputWithVendor })

    await createModel(inputWithVendor)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: 'v1' }),
      })
    )
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await createModel(validInput)

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input -- missing name', async () => {
    const result = await createModel({ ...validInput, name: '' })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input -- bad type', async () => {
    const result = await createModel({ ...validInput, type: 'INVALID' as any })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

describe('updateModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('updates a model and revalidates both paths', async () => {
    const input = { id: 'm1', ...validInput }
    const updated = { ...input, vendorId: null }
    mockUpdate.mockResolvedValue(updated)

    const result = await updateModel(input)

    expect(result).toEqual({ data: updated })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { ...validInput, vendorId: null },
    })
    expect(mockRevalidate).toHaveBeenCalledWith('/models')
    expect(mockRevalidate).toHaveBeenCalledWith('/models/m1')
  })

  it('sets vendorId to null when not provided on update', async () => {
    const input = { id: 'm1', ...validInput }
    mockUpdate.mockResolvedValue({ ...input, vendorId: null })

    await updateModel(input)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ vendorId: null }),
      })
    )
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await updateModel({ id: 'm1', ...validInput })

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid input', async () => {
    const result = await updateModel({ id: '', ...validInput })

    expect(result).toEqual({ error: 'Invalid input' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('retireModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: 'user_test123' })
  })

  it('sets status to RETIRED and updates lastReviewedAt', async () => {
    const retired = { id: 'm1', status: 'RETIRED', lastReviewedAt: new Date() }
    mockUpdate.mockResolvedValue(retired)

    const beforeCall = new Date()
    const result = await retireModel('m1')
    const afterCall = new Date()

    expect(result).toEqual({ data: retired })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: {
        status: 'RETIRED',
        lastReviewedAt: expect.any(Date),
      },
    })

    // Verify the date is reasonable (between before and after call)
    const calledData = mockUpdate.mock.calls[0][0].data
    expect(calledData.lastReviewedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
    expect(calledData.lastReviewedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime())
  })

  it('revalidates both /models and /models/:id', async () => {
    mockUpdate.mockResolvedValue({ id: 'm1', status: 'RETIRED' })

    await retireModel('m1')

    expect(mockRevalidate).toHaveBeenCalledWith('/models')
    expect(mockRevalidate).toHaveBeenCalledWith('/models/m1')
  })

  it('returns error when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null })

    const result = await retireModel('m1')

    expect(result).toEqual({ error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6.2: Run the test (should fail -- module not found)**

```bash
node node_modules/.bin/jest --testPathPatterns model.actions.test --forceExit
```

Expect: FAIL.

- [ ] **Step 6.3: Implement the Server Actions**

Create `src/lib/actions/model.actions.ts`:

```typescript
'use server'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const CreateModelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['LLM', 'ML', 'RPA', 'RULES']),
  businessUnit: z.string().min(1, 'Business unit is required'),
  owner: z.string().min(1, 'Owner is required'),
  useCaseId: z.string().min(1, 'Use case is required'),
  vendorId: z.string().optional(),
})

export type CreateModelInput = z.infer<typeof CreateModelSchema>

const UpdateModelSchema = CreateModelSchema.extend({
  id: z.string().min(1),
})

export type UpdateModelInput = z.infer<typeof UpdateModelSchema>

export async function createModel(data: CreateModelInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = CreateModelSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const model = await db.aIModel.create({
    data: {
      ...parsed.data,
      vendorId: parsed.data.vendorId ?? null,
    },
  })
  revalidatePath('/models')
  return { data: model }
}

export async function updateModel(data: UpdateModelInput) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const parsed = UpdateModelSchema.safeParse(data)
  if (!parsed.success) return { error: 'Invalid input' as const }

  const { id, ...rest } = parsed.data
  const model = await db.aIModel.update({
    where: { id },
    data: { ...rest, vendorId: rest.vendorId ?? null },
  })
  revalidatePath('/models')
  revalidatePath(`/models/${id}`)
  return { data: model }
}

export async function retireModel(id: string) {
  const { userId } = await auth()
  if (!userId) return { error: 'Unauthorized' as const }

  const model = await db.aIModel.update({
    where: { id },
    data: { status: 'RETIRED', lastReviewedAt: new Date() },
  })
  revalidatePath('/models')
  revalidatePath(`/models/${id}`)
  return { data: model }
}
```

- [ ] **Step 6.4: Run the test (should pass)**

```bash
node node_modules/.bin/jest --testPathPatterns model.actions.test --forceExit
```

Expect: PASS.

- [ ] **Step 6.5: Run full test suite to verify no regressions**

```bash
node node_modules/.bin/jest --forceExit
```

Expect: All tests pass.

- [ ] **Step 6.6: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 6.7: Commit**

```bash
git add src/lib/actions/model.actions.ts __tests__/lib/actions/model.actions.test.ts
git commit -m "feat: add Model Server Actions (create, update, retire) with tests"
```

---

## Task 7: Badge Components

**Files:**
- Create: `src/components/models/ModelStatusBadge.tsx`
- Create: `src/components/models/ModelTypeBadge.tsx`
- Create: `src/components/models/RiskTierBadge.tsx`

No tests -- these are pure presentational components.

- [ ] **Step 7.1: Create ModelStatusBadge**

Create `src/components/models/ModelStatusBadge.tsx`:

```typescript
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
```

- [ ] **Step 7.2: Create ModelTypeBadge**

Create `src/components/models/ModelTypeBadge.tsx`:

```typescript
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
```

- [ ] **Step 7.3: Create RiskTierBadge**

Create `src/components/models/RiskTierBadge.tsx`:

```typescript
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
```

- [ ] **Step 7.4: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 7.5: Commit**

```bash
git add src/components/models/ModelStatusBadge.tsx src/components/models/ModelTypeBadge.tsx src/components/models/RiskTierBadge.tsx
git commit -m "feat: add ModelStatus, ModelType, and RiskTier badge components"
```

---

## Task 8: VendorForm and VendorTable Components

**Files:**
- Create: `src/components/vendors/VendorForm.tsx`
- Create: `src/components/vendors/VendorTable.tsx`

No tests -- client UI components.

- [ ] **Step 8.1: Create VendorForm**

Create `src/components/vendors/VendorForm.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

import { createVendor, updateVendor } from '@/lib/actions/vendor.actions'
import type { CreateVendorInput } from '@/lib/actions/vendor.actions'

const VendorFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INTERNAL', 'THIRD_PARTY']),
  country: z.string().optional(),
  contractRef: z.string().optional(),
})

interface VendorFormProps {
  defaultValues?: {
    id: string
    name: string
    type: 'INTERNAL' | 'THIRD_PARTY'
    country?: string | null
    contractRef?: string | null
  }
}

export function VendorForm({ defaultValues }: VendorFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!defaultValues

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data: CreateVendorInput = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'INTERNAL' | 'THIRD_PARTY',
      country: (formData.get('country') as string) || undefined,
      contractRef: (formData.get('contractRef') as string) || undefined,
    }

    const parsed = VendorFormSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateVendor(defaultValues!.id, data)
        : await createVendor(data)

      if ('error' in result) {
        setError(result.error)
      } else {
        router.push('/registry/vendors')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-200">
          Vendor Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter vendor name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium text-slate-200">
          Vendor Type *
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={defaultValues?.type ?? 'THIRD_PARTY'}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="THIRD_PARTY">Third Party</option>
          <option value="INTERNAL">Internal</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="country" className="text-sm font-medium text-slate-200">
          Country
        </label>
        <input
          id="country"
          name="country"
          type="text"
          defaultValue={defaultValues?.country ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. SG, US, UK"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="contractRef" className="text-sm font-medium text-slate-200">
          Contract Reference
        </label>
        <input
          id="contractRef"
          name="contractRef"
          type="text"
          defaultValue={defaultValues?.contractRef ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g. CT-2026-001"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Vendor' : 'Create Vendor'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/registry/vendors')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 8.2: Create VendorTable**

Create `src/components/vendors/VendorTable.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { deleteVendor } from '@/lib/actions/vendor.actions'

interface VendorRow {
  id: string
  name: string
  type: 'INTERNAL' | 'THIRD_PARTY'
  country: string | null
  contractRef: string | null
  _count: { models: number }
}

export function VendorTable({ vendors }: { vendors: VendorRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return
    startTransition(async () => {
      await deleteVendor(id)
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/50">
            <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Country</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Contract Ref</th>
            <th className="px-4 py-3 text-left font-medium text-slate-300">Models</th>
            <th className="px-4 py-3 text-right font-medium text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                No vendors registered yet.
              </td>
            </tr>
          ) : (
            vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/registry/vendors/${vendor.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {vendor.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'}
                </td>
                <td className="px-4 py-3 text-slate-400">{vendor.country ?? '--'}</td>
                <td className="px-4 py-3 text-slate-400">{vendor.contractRef ?? '--'}</td>
                <td className="px-4 py-3 text-slate-300">{vendor._count.models}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => router.push(`/registry/vendors/${vendor.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-400 hover:text-red-300"
                      disabled={isPending}
                      onClick={() => handleDelete(vendor.id, vendor.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 8.3: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 8.4: Commit**

```bash
git add src/components/vendors/VendorForm.tsx src/components/vendors/VendorTable.tsx
git commit -m "feat: add VendorForm and VendorTable client components"
```

---

## Task 9: ModelForm Component

**Files:**
- Create: `src/components/models/ModelForm.tsx`

No tests -- client UI component.

- [ ] **Step 9.1: Create ModelForm**

Create `src/components/models/ModelForm.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'

import { createModel, updateModel } from '@/lib/actions/model.actions'
import type { CreateModelInput } from '@/lib/actions/model.actions'

const ModelFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['LLM', 'ML', 'RPA', 'RULES']),
  businessUnit: z.string().min(1, 'Business unit is required'),
  owner: z.string().min(1, 'Owner is required'),
  useCaseId: z.string().min(1, 'Use case is required'),
  vendorId: z.string().optional(),
})

interface UseCaseOption {
  id: string
  name: string
  regulatoryCategory: string
}

interface VendorOption {
  id: string
  name: string
}

interface ModelFormProps {
  useCases: UseCaseOption[]
  vendors: VendorOption[]
  defaultValues?: {
    id: string
    name: string
    description?: string | null
    type: 'LLM' | 'ML' | 'RPA' | 'RULES'
    businessUnit: string
    owner: string
    useCaseId: string
    vendorId?: string | null
  }
}

export function ModelForm({ useCases, vendors, defaultValues }: ModelFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!defaultValues

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data: CreateModelInput = {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      type: formData.get('type') as 'LLM' | 'ML' | 'RPA' | 'RULES',
      businessUnit: formData.get('businessUnit') as string,
      owner: formData.get('owner') as string,
      useCaseId: formData.get('useCaseId') as string,
      vendorId: (formData.get('vendorId') as string) || undefined,
    }

    const parsed = ModelFormSchema.safeParse(data)
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Invalid input')
      return
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateModel({ id: defaultValues!.id, ...data })
        : await createModel(data)

      if ('error' in result) {
        setError(result.error)
      } else {
        router.push(isEditing ? `/models/${defaultValues!.id}` : '/models')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-200">
          Model Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter model name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-200">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ''}
          className="flex w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Describe what this model does and its purpose"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-slate-200">
            Model Type *
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={defaultValues?.type ?? ''}
            className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>Select type...</option>
            <option value="LLM">LLM</option>
            <option value="ML">ML</option>
            <option value="RPA">RPA</option>
            <option value="RULES">Rules-based</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="businessUnit" className="text-sm font-medium text-slate-200">
            Business Unit *
          </label>
          <input
            id="businessUnit"
            name="businessUnit"
            type="text"
            required
            defaultValue={defaultValues?.businessUnit ?? ''}
            className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Retail Banking"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="owner" className="text-sm font-medium text-slate-200">
          Model Owner *
        </label>
        <input
          id="owner"
          name="owner"
          type="text"
          required
          defaultValue={defaultValues?.owner ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter model owner name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="useCaseId" className="text-sm font-medium text-slate-200">
          Use Case *
        </label>
        <select
          id="useCaseId"
          name="useCaseId"
          required
          defaultValue={defaultValues?.useCaseId ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="" disabled>Select use case...</option>
          {useCases.map((uc) => (
            <option key={uc.id} value={uc.id}>
              {uc.name} ({uc.regulatoryCategory})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="vendorId" className="text-sm font-medium text-slate-200">
          Vendor (optional)
        </label>
        <select
          id="vendorId"
          name="vendorId"
          defaultValue={defaultValues?.vendorId ?? ''}
          className="flex h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">No vendor</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Update Model' : 'Register Model'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(isEditing ? `/models/${defaultValues!.id}` : '/models')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 9.2: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 9.3: Commit**

```bash
git add src/components/models/ModelForm.tsx
git commit -m "feat: add ModelForm client component with Zod validation"
```

---

## Task 10: ModelTable Component

**Files:**
- Create: `src/components/models/ModelTable.tsx`

No tests -- client UI component.

- [ ] **Step 10.1: Create ModelTable**

Create `src/components/models/ModelTable.tsx`:

```typescript
'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { retireModel } from '@/lib/actions/model.actions'
import type { ModelStatus, ModelType, RiskTier } from '@/lib/constants'

interface ModelRow {
  id: string
  name: string
  type: ModelType
  status: ModelStatus
  currentRiskTier: RiskTier | null
  businessUnit: string
  owner: string
  useCase: { id: string; name: string }
  vendor: { id: string; name: string } | null
  _count: { riskAssessments: number; workflows: number }
}

interface ModelTableProps {
  models: ModelRow[]
}

export function ModelTable({ models }: ModelTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (statusFilter && m.status !== statusFilter) return false
      if (typeFilter && m.type !== typeFilter) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [models, search, statusFilter, typeFilter])

  function handleRetire(id: string, name: string) {
    if (!confirm(`Are you sure you want to retire model "${name}"? This action sets the model status to RETIRED.`)) return
    startTransition(async () => {
      await retireModel(id)
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="RETIRED">Retired</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All types</option>
          <option value="LLM">LLM</option>
          <option value="ML">ML</option>
          <option value="RPA">RPA</option>
          <option value="RULES">Rules</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/50">
              <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Risk Tier</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Business Unit</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Owner</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Use Case</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Vendor</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  {models.length === 0
                    ? 'No models registered yet.'
                    : 'No models match the current filters.'}
                </td>
              </tr>
            ) : (
              filtered.map((model) => (
                <tr key={model.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/models/${model.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {model.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ModelTypeBadge type={model.type} />
                  </td>
                  <td className="px-4 py-3">
                    <ModelStatusBadge status={model.status} />
                  </td>
                  <td className="px-4 py-3">
                    {model.currentRiskTier ? (
                      <RiskTierBadge tier={model.currentRiskTier} />
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{model.businessUnit}</td>
                  <td className="px-4 py-3 text-slate-400">{model.owner}</td>
                  <td className="px-4 py-3 text-slate-400">{model.useCase.name}</td>
                  <td className="px-4 py-3 text-slate-400">{model.vendor?.name ?? '--'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/models/${model.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => router.push(`/models/${model.id}/edit`)}
                      >
                        Edit
                      </Button>
                      {model.status !== 'RETIRED' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-red-400 hover:text-red-300"
                          disabled={isPending}
                          onClick={() => handleRetire(model.id, model.name)}
                        >
                          Retire
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {models.length} model{models.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
```

- [ ] **Step 10.2: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 10.3: Commit**

```bash
git add src/components/models/ModelTable.tsx
git commit -m "feat: add ModelTable client component with filtering"
```

---

## Task 11: Models List Page + New Model Page

**Files:**
- Replace: `src/app/(app)/models/page.tsx`
- Create: `src/app/(app)/models/new/page.tsx`

- [ ] **Step 11.1: Replace the models list page**

Replace `src/app/(app)/models/page.tsx` with:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModelTable } from '@/components/models/ModelTable'
import { getModels } from '@/lib/queries/model.queries'
import type { ModelStatus, ModelType } from '@/lib/constants'

interface ModelsPageProps {
  searchParams: Promise<{
    status?: string
    type?: string
    businessUnit?: string
  }>
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = await searchParams
  const models = await getModels({
    status: params.status as ModelStatus | undefined,
    type: params.type as ModelType | undefined,
    businessUnit: params.businessUnit,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">AI Inventory</h1>
          <p className="text-sm text-slate-400 mt-1">
            Register and manage all AI/ML models across the organisation.
          </p>
        </div>
        <Link href="/models/new">
          <Button>Register Model</Button>
        </Link>
      </div>

      <ModelTable models={models} />
    </div>
  )
}
```

- [ ] **Step 11.2: Create the new model page**

Create `src/app/(app)/models/new/page.tsx`:

```typescript
import { ModelForm } from '@/components/models/ModelForm'
import { getUseCases } from '@/lib/queries/usecase.queries'
import { getVendors } from '@/lib/queries/vendor.queries'

export default async function NewModelPage() {
  const [useCases, vendorsWithCount] = await Promise.all([
    getUseCases(),
    getVendors(),
  ])

  const vendors = vendorsWithCount.map((v) => ({ id: v.id, name: v.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Register New Model</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add a new AI/ML model to the inventory.
        </p>
      </div>

      <ModelForm useCases={useCases} vendors={vendors} />
    </div>
  )
}
```

- [ ] **Step 11.3: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 11.4: Commit**

```bash
git add src/app/\(app\)/models/page.tsx src/app/\(app\)/models/new/page.tsx
git commit -m "feat: implement models list page and new model page"
```

---

## Task 12: Model Edit Page

**Files:**
- Create: `src/app/(app)/models/[id]/edit/page.tsx`

- [ ] **Step 12.1: Create the edit model page**

Create `src/app/(app)/models/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { ModelForm } from '@/components/models/ModelForm'
import { getModelById } from '@/lib/queries/model.queries'
import { getUseCases } from '@/lib/queries/usecase.queries'
import { getVendors } from '@/lib/queries/vendor.queries'

interface EditModelPageProps {
  params: Promise<{ id: string }>
}

export default async function EditModelPage({ params }: EditModelPageProps) {
  const { id } = await params
  const [model, useCases, vendorsWithCount] = await Promise.all([
    getModelById(id),
    getUseCases(),
    getVendors(),
  ])

  if (!model) notFound()

  const vendors = vendorsWithCount.map((v) => ({ id: v.id, name: v.name }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Edit Model</h1>
        <p className="text-sm text-slate-400 mt-1">
          Update details for <span className="text-slate-200">{model.name}</span>.
        </p>
      </div>

      <ModelForm
        useCases={useCases}
        vendors={vendors}
        defaultValues={{
          id: model.id,
          name: model.name,
          description: model.description,
          type: model.type,
          businessUnit: model.businessUnit,
          owner: model.owner,
          useCaseId: model.useCaseId,
          vendorId: model.vendorId,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 12.2: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 12.3: Commit**

```bash
git add src/app/\(app\)/models/\[id\]/edit/page.tsx
git commit -m "feat: implement model edit page"
```

---

## Task 13: Model Detail Page

**Files:**
- Create: `src/app/(app)/models/[id]/page.tsx`

- [ ] **Step 13.1: Create the model detail page**

Create `src/app/(app)/models/[id]/page.tsx`:

```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { RiskTierBadge } from '@/components/models/RiskTierBadge'
import { getModelById } from '@/lib/queries/model.queries'
import { retireModel } from '@/lib/actions/model.actions'

interface ModelDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { id } = await params
  const model = await getModelById(id)

  if (!model) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">{model.name}</h1>
            <ModelStatusBadge status={model.status} />
            <ModelTypeBadge type={model.type} />
            {model.currentRiskTier && <RiskTierBadge tier={model.currentRiskTier} />}
          </div>
          {model.description && (
            <p className="text-sm text-slate-400 mt-2">{model.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/models/${model.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          {model.status !== 'RETIRED' && (
            <form
              action={async () => {
                'use server'
                await retireModel(model.id)
              }}
            >
              <Button type="submit" variant="destructive">
                Retire Model
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Model Information Card */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Model Information</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Unit</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.businessUnit}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Owner</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.owner}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Use Case</dt>
            <dd className="mt-1 text-sm text-slate-200">{model.useCase.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Vendor</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.vendor ? (
                <Link
                  href={`/registry/vendors/${model.vendor.id}`}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {model.vendor.name}
                </Link>
              ) : (
                <span className="text-slate-500">None</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Deployed At</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.deployedAt
                ? new Date(model.deployedAt).toLocaleDateString()
                : '--'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Last Reviewed</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {model.lastReviewedAt
                ? new Date(model.lastReviewedAt).toLocaleDateString()
                : '--'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Version History */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Version History</h2>
        {model.modelVersions.length === 0 ? (
          <p className="text-sm text-slate-500">No versions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {model.modelVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    v{version.version}
                  </span>
                  {version.changeLog && (
                    <p className="text-xs text-slate-400 mt-0.5">{version.changeLog}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                  {version.approvedBy && (
                    <p className="text-xs text-green-400">
                      Approved by {version.approvedBy}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Risk Assessments */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Recent Risk Assessments</h2>
        {model.riskAssessments.length === 0 ? (
          <p className="text-sm text-slate-500">No risk assessments completed yet.</p>
        ) : (
          <div className="space-y-3">
            {model.riskAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <RiskTierBadge tier={assessment.tier} />
                  <span className="text-sm text-slate-300">
                    Assessed by {assessment.assessedBy}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(assessment.assessedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Workflows */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Workflow Status</h2>
        {model.workflows.length === 0 ? (
          <p className="text-sm text-slate-500">No workflows initiated yet.</p>
        ) : (
          <div className="space-y-3">
            {model.workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">
                    {workflow.type.replace(/_/g, ' ')}
                  </span>
                  <span className="ml-2 text-xs text-slate-400">
                    by {workflow.initiatedBy}
                  </span>
                </div>
                <span className={`text-xs font-medium ${
                  workflow.status === 'APPROVED' ? 'text-green-400' :
                  workflow.status === 'REJECTED' ? 'text-red-400' :
                  workflow.status === 'IN_REVIEW' ? 'text-amber-400' :
                  'text-slate-400'
                }`}>
                  {workflow.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/models" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          Back to AI Inventory
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 13.2: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 13.3: Commit**

```bash
git add src/app/\(app\)/models/\[id\]/page.tsx
git commit -m "feat: implement model detail page with version history and assessments"
```

---

## Task 14: Registry Overview + Vendor Pages

**Files:**
- Replace: `src/app/(app)/registry/page.tsx`
- Create: `src/app/(app)/registry/vendors/page.tsx`
- Create: `src/app/(app)/registry/vendors/new/page.tsx`
- Create: `src/app/(app)/registry/vendors/[id]/page.tsx`

- [ ] **Step 14.1: Replace the registry overview page**

Replace `src/app/(app)/registry/page.tsx` with:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getModels } from '@/lib/queries/model.queries'
import { getVendors } from '@/lib/queries/vendor.queries'

export default async function RegistryPage() {
  const [models, vendors] = await Promise.all([getModels(), getVendors()])

  // Count models by type
  const modelsByType = models.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Count models by status
  const modelsByStatus = models.reduce(
    (acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Model & Vendor Registry</h1>
        <p className="text-sm text-slate-400 mt-1">
          Overview of all registered AI models and vendors.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Total Models</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">{models.length}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            {Object.entries(modelsByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}</span>
                <span className="text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Models by Type</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(modelsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between text-sm">
                <span className="text-slate-300">{type}</span>
                <span className="text-slate-100 font-medium">{count}</span>
              </div>
            ))}
            {Object.keys(modelsByType).length === 0 && (
              <p className="text-sm text-slate-500">No models registered</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
          <h3 className="text-sm font-medium text-slate-400">Total Vendors</h3>
          <p className="text-3xl font-bold text-slate-100 mt-2">{vendors.length}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Third Party</span>
              <span className="text-slate-300">
                {vendors.filter((v) => v.type === 'THIRD_PARTY').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Internal</span>
              <span className="text-slate-300">
                {vendors.filter((v) => v.type === 'INTERNAL').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-3">
        <Link href="/models">
          <Button variant="outline">View All Models</Button>
        </Link>
        <Link href="/models/new">
          <Button>Register Model</Button>
        </Link>
        <Link href="/registry/vendors">
          <Button variant="outline">View All Vendors</Button>
        </Link>
        <Link href="/registry/vendors/new">
          <Button>Register Vendor</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 14.2: Create the vendor list page**

Create `src/app/(app)/registry/vendors/page.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { VendorTable } from '@/components/vendors/VendorTable'
import { getVendors } from '@/lib/queries/vendor.queries'

export default async function VendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Vendors</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage AI model vendors and third-party providers.
          </p>
        </div>
        <Link href="/registry/vendors/new">
          <Button>Register Vendor</Button>
        </Link>
      </div>

      <VendorTable vendors={vendors} />
    </div>
  )
}
```

- [ ] **Step 14.3: Create the new vendor page**

Create `src/app/(app)/registry/vendors/new/page.tsx`:

```typescript
import { VendorForm } from '@/components/vendors/VendorForm'

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Register New Vendor</h1>
        <p className="text-sm text-slate-400 mt-1">
          Add a new vendor to the registry.
        </p>
      </div>

      <VendorForm />
    </div>
  )
}
```

- [ ] **Step 14.4: Create the vendor detail page**

Create `src/app/(app)/registry/vendors/[id]/page.tsx`:

```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ModelStatusBadge } from '@/components/models/ModelStatusBadge'
import { ModelTypeBadge } from '@/components/models/ModelTypeBadge'
import { getVendorById } from '@/lib/queries/vendor.queries'

interface VendorDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { id } = await params
  const vendor = await getVendorById(id)

  if (!vendor) notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">{vendor.name}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'} Vendor
          </p>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">Vendor Information</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Type</dt>
            <dd className="mt-1 text-sm text-slate-200">
              {vendor.type === 'THIRD_PARTY' ? 'Third Party' : 'Internal'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Country</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.country ?? '--'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contract Reference</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.contractRef ?? '--'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Due Diligence Status</dt>
            <dd className="mt-1 text-sm text-slate-200">{vendor.dueDiligenceStatus ?? '--'}</dd>
          </div>
        </dl>
      </div>

      {/* Linked Models */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-6">
        <h2 className="text-lg font-medium text-slate-100 mb-4">
          Linked Models ({vendor.models.length})
        </h2>
        {vendor.models.length === 0 ? (
          <p className="text-sm text-slate-500">No models linked to this vendor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Use Case</th>
                </tr>
              </thead>
              <tbody>
                {vendor.models.map((model) => (
                  <tr key={model.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/models/${model.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {model.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <ModelTypeBadge type={model.type} />
                    </td>
                    <td className="px-4 py-3">
                      <ModelStatusBadge status={model.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{model.useCase.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back link */}
      <div>
        <Link href="/registry/vendors" className="text-sm text-blue-400 hover:text-blue-300 hover:underline">
          Back to Vendors
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 14.5: Run typecheck**

```bash
node node_modules/.bin/tsc --noEmit
```

- [ ] **Step 14.6: Run the full test suite**

```bash
node node_modules/.bin/jest --forceExit
```

Expect: All tests pass (including the new query and action tests from Tasks 2-6).

- [ ] **Step 14.7: Commit**

```bash
git add src/app/\(app\)/registry/ src/app/\(app\)/registry/vendors/
git commit -m "feat: implement registry overview and vendor pages (list, create, detail)"
```

---

## Verification Checklist

After all 14 tasks are complete, run these final checks:

```bash
# All tests pass
node node_modules/.bin/jest --forceExit

# No type errors
node node_modules/.bin/tsc --noEmit

# Lint passes
npx eslint .
```

**Expected test file count:** 5 new test files:
1. `__tests__/lib/queries/usecase.queries.test.ts`
2. `__tests__/lib/queries/vendor.queries.test.ts`
3. `__tests__/lib/queries/model.queries.test.ts`
4. `__tests__/lib/actions/vendor.actions.test.ts`
5. `__tests__/lib/actions/model.actions.test.ts`

**Expected new source files:** 17 files across queries, actions, components, and pages.

**Functional coverage:**
- Register AI models (name, description, type, business unit, owner, use case, vendor)
- List all models with filtering by status, risk tier, type, business unit
- View model detail (info, version history, risk assessments, workflows)
- Edit and soft-delete (retire) models
- Register vendors (name, type, country, contract reference)
- List vendors, view vendor detail with linked models
- Registry overview page showing models + vendors together
