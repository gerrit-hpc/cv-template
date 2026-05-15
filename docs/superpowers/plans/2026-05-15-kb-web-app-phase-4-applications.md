# KB Web App — Phase 4: Applications + JSONB Editors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Application list, creation, and detail page with six panes: Job description, Tailoring strategy, Company notes, Interview prep briefs, Artifacts (read-only), and a Chat stub. Tailoring strategy / company notes / prep briefs use JSONB content with section-by-section sub-form editors that produce Zod-validated shapes matching `design/ui-design-spec.md` §Pane 2-4 and the data-model spec §2.4.

**Architecture:** Each pane is its own React Server Component that fetches its slice + a client form for editing. JSONB content stored as Prisma `Json` columns; Zod schemas guard read + write. Markdown rendering uses `react-markdown` + `remark-gfm` + `rehype-sanitize`. Status changes use a small client dropdown.

**Tech Stack:** Prisma `Json`, Zod (deeply nested schemas), `react-markdown`, `remark-gfm`, `rehype-sanitize`.

**Spec reference:** §2.4 (JSONB content shapes), §4 (route map for applications), `design/ui-design-spec.md` §Application Detail.

---

## File structure (delivered by end of Phase 4)

```
app/(shell)/applications/
  page.tsx                                # list
  new/page.tsx                            # create form
  [slug]/
    page.tsx                              # detail (renders all panes)
    job-description-pane.tsx
    tailoring-strategy-pane.tsx
    company-notes-pane.tsx
    briefs-pane.tsx
    artifacts-pane.tsx
    chat-pane.tsx
    status-dropdown.tsx

server/
  validation/
    application.ts                        # root + JSONB sub-schemas
  actions/
    application.ts
    job-description.ts
    tailoring-strategy.ts
    company-notes.ts
    interview-prep-brief.ts

components/
  sections/
    markdown-preview.tsx

tests/
  unit/server/validation/application.test.ts
  integration/server/actions/application.test.ts
```

---

## Task 1: Install markdown deps

- [ ] **Step 1:**

```bash
npm install react-markdown remark-gfm rehype-sanitize
npm install -D @types/hast
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "phase 4: install markdown rendering deps"
```

---

## Task 2: MarkdownPreview component

**Files:** `components/sections/markdown-preview.tsx` + `tests/unit/components/markdown-preview.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownPreview } from "@/components/sections/markdown-preview";

describe("MarkdownPreview", () => {
  it("renders headings and paragraphs", () => {
    render(<MarkdownPreview source={"# Hi\n\nbody"} />);
    expect(screen.getByRole("heading", { name: "Hi" })).toBeDefined();
    expect(screen.getByText("body")).toBeDefined();
  });
  it("supports GFM tables", () => {
    render(<MarkdownPreview source={"| a | b |\n|---|---|\n| 1 | 2 |\n"} />);
    expect(screen.getByRole("table")).toBeDefined();
  });
  it("sanitizes html", () => {
    render(<MarkdownPreview source={"<script>alert(1)</script>hello"} />);
    expect(screen.queryByText("alert(1)")).toBeNull();
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`components/sections/markdown-preview.tsx`:

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function MarkdownPreview({ source }: { source: string }) {
  return (
    <div className="prose prose-invert max-w-none text-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}
```

Add to `app/globals.css`:

```css
@layer components {
  .prose-invert h1 { @apply text-heading text-text mb-md; }
  .prose-invert h2 { @apply text-subheading text-text mt-lg mb-sm; }
  .prose-invert p { @apply text-body text-text mb-md; }
  .prose-invert ul { @apply list-disc pl-lg mb-md; }
  .prose-invert table { @apply border-collapse mb-md; }
  .prose-invert th, .prose-invert td { @apply border border-border px-md py-sm; }
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/components/markdown-preview.test.tsx
git add components/sections/markdown-preview.tsx app/globals.css tests/unit/components/markdown-preview.test.tsx
git commit -m "phase 4: add MarkdownPreview component"
```

---

## Task 3: Application validation schemas (root + JSONB shapes)

**File:** `server/validation/application.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import {
  ApplicationSchema,
  JobDescriptionSchema,
  TailoringStrategyContentSchema,
  CompanyNotesContentSchema,
  InterviewPrepBriefContentSchema,
} from "@/server/validation/application";

describe("Application schemas", () => {
  it("ApplicationSchema requires slug + company + roleTitle + language", () => {
    const r = ApplicationSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(fe.slug).toBeDefined();
    expect(fe.company).toBeDefined();
    expect(fe.roleTitle).toBeDefined();
    expect(fe.language).toBeDefined();
  });
  it("language must be en or de", () => {
    expect(() => ApplicationSchema.parse({ slug: "x", company: "c", roleTitle: "r", language: "fr" })).toThrow();
    expect(ApplicationSchema.parse({ slug: "x", company: "c", roleTitle: "r", language: "en" }).language).toBe("en");
  });
  it("JobDescriptionSchema requires sourceType + content", () => {
    const r = JobDescriptionSchema.safeParse({});
    if (r.success) throw new Error();
    expect(r.error.flatten().fieldErrors.sourceType).toBeDefined();
  });
  it("TailoringStrategyContentSchema accepts minimal valid input", () => {
    const v = TailoringStrategyContentSchema.parse({
      jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
      strategy: {
        headlineSummary: "x",
        experienceOrder: [],
        skillsLead: [],
        skillsDeprioritize: [],
        coverLetterAngle: { hook: "h", body1: "b", body2: "b", close: "c" },
      },
      gaps: [],
    });
    expect(v.gaps).toEqual([]);
  });
  it("CompanyNotesContentSchema requires calibration bands", () => {
    expect(() => CompanyNotesContentSchema.parse({ company: {}, role: {}, process: {}, calibration: {} })).toThrow();
  });
  it("InterviewPrepBriefContentSchema accepts minimal input", () => {
    const v = InterviewPrepBriefContentSchema.parse({
      stageContext: "x",
      anchorStories: [],
      questionClusters: [],
      toughQuestions: "",
      questionsToAsk: [],
      logistics: "",
    });
    expect(v.anchorStories).toEqual([]);
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/validation/application.ts`:

