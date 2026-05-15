# KB Web App — Sub-project 1: Data Model + KB CRUD

**Date:** 2026-05-15
**Status:** Design (approved for spec write — pending user review of this document)
**Scope:** Sub-project 1 of 5 in the larger "turn the cv-template skills into a web app" effort.

## Companion documents

This spec covers **data model, behavior, and routes**. Visual design and page-by-page UI structure live in two companion documents under `design/` (the Open CoDesign working folder, tracked in git), which are authoritative for what they cover:

- **`design/DESIGN.md`** — the design system: color palette (dark theme), typography (Geist / Geist Mono), spacing scale, shape tokens, component primitives (button, input, card, tag, status badge), and do's/don'ts. The implementation must consume these tokens, not redefine them.
- **`design/ui-design-spec.md`** — page-by-page layout: shell (left rail + header + content), shared patterns (edit-in-place section, list view, empty state, reordering, tag selector), per-page mockups with field-level detail, an extended component inventory, and accessibility requirements.

Where this spec and the UI spec overlap, the UI spec is authoritative for **visual treatment and field layout**; this spec is authoritative for **data shapes, server behavior, and acceptance criteria**. Conflicts resolved during the sync are called out inline below.

---

## Context

The `cv-template` repo currently hosts a four-skill Claude Code workflow over a markdown knowledge base on disk:

- `/interview` builds the KB (`profile.md`, `education.md`, `skills.md`, `values.md`, `experience/*.md`).
- `/tailor` produces a per-application folder with a tailoring strategy and Typst-rendered CV + cover letter.
- `/research-company` adds company intel and calibration bands.
- `/interview-prep` writes per-stage prep briefs.

Every skill has an approval gate and treats disk as source of truth. The goal of the wider effort is to lift this onto a self-hosted web app where the user manages KB and applications through a UI, but the **primary interaction remains a conversation with an LLM, scoped to one application at a time**.

### Decomposition of the wider effort

1. **Data model + KB CRUD** (this spec) — Postgres schema, importer from existing markdown, CRUD pages. No LLM.
2. **Application chat workspace** — per-application chat (Anthropic SDK + tool-use); each skill workflow becomes an assistant "mode"; approval gates surface as UI confirmations.
3. **Artifact rendering** — server-side Typst → PDF, versioned per application.
4. **Skill orchestration layer** — extracts the current SKILL.md prompts into structured server-side workflows (pre-amble, gates, tool definitions, output schemas).
5. **Multi-user + auth + deploy** — deferred.

Each sub-project gets its own spec → plan → implementation cycle. This document covers sub-project 1 only.

---

## Foundational decisions (locked)

| Decision | Choice |
|---|---|
| Audience | Single-user, designed clean enough that multi-user is a straightforward later extension |
| Hosting | Self-hostable, runs locally or on a VPS via Docker compose |
| KB persistence | Database-first. Importer migrates from the existing markdown repo. No export-back-to-markdown in this slice. |
| Stack | Next.js 15 App Router + TypeScript, Prisma + Postgres (SQLite supported for local dev), Server Actions, Zod, Tailwind, shadcn/ui |
| LLM | Not in this sub-project (lands in sub-project 2) |
| PDF | Not in this sub-project (lands in sub-project 3) |
| Auth | Optional env-var password gate; no user table beyond a single seeded row |
| Importer | CLI script, idempotent, partial-success on parse failures |
| First-slice scope | Pure CRUD + import. No LLM, no PDF regeneration, no JD fetching. |

---

## 1. Architecture & stack

