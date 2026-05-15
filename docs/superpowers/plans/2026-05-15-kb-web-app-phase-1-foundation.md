# KB Web App — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Next.js + TypeScript + Tailwind + Prisma project with the full database schema, single-user scoping, optional password auth, and a green test runner. No UI surfaces or design system yet — that lands in Phase 2.

**Architecture:** Single Next.js 15 App Router project at the repo root, alongside the existing `.claude/` and markdown KB. Prisma schema supports both Postgres (prod, via Docker compose) and SQLite (local fast iteration). Server Actions are the only mutation surface; every action returns a uniform `ActionResult<T>`. A thin scoping wrapper enforces single-user isolation. Optional password gate via middleware.

**Tech Stack:** Node 22 LTS, Next.js 15 (App Router), TypeScript strict, Prisma 5+, Postgres 16 / SQLite, Vitest, iron-session, bcryptjs, Zod, Pino, Docker compose.

**Spec reference:** `docs/superpowers/specs/2026-05-15-kb-web-app-data-model-and-crud-design.md` §1, §2, §5, §6, §7.

---

## File structure (delivered by end of Phase 1)

```
package.json
tsconfig.json
next.config.ts
.env.example
.gitignore                        # already exists; add Node + Next entries
compose.yaml
Dockerfile                        # for the app service

middleware.ts

lib/
  env.ts                          # validated env

server/
  data/
    db.ts                         # Prisma client singleton
    current-user.ts               # scopeToUser wrapper
  actions/
    result.ts                     # ActionResult<T> + ok() / err() helpers
  auth/
    session.ts                    # iron-session config + helpers

prisma/
  schema.prisma
  seed.ts
  migrations/                     # generated

scripts/
  hash-password.ts                # `npm run hash-password`

tests/
  setup.ts                        # Vitest setup (resets DB before each test)
  unit/
    server/
      data/
        current-user.test.ts
      actions/
        result.test.ts
  integration/
    seed.test.ts

vitest.config.ts
```

Two minimal Next.js pages exist purely to verify the shell boots:
- `app/layout.tsx` — bare HTML layout
- `app/page.tsx` — single line "KB Web App — Phase 1 OK" (will be replaced in Phase 2)
- `app/api/health/route.ts` — returns `{ ok: true }`

---

## Task 1: Initialize npm package

**Files:**
- Create: `package.json`
- Create: `.npmrc` (set `save-exact=true`)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "kb-web-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset --force",
    "db:seed": "tsx prisma/seed.ts",
    "hash-password": "tsx scripts/hash-password.ts"
  }
}
```

- [ ] **Step 2: Create `.npmrc`**

```
save-exact=true
```

- [ ] **Step 3: Initialize git ignore entries**

Append to `.gitignore`:

```
# Node / Next
node_modules/
.next/
.env
.env.local
*.log
coverage/
playwright-report/
```

- [ ] **Step 4: Commit**

```bash
git add package.json .npmrc .gitignore
git commit -m "phase 1: initialize npm package + gitignore"
```

---

## Task 2: Install runtime dependencies

**Files:** none modified directly (updates `package.json` + `package-lock.json`)

- [ ] **Step 1: Install Next.js + React + TypeScript**

```bash
npm install next@15 react@19 react-dom@19
npm install -D typescript@5 @types/node @types/react @types/react-dom
```

- [ ] **Step 2: Install Prisma + DB drivers**

```bash
npm install @prisma/client
npm install -D prisma tsx
```

- [ ] **Step 3: Install auth + validation + logging**

```bash
npm install zod iron-session bcryptjs pino
npm install -D @types/bcryptjs
```

- [ ] **Step 4: Install Vitest**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "phase 1: install runtime + test dependencies"
```

---

## Task 3: TypeScript + Next config

**Files:**
- Create: `tsconfig.json`
- Create: `next.config.ts`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "design", "applications", "experience"]
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
};