```ts
import { z } from "zod";
import { Slug } from "@/server/validation/common";

export const ApplicationSchema = z.object({
  id: z.number().optional(),
  slug: Slug,
  company: z.string().min(1, "Company is required"),
  roleTitle: z.string().min(1, "Role title is required"),
  language: z.enum(["en", "de"]),
  status: z.enum(["drafting", "applied", "interviewing", "offer", "closed"]).default("drafting"),
});

export const JobDescriptionSchema = z.object({
  sourceType: z.enum(["url", "path", "pasted"]),
  sourceValue: z.string().optional().nullable(),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "ISO date").optional(),
  content: z.string().min(1, "Content is required"),
});

export const TailoringStrategyContentSchema = z.object({
  jdSummary: z.object({
    mustHaves: z.array(z.string()),
    niceToHaves: z.array(z.string()),
    signals: z.array(z.string()),
    ambiguities: z.array(z.string()),
  }),
  strategy: z.object({
    headlineSummary: z.string(),
    experienceOrder: z.array(
      z.object({
        roleSlug: z.string(),
        leadAchievements: z.array(z.string()),
        dropAchievements: z.array(z.string()),
      }),
    ),
    skillsLead: z.array(z.string()),
    skillsDeprioritize: z.array(z.string()),
    coverLetterAngle: z.object({
      hook: z.string(),
      body1: z.string(),
      body2: z.string(),
      close: z.string(),
    }),
  }),
  gaps: z.array(
    z.object({
      requirement: z.string(),
      optionA: z.string(),
      optionB: z.string(),
      recommendation: z.enum(["A", "B", "address-head-on"]),
    }),
  ),
});

const CalibrationStyle = z.enum([
  "structured-behavioral",
  "unstructured-conversational",
  "case-heavy",
  "coding-heavy",
  "culture-heavy",
  "mixed",
]);
const CalibrationDifficulty = z.enum([
  "junior-screen",
  "mid-rigorous",
  "staff-level-deep-dive",
  "leadership-fit",
  "hybrid",
]);
const CalibrationTone = z.enum(["formal", "casual", "startup-scrappy", "corporate"]);

export const CompanyNotesContentSchema = z.object({
  company: z.object({
    overview: z.string(),
    products: z.string(),
    recentSignals: z.string(),
    leadership: z.string(),
    reputation: z.string(),
  }),
  role: z.object({
    beyondJd: z.string(),
    whyRole: z.string(),
  }),
  process: z.object({
    stages: z.array(
      z.object({
        name: z.string(),
        format: z.string(),
        duration: z.string(),
        who: z.string(),
        date: z.string().nullable(),
        status: z.enum(["known", "unknown"]),
      }),
    ),
    peopleToMeet: z.array(
      z.object({ name: z.string(), title: z.string(), linkedinUrl: z.string().nullable() }),
    ),
    logistics: z.string(),
  }),
  calibration: z.object({
    style: CalibrationStyle,
    difficulty: CalibrationDifficulty,
    tone: CalibrationTone,
    justification: z.string(),
  }),
  riskAreas: z.string(),
});

export const InterviewPrepBriefContentSchema = z.object({
  stageContext: z.string(),
  anchorStories: z.array(
    z.object({
      name: z.string(),
      sourceRoleSlug: z.string(),
      covers: z.array(z.string()),
      star: z.object({
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
      }),
      oneLineSummary: z.string(),
    }),
  ),
  questionClusters: z.array(
    z.object({
      name: z.string(),
      questions: z.array(z.object({ q: z.string(), howToAnswer: z.string() })),
    }),
  ),
  toughQuestions: z.string(),
  questionsToAsk: z.array(z.object({ question: z.string(), listenFor: z.string() })),
  logistics: z.string(),
});

export type ApplicationInput = z.infer<typeof ApplicationSchema>;
export type TailoringStrategyContent = z.infer<typeof TailoringStrategyContentSchema>;
export type CompanyNotesContent = z.infer<typeof CompanyNotesContentSchema>;
export type InterviewPrepBriefContent = z.infer<typeof InterviewPrepBriefContentSchema>;
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/unit/server/validation/application.test.ts
git add server/validation/application.ts tests/unit/server/validation/application.test.ts
git commit -m "phase 4: add Application + JSONB content Zod schemas"
```

---

## Task 4: Application root actions (create/update/delete + setStatus)

**File:** `server/actions/application.ts`

- [ ] **Step 1: Action integration test**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("application actions", () => {
  beforeAll(async () => resetDb());
  afterAll(async () => db.$disconnect());
  beforeEach(async () => { await db.application.deleteMany(); });

  it("createApplication creates a row", async () => {
    const { createApplication } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "acme-engineer"); fd.set("company", "Acme"); fd.set("roleTitle", "Engineer"); fd.set("language", "en");
    const r = await createApplication(fd);
    expect(r.ok).toBe(true);
    const app = await db.application.findFirst({ where: { slug: "acme-engineer" } });
    expect(app?.status).toBe("drafting");
  });

  it("createApplication rejects duplicate slug", async () => {
    const { createApplication } = await import("@/server/actions/application");
    const make = () => {
      const fd = new FormData();
      fd.set("slug", "x"); fd.set("company", "X"); fd.set("roleTitle", "Y"); fd.set("language", "en");
      return fd;
    };
    await createApplication(make());
    const r = await createApplication(make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("setApplicationStatus updates the status", async () => {
    const { createApplication, setApplicationStatus } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "a"); fd.set("company", "A"); fd.set("roleTitle", "B"); fd.set("language", "en");
    await createApplication(fd);
    const app = await db.application.findFirstOrThrow();
    const r = await setApplicationStatus(app.id, "applied");
    expect(r.ok).toBe(true);
    const updated = await db.application.findUnique({ where: { id: app.id } });
    expect(updated?.status).toBe("applied");
  });

  it("deleteApplication cascades", async () => {
    const { createApplication, deleteApplication } = await import("@/server/actions/application");
    const fd = new FormData();
    fd.set("slug", "z"); fd.set("company", "Z"); fd.set("roleTitle", "X"); fd.set("language", "en");
    await createApplication(fd);
    const app = await db.application.findFirstOrThrow();
    await deleteApplication(app.id);
    expect(await db.application.count()).toBe(0);
  });
});
```

- [ ] **Step 2: Run → FAIL, implement**

`server/actions/application.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ApplicationSchema } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  return {
    slug: String(fd.get("slug") ?? ""),
    company: String(fd.get("company") ?? ""),
    roleTitle: String(fd.get("roleTitle") ?? ""),
    language: String(fd.get("language") ?? "en") as "en" | "de",
  };
}