- **Runtime**: Node.js 22 LTS.
- **Framework**: Next.js 15 (App Router), TypeScript strict.
- **Database**: Postgres 16 in prod, SQLite in local dev. Prisma's multi-provider schema covers both; JSONB on Postgres maps to TEXT on SQLite (the application layer treats it as JSON regardless).
- **ORM**: Prisma. Schema lives at `prisma/schema.prisma`. Migrations are committed.
- **Mutations**: Server Actions exclusively. Every action returns `{ ok: true, data } | { ok: false, error }` (see §6).
- **Validation**: Zod at the Server Action boundary. Forms render field errors inline via `useFormState`.
- **Styling**: Tailwind CSS + shadcn/ui primitives, themed via the `design/DESIGN.md` token set (colors, typography, spacing, shapes). Geist + Geist Mono self-hosted via `next/font/local` or `next/font/google` — exact loader chosen at implementation time. No animation library yet.
- **Auth**: Optional. If `ADMIN_PASSWORD` env var is set, a middleware-level password gate guards every route except `/login` and `/api/health`. Cookie via `iron-session`, 30-day expiry, `HttpOnly + SameSite=Lax`.
- **Storage**: PDF artifacts (when sub-project 3 lands) live under `storage/artifacts/<application_slug>/...` outside the Next.js `public/` tree. This sub-project provisions the directory structure but does not write to it yet.
- **Logging**: Pino, JSON to stdout. No external aggregator.
- **Deployment**: Docker compose (`compose.yaml` with `app` + `db` services). Out of scope for this sub-project's implementation, but the schema must not preclude it.

### Folder layout in this repo

```
.claude/                  # existing — untouched
experience/               # existing — untouched (the markdown KB the importer reads)
applications/             # existing — untouched (the markdown applications the importer reads)
docs/superpowers/specs/   # design docs (this file)

app/                      # NEW — Next.js app
  layout.tsx
  page.tsx                # / → redirect
  profile/page.tsx
  experience/page.tsx
  experience/[slug]/page.tsx
  skills/page.tsx
  education/page.tsx
  values/page.tsx
  applications/page.tsx
  applications/[slug]/page.tsx
  settings/page.tsx
  login/page.tsx
  api/health/route.ts

components/               # NEW
  ui/                     # shadcn primitives
  forms/                  # field components, FormState wrappers
  navigation/             # left rail
  sections/               # one component per editable section

server/                   # NEW — Server Actions + data access
  actions/                # one file per surface (profile.ts, experience.ts, ...)
  data/                   # Prisma helpers, single-user scoping wrapper
  validation/             # Zod schemas
  importer/               # CLI importer (parsers + driver)

prisma/                   # NEW
  schema.prisma
  migrations/
  seed.ts                 # seeds user (id=1), tags, default skill categories

scripts/
  import.ts               # `npm run import` entrypoint, calls server/importer

test-fixtures/            # NEW — committed minimal cv-template repo for importer tests

tests/                    # NEW
  unit/
  integration/
  e2e/

package.json              # NEW
tsconfig.json             # NEW
next.config.ts            # NEW
compose.yaml              # NEW (db + app)
```

The existing markdown KB and `applications/` folder stay untouched. The web app reads from them only via the importer; once data is in the DB, it never reads back from disk.

---

## 2. Data model

Three families: **profile/KB** (normalized, edited field-by-field), **applications** (queryable spine + JSONB content for artifacts written wholesale), **artifacts** (versioned files).

### 2.1 Profile / KB