export default config;
```

- [ ] **Step 3: Run typecheck to verify config is valid**

```bash
npm run typecheck
```

Expected: PASS (no errors, no files to check yet — TS may emit "no inputs" warning; that's fine).

- [ ] **Step 4: Commit**

```bash
git add tsconfig.json next.config.ts
git commit -m "phase 1: add TypeScript + Next.js configuration"
```

---

## Task 4: Minimal Next.js shell (verifies the dev server boots)

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/api/health/route.ts`

- [ ] **Step 1: Write the failing test for `/api/health`**

Create `tests/integration/health.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("/api/health", () => {
  it("returns 200 with { ok: true }", async () => {
    const { GET } = await import("@/app/api/health/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/integration/health.test.ts
```

Expected: FAIL — `Cannot find module '@/app/api/health/route'`.

- [ ] **Step 3: Create `app/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export const metadata = { title: "KB" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Create `app/page.tsx`**

```tsx
export default function HomePage() {
  return <main>KB Web App — Phase 1 OK</main>;
}
```

- [ ] **Step 5: Create `app/api/health/route.ts`**

```ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test -- tests/integration/health.test.ts
```

Expected: PASS.

- [ ] **Step 7: Boot the dev server manually and confirm**

```bash
npm run dev
```

Open `http://localhost:3000` — confirm the page renders. `http://localhost:3000/api/health` returns `{"ok":true}`. Stop the server (Ctrl-C).

- [ ] **Step 8: Commit**

```bash
git add app/ tests/integration/health.test.ts
git commit -m "phase 1: add minimal Next.js shell + /api/health endpoint"
```

---

## Task 5: Vitest configuration

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["server/**", "lib/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
```

- [ ] **Step 2: Create empty `tests/setup.ts` (will grow in later tasks)**

```ts
// Test setup runs before each suite.
// Phase 1: no global setup yet; Task 11 wires in DB reset.
export {};
```

- [ ] **Step 3: Re-run the health test to confirm config picks it up**

```bash
npm test
```

Expected: PASS (1 test).

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "phase 1: add Vitest config + setup placeholder"
```

---

## Task 6: Env validation module

**Files:**
- Create: `lib/env.ts`
- Create: `.env.example`
- Create: `tests/unit/lib/env.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/env.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("requires DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("accepts a valid env", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost:5432/kb",
      KB_SOURCE_REPO_PATH: "/tmp/cv",
    });
    expect(env.DATABASE_URL).toBe("postgres://localhost:5432/kb");
    expect(env.KB_SOURCE_REPO_PATH).toBe("/tmp/cv");
    expect(env.ADMIN_PASSWORD_HASH).toBeUndefined();
  });

  it("returns ADMIN_PASSWORD_HASH when set", () => {
    const env = parseEnv({
      DATABASE_URL: "postgres://localhost:5432/kb",
      ADMIN_PASSWORD_HASH: "$2b$12$abc",
    });
    expect(env.ADMIN_PASSWORD_HASH).toBe("$2b$12$abc");
  });

  it("requires SESSION_SECRET to be at least 32 chars when ADMIN_PASSWORD_HASH is set", () => {
    expect(() =>
      parseEnv({
        DATABASE_URL: "postgres://localhost:5432/kb",
        ADMIN_PASSWORD_HASH: "$2b$12$abc",
        SESSION_SECRET: "short",
      }),
    ).toThrow(/SESSION_SECRET/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/lib/env.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/env'`.

- [ ] **Step 3: Implement `lib/env.ts`**

```ts
import { z } from "zod";

const Schema = z
  .object({
    DATABASE_URL: z.string().url(),
    KB_SOURCE_REPO_PATH: z.string().optional(),
    ADMIN_PASSWORD_HASH: z.string().optional(),
    SESSION_SECRET: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.ADMIN_PASSWORD_HASH && (val.SESSION_SECRET?.length ?? 0) < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be ≥32 chars when ADMIN_PASSWORD_HASH is set",
      });
    }
  });

export type Env = z.infer<typeof Schema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return Schema.parse(raw);
}

export const env: Env = parseEnv(process.env);
```

- [ ] **Step 4: Create `.env.example`**

```
# Required. Postgres URL in production, file URL for SQLite in dev.
DATABASE_URL=postgresql://kb:kb@localhost:5432/kb

# Optional. Absolute path to your existing cv-template repo, used by the Settings importer button.
KB_SOURCE_REPO_PATH=

# Optional. Set to enable password gate. Generate with `npm run hash-password`.
ADMIN_PASSWORD_HASH=

# Required if ADMIN_PASSWORD_HASH is set. At least 32 chars. Used to sign session cookies.
SESSION_SECRET=
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test -- tests/unit/lib/env.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/env.ts .env.example tests/unit/lib/env.test.ts
git commit -m "phase 1: add env validation + .env.example"
```

---

## Task 7: Prisma schema (full data model)

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())

  profile        Profile?
  educations     EducationEntry[]
  roles          ExperienceRole[]
  skillCategories SkillCategory[]
  softSkills     SoftSkill[]
  principles     ValuePrinciple[]
  narrative      ValueCareerNarrative?
  opinions       ValueIndustryOpinion[]
  themes         ValueLinkedInTheme[]
  applications   Application[]
  importRuns     ImportRun[]
}