export async function createApplication(fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ApplicationSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  try {
    const a = await db.application.create({ data: { ...parsed.data, userId: CURRENT_USER_ID } });
    revalidatePath("/applications");
    return ok({ id: a.id, slug: a.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Slug already taken.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function updateApplication(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = ApplicationSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Application not found.");
  await db.application.update({ where: { id }, data: parsed.data });
  revalidatePath("/applications");
  return ok(null);
}

export async function setApplicationStatus(
  id: number,
  status: "drafting" | "applied" | "interviewing" | "offer" | "closed",
): Promise<ActionResult<null>> {
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Application not found.");
  await db.application.update({ where: { id }, data: { status } });
  revalidatePath("/applications");
  revalidatePath(`/applications/${existing.slug}`);
  return ok(null);
}

export async function deleteApplication(id: number): Promise<ActionResult<null>> {
  const existing = await db.application.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Application not found.");
  await db.application.delete({ where: { id } });
  revalidatePath("/applications");
  return ok(null);
}
```

- [ ] **Step 3: Run → PASS, commit**

```bash
npm test -- tests/integration/server/actions/application.test.ts
git add server/actions/application.ts tests/integration/server/actions/application.test.ts
git commit -m "phase 4: add Application root actions (create/update/setStatus/delete)"
```

---

## Task 5: Job description, tailoring strategy, company notes, interview prep brief actions

**Files:** four action files

- [ ] **Step 1: Implement `server/actions/job-description.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { JobDescriptionSchema } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertJobDescription(applicationId: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = JobDescriptionSchema.safeParse({
    sourceType: String(fd.get("sourceType") ?? "pasted"),
    sourceValue: String(fd.get("sourceValue") ?? "") || null,
    content: String(fd.get("content") ?? ""),
  });
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the JD.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.jobDescription.upsert({
    where: { applicationId },
    create: {
      applicationId,
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      capturedAt: new Date(),
      content: parsed.data.content,
    },
    update: {
      sourceType: parsed.data.sourceType,
      sourceValue: parsed.data.sourceValue,
      content: parsed.data.content,
    },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
```

- [ ] **Step 2: Implement `server/actions/tailoring-strategy.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { TailoringStrategyContentSchema, type TailoringStrategyContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertTailoringStrategy(
  applicationId: number,
  content: TailoringStrategyContent,
): Promise<ActionResult<null>> {
  const parsed = TailoringStrategyContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Strategy malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.tailoringStrategy.upsert({
    where: { applicationId },
    create: { applicationId, content: parsed.data },
    update: { content: parsed.data },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}

export async function approveTailoringStrategy(applicationId: number): Promise<ActionResult<null>> {
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID }, include: { tailoringStrategy: true } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  if (!app.tailoringStrategy) return err("NOT_FOUND", "No strategy to approve.");
  await db.tailoringStrategy.update({ where: { applicationId }, data: { approvedAt: new Date() } });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
```

- [ ] **Step 3: Implement `server/actions/company-notes.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { CompanyNotesContentSchema, type CompanyNotesContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertCompanyNotes(applicationId: number, content: CompanyNotesContent): Promise<ActionResult<null>> {
  const parsed = CompanyNotesContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Notes malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  const now = new Date();
  await db.companyNotes.upsert({
    where: { applicationId },
    create: { applicationId, content: parsed.data, researchedAt: now, lastUpdated: now },
    update: { content: parsed.data, lastUpdated: now },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
```

- [ ] **Step 4: Implement `server/actions/interview-prep-brief.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { InterviewPrepBriefContentSchema, type InterviewPrepBriefContent } from "@/server/validation/application";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function upsertInterviewPrepBrief(
  applicationId: number,
  stageName: string,
  content: InterviewPrepBriefContent,
): Promise<ActionResult<null>> {
  if (!stageName.match(/^[a-z0-9-]+$/)) {
    return err("VALIDATION_FAILED", "Stage name must be kebab-case.", { stageName: "Invalid" });
  }
  const parsed = InterviewPrepBriefContentSchema.safeParse(content);
  if (!parsed.success) return err("VALIDATION_FAILED", "Brief malformed.", zodToFieldErrors(parsed.error));
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.interviewPrepBrief.upsert({
    where: { applicationId_stageName: { applicationId, stageName } },
    create: { applicationId, stageName, content: parsed.data, generatedAt: new Date() },
    update: { content: parsed.data, generatedAt: new Date() },
  });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}

export async function deleteInterviewPrepBrief(applicationId: number, stageName: string): Promise<ActionResult<null>> {
  const app = await db.application.findFirst({ where: { id: applicationId, userId: CURRENT_USER_ID } });
  if (!app) return err("NOT_FOUND", "Application not found.");
  await db.interviewPrepBrief.delete({ where: { applicationId_stageName: { applicationId, stageName } } });
  revalidatePath(`/applications/${app.slug}`);
  return ok(null);
}
```

- [ ] **Step 5: Commit**

```bash
git add server/actions/job-description.ts server/actions/tailoring-strategy.ts server/actions/company-notes.ts server/actions/interview-prep-brief.ts
git commit -m "phase 4: add application-child actions (jd, strategy, notes, briefs)"
```

---

## Task 6: Applications list page

**File:** `app/(shell)/applications/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { RelativeDate } from "@/components/ui/relative-date";

export default async function ApplicationsListPage() {
  const apps = await db.application.findMany({
    where: { userId: CURRENT_USER_ID },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <Header
        title="Applications"
        subtitle={`${apps.length} application${apps.length === 1 ? "" : "s"}`}
        actions={<Link href="/applications/new"><Button>New application</Button></Link>}
      />
      <div className="p-2xl">
        {apps.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="Create an application to start tailoring CVs and tracking interviews."
            actions={<Link href="/applications/new"><Button>New application</Button></Link>}
          />
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_140px_180px_100px] gap-md px-lg py-sm bg-surface text-label uppercase text-text-secondary border-b border-border">
              <span>Company</span><span>Role</span><span>Status</span><span>Updated</span><span></span>
            </div>
            {apps.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.slug}`}
                className="grid grid-cols-[1fr_1fr_140px_180px_100px] gap-md items-center px-lg h-12 hover:bg-surface-raised border-b border-border-subtle last:border-b-0"
              >
                <span className="text-body">{a.company}</span>
                <span className="text-body">{a.roleTitle}</span>
                <StatusBadge status={a.status as any} />
                <RelativeDate date={a.updatedAt} />
                <Button variant="ghost">Open</Button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/page.tsx
git commit -m "phase 4: add Applications list page"
```

---

## Task 7: Applications new page

**File:** `app/(shell)/applications/new/page.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { useState } from "react";
import { createApplication } from "@/server/actions/application";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormSelect } from "@/components/forms/form-select";
import { SlugField } from "@/components/forms/slug-field";
import { slugify } from "@/server/actions/helpers";

const initial = { ok: true as const, data: { id: 0, slug: "" } };

export default function NewApplicationPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const derived = slugify(company, roleTitle);
  const [state, action] = useFormState(async (_: any, fd: FormData) => {
    const r = await createApplication(fd);
    if (r.ok) router.push(`/applications/${r.data.slug}`);
    return r;
  }, initial);
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};

  return (
    <>
      <Header title="New application" />
      <div className="p-2xl max-w-[560px] flex flex-col gap-md">
        <BackLink href="/applications" label="Applications" />
        <form action={action} className="flex flex-col gap-md">
          <FormField label="Company" name="company" value={company} onChange={(e) => setCompany(e.currentTarget.value)} error={fe.company} />
          <FormField label="Role title" name="roleTitle" value={roleTitle} onChange={(e) => setRoleTitle(e.currentTarget.value)} error={fe.roleTitle} />
          <FormSelect label="Language" name="language" defaultValue="en" options={[{ value: "en", label: "English" }, { value: "de", label: "Deutsch" }]} error={fe.language} />
          <label className="flex flex-col gap-xs">
            <span className="text-label uppercase text-text-secondary">Slug</span>
            <SlugField name="slug" derivedFrom={derived} />
            {fe.slug ? <span className="text-caption text-danger">{fe.slug}</span> : null}
          </label>
          <Button type="submit">Create</Button>
        </form>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/new/page.tsx
git commit -m "phase 4: add Applications new page"
```

---

## Task 8: Status dropdown

**File:** `app/(shell)/applications/[slug]/status-dropdown.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { setApplicationStatus } from "@/server/actions/application";
import { StatusBadge, type ApplicationStatus } from "@/components/ui/status-badge";

const STATUSES: ApplicationStatus[] = ["drafting", "applied", "interviewing", "offer", "closed"];

export function StatusDropdown({ applicationId, status }: { applicationId: number; status: ApplicationStatus }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-sm">
        <StatusBadge status={status} />
        <span className="text-text-secondary">▾</span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-sm bg-surface-overlay border border-border rounded-md p-xs flex flex-col gap-xs z-10">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={pending}
              onClick={() => start(async () => { await setApplicationStatus(applicationId, s); setOpen(false); })}
              className="text-left px-sm py-xs hover:bg-surface-raised rounded"
            >
              <StatusBadge status={s} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/status-dropdown.tsx
git commit -m "phase 4: add StatusDropdown"
```

---

## Task 9: Job description pane

**File:** `app/(shell)/applications/[slug]/job-description-pane.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { upsertJobDescription } from "@/server/actions/job-description";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/forms/form-select";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { MarkdownPreview } from "@/components/sections/markdown-preview";

type JobDescription = {
  sourceType: "url" | "path" | "pasted";
  sourceValue: string | null;
  capturedAt: Date;
  content: string;
} | null;

export function JobDescriptionPane({ applicationId, jd }: { applicationId: number; jd: JobDescription }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader
        title="Job description"
        actions={
          jd && !editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null
        }
      />
      <CardBody>
        {!jd && !editing ? (
          <div className="flex flex-col gap-sm">
            <p className="text-small text-text-secondary">
              No job description yet. Will be created by the chat workflow in sub-project 2.
            </p>
            <Button variant="secondary" onClick={() => setEditing(true)}>Add manually</Button>
          </div>
        ) : null}
        {jd && !editing ? <MarkdownPreview source={jd.content} /> : null}
        {editing ? (
          <form
            action={(fd) =>
              start(async () => {
                const r = await upsertJobDescription(applicationId, fd);
                if (r.ok) setEditing(false);
              })
            }
            className="flex flex-col gap-md"
          >
            <FormSelect
              label="Source type"
              name="sourceType"
              defaultValue={jd?.sourceType ?? "pasted"}
              options={[
                { value: "url", label: "URL" },
                { value: "path", label: "Path" },
                { value: "pasted", label: "Pasted" },
              ]}
            />
            <FormField label="Source value" name="sourceValue" defaultValue={jd?.sourceValue ?? ""} />
            <FormTextarea label="Content (markdown)" name="content" rows={16} defaultValue={jd?.content ?? ""} />
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={pending}>Save</Button>
            </div>
          </form>
        ) : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/job-description-pane.tsx
git commit -m "phase 4: add JobDescriptionPane"
```

---

## Task 10: Tailoring strategy pane (sub-form editor for JSONB)

**File:** `app/(shell)/applications/[slug]/tailoring-strategy-pane.tsx`

This is the most complex JSONB editor. The pane has three sub-sections (jdSummary, strategy, gaps). Each renders read-mode and edit-mode with section-by-section sub-forms.

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { upsertTailoringStrategy, approveTailoringStrategy } from "@/server/actions/tailoring-strategy";
import type { TailoringStrategyContent } from "@/server/validation/application";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";

const EMPTY: TailoringStrategyContent = {
  jdSummary: { mustHaves: [], niceToHaves: [], signals: [], ambiguities: [] },
  strategy: {
    headlineSummary: "",
    experienceOrder: [],
    skillsLead: [],
    skillsDeprioritize: [],
    coverLetterAngle: { hook: "", body1: "", body2: "", close: "" },
  },
  gaps: [],
};

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <p className="text-label uppercase text-text-secondary">{label}</p>
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-sm">
          <Input value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <Button variant="ghost" type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" type="button" onClick={() => onChange([...items, ""])}>Add</Button>
    </div>
  );
}

export function TailoringStrategyPane({
  applicationId,
  strategy,
  approvedAt,
}: {
  applicationId: number;
  strategy: TailoringStrategyContent | null;
  approvedAt: Date | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [content, setContent] = useState<TailoringStrategyContent>(strategy ?? EMPTY);

  return (
    <Card>
      <CardHeader
        title="Tailoring strategy"
        actions={
          <>
            {approvedAt ? (
              <span className="text-small text-text-secondary">approved {approvedAt.toISOString().slice(0, 10)}</span>
            ) : strategy ? (
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() => start(async () => { await approveTailoringStrategy(applicationId); })}
              >
                Mark approved
              </Button>
            ) : null}
            {!editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null}
          </>
        }
      />
      <CardBody className="flex flex-col gap-lg">
        {!strategy && !editing ? (
          <p className="text-small text-text-secondary">No strategy yet. Will be created by the chat workflow in sub-project 2.</p>
        ) : null}

        {strategy && !editing ? (
          <>
            <section>
              <p className="text-subheading mb-sm">JD summary</p>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <p className="text-label uppercase text-text-secondary">Must-haves</p>
                  <ul className="flex flex-wrap gap-xs mt-xs">{strategy.jdSummary.mustHaves.map((m, i) => <Tag key={i}>{m}</Tag>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Nice-to-haves</p>
                  <ul className="flex flex-wrap gap-xs mt-xs">{strategy.jdSummary.niceToHaves.map((m, i) => <Tag key={i}>{m}</Tag>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Signals</p>
                  <ul className="flex flex-col gap-xs mt-xs">{strategy.jdSummary.signals.map((s, i) => <li key={i} className="text-small">{s}</li>)}</ul>
                </div>
                <div>
                  <p className="text-label uppercase text-text-secondary">Ambiguities</p>
                  <ul className="flex flex-col gap-xs mt-xs">{strategy.jdSummary.ambiguities.map((s, i) => <li key={i} className="text-small">{s}</li>)}</ul>
                </div>
              </div>
            </section>
            <section>
              <p className="text-subheading mb-sm">Strategy</p>
              <p className="text-body mb-md">{strategy.strategy.headlineSummary}</p>
              <p className="text-label uppercase text-text-secondary">Cover letter</p>
              <div className="flex flex-col gap-xs mt-xs">
                <p><strong>Hook:</strong> {strategy.strategy.coverLetterAngle.hook}</p>
                <p><strong>Body 1:</strong> {strategy.strategy.coverLetterAngle.body1}</p>
                <p><strong>Body 2:</strong> {strategy.strategy.coverLetterAngle.body2}</p>
                <p><strong>Close:</strong> {strategy.strategy.coverLetterAngle.close}</p>
              </div>
            </section>
            <section>
              <p className="text-subheading mb-sm">Gaps flagged</p>
              {strategy.gaps.length === 0 ? <p className="text-small text-text-tertiary">No gaps flagged.</p> : (
                <table className="w-full text-small">
                  <thead className="text-label uppercase text-text-secondary">
                    <tr><th className="text-left p-xs">Requirement</th><th className="text-left p-xs">Option A</th><th className="text-left p-xs">Option B</th><th className="text-left p-xs">Recommendation</th></tr>
                  </thead>
                  <tbody>
                    {strategy.gaps.map((g, i) => (
                      <tr key={i} className="border-t border-border-subtle"><td className="p-xs">{g.requirement}</td><td className="p-xs">{g.optionA}</td><td className="p-xs">{g.optionB}</td><td className="p-xs">{g.recommendation}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-lg">
            <section className="flex flex-col gap-md">
              <p className="text-subheading">JD summary</p>
              <StringListEditor label="Must-haves" items={content.jdSummary.mustHaves} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, mustHaves: items } })} />
              <StringListEditor label="Nice-to-haves" items={content.jdSummary.niceToHaves} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, niceToHaves: items } })} />
              <StringListEditor label="Signals" items={content.jdSummary.signals} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, signals: items } })} />
              <StringListEditor label="Ambiguities" items={content.jdSummary.ambiguities} onChange={(items) => setContent({ ...content, jdSummary: { ...content.jdSummary, ambiguities: items } })} />
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Strategy</p>
              <Textarea rows={3} value={content.strategy.headlineSummary} placeholder="Headline summary" onChange={(e) => setContent({ ...content, strategy: { ...content.strategy, headlineSummary: e.target.value } })} />
              <StringListEditor label="Skills to lead with" items={content.strategy.skillsLead} onChange={(items) => setContent({ ...content, strategy: { ...content.strategy, skillsLead: items } })} />
              <StringListEditor label="Skills to deprioritize" items={content.strategy.skillsDeprioritize} onChange={(items) => setContent({ ...content, strategy: { ...content.strategy, skillsDeprioritize: items } })} />
              <p className="text-label uppercase text-text-secondary">Cover letter angle</p>
              {(["hook", "body1", "body2", "close"] as const).map((k) => (
                <Textarea key={k} rows={3} placeholder={k} value={content.strategy.coverLetterAngle[k]} onChange={(e) => setContent({ ...content, strategy: { ...content.strategy, coverLetterAngle: { ...content.strategy.coverLetterAngle, [k]: e.target.value } } })} />
              ))}
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Gaps</p>
              {content.gaps.map((g, i) => (
                <div key={i} className="flex flex-col gap-xs p-md border border-border rounded-md">
                  <Input placeholder="Requirement" value={g.requirement} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, requirement: e.target.value } : x) })} />
                  <Textarea rows={2} placeholder="Option A" value={g.optionA} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, optionA: e.target.value } : x) })} />
                  <Textarea rows={2} placeholder="Option B" value={g.optionB} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, optionB: e.target.value } : x) })} />
                  <Select value={g.recommendation} onChange={(e) => setContent({ ...content, gaps: content.gaps.map((x, j) => j === i ? { ...x, recommendation: e.target.value as "A" | "B" | "address-head-on" } : x) })}>
                    <option value="A">A</option><option value="B">B</option><option value="address-head-on">Address head-on</option>
                  </Select>
                  <Button variant="ghost" type="button" onClick={() => setContent({ ...content, gaps: content.gaps.filter((_, j) => j !== i) })}>Remove</Button>
                </div>
              ))}
              <Button variant="secondary" type="button" onClick={() => setContent({ ...content, gaps: [...content.gaps, { requirement: "", optionA: "", optionB: "", recommendation: "A" }] })}>Add gap</Button>
            </section>
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => { setContent(strategy ?? EMPTY); setEditing(false); }}>Cancel</Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => start(async () => {
                  const r = await upsertTailoringStrategy(applicationId, content);
                  if (r.ok) setEditing(false);
                })}
              >
                Save
              </Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/tailoring-strategy-pane.tsx