```prisma
model User {
  id          Int      @id @default(autoincrement())
  createdAt   DateTime @default(now())

  profile     Profile?
  educations  EducationEntry[]
  roles       ExperienceRole[]
  skillCategories SkillCategory[]
  softSkills  SoftSkill[]
  principles  ValuePrinciple[]
  narrative   ValueCareerNarrative?
  opinions    ValueIndustryOpinion[]
  themes      ValueLinkedInTheme[]
  applications Application[]
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
  professionalSummary String   @db.Text

  keyQualifications   KeyQualification[]
  languages           Language[]
}

model KeyQualification {
  id        Int     @id @default(autoincrement())
  profileId Int
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  text      String  @db.Text
  order     Int
}

model Language {
  id           Int     @id @default(autoincrement())
  profileId    Int
  profile      Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  name         String
  proficiency  String  // free-text: "native", "fluent C1", "conversational", etc.
  order        Int
}

model EducationEntry {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind        EducationKind
  institution String?
  name        String   // "MSc Computer Science", "AWS Solutions Architect", etc.
  field       String?  // degrees only
  startDate   String?  // YYYY-MM
  endDate     String?
  notes       String?  @db.Text
  order       Int
}

enum EducationKind {
  degree
  certification
  course
}

model ExperienceRole {
  id                Int      @id @default(autoincrement())
  userId            Int
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug              String   // "acme-staff-engineer", stable for cross-references
  company           String
  title             String
  startDate         String   // YYYY-MM
  endDate           String?  // YYYY-MM, null = present
  location          String?
  employmentType    EmploymentType
  companyUrl        String?
  overview          String   @db.Text
  scopeTeamSize     String?
  scopeReportingTo  String?
  scopeTechStack    String?  @db.Text
  scopeBudget       String?
  isHighlightsOnly  Boolean  @default(false)

  achievements      Achievement[]
  highlights        Highlight[]
  tags              RoleTag[]
  skillApplications SkillApplication[]

  @@unique([userId, slug])
}

enum EmploymentType {
  full_time
  part_time
  contract
  internship
}

model Achievement {
  id        Int      @id @default(autoincrement())
  roleId    Int
  role      ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  title     String
  result    String   @db.Text
  context   String   @db.Text
  action    String   @db.Text
  order     Int
  tags      AchievementTag[]
}

model Highlight {
  id      Int    @id @default(autoincrement())
  roleId  Int
  role    ExperienceRole @relation(fields: [roleId], references: [id], onDelete: Cascade)
  text    String @db.Text
  order   Int
}

model Tag {
  id    Int    @id @default(autoincrement())
  slug  String @unique  // "leadership", "technical", etc.
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
  id      Int     @id @default(autoincrement())
  userId  Int
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  name    String  // "Languages", "Infrastructure & Platforms", ...
  order   Int

  skills  Skill[]

  @@unique([userId, name])
}

model Skill {
  id          Int      @id @default(autoincrement())
  categoryId  Int
  category    SkillCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        String
  proficiency Proficiency
  notes       String?  @db.Text
  order       Int

  applications SkillApplication[]

  @@unique([categoryId, name])
}

enum Proficiency {
  familiar
  proficient
  expert
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
  whereDemonstrated String @db.Text
  whatHappened      String @db.Text
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
  id           Int    @id @default(autoincrement())
  userId       Int
  user         User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  statement    String @db.Text
  justification String @db.Text
  order        Int
}

model ValueCareerNarrative {
  id     Int    @id @default(autoincrement())
  userId Int    @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  text   String @db.Text
}

model ValueIndustryOpinion {
  id             Int    @id @default(autoincrement())
  userId         Int
  user           User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  position       String @db.Text
  why            String @db.Text
  counterargument String @db.Text
  order          Int
}

model ValueLinkedInTheme {
  id     Int    @id @default(autoincrement())
  userId Int
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  text   String @db.Text
  order  Int
}
```

### 2.2 Applications

```prisma
model Application {
  id          Int      @id @default(autoincrement())
  userId      Int
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slug        String   // "acme-staff-engineer", "acme-staff-engineer-2", etc.
  company     String
  roleTitle   String
  language    Language_  // "en" or "de"
  status      ApplicationStatus  @default(drafting)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  jobDescription      JobDescription?
  tailoringStrategy   TailoringStrategy?
  companyNotes        CompanyNotes?
  interviewPrepBriefs InterviewPrepBrief[]
  artifacts           Artifact[]

  @@unique([userId, slug])
}

// Renamed to avoid clash with the spoken-language Language model.
enum Language_ {
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

model JobDescription {
  id            Int      @id @default(autoincrement())
  applicationId Int      @unique
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  sourceType    JdSourceType
  sourceValue   String?  // URL or path; null for pasted
  capturedAt    DateTime
  content       String   @db.Text
}

enum JdSourceType {
  url
  path
  pasted
}

model TailoringStrategy {
  id            Int      @id @default(autoincrement())
  applicationId Int      @unique
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  content       Json     // see §2.4 for shape
  approvedAt    DateTime?
}

model CompanyNotes {
  id            Int      @id @default(autoincrement())
  applicationId Int      @unique
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  researchedAt  DateTime
  lastUpdated   DateTime
  content       Json     // see §2.4
}

model InterviewPrepBrief {
  id            Int      @id @default(autoincrement())
  applicationId Int
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  stageName     String   // "recruiter-screen", "hiring-manager", custom, ...
  generatedAt   DateTime
  content       Json     // see §2.4

  @@unique([applicationId, stageName])
}
```

