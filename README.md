# AI Governance Platform

A MAS-compliant AI model risk management platform built with Next.js 16, Prisma, Clerk, and Neon PostgreSQL.

**Features:** Model registry · Risk assessment & tiering · Approval workflows · Policy & control library · Board-level reports · Use case management · Vendor registry

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Neon (Database)](#step-1--neon-database)
4. [Step 2 — Clerk (Authentication)](#step-2--clerk-authentication)
5. [Step 3 — Local Setup](#step-3--local-setup)
6. [Step 4 — GitHub](#step-4--github)
7. [Step 5 — Vercel (Production Deploy)](#step-5--vercel-production-deploy)
8. [Step 6 — Seed Demo Data](#step-6--seed-demo-data)
9. [Environment Variables Reference](#environment-variables-reference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma 5 |
| Auth | Clerk 7 |
| Styling | Tailwind CSS 4 |
| Testing | Jest 30 |
| Hosting | Vercel |

---

## Prerequisites

- Node.js 20+
- npm 10+
- A [GitHub](https://github.com) account
- A [Neon](https://neon.tech) account (free tier works)
- A [Clerk](https://clerk.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)

---

## Step 1 — Neon (Database)

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. Click **New Project**. Give it a name (e.g. `ai-governance`). Choose a region close to your Vercel deployment region (e.g. `AWS us-east-1` for Vercel's default `iad1`).
3. Once created, go to the project dashboard and click **Connection Details**.
4. Select **Prisma** from the framework dropdown — it will show two connection strings:
   - **Pooled** (use for `DATABASE_URL`) — ends with `-pooler.xxx.neon.tech/...`
   - **Direct** (use for `DATABASE_URL_UNPOOLED`) — ends with `.xxx.neon.tech/...`
5. Copy both strings — you'll need them in the next steps.

---

## Step 2 — Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and sign up / log in.
2. Click **Create application**. Give it a name. Enable **Email** and **Google** sign-in (or whichever providers you want).
3. After creation, go to **API Keys** in the sidebar.
4. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
5. _(Optional)_ To enable multi-org support: go to **Organizations** in the sidebar and enable the feature.
6. After deploying to Vercel (Step 5), come back and add your production domain to **Clerk → Settings → Domains** so auth redirects work.

---

## Step 3 — Local Setup

### 3.1 Clone and install

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
npm install
```

### 3.2 Create environment file

Create a `.env` file in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon (Prisma)
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

Replace the placeholder values with your actual keys from Steps 1 and 2.

### 3.3 Set up the database

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your Neon database (creates all tables)
npx prisma db push

# Seed with MAS policy templates and demo data
npx prisma db seed
```

### 3.4 Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up for an account — you'll be redirected to the dashboard.

### 3.5 Run tests

```bash
npm test
```

---

## Step 4 — GitHub

If you cloned someone else's repo and want your own copy, or are starting fresh:

```bash
# Initialise git (skip if already a repo)
git init
git add -A
git commit -m "initial commit"

# Create a new GitHub repo and push
gh repo create <repo-name> --private --source=. --push
```

Or create the repo manually on [github.com/new](https://github.com/new) (leave it empty, no README), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

---

## Step 5 — Vercel (Production Deploy)

### 5.1 Import the project

1. Go to [vercel.com/new](https://vercel.com/new) and log in.
2. Click **Import Git Repository** and select your GitHub repo.
3. Vercel auto-detects Next.js — leave all build settings as-is.

### 5.2 Add environment variables

Before clicking **Deploy**, expand **Environment Variables** and add all of the following:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From Clerk API Keys |
| `CLERK_SECRET_KEY` | From Clerk API Keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/dashboard` |

### 5.3 Deploy

Click **Deploy**. The build runs `prisma generate && next build` — this takes ~2 minutes on first deploy.

### 5.4 Add your Vercel domain to Clerk

1. Copy your production URL from Vercel (e.g. `https://ai-governance-platform.vercel.app`).
2. In Clerk dashboard → **Settings → Domains** → **Add domain** → paste the URL.

This is required — without it, Clerk will block auth redirects on the production domain.

---

## Step 6 — Seed Demo Data

The seed script is idempotent (safe to run multiple times). Run it once against your production database from your local machine — your `.env` already points to the correct database:

```bash
npx prisma db seed
```

This creates:
- 6 MAS policy templates with controls
- 3 vendors (OpenAI, AWS, Internal)
- 4 use cases (Credit Scoring, Fraud Detection, Customer Service, AML Screening)
- 6 AI models across different risk tiers and statuses
- 5 risk assessments
- 4 approval workflows (completed, in-review, and pending)

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon **pooled** connection string (used by Prisma at runtime) |
| `DATABASE_URL_UNPOOLED` | Yes | Neon **direct** connection string (used by Prisma migrations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (safe to expose to browser) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-side only, never expose) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Path for sign-in page — set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Path for sign-up page — set to `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Redirect after sign-in — set to `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Redirect after sign-up — set to `/dashboard` |

---

## Project Structure

```
src/
  app/
    (auth)/          # Sign-in and sign-up pages (Clerk)
    (app)/           # Protected app routes
      dashboard/     # KPI overview
      models/        # AI model registry
      assessments/   # Risk assessments
      workflows/     # Approval workflows
      policies/      # Policy & control library
      reports/       # Board-level reports
      registry/      # Vendors and use cases
  components/        # Shared UI components
  lib/
    actions/         # Server Actions (mutations)
    queries/         # Database read functions
    utils.ts         # Shared utilities
prisma/
  schema.prisma      # Database schema
  seed.ts            # Demo data seed script
```