git commit -m "phase 4: add TailoringStrategyPane (JSONB sub-form editor)"
```

---

## Task 11: Company notes pane

**File:** `app/(shell)/applications/[slug]/company-notes-pane.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState, useTransition } from "react";
import { upsertCompanyNotes } from "@/server/actions/company-notes";
import type { CompanyNotesContent } from "@/server/validation/application";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const EMPTY: CompanyNotesContent = {
  company: { overview: "", products: "", recentSignals: "", leadership: "", reputation: "" },
  role: { beyondJd: "", whyRole: "" },
  process: { stages: [], peopleToMeet: [], logistics: "" },
  calibration: { style: "mixed", difficulty: "mid-rigorous", tone: "casual", justification: "" },
  riskAreas: "",
};

export function CompanyNotesPane({
  applicationId,
  notes,
  lastUpdated,
}: {
  applicationId: number;
  notes: CompanyNotesContent | null;
  lastUpdated: Date | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [content, setContent] = useState<CompanyNotesContent>(notes ?? EMPTY);

  return (
    <Card>
      <CardHeader
        title="Company notes"
        actions={
          <>
            {lastUpdated ? <span className="text-small text-text-secondary">updated {lastUpdated.toISOString().slice(0, 10)}</span> : null}
            {!editing ? <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button> : null}
          </>
        }
      />
      <CardBody className="flex flex-col gap-lg">
        {!notes && !editing ? <p className="text-small text-text-secondary">No company notes yet.</p> : null}
        {notes && !editing ? (
          <>
            <section className="grid grid-cols-2 gap-md">
              <div><p className="text-label uppercase text-text-secondary">Overview</p><p className="text-body">{notes.company.overview}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Products</p><p className="text-body">{notes.company.products}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Recent signals</p><p className="text-body">{notes.company.recentSignals}</p></div>
              <div><p className="text-label uppercase text-text-secondary">Leadership</p><p className="text-body">{notes.company.leadership}</p></div>
              <div className="col-span-2"><p className="text-label uppercase text-text-secondary">Reputation</p><p className="text-body">{notes.company.reputation}</p></div>
            </section>
            <section><p className="text-subheading mb-sm">Calibration</p><div className="flex gap-md"><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.style}</span><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.difficulty}</span><span className="px-md py-xs rounded-full bg-accent-muted text-accent text-label">{notes.calibration.tone}</span></div><p className="text-body mt-sm">{notes.calibration.justification}</p></section>
            <section><p className="text-subheading mb-sm">Risk areas</p><p className="text-body">{notes.riskAreas}</p></section>
          </>
        ) : null}

        {editing ? (
          <div className="flex flex-col gap-lg">
            <section className="grid grid-cols-2 gap-md">
              {(["overview", "products", "recentSignals", "leadership", "reputation"] as const).map((k) => (
                <Textarea key={k} rows={3} placeholder={k} value={content.company[k]} onChange={(e) => setContent({ ...content, company: { ...content.company, [k]: e.target.value } })} />
              ))}
            </section>
            <section className="grid grid-cols-2 gap-md">
              <Textarea rows={3} placeholder="Beyond JD" value={content.role.beyondJd} onChange={(e) => setContent({ ...content, role: { ...content.role, beyondJd: e.target.value } })} />
              <Textarea rows={3} placeholder="Why this role" value={content.role.whyRole} onChange={(e) => setContent({ ...content, role: { ...content.role, whyRole: e.target.value } })} />
            </section>
            <section className="flex flex-col gap-md">
              <p className="text-subheading">Calibration</p>
              <Select value={content.calibration.style} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, style: e.target.value as any } })}>
                <option value="structured-behavioral">structured-behavioral</option><option value="unstructured-conversational">unstructured-conversational</option><option value="case-heavy">case-heavy</option><option value="coding-heavy">coding-heavy</option><option value="culture-heavy">culture-heavy</option><option value="mixed">mixed</option>
              </Select>
              <Select value={content.calibration.difficulty} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, difficulty: e.target.value as any } })}>
                <option value="junior-screen">junior-screen</option><option value="mid-rigorous">mid-rigorous</option><option value="staff-level-deep-dive">staff-level-deep-dive</option><option value="leadership-fit">leadership-fit</option><option value="hybrid">hybrid</option>
              </Select>
              <Select value={content.calibration.tone} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, tone: e.target.value as any } })}>
                <option value="formal">formal</option><option value="casual">casual</option><option value="startup-scrappy">startup-scrappy</option><option value="corporate">corporate</option>
              </Select>
              <Textarea rows={3} placeholder="Justification" value={content.calibration.justification} onChange={(e) => setContent({ ...content, calibration: { ...content.calibration, justification: e.target.value } })} />
            </section>
            <Textarea rows={3} placeholder="Risk areas" value={content.riskAreas} onChange={(e) => setContent({ ...content, riskAreas: e.target.value })} />
            <div className="flex justify-end gap-sm">
              <Button variant="ghost" type="button" onClick={() => { setContent(notes ?? EMPTY); setEditing(false); }}>Cancel</Button>
              <Button type="button" disabled={pending} onClick={() => start(async () => { const r = await upsertCompanyNotes(applicationId, content); if (r.ok) setEditing(false); })}>Save</Button>
            </div>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