### 2.3 Artifacts

```prisma
model Artifact {
  id            Int      @id @default(autoincrement())
  applicationId Int
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  kind          ArtifactKind
  typstSource   String   @db.Text
  pdfPath       String?  // filesystem path; null if not yet compiled
  generatedAt   DateTime @default(now())
  version       Int

  @@unique([applicationId, kind, version])
}

enum ArtifactKind {
  cv
  cover_letter
}
```

In sub-project 1, `Artifact` rows are written only by the importer (registering existing PDFs as `version=1`). Regeneration lands in sub-project 3.

### 2.3.1 Import run log

```prisma
model ImportRun {
  id         Int      @id @default(autoincrement())
  userId     Int
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  startedAt  DateTime @default(now())
  finishedAt DateTime?
  sourcePath String
  result     ImportResult
  summary    Json     // { counts: { imported, updated }, skipped: [{ file, error }] }
}

enum ImportResult {
  success
  partial
  failed
  in_progress
}
```

One row per importer invocation. The Settings page reads the most-recent row to render status.

### 2.4 JSONB content shapes

Stored as `Json` columns; mirrored by Zod schemas in `server/validation/`. Shapes intentionally match the current markdown skill outputs.

**`TailoringStrategy.content`**:
```ts
{
  jdSummary: {
    mustHaves: string[];     // verbatim JD quotes
    niceToHaves: string[];
    signals: string[];
    ambiguities: string[];
  };
  strategy: {
    headlineSummary: string;
    experienceOrder: Array<{
      roleSlug: string;
      leadAchievements: string[];   // achievement titles
      dropAchievements: string[];
    }>;
    skillsLead: string[];
    skillsDeprioritize: string[];
    coverLetterAngle: {
      hook: string;
      body1: string;
      body2: string;
      close: string;
    };
  };
  gaps: Array<{
    requirement: string;
    optionA: string;
    optionB: string;
    recommendation: "A" | "B" | "address-head-on";
  }>;
}
```

**`CompanyNotes.content`**:
```ts
{
  company: {
    overview: string;
    products: string;
    recentSignals: string;
    leadership: string;
    reputation: string;
  };
  role: {
    beyondJd: string;
    whyRole: string;
  };
  process: {
    stages: Array<{
      name: string;
      format: string;
      duration: string;
      who: string;
      date: string | null;
      status: "known" | "unknown";
    }>;
    peopleToMeet: Array<{ name: string; title: string; linkedinUrl: string | null }>;
    logistics: string;
  };
  calibration: {
    style: "structured-behavioral" | "unstructured-conversational" | "case-heavy" | "coding-heavy" | "culture-heavy" | "mixed";
    difficulty: "junior-screen" | "mid-rigorous" | "staff-level-deep-dive" | "leadership-fit" | "hybrid";
    tone: "formal" | "casual" | "startup-scrappy" | "corporate";
    justification: string;
  };
  riskAreas: string;
}
```

**`InterviewPrepBrief.content`**:
```ts
{
  stageContext: string;
  anchorStories: Array<{
    name: string;
    sourceRoleSlug: string;
    covers: string[];
    star: { situation: string; task: string; action: string; result: string };
    oneLineSummary: string;
  }>;
  questionClusters: Array<{
    name: string;
    questions: Array<{ q: string; howToAnswer: string }>;
  }>;
  toughQuestions: string;
  questionsToAsk: Array<{ question: string; listenFor: string }>;
  logistics: string;
}
```

### 2.5 Single-user scoping

All Prisma queries go through a thin wrapper in `server/data/current-user.ts`:

```ts
export const CURRENT_USER_ID = 1;
export const scopeToUser = <T extends { userId?: number }>(where: T) =>
  ({ ...where, userId: CURRENT_USER_ID });
```

When multi-user comes later, the wrapper switches to read session-derived user id. All `findMany` / `findFirst` / `create` calls must go through it. Lint rule (or grep guard in CI) enforces no raw `prisma.x.findMany({...})` calls in `app/` or `server/actions/`.