model Profile {
  id                  Int      @id @default(autoincrement())
  userId              Int      @unique
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  fullName            String
  headline            String
  locationCity        String?
  locationCountry     String?
  email               String
  phone               String?
  linkedinUrl         String?
  githubUrl           String?
  websiteUrl          String?
  professionalSummary String

  keyQualifications   KeyQualification[]
  languages           Language[]
}

model KeyQualification {
  id        Int     @id @default(autoincrement())
  profileId Int
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  text      String
  order     Int
}

model Language {
  id          Int     @id @default(autoincrement())
  profileId   Int
  profile     Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name        String
  proficiency String
  order       Int
}

enum EducationKind {
  degree
  certification
  course
}

model EducationEntry {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind        EducationKind
  institution String?
  name        String
  field       String?
  startDate   String?
  endDate     String?
  notes       String?
  order       Int
}

enum EmploymentType {
  full_time
  part_time
  contract
  internship
}

model ExperienceRole {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug              String
  company           String
  title             String
  startDate         String
  endDate           String?
  location          String?
  employmentType    EmploymentType
  companyUrl        String?
  overview          String
  scopeTeamSize     String?
  scopeReportingTo  String?
  scopeTechStack    String?
  scopeBudget       String?
  isHighlightsOnly  Boolean  @default(false)

  achievements      Achievement[]
  highlights        Highlight[]
  tags              RoleTag[]
  skillApplications SkillApplication[]

  @@unique([userId, slug])
}

model Achievement {
  id      Int      @id @default(autoincrement())
  roleId  Int
  role    ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  title   String
  result  String
  context String
  action  String
  order   Int
  tags    AchievementTag[]
}

model Highlight {
  id     Int    @id @default(autoincrement())
  roleId Int
  role   ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  text   String
  order  Int
}

model Tag {
  id    Int    @id @default(autoincrement())
  slug  String @unique
  label String

  roles        RoleTag[]
  achievements AchievementTag[]
  softSkills   SoftSkillTag[]
}

model RoleTag {
  roleId Int
  tagId  Int
  role   ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  tag    Tag            @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([roleId, tagId])
}

model AchievementTag {
  achievementId Int
  tagId         Int
  achievement   Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  tag           Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([achievementId, tagId])
}

model SkillCategory {
  id     Int     @id @default(autoincrement())
  userId Int
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name   String
  order  Int

  skills Skill[]

  @@unique([userId, name])
}

enum Proficiency {
  familiar
  proficient
  expert
}

model Skill {
  id          Int      @id @default(autoincrement())
  categoryId  Int
  category    SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        String
  proficiency Proficiency
  notes       String?
  order       Int

  applications SkillApplication[]

  @@unique([categoryId, name])
}