```

(Process stages + peopleToMeet editing is intentionally trimmed in v1 — the schema preserves them and existing data round-trips, but the UI doesn't expose adding/editing stages or people. Add later in Phase 2 sub-project work or a follow-up.)

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/company-notes-pane.tsx
git commit -m "phase 4: add CompanyNotesPane (company + calibration + risks)"
```

---

## Task 12: Briefs pane

**File:** `app/(shell)/applications/[slug]/briefs-pane.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import type { InterviewPrepBriefContent } from "@/server/validation/application";

type Brief = {
  stageName: string;
  generatedAt: Date;
  content: InterviewPrepBriefContent;
};

export function BriefsPane({ briefs }: { applicationId: number; briefs: Brief[] }) {
  const [openStage, setOpenStage] = useState<string | null>(null);
  return (
    <Card>
      <CardHeader title="Interview prep briefs" />
      <CardBody className="flex flex-col gap-md">
        {briefs.length === 0 ? (
          <p className="text-small text-text-secondary">No briefs yet.</p>
        ) : (
          briefs.map((b) => (
            <div key={b.stageName} className="border border-border-subtle rounded-md">
              <button type="button" className="w-full flex items-center justify-between p-md hover:bg-surface-raised" onClick={() => setOpenStage(openStage === b.stageName ? null : b.stageName)}>
                <span className="text-subheading">{b.stageName}</span>
                <span className="text-caption text-text-tertiary">generated {b.generatedAt.toISOString().slice(0, 10)}</span>
              </button>
              {openStage === b.stageName ? (
                <div className="p-md border-t border-border-subtle flex flex-col gap-md">
                  <section><p className="text-label uppercase text-text-secondary">Stage context</p><p className="text-body">{b.content.stageContext}</p></section>
                  <section>
                    <p className="text-label uppercase text-text-secondary mb-xs">Anchor stories</p>
                    {b.content.anchorStories.map((s, i) => (
                      <div key={i} className="p-md border border-border-subtle rounded-md mb-sm">
                        <p className="text-subheading">{s.name}</p>
                        <p className="text-caption text-text-tertiary">source: {s.sourceRoleSlug}</p>
                        <p className="text-body mt-sm"><strong>S:</strong> {s.star.situation}</p>
                        <p className="text-body"><strong>T:</strong> {s.star.task}</p>
                        <p className="text-body"><strong>A:</strong> {s.star.action}</p>
                        <p className="text-body"><strong>R:</strong> {s.star.result}</p>
                      </div>
                    ))}
                  </section>
                  <section>
                    <p className="text-label uppercase text-text-secondary mb-xs">Question clusters</p>
                    {b.content.questionClusters.map((c, i) => (
                      <details key={i} className="border border-border-subtle rounded-md p-md mb-sm">
                        <summary className="text-subheading cursor-pointer">{c.name}</summary>
                        <ul className="mt-sm flex flex-col gap-sm">
                          {c.questions.map((q, j) => (
                            <li key={j}><p className="text-body"><strong>Q:</strong> {q.q}</p><p className="text-body"><strong>A:</strong> {q.howToAnswer}</p></li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </section>
                  {b.content.toughQuestions ? <section><p className="text-label uppercase text-text-secondary">Tough questions</p><p className="text-body">{b.content.toughQuestions}</p></section> : null}
                  {b.content.questionsToAsk.length > 0 ? (
                    <section>
                      <p className="text-label uppercase text-text-secondary mb-xs">Questions to ask</p>
                      <table className="w-full text-small">
                        <tbody>{b.content.questionsToAsk.map((q, i) => <tr key={i} className="border-t border-border-subtle"><td className="p-xs">{q.question}</td><td className="p-xs text-text-secondary">{q.listenFor}</td></tr>)}</tbody>
                      </table>
                    </section>
                  ) : null}
                  {b.content.logistics ? <section><p className="text-label uppercase text-text-secondary">Logistics</p><p className="text-body">{b.content.logistics}</p></section> : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
}
```