---

## 3. Importer (CLI + Settings UI)

**Entry points** (both invoke the same `server/importer/run.ts`):

1. **CLI**: `npm run import -- <path-to-cv-template-repo>` → `scripts/import.ts` → `server/importer/run.ts`.
2. **Settings UI**: `/settings` exposes a "Run importer" primary button (per `design/ui-design-spec.md` §Settings). The button triggers a Server Action that calls `server/importer/run.ts` with the default repo path resolved from an env var (`KB_SOURCE_REPO_PATH`) or a path field on the form. The action streams progress (one line per file) via a Server-Sent Events endpoint at `/api/import/stream`; the UI renders the stream in a status area. Last-import metadata (timestamp + result + skipped-file list) persists in a small `import_run` row so the Settings page survives a reload.

**Flags**:
- `--clean` — wipes all rows (cascading from `User`) and reimports. Re-seeds user + tags first.
- `--dry-run` — parses everything, prints what would change, writes nothing.

**Behavior**:

1. **Inventory**: walk the repo, list every file the importer cares about. Emit one log line per file.
2. **Parse**: per-file `try/catch`; accumulate parse failures with `{ file, line, error }`. Never abort on first failure.
3. **Resolve**: build an in-memory map of role slugs (for `SkillApplication` "Applied at" resolution; existing roles match by `company` column case-insensitive).
4. **Write** in dependency order: `User` (idempotent) → `Tag` seed → `Profile` → `EducationEntry[]` → `ExperienceRole[]` + achievements/highlights/tags → `SkillCategory[]` + `Skill[]` + `SkillApplication[]` → `SoftSkill[]` → `Value*` → `Application[]` + children.
5. **Conflict policy**: update-by-natural-key, never delete. Roles match by `(userId, slug)`. Skills match by `(categoryId, name)`. Applications match by `(userId, slug)`. Profile is 1:1. Updates replace child collections wholesale (e.g. re-import overwrites a role's achievements with the parsed set).
6. **Report**: at the end, print `IMPORTED: <counts>`, `UPDATED: <counts>`, `SKIPPED-WITH-ERRORS: <list>`.

**Parsers** live one-per-file under `server/importer/parsers/`:
- `profile.ts` — frontmatter + section parser for `profile.md`.
- `education.ts` — heading-based parser for `education.md`. Sections "Degrees" / "Certifications" / "Courses" map to `kind`.
- `experience.ts` — frontmatter + sections parser; detects `## Highlights` vs `## Achievements` for the `is_highlights_only` flag.
- `skills.ts` — table parser for hard-skill categories, structured parser for soft skills.
- `values.ts` — section-based narrative parser.
- `applications.ts` — walks one `applications/<slug>/` folder; subparsers for tailoring strategy / company notes / interview prep briefs reconstruct the JSONB shapes from rendered markdown.

Application-artifact parsing is best-effort: the markdown wasn't designed as a structured wire format. Unparseable sections become a single `raw` field in the JSONB and a parse warning. Sub-project 2 (chat) will write through Zod-validated shapes going forward; the rough import is just to seed history.

PDF discovery: any `cv.pdf` / `cover-letter.pdf` adjacent to a `.typ` file becomes an `Artifact` row with `version=1`, `pdfPath = <repo>/applications/<slug>/<file>.pdf`. The web app does not copy the file — it just registers the path. Sub-project 3 will define the copy/storage policy.

---

## 4. UI / route map

Left rail is persistent on every authenticated page. Routes:

| Path | Purpose | Notes |
|---|---|---|
| `/` | Bootstrap redirect | `/profile` if profile is empty, else `/applications` |
| `/login` | Single password field | Only rendered if `ADMIN_PASSWORD` is set |
| `/profile` | Edit profile | One form; sections: identity, summary, qualifications, languages |
| `/experience` | List of roles | Sorted by `startDate desc`; click → detail |
| `/experience/new` | Create role | Same layout as detail with empty fields; slug auto-generated from company + title, editable; redirects to `/experience/[slug]` on create |
| `/experience/[slug]` | Role detail | Frontmatter form + overview + scope + achievements/highlights editor + tags + **read-only** linked-skills list (skill ↔ role joins are managed from `/skills`, not here) |
| `/skills` | Categories + skills | Inline editable tables per category; soft-skills section below. Manages `SkillApplication` joins (skill ↔ role linking) here. |
| `/education` | Education list | Grouped by `kind` |
| `/education/new` | Create education entry | Inline or page form; kind select drives field visibility |
| `/values` | Four-section editor | Principles list, narrative textarea, opinions list, themes list |
| `/applications` | Application list | Table view: company, role, status badge, updated_at (relative), [Open]. Sorted by `updatedAt desc`. |
| `/applications/new` | Create application | Form: company, role title, language (en/de), slug (auto-generated, editable, mono font, validated unique); redirects to detail on create |
| `/applications/[slug]` | Application detail | Panes: JD / tailoring strategy / company notes / prep briefs / artifacts. Chat panel **stub** (placeholder card with "Soon" pill, per ui-design-spec.md §Pane 6) |
| `/settings` | Tag vocab + auth status + importer + danger zone | Auth section is read-only ("password protection is enabled/disabled" — env-var only in v1). Wipe-all requires typed `DELETE` confirmation. |
| `/api/health` | `200 OK` | For container probes |
| `/api/import/stream` | SSE | Server-Sent Events endpoint for the Settings importer button to stream per-file progress |

### UI conventions

- **Edit-in-place** with a per-section Save button. No autosave in v1. The Save button shows an 8px accent dot when the form has unsaved changes (per `design/ui-design-spec.md`).
- **Optimistic UI**: not in v1. Server Actions await, then revalidate. Acceptable because mutations are cheap.
- **Empty states**: every list view uses the empty-state component from `design/DESIGN.md` with an "import your existing markdown KB" pointer.
- **Forms**: `useFormState` + Server Action; errors render inline.
- **Reordering**: number input (`order` field), not drag-and-drop. v1 limitation.
- **Tags**: rendered as pills (per `design/DESIGN.md`); edit via the `TagSelector` component (`design/ui-design-spec.md`) — checkable dropdown over the seeded vocabulary with an inline "Create new tag" input that persists immediately.
- **Skill ↔ role linking** is managed only from `/skills`; the role detail page renders linked skills read-only. Rationale: one canonical surface avoids two-way sync UX bugs.
- **Destructive confirmations**: standard pattern from `design/ui-design-spec.md` — modal with typed confirmation (`DELETE`) for wipe-all and tag deletion when the tag is in use.

### Application detail page layout

```
+------------------------------------------------------------------+
| <- Applications     acme — Staff Engineer       [status: applied]|
+------------------------------------------------------------------+
| Job description                                            [Edit]|
|   <markdown render of jd content>                                |
+------------------------------------------------------------------+
| Tailoring strategy                  [approved 2026-03-12]  [Edit]|
|   <rendered view of jsonb content>                               |
+------------------------------------------------------------------+
| Company notes                       [last updated 2026-04-01]    |
|   <rendered view>                                                |
+------------------------------------------------------------------+
| Interview prep briefs                                            |
|   - recruiter-screen      generated 2026-04-05    [Open]         |
|   - hiring-manager        generated 2026-04-12    [Open]         |
+------------------------------------------------------------------+
| Artifacts                                                        |
|   - cv v1            2026-03-15           [Download PDF]         |
|   - cover-letter v1  2026-03-15           [Download PDF]         |
+------------------------------------------------------------------+
| Chat                                                             |
|   (placeholder card — sub-project 2)                             |
+------------------------------------------------------------------+
```

Editing a tailoring strategy / company notes / brief in v1 means raw JSON edit in a form, or section-by-section sub-forms — see §8 for the call.

---

## 5. Single-user / auth

- **Seed**: `prisma/seed.ts` creates `User(id=1)`, the seven default `Tag` rows (`leadership / technical / strategy / delivery / culture / growth / innovation`), and a default set of `SkillCategory` rows (`Languages`, `Infrastructure & Platforms`, `Architecture & Design`, `AI & Developer Experience`, `Methods & Practices`).
- **Optional auth**: middleware (`middleware.ts`) reads `ADMIN_PASSWORD_HASH`. Unset → no gate. Set → unauthenticated requests redirect to `/login`. Login compares plain-text input against `bcrypt.compare(input, env.ADMIN_PASSWORD_HASH)`. `npm run hash-password` is a small helper that prints a hash for the user to paste into their `.env`. If a user navigates to `/login` directly when `ADMIN_PASSWORD_HASH` is unset, the page renders an info card ("Authentication is not configured.") with a link back to `/profile` rather than a password field (per `design/ui-design-spec.md`).
- **Session**: `iron-session` cookie, 30-day expiry, `HttpOnly + SameSite=Lax + Secure` (Secure off in dev).
- **No CSRF lib**: Server Actions are origin-checked by Next.js. Pure-API endpoints (only `/api/health` in this slice) are public.
- **Single-user enforcement**: §2.5's wrapper. CI grep guard rejects raw Prisma calls in `app/` or `server/actions/`.

---

## 6. Error handling

### Server Action return shape

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };
```

Error codes are a closed enum: `VALIDATION_FAILED`, `NOT_FOUND`, `UNIQUE_CONFLICT`, `INTERNAL`. Unknown errors map to `INTERNAL` and are logged with the request id. (Auth is enforced at middleware; Server Actions never see unauthenticated state.)

### Form rendering

`useFormState` consumes the result. On `ok: false`, `fieldErrors` render inline on matching inputs; the top-level `message` renders as a banner.

### Importer

Per-file try/catch. Errors collected into a structured report. The script exits 0 if **any** file imported; exit 1 only if **everything** failed or the target path doesn't exist. Report printed to stdout in both cases.

### What we deliberately do not catch in v1

- Prisma client init errors (let the process die; surfaces fast in Docker compose logs)
- File-system errors from importer reading the source markdown (let the per-file try/catch handle it)
- Unhandled rejections in Server Actions (Next.js handles + renders the standard error UI)

---

## 7. Testing

Per the user's TDD preference and the brainstorming skill's guidance: every implementation step starts with a failing test.

### Unit tests (Vitest, no DB)

- Zod schemas — one test per schema verifying required fields + a malformed-input rejection.
- Importer parsers — one test per parser per fixture file (`test-fixtures/cv-template-minimal/`). Each parser is a pure `(string) => ParsedShape`; tests assert the shape.
- Value-object utilities (date parsing, slug generation).

### Integration tests (Vitest + real DB)

Run against a dedicated test database (Postgres or SQLite — pick Postgres for parity, but the test setup must work on SQLite for fast local iteration). One `beforeEach` resets the schema via `prisma migrate reset --force --skip-seed` and re-runs the seed.

Coverage:
- Every Server Action: happy path + at least one failure path (validation, not-found, unique-conflict).
- Importer end-to-end against `test-fixtures/cv-template-minimal/` — assert DB state after import; re-run and assert idempotency.

### E2E tests (Playwright)

One happy path per top-level surface, against a real running app + DB:
- Create + edit a role + add an achievement
- Create + edit a skill within a category
- Edit profile
- Edit values
- Create an application + edit its JD
- Importer: `npm run import -- test-fixtures/cv-template-minimal/` then navigate the UI to verify the imported content shows up

### What we deliberately skip in v1

- Visual regression tests
- Mobile / responsive E2E
- Load / perf tests
- Auth E2E coverage beyond a single "password gates routes" smoke test (skipped entirely if `ADMIN_PASSWORD_HASH` env handling is straightforward enough to be exercised in integration tests)

---

## 8. Open design calls (deliberately resolved here for the spec)

These came up while writing and are resolved as follows. Flag any to flip during your review.

1. **Editing application-artifact JSONB in v1**: section-by-section sub-forms, not raw JSON. The shapes are stable (§2.4) and a raw editor is a usability tarpit. The forms are small and follow the same `useFormState` pattern as the rest of the app.

2. **Empty state for application detail page**: shows the panes with "no content yet — will be created by the chat in sub-project 2" placeholders. No "create empty strategy" buttons in v1; data flows in via importer or (later) chat.

3. **Markdown rendering in the UI**: use `remark-gfm` + `rehype-sanitize` for JD content + the narrative parts of strategy/notes/briefs. No raw HTML allowed.

4. **Application status transitions**: free-form (any status can move to any other); no workflow validation. The status drives sorting and a column color; no behavior gates.

5. **Schema-level enums vs string fields**: Prisma enums for fixed taxonomies (`Proficiency`, `ApplicationStatus`, `EmploymentType`, `EducationKind`, `JdSourceType`, `Language_`, `ArtifactKind`). String fields for things users should be able to extend (language proficiency, tag slugs beyond the seven defaults — note: tags are a *table*, so extension means inserting rows, not extending an enum).

6. **`Tag` extensibility**: yes, via `/settings`. The seven defaults are seeded; users can add new tag slugs. Tag deletion cascades to all join tables — confirmed via a modal.

7. **Calibration content under `CompanyNotes.content.calibration`**: enum-typed strings in the JSONB (Zod refinement enforces the bands from the existing references). Not a separate column because the calibration is conceptually part of the notes, not a free-standing entity.

---

## 9. Out of scope (deferred)

Everything below lands in later sub-projects or is intentionally not built:

- LLM chat, tool-use, approval gates (sub-project 2)
- Typst regeneration, PDF preview (sub-project 3)
- JD URL fetching, company web pass (sub-projects 2 + 3)
- Skill orchestration extraction from SKILL.md (sub-project 4)
- Multi-user, OAuth/SSO, billing (sub-project 5)
- Drag-and-drop reordering
- Markdown re-export
- File-upload import wizard (CLI + Settings button are the only entry points; no drag-drop or file picker)
- Full mobile-responsive layouts — desktop-first (≥1024px); below 1024px the left rail collapses to a drawer (per `design/ui-design-spec.md` §Responsive Behavior) but no other layout adaptation
- Analytics / metrics
- Anything that touches the existing `.claude/skills/` directory

---

## 10. Accessibility

Inherited from `design/ui-design-spec.md` §Accessibility, restated here as implementation requirements:

- All interactive elements render a 2px `accent-muted` focus ring on `:focus-visible`.
- Form labels use `htmlFor` to associate with their inputs; error messages link via `aria-describedby`.
- Navigation renders as a semantic `<nav>` with a nested `<ul>` / `<li>` structure.
- Save success and error events fire into an `aria-live="polite"` region so screen readers announce the result.
- Color is never the sole carrier of meaning — status badges include a text label alongside the dot, gap-flagged rows include a textual indicator.
- Contrast targets: ≥ 4.5:1 for body text, ≥ 3:1 for UI components. The `design/DESIGN.md` palette is chosen to meet these against the dark base; implementation must not introduce off-palette colors that violate them.

These are testable: the E2E suite includes an `@axe-core/playwright` smoke pass on each top-level surface.

---

## 11. Acceptance criteria for sub-project 1

The slice is "done" when:

1. `docker compose up` brings the app + DB online. `/api/health` returns 200.
2. Visiting `/` with an empty DB redirects to `/profile` and shows an empty-state form with "import your existing markdown KB" guidance.
3. `npm run import -- ./` (from the cv-template repo root) successfully imports a real KB: every existing markdown file lands in the DB, the import report is printed, re-running is idempotent.
4. Every top-level UI surface (`/profile`, `/experience`, `/experience/[slug]`, `/skills`, `/education`, `/values`, `/applications`, `/applications/[slug]`, `/settings`) renders, supports edit-in-place, and persists changes through Server Actions.
5. Setting `ADMIN_PASSWORD_HASH` gates every route except `/login` and `/api/health`. Unsetting it removes the gate.
6. All unit + integration + E2E tests pass in CI.
7. The implementation does not modify any file under `.claude/`, `experience/`, or `applications/` in the existing repo.
8. `design/DESIGN.md` tokens are reflected in the implemented Tailwind theme (color palette, typography scale, spacing, shape radii). No off-palette colors appear in any rendered page.
9. The Settings page importer button runs the same code path as `npm run import` and streams progress via `/api/import/stream`. `import_run` rows persist after each invocation.
10. `@axe-core/playwright` smoke pass succeeds on every top-level surface.