model SkillApplication {
  skillId Int
  roleId  Int
  skill   Skill          @relation(fields: [skillId], references: [id], onDelete: Cascade)
  role    ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  @@id([skillId, roleId])
}

model SoftSkill {
  id                Int    @id @default(autoincrement())
  userId            Int
  user              User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  name              String
  whereDemonstrated String
  whatHappened      String
  order             Int

  tags SoftSkillTag[]
}

model SoftSkillTag {
  softSkillId Int
  tagId       Int
  softSkill   SoftSkill @relation(fields: [softSkillId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)
  @@id([softSkillId, tagId])
}

model ValuePrinciple {
  id            Int    @id @default(autoincrement())
  userId        Int
  user          User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  statement     String
  justification String
  order         Int
}

model ValueCareerNarrative {
  id     Int    @id @default(autoincrement())
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  text   String
}

model ValueIndustryOpinion {
  id              Int    @id @default(autoincrement())
  userId          Int
  user            User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  position        String
  why             String
  counterargument String
  order           Int
}

model ValueLinkedInTheme {
  id     Int    @id @default(autoincrement())
  userId Int
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  text   String
  order  Int
}

enum JdLanguage {
  en
  de
}

enum ApplicationStatus {
  drafting
  applied
  interviewing
  offer
  closed
}

model Application {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug      String
  company   String
  roleTitle String
  language  JdLanguage
  status    ApplicationStatus @default(drafting)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  jobDescription      JobDescription?
  tailoringStrategy   TailoringStrategy?
  companyNotes        CompanyNotes?
  interviewPrepBriefs InterviewPrepBrief[]
  artifacts           Artifact[]

  @@unique([userId, slug])
}

enum JdSourceType {
  url
  path
  pasted
}

model JobDescription {
  id            Int          @id @default(autoincrement())
  applicationId Int          @unique
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  sourceType    JdSourceType
  sourceValue   String?
  capturedAt    DateTime
  content       String
}

model TailoringStrategy {
  id            Int          @id @default(autoincrement())
  applicationId Int          @unique
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  content       Json
  approvedAt    DateTime?
}

model CompanyNotes {
  id            Int          @id @default(autoincrement())
  applicationId Int          @unique
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  researchedAt  DateTime
  lastUpdated   DateTime
  content       Json
}

model InterviewPrepBrief {
  id            Int         @id @default(autoincrement())
  applicationId Int
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  stageName     String
  generatedAt   DateTime
  content       Json

  @@unique([applicationId, stageName])
}

enum ArtifactKind {
  cv
  cover_letter
}

model Artifact {
  id            Int          @id @default(autoincrement())
  applicationId Int
  application   Application  @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  kind          ArtifactKind
  typstSource   String
  pdfPath       String?
  generatedAt   DateTime     @default(now())
  version       Int

  @@unique([applicationId, kind, version])
}

enum ImportResult {
  success
  partial
  failed
  in_progress
}

model ImportRun {
  id         Int           @id @default(autoincrement())
  userId     Int
  user       User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  startedAt  DateTime      @default(now())
  finishedAt DateTime?
  sourcePath String
  result     ImportResult
  summary    Json
}
```

- [ ] **Step 2: Run `prisma format` to verify syntax**

```bash
npx prisma format
```

Expected: no changes (already formatted) or whitespace fixes. No errors.

- [ ] **Step 3: Generate the migration**

Start a local Postgres for migration generation (use docker quickly):

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate dev --name init
```

Expected: migration file created under `prisma/migrations/<timestamp>_init/migration.sql`. Database in sync.

Stop the temp container:

```bash
docker stop kb-pg-tmp
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "phase 1: add Prisma schema + initial migration"
```

---

## Task 8: Prisma client singleton

**Files:**
- Create: `server/data/db.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/server/data/db.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("db singleton", () => {
  it("exports a Prisma client instance", async () => {
    const { db } = await import("@/server/data/db");
    expect(db).toBeDefined();
    expect(typeof db.user.findFirst).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/server/data/db.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `server/data/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { db?: PrismaClient };

export const db: PrismaClient =
  globalForPrisma.db ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/server/data/db.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/data/db.ts tests/unit/server/data/db.test.ts
git commit -m "phase 1: add Prisma client singleton"
```

---

## Task 9: Single-user scoping wrapper

**Files:**
- Create: `server/data/current-user.ts`
- Create: `tests/unit/server/data/current-user.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { CURRENT_USER_ID, scopeToUser } from "@/server/data/current-user";

describe("current-user", () => {
  it("CURRENT_USER_ID is 1", () => {
    expect(CURRENT_USER_ID).toBe(1);
  });

  it("scopeToUser adds userId to a where clause", () => {
    expect(scopeToUser({})).toEqual({ userId: 1 });
    expect(scopeToUser({ slug: "x" })).toEqual({ slug: "x", userId: 1 });
  });

  it("scopeToUser preserves an existing userId only if it equals CURRENT_USER_ID", () => {
    expect(scopeToUser({ userId: 1 })).toEqual({ userId: 1 });
    expect(() => scopeToUser({ userId: 99 })).toThrow(/userId mismatch/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/server/data/current-user.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
export const CURRENT_USER_ID = 1 as const;

export function scopeToUser<T extends { userId?: number }>(where: T): T & { userId: number } {
  if (where.userId !== undefined && where.userId !== CURRENT_USER_ID) {
    throw new Error(`userId mismatch: got ${where.userId}, expected ${CURRENT_USER_ID}`);
  }
  return { ...where, userId: CURRENT_USER_ID };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/server/data/current-user.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/data/current-user.ts tests/unit/server/data/current-user.test.ts
git commit -m "phase 1: add single-user scoping wrapper"
```

---

## Task 10: ActionResult type + helpers

**Files:**
- Create: `server/actions/result.ts`
- Create: `tests/unit/server/actions/result.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { ok, err, type ActionResult } from "@/server/actions/result";

describe("ActionResult helpers", () => {
  it("ok wraps a value", () => {
    const result: ActionResult<number> = ok(42);
    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("err builds an error", () => {
    const result = err("VALIDATION_FAILED", "bad input", { name: "required" });
    expect(result).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_FAILED",
        message: "bad input",
        fieldErrors: { name: "required" },
      },
    });
  });

  it("err omits fieldErrors when not provided", () => {
    const result = err("NOT_FOUND", "no such row");
    expect(result).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "no such row" },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- tests/unit/server/actions/result.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "UNIQUE_CONFLICT"
  | "INTERNAL";

export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return fieldErrors
    ? { ok: false, error: { code, message, fieldErrors } }
    : { ok: false, error: { code, message } };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- tests/unit/server/actions/result.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/actions/result.ts tests/unit/server/actions/result.test.ts
git commit -m "phase 1: add ActionResult type + ok/err helpers"
```

---

## Task 11: Seed script (user + tags + default skill categories)

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Implement `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULT_TAGS = [
  { slug: "leadership", label: "Leadership" },
  { slug: "technical", label: "Technical" },
  { slug: "strategy", label: "Strategy" },
  { slug: "delivery", label: "Delivery" },
  { slug: "culture", label: "Culture" },
  { slug: "growth", label: "Growth" },
  { slug: "innovation", label: "Innovation" },
];

const DEFAULT_SKILL_CATEGORIES = [
  "Languages",
  "Infrastructure & Platforms",
  "Architecture & Design",
  "AI & Developer Experience",
  "Methods & Practices",
];

async function main() {
  const user = await db.user.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  for (const tag of DEFAULT_TAGS) {
    await db.tag.upsert({
      where: { slug: tag.slug },
      update: { label: tag.label },
      create: tag,
    });
  }

  let order = 0;
  for (const name of DEFAULT_SKILL_CATEGORIES) {
    await db.skillCategory.upsert({
      where: { userId_name: { userId: user.id, name } },
      update: { order },
      create: { userId: user.id, name, order },
    });
    order += 1;
  }

  console.log("Seeded user", user.id, "tags", DEFAULT_TAGS.length, "categories", DEFAULT_SKILL_CATEGORIES.length);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Write integration test that runs the seed**

Create `tests/integration/seed.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/server/data/db";
import { execSync } from "node:child_process";

describe("seed", () => {
  beforeAll(() => {
    execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit" });
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("creates user 1", async () => {
    const user = await db.user.findUnique({ where: { id: 1 } });
    expect(user).not.toBeNull();
  });

  it("creates 7 default tags", async () => {
    const tags = await db.tag.findMany();
    expect(tags.length).toBe(7);
    expect(tags.map((t) => t.slug).sort()).toEqual([
      "culture",
      "delivery",
      "growth",
      "innovation",
      "leadership",
      "strategy",
      "technical",
    ]);
  });

  it("creates 5 default skill categories for user 1", async () => {
    const cats = await db.skillCategory.findMany({ where: { userId: 1 } });
    expect(cats.length).toBe(5);
  });

  it("is idempotent (re-running does not duplicate)", async () => {
    execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
    const tags = await db.tag.findMany();
    const cats = await db.skillCategory.findMany({ where: { userId: 1 } });
    expect(tags.length).toBe(7);
    expect(cats.length).toBe(5);
  });
});
```

- [ ] **Step 3: Add a test DB to compose for tests**

(Deferred to Task 14 — Docker compose. For now the test assumes a local Postgres on port 5432 with the env var set.)

- [ ] **Step 4: Run integration test**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npm test -- tests/integration/seed.test.ts
```

Expected: PASS (4 tests). Stop temp container after: `docker stop kb-pg-tmp`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts tests/integration/seed.test.ts
git commit -m "phase 1: add seed + integration test"
```

---

## Task 12: Hash-password helper script

**Files:**
- Create: `scripts/hash-password.ts`

- [ ] **Step 1: Implement**

```ts
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pw = await rl.question("Password: ");
  rl.close();
  if (!pw) {
    console.error("Empty password");
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 12);
  console.log("\nPaste this into your .env as ADMIN_PASSWORD_HASH:");
  console.log(hash);
}

main();
```

- [ ] **Step 2: Smoke test it**

```bash
echo "testpw" | npx tsx scripts/hash-password.ts
```

Expected: prints a `$2b$12$...` hash. No automated test — interactive script.

- [ ] **Step 3: Commit**

```bash
git add scripts/hash-password.ts
git commit -m "phase 1: add hash-password CLI"
```

---

## Task 13: Iron-session config + auth middleware

**Files:**
- Create: `server/auth/session.ts`
- Create: `middleware.ts`
- Create: `tests/unit/server/auth/session.test.ts`

- [ ] **Step 1: Write the test for session config shape**

```ts
import { describe, it, expect } from "vitest";
import { sessionOptions } from "@/server/auth/session";

describe("sessionOptions", () => {
  it("has the expected cookie config", () => {
    expect(sessionOptions.cookieName).toBe("kb-session");
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
    expect(sessionOptions.cookieOptions?.sameSite).toBe("lax");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
SESSION_SECRET=$(node -e "console.log('a'.repeat(32))") \
ADMIN_PASSWORD_HASH=dummy \
DATABASE_URL=postgresql://kb:kb@localhost:5432/kb \
npm test -- tests/unit/server/auth/session.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `server/auth/session.ts`**

```ts
import type { SessionOptions } from "iron-session";

export type SessionData = {
  authenticated: true;
};

export const sessionOptions: SessionOptions = {
  cookieName: "kb-session",
  password: process.env.SESSION_SECRET ?? "x".repeat(32),
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  },
};
```

- [ ] **Step 4: Implement `middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "@/server/auth/session";

const PUBLIC_PATHS = new Set(["/login", "/api/health"]);

export async function middleware(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD_HASH) return NextResponse.next();
  const pathname = req.nextUrl.pathname;
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.authenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Run test to verify it passes**

```bash
SESSION_SECRET=$(node -e "console.log('a'.repeat(32))") \
ADMIN_PASSWORD_HASH=dummy \
DATABASE_URL=postgresql://kb:kb@localhost:5432/kb \
npm test -- tests/unit/server/auth/session.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server/auth/session.ts middleware.ts tests/unit/server/auth/session.test.ts
git commit -m "phase 1: add iron-session config + auth middleware"
```

---

## Task 14: Docker compose for dev/prod

**Files:**
- Create: `compose.yaml`
- Create: `Dockerfile`

- [ ] **Step 1: Create `compose.yaml`**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: kb
      POSTGRES_PASSWORD: kb
      POSTGRES_DB: kb
    ports:
      - "5432:5432"
    volumes:
      - kb-db:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "kb"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://kb:kb@db:5432/kb
      NODE_ENV: production
    ports:
      - "3000:3000"
    command: sh -c "npx prisma migrate deploy && npx tsx prisma/seed.ts && node .next/standalone/server.js"

volumes:
  kb-db:
```

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 3000
```

- [ ] **Step 3: Add `output: "standalone"` to `next.config.ts`**

Edit `next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    typedRoutes: true,
  },
};

export default config;
```

- [ ] **Step 4: Smoke test compose**

```bash
docker compose up --build -d
sleep 10
curl -s http://localhost:3000/api/health
```

Expected: `{"ok":true}`. Then `docker compose down`.

- [ ] **Step 5: Commit**

```bash
git add compose.yaml Dockerfile next.config.ts
git commit -m "phase 1: add Docker compose + Dockerfile"
```

---

## Task 15: CI grep guard for raw Prisma calls

**Files:**
- Create: `scripts/check-prisma-scoping.sh`
- Modify: `package.json` (add to test script)

- [ ] **Step 1: Create the guard script**

```bash
#!/usr/bin/env bash
set -euo pipefail

VIOLATIONS=$(grep -rEn "db\.(user|profile|experienceRole|achievement|skill|skillCategory|skillApplication|softSkill|education|valuePrinciple|valueIndustryOpinion|valueLinkedInTheme|valueCareerNarrative|application|jobDescription|tailoringStrategy|companyNotes|interviewPrepBrief|artifact|importRun)\.(findFirst|findMany|create|update|delete)\(" app/ server/actions/ 2>/dev/null | grep -v "scopeToUser" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "Raw Prisma calls without scopeToUser detected:"
  echo "$VIOLATIONS"
  exit 1
fi
echo "Prisma scoping check passed."
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/check-prisma-scoping.sh
```

- [ ] **Step 3: Run it (should pass — no app/ or server/actions/ contents yet)**

```bash
./scripts/check-prisma-scoping.sh
```

Expected: `Prisma scoping check passed.`

- [ ] **Step 4: Update `package.json` to run it as part of `test`**

Edit `package.json`:

```json
{
  "scripts": {
    "test": "./scripts/check-prisma-scoping.sh && vitest run"
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add scripts/check-prisma-scoping.sh package.json
git commit -m "phase 1: add Prisma scoping CI guard"
```

---

## Task 16: Final Phase 1 verification

- [ ] **Step 1: Clean install + full test suite**

```bash
rm -rf node_modules .next
npm install
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16
sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npm test
```

Expected: all tests PASS. Stop temp DB: `docker stop kb-pg-tmp`.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Confirm Phase 1 acceptance**

The repo now has:
- A booting Next.js app at `localhost:3000` showing "Phase 1 OK"
- `/api/health` returning `{ ok: true }`
- A full Prisma schema applied via migration
- A seed that creates user(1), 7 tags, 5 skill categories
- ActionResult helpers, scopeToUser wrapper, env validation
- Optional auth middleware behind `ADMIN_PASSWORD_HASH`
- Docker compose for dev + prod
- Vitest passing on all of the above
- CI grep guard for Prisma scoping

Phase 1 is complete. Phase 2 (design system + shell) begins from here.