(Brief creation/editing is intentionally read-only in v1 — they're created via the importer or, in sub-project 2, via chat. Manual editing in UI is a stretch goal.)

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/briefs-pane.tsx
git commit -m "phase 4: add BriefsPane (read-only brief viewer)"
```

---

## Task 13: Artifacts pane + chat stub pane

- [ ] **Step 1: Implement `artifacts-pane.tsx`**

```tsx
import { Card, CardHeader, CardBody } from "@/components/ui/card";

type Artifact = {
  kind: "cv" | "cover_letter";
  version: number;
  generatedAt: Date;
  pdfPath: string | null;
};

const LABELS = { cv: "CV", cover_letter: "Cover letter" } as const;

export function ArtifactsPane({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <Card>
      <CardHeader title="Artifacts" />
      <CardBody>
        {artifacts.length === 0 ? (
          <p className="text-small text-text-secondary">No artifacts yet. Regeneration lands in sub-project 3.</p>
        ) : (
          <ul className="flex flex-col gap-sm">
            {artifacts.map((a) => (
              <li key={`${a.kind}-${a.version}`} className="flex items-center justify-between p-sm border-b border-border-subtle">
                <span className="text-body">{LABELS[a.kind]} v{a.version} <span className="text-text-tertiary text-caption">{a.generatedAt.toISOString().slice(0, 10)}</span></span>
                {a.pdfPath ? <a href={a.pdfPath} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover">Download PDF</a> : <span className="text-text-tertiary text-small">No PDF</span>}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 2: Implement `chat-pane.tsx`**

```tsx
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export function ChatPane() {
  return (
    <Card className="border-dashed">
      <CardHeader title={<span className="flex items-center gap-sm">Chat <span className="px-sm py-xs rounded-full bg-warning-muted text-warning text-label">Soon</span></span>} />
      <CardBody>
        <p className="text-small text-text-secondary text-center py-lg">Conversational workflow lands in sub-project 2.</p>
      </CardBody>
    </Card>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/artifacts-pane.tsx app/\(shell\)/applications/\[slug\]/chat-pane.tsx
git commit -m "phase 4: add ArtifactsPane + ChatPane stub"
```

---

## Task 14: Application detail page (wires all panes)

**File:** `app/(shell)/applications/[slug]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { notFound } from "next/navigation";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { StatusDropdown } from "./status-dropdown";
import { JobDescriptionPane } from "./job-description-pane";
import { TailoringStrategyPane } from "./tailoring-strategy-pane";
import { CompanyNotesPane } from "./company-notes-pane";
import { BriefsPane } from "./briefs-pane";
import { ArtifactsPane } from "./artifacts-pane";
import { ChatPane } from "./chat-pane";
import {
  TailoringStrategyContentSchema,
  CompanyNotesContentSchema,
  InterviewPrepBriefContentSchema,
  type TailoringStrategyContent,
  type CompanyNotesContent,
  type InterviewPrepBriefContent,
} from "@/server/validation/application";
import type { ApplicationStatus } from "@/components/ui/status-badge";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await db.application.findFirst({
    where: { userId: CURRENT_USER_ID, slug },
    include: {
      jobDescription: true,
      tailoringStrategy: true,
      companyNotes: true,
      interviewPrepBriefs: { orderBy: { generatedAt: "asc" } },
      artifacts: { orderBy: [{ kind: "asc" }, { version: "desc" }] },
    },
  });
  if (!app) notFound();

  const strategy = app.tailoringStrategy
    ? (TailoringStrategyContentSchema.parse(app.tailoringStrategy.content) as TailoringStrategyContent)
    : null;
  const notes = app.companyNotes
    ? (CompanyNotesContentSchema.parse(app.companyNotes.content) as CompanyNotesContent)
    : null;
  const briefs = app.interviewPrepBriefs.map((b) => ({
    stageName: b.stageName,
    generatedAt: b.generatedAt,
    content: InterviewPrepBriefContentSchema.parse(b.content) as InterviewPrepBriefContent,
  }));

  return (
    <>
      <Header
        title={`${app.company} — ${app.roleTitle}`}
        actions={<StatusDropdown applicationId={app.id} status={app.status as ApplicationStatus} />}
      />
      <div className="p-2xl flex flex-col gap-lg">
        <BackLink href="/applications" label="Applications" />
        <JobDescriptionPane
          applicationId={app.id}
          jd={app.jobDescription ? {
            sourceType: app.jobDescription.sourceType,
            sourceValue: app.jobDescription.sourceValue,
            capturedAt: app.jobDescription.capturedAt,
            content: app.jobDescription.content,
          } : null}
        />
        <TailoringStrategyPane applicationId={app.id} strategy={strategy} approvedAt={app.tailoringStrategy?.approvedAt ?? null} />
        <CompanyNotesPane applicationId={app.id} notes={notes} lastUpdated={app.companyNotes?.lastUpdated ?? null} />
        <BriefsPane applicationId={app.id} briefs={briefs} />
        <ArtifactsPane artifacts={app.artifacts.map((a) => ({ kind: a.kind, version: a.version, generatedAt: a.generatedAt, pdfPath: a.pdfPath }))} />
        <ChatPane />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(shell\)/applications/\[slug\]/page.tsx
git commit -m "phase 4: wire application detail page with all panes"
```

---

## Task 15: Final Phase 4 verification

- [ ] **Step 1: Full test suite + typecheck + build**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy && npx tsx prisma/seed.ts
npm test && npm run typecheck && npm run build
docker stop kb-pg-tmp
```

- [ ] **Step 2: Smoke test**

```bash
npm run dev
```

Create an application, edit JD, tailoring strategy, company notes. Change status. Verify panes render correctly. Stop.

- [ ] **Step 3: Confirm Phase 4 acceptance**

Application list, creation, detail with six panes works. JSONB editors persist correctly. Phase 5 (importer + settings + a11y) begins from here.
