# KB Web App — Phase 3: KB CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up CRUD for the five KB entities: Profile, Experience (roles + achievements/highlights + role-tags), Skills (categories + skills + soft skills + SkillApplication joins), Education, Values (principles + narrative + opinions + themes). Every page edit-in-place per `design/ui-design-spec.md`.

**Architecture:** One Server Action file per entity in `server/actions/<entity>.ts`. Zod schemas in `server/validation/<entity>.ts`. Pages under `app/(shell)/<entity>/`. The CRUD pattern is established in detail in Task 6 (Profile) and reused with entity-specific code in subsequent tasks. Reorderable lists use a new `ReorderableList` component; tag editing uses a new `TagSelector` component.

**Tech Stack:** Server Actions, Zod, Prisma, React Server Components for reads, client `useFormState` for writes.

**Spec reference:** §2 (data model), §4 (route map for KB pages), §6 (error handling), `design/ui-design-spec.md` (per-page layouts).

---

## File structure (delivered by end of Phase 3)

```
app/(shell)/
  profile/page.tsx
  experience/
    page.tsx
    new/page.tsx
    [slug]/page.tsx
  skills/page.tsx
  education/
    page.tsx
    new/page.tsx
  values/page.tsx

server/
  validation/
    profile.ts
    experience.ts
    skills.ts
    education.ts
    values.ts
    common.ts                   # shared schemas (slug, YYYY-MM, tag-slug)
  actions/
    profile.ts
    experience.ts
    achievement.ts
    highlight.ts
    skill-category.ts
    skill.ts
    soft-skill.ts
    skill-application.ts
    education.ts
    values.ts
    helpers.ts                  # zodToFieldErrors, slugify, withAction wrapper

components/
  forms/
    slug-field.tsx
    tag-selector.tsx
    inline-edit-row.tsx
  sections/
    reorderable-list.tsx

tests/
  unit/server/validation/...
  unit/components/...
  integration/server/actions/...
```

---

## Task 1: Shared validation primitives

**Files:**
- Create: `server/validation/common.ts`
- Create: `tests/unit/server/validation/common.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { Slug, YearMonth, TagSlug } from "@/server/validation/common";

describe("validation/common", () => {
  it("Slug accepts lowercase kebab", () => {
    expect(Slug.parse("acme-staff-engineer")).toBe("acme-staff-engineer");
  });
  it("Slug rejects uppercase, spaces, leading hyphen", () => {
    expect(() => Slug.parse("Acme")).toThrow();
    expect(() => Slug.parse("a b")).toThrow();
    expect(() => Slug.parse("-x")).toThrow();
  });
  it("YearMonth accepts YYYY-MM and 'present'", () => {
    expect(YearMonth.parse("2021-03")).toBe("2021-03");
    expect(YearMonth.parse("present")).toBe("present");
  });
  it("YearMonth rejects invalid format", () => {
    expect(() => YearMonth.parse("2021")).toThrow();
    expect(() => YearMonth.parse("2021/03")).toThrow();
  });
  it("TagSlug accepts lowercase kebab", () => {
    expect(TagSlug.parse("leadership")).toBe("leadership");
    expect(() => TagSlug.parse("Lead-Ership")).toThrow();
  });
});
```

- [ ] **Step 2: Run test → FAIL**

```bash
npm test -- tests/unit/server/validation/common.test.ts
```

- [ ] **Step 3: Implement `server/validation/common.ts`**

```ts
import { z } from "zod";

export const Slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Must be lowercase kebab-case");
export const TagSlug = Slug;
export const YearMonth = z.union([z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM"), z.literal("present")]);
```

- [ ] **Step 4: Run test → PASS, commit**

```bash
npm test -- tests/unit/server/validation/common.test.ts
git add server/validation/common.ts tests/unit/server/validation/common.test.ts
git commit -m "phase 3: add shared validation primitives (Slug, YearMonth, TagSlug)"
```

---

## Task 2: Server Action helpers (zodToFieldErrors, withAction wrapper)

**Files:**
- Create: `server/actions/helpers.ts`
- Create: `tests/unit/server/actions/helpers.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { zodToFieldErrors, slugify } from "@/server/actions/helpers";

describe("zodToFieldErrors", () => {
  it("flattens a ZodError into {field: message}", () => {
    const schema = z.object({ name: z.string().min(1), age: z.number().min(0) });
    const result = schema.safeParse({ name: "", age: -1 });
    if (result.success) throw new Error("expected failure");
    const errs = zodToFieldErrors(result.error);
    expect(errs.name).toBeDefined();
    expect(errs.age).toBeDefined();
  });
});

describe("slugify", () => {
  it("converts company + title to a kebab slug", () => {
    expect(slugify("Acme GmbH", "Staff Engineer, Platform")).toBe("acme-staff-engineer-platform");
  });
  it("strips diacritics and non-ascii", () => {
    expect(slugify("Café", "Über Engineer")).toBe("cafe-uber-engineer");
  });
});
```

- [ ] **Step 2: Run → FAIL**

```bash
npm test -- tests/unit/server/actions/helpers.test.ts
```

- [ ] **Step 3: Implement `server/actions/helpers.ts`**

```ts
import type { ZodError } from "zod";

export function zodToFieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function slugify(...parts: string[]): string {
  return parts
    .map((s) =>
      s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("-");
}
```

- [ ] **Step 4: Run → PASS, commit**

```bash
npm test -- tests/unit/server/actions/helpers.test.ts
git add server/actions/helpers.ts tests/unit/server/actions/helpers.test.ts
git commit -m "phase 3: add zodToFieldErrors + slugify helpers"
```

---

## Task 3: Test infrastructure for action integration tests

- [ ] **Step 1: Update `tests/setup.ts` for action tests that need a clean DB**

```ts
import "@testing-library/dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

Create `tests/helpers/db.ts`:

```ts
import { execSync } from "node:child_process";
import { db } from "@/server/data/db";

export async function resetDb() {
  execSync("npx prisma migrate reset --force --skip-seed", { stdio: "pipe" });
  execSync("npx tsx prisma/seed.ts", { stdio: "pipe" });
}

export { db };
```

- [ ] **Step 2: Commit**

```bash
git add tests/helpers/db.ts tests/setup.ts
git commit -m "phase 3: add resetDb test helper"
```

---

## Task 4: ReorderableList component

**Files:**
- Create: `components/sections/reorderable-list.tsx`
- Create: `tests/unit/components/reorderable-list.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReorderableList } from "@/components/sections/reorderable-list";

describe("ReorderableList", () => {
  it("renders items in order", () => {
    render(
      <ReorderableList
        items={[
          { id: "a", order: 1, content: <span>One</span> },
          { id: "b", order: 0, content: <span>Zero</span> },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0].textContent).toContain("Zero");
    expect(items[1].textContent).toContain("One");
  });
});
```

- [ ] **Step 2: Run → FAIL**

```bash
npm test -- tests/unit/components/reorderable-list.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
import type { ReactNode } from "react";

type Item = { id: string; order: number; content: ReactNode };

export function ReorderableList({ items }: { items: Item[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  return (
    <ul className="flex flex-col gap-md">
      {sorted.map((item) => (
        <li key={item.id} className="flex items-start gap-md">
          {item.content}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Run → PASS, commit**

```bash
npm test -- tests/unit/components/reorderable-list.test.tsx
git add components/sections/reorderable-list.tsx tests/unit/components/reorderable-list.test.tsx
git commit -m "phase 3: add ReorderableList component"
```

---

## Task 5: TagSelector component + SlugField + InlineEditRow

These three small components unblock the next CRUD pages.

- [ ] **Step 1: Implement `components/forms/slug-field.tsx`**

```tsx
"use client";
import { useState, useEffect, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  derivedFrom?: string;
  manualOverride?: string;
};

export function SlugField({ name, defaultValue, derivedFrom, ...rest }: Props) {
  const [touched, setTouched] = useState(false);
  const [value, setValue] = useState(String(defaultValue ?? ""));
  useEffect(() => {
    if (!touched && derivedFrom) setValue(derivedFrom);
  }, [derivedFrom, touched]);
  return (
    <Input
      {...rest}
      name={name}
      className="font-mono"
      value={value}
      onChange={(e) => {
        setTouched(true);
        setValue(e.target.value);
      }}
    />
  );
}
```

- [ ] **Step 2: Implement `components/forms/tag-selector.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Tag } from "@/components/ui/tag";

type Tag = { slug: string; label: string };

export function TagSelector({
  name,
  available,
  selected,
}: {
  name: string;
  available: Tag[];
  selected: string[];
}) {
  const [picked, setPicked] = useState<string[]>(selected);
  const [open, setOpen] = useState(false);
  const remaining = available.filter((t) => !picked.includes(t.slug));
  return (
    <div className="flex flex-wrap items-center gap-xs">
      {picked.map((slug) => {
        const t = available.find((x) => x.slug === slug);
        return (
          <Tag key={slug} onRemove={() => setPicked(picked.filter((p) => p !== slug))}>
            {t?.label ?? slug}
          </Tag>
        );
      })}
      <input type="hidden" name={name} value={picked.join(",")} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-small text-text-secondary hover:text-text"
      >
        + Add tag
      </button>
      {open ? (
        <div className="absolute z-10 mt-md bg-surface-overlay border border-border rounded-md p-md flex flex-col gap-xs">
          {remaining.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => {
                setPicked([...picked, t.slug]);
                setOpen(false);
              }}
              className="text-left text-small text-text hover:bg-surface-raised px-sm py-xs rounded"
            >
              {t.label}
            </button>
          ))}
          {remaining.length === 0 ? (
            <p className="text-small text-text-tertiary">All tags selected.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Implement `components/forms/inline-edit-row.tsx`**

```tsx
"use client";
import { useState, type ReactNode } from "react";

export function InlineEditRow({
  readView,
  editView,
}: {
  readView: ReactNode;
  editView: (close: () => void) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-md h-11 px-md hover:bg-surface-raised">
      {editing ? editView(() => setEditing(false)) : (
        <button type="button" onClick={() => setEditing(true)} className="w-full text-left">
          {readView}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/forms/slug-field.tsx components/forms/tag-selector.tsx components/forms/inline-edit-row.tsx
git commit -m "phase 3: add SlugField, TagSelector, InlineEditRow"
```

---

## Task 6: Profile — validation + actions + page (establishes the CRUD pattern)

This task is fully detailed. Subsequent entity tasks reuse the same pattern.

**Files:**
- Create: `server/validation/profile.ts`
- Create: `server/actions/profile.ts`
- Create: `app/(shell)/profile/page.tsx`
- Tests: `tests/unit/server/validation/profile.test.ts`, `tests/integration/server/actions/profile.test.ts`

- [ ] **Step 1: Validation test**

```ts
import { describe, it, expect } from "vitest";
import { ProfileSchema, KeyQualificationSchema, LanguageSchema } from "@/server/validation/profile";

describe("ProfileSchema", () => {
  it("requires fullName, headline, email, professionalSummary", () => {
    const r = ProfileSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    expect(r.error.flatten().fieldErrors).toMatchObject({
      fullName: expect.any(Array),
      headline: expect.any(Array),
      email: expect.any(Array),
      professionalSummary: expect.any(Array),
    });
  });
  it("accepts valid input with optional fields omitted", () => {
    expect(
      ProfileSchema.parse({
        fullName: "Jane Doe",
        headline: "Engineer",
        email: "j@d.com",
        professionalSummary: "summary",
      }),
    ).toMatchObject({ fullName: "Jane Doe" });
  });
  it("rejects invalid email", () => {
    expect(() =>
      ProfileSchema.parse({ fullName: "x", headline: "y", email: "nope", professionalSummary: "s" }),
    ).toThrow();
  });
});

describe("KeyQualificationSchema", () => {
  it("requires text", () => {
    expect(() => KeyQualificationSchema.parse({ text: "", order: 0 })).toThrow();
    expect(KeyQualificationSchema.parse({ text: "ok", order: 0 }).text).toBe("ok");
  });
});

describe("LanguageSchema", () => {
  it("requires name + proficiency", () => {
    expect(() => LanguageSchema.parse({ name: "", proficiency: "", order: 0 })).toThrow();
  });
});
```

- [ ] **Step 2: Run → FAIL**

```bash
npm test -- tests/unit/server/validation/profile.test.ts
```

- [ ] **Step 3: Implement `server/validation/profile.ts`**

```ts
import { z } from "zod";

export const ProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  headline: z.string().min(1, "Headline is required"),
  locationCity: z.string().optional().nullable(),
  locationCountry: z.string().optional().nullable(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  githubUrl: z.string().url().optional().nullable().or(z.literal("")),
  websiteUrl: z.string().url().optional().nullable().or(z.literal("")),
  professionalSummary: z.string().min(1, "Summary is required"),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

export const KeyQualificationSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export const LanguageSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  proficiency: z.string().min(1, "Proficiency is required"),
  order: z.number().int().nonnegative(),
});

export type KeyQualificationInput = z.infer<typeof KeyQualificationSchema>;
export type LanguageInput = z.infer<typeof LanguageSchema>;
```

- [ ] **Step 4: Run → PASS, commit**

```bash
npm test -- tests/unit/server/validation/profile.test.ts
git add server/validation/profile.ts tests/unit/server/validation/profile.test.ts
git commit -m "phase 3: add Profile Zod schemas"
```

- [ ] **Step 5: Action integration test**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("profile actions", () => {
  beforeAll(async () => resetDb());
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.keyQualification.deleteMany();
    await db.language.deleteMany();
    await db.profile.deleteMany();
  });

  it("upsertProfile creates a profile if none exists", async () => {
    const { upsertProfile } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "Jane Doe");
    fd.set("headline", "Engineer");
    fd.set("email", "j@d.com");
    fd.set("professionalSummary", "summary");
    const r = await upsertProfile(fd);
    expect(r.ok).toBe(true);
    const p = await db.profile.findUnique({ where: { userId: 1 } });
    expect(p?.fullName).toBe("Jane Doe");
  });

  it("upsertProfile returns fieldErrors on invalid input", async () => {
    const { upsertProfile } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "");
    fd.set("headline", "");
    fd.set("email", "bad");
    fd.set("professionalSummary", "");
    const r = await upsertProfile(fd);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.fieldErrors?.fullName).toBeDefined();
    expect(r.error.fieldErrors?.email).toBeDefined();
  });

  it("setKeyQualifications replaces the full list", async () => {
    const { upsertProfile, setKeyQualifications } = await import("@/server/actions/profile");
    const fd = new FormData();
    fd.set("fullName", "x"); fd.set("headline", "y"); fd.set("email", "a@b.c"); fd.set("professionalSummary", "s");
    await upsertProfile(fd);
    const r = await setKeyQualifications([
      { text: "one", order: 0 },
      { text: "two", order: 1 },
    ]);
    expect(r.ok).toBe(true);
    const list = await db.keyQualification.findMany({ orderBy: { order: "asc" } });
    expect(list.length).toBe(2);
    expect(list[0]!.text).toBe("one");
  });
});
```

- [ ] **Step 6: Run → FAIL**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy
npm test -- tests/integration/server/actions/profile.test.ts
```

- [ ] **Step 7: Implement `server/actions/profile.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ProfileSchema, KeyQualificationSchema, LanguageSchema, type KeyQualificationInput, type LanguageInput } from "@/server/validation/profile";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToProfileInput(fd: FormData) {
  return {
    fullName: String(fd.get("fullName") ?? ""),
    headline: String(fd.get("headline") ?? ""),
    locationCity: String(fd.get("locationCity") ?? "") || null,
    locationCountry: String(fd.get("locationCountry") ?? "") || null,
    email: String(fd.get("email") ?? ""),
    phone: String(fd.get("phone") ?? "") || null,
    linkedinUrl: String(fd.get("linkedinUrl") ?? "") || null,
    githubUrl: String(fd.get("githubUrl") ?? "") || null,
    websiteUrl: String(fd.get("websiteUrl") ?? "") || null,
    professionalSummary: String(fd.get("professionalSummary") ?? ""),
  };
}

export async function upsertProfile(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = ProfileSchema.safeParse(fdToProfileInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const data = parsed.data;
  const row = await db.profile.upsert({
    where: { userId: CURRENT_USER_ID },
    create: { ...data, userId: CURRENT_USER_ID },
    update: data,
  });
  revalidatePath("/profile");
  return ok({ id: row.id });
}

export async function setKeyQualifications(items: KeyQualificationInput[]): Promise<ActionResult<null>> {
  for (const item of items) {
    const r = KeyQualificationSchema.safeParse(item);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid qualification.", zodToFieldErrors(r.error));
  }
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  if (!profile) return err("NOT_FOUND", "Profile does not exist yet.");
  await db.$transaction([
    db.keyQualification.deleteMany({ where: { profileId: profile.id } }),
    db.keyQualification.createMany({
      data: items.map((i) => ({ text: i.text, order: i.order, profileId: profile.id })),
    }),
  ]);
  revalidatePath("/profile");
  return ok(null);
}

export async function setLanguages(items: LanguageInput[]): Promise<ActionResult<null>> {
  for (const item of items) {
    const r = LanguageSchema.safeParse(item);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid language.", zodToFieldErrors(r.error));
  }
  const profile = await db.profile.findUnique({ where: { userId: CURRENT_USER_ID } });
  if (!profile) return err("NOT_FOUND", "Profile does not exist yet.");
  await db.$transaction([
    db.language.deleteMany({ where: { profileId: profile.id } }),
    db.language.createMany({
      data: items.map((i) => ({ name: i.name, proficiency: i.proficiency, order: i.order, profileId: profile.id })),
    }),
  ]);
  revalidatePath("/profile");
  return ok(null);
}
```

- [ ] **Step 8: Run → PASS, commit**

```bash
npm test -- tests/integration/server/actions/profile.test.ts
docker stop kb-pg-tmp
git add server/actions/profile.ts tests/integration/server/actions/profile.test.ts
git commit -m "phase 3: add Profile actions (upsertProfile, setKeyQualifications, setLanguages)"
```

- [ ] **Step 9: Implement `app/(shell)/profile/page.tsx`**

```tsx
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { ProfileForm } from "./profile-form";
import { KeyQualificationsSection } from "./key-qualifications-section";
import { LanguagesSection } from "./languages-section";
import { InfoBanner } from "@/components/ui/info-banner";

export default async function ProfilePage() {
  const profile = await db.profile.findUnique({
    where: { userId: CURRENT_USER_ID },
    include: {
      keyQualifications: { orderBy: { order: "asc" } },
      languages: { orderBy: { order: "asc" } },
    },
  });

  return (
    <>
      <Header title="Profile" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        {!profile ? (
          <InfoBanner dismissible>
            Welcome. Import your existing markdown KB from Settings to pre-fill these fields, or start from scratch below.
          </InfoBanner>
        ) : null}
        <ProfileForm profile={profile ?? null} />
        {profile ? (
          <>
            <KeyQualificationsSection profileId={profile.id} items={profile.keyQualifications} />
            <LanguagesSection profileId={profile.id} items={profile.languages} />
          </>
        ) : null}
      </div>
    </>
  );
}
```

- [ ] **Step 10: Implement the three child client components**

`app/(shell)/profile/profile-form.tsx`:

```tsx
"use client";
import { useFormState } from "react-dom";
import { upsertProfile } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";

type Profile = {
  fullName: string;
  headline: string;
  locationCity: string | null;
  locationCountry: string | null;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  professionalSummary: string;
} | null;

const initial = { ok: true as const, data: { id: 0 } };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(async (_: any, fd: FormData) => upsertProfile(fd), initial);
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader title="Identity" actions={<Button type="submit">Save</Button>} />
      <div className="grid grid-cols-2 gap-md">
        <FormField label="Full name" name="fullName" defaultValue={profile?.fullName ?? ""} error={fe.fullName} />
        <FormField label="Headline" name="headline" defaultValue={profile?.headline ?? ""} error={fe.headline} />
        <FormField label="Email" name="email" type="email" defaultValue={profile?.email ?? ""} error={fe.email} />
        <FormField label="Phone" name="phone" defaultValue={profile?.phone ?? ""} error={fe.phone} />
        <FormField label="City" name="locationCity" defaultValue={profile?.locationCity ?? ""} error={fe.locationCity} />
        <FormField label="Country" name="locationCountry" defaultValue={profile?.locationCountry ?? ""} error={fe.locationCountry} />
        <FormField label="LinkedIn URL" name="linkedinUrl" defaultValue={profile?.linkedinUrl ?? ""} error={fe.linkedinUrl} />
        <FormField label="GitHub URL" name="githubUrl" defaultValue={profile?.githubUrl ?? ""} error={fe.githubUrl} />
        <FormField label="Website URL" name="websiteUrl" defaultValue={profile?.websiteUrl ?? ""} error={fe.websiteUrl} />
      </div>
      <FormTextarea
        label="Professional summary"
        name="professionalSummary"
        rows={8}
        defaultValue={profile?.professionalSummary ?? ""}
        error={fe.professionalSummary}
      />
    </form>
  );
}
```

`app/(shell)/profile/key-qualifications-section.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { setKeyQualifications } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; text: string; order: number };

export function KeyQualificationsSection({ items: initial }: { profileId: number; items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Key qualifications"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setKeyQualifications(items.map(({ text, order }) => ({ text, order })));
              })
            }
          >
            {pending ? "Saving..." : "Save"}
          </Button>
        }
      />
      {items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, i) => (
          <div key={i} className="flex items-start gap-md">
            <Input
              type="number"
              value={item.order}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, order: Number(e.target.value) } : x)))
              }
              className="w-16"
            />
            <Textarea
              rows={3}
              value={item.text}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
            />
            <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
      <Button variant="secondary" onClick={() => setItems([...items, { text: "", order: items.length }])}>
        Add qualification
      </Button>
    </div>
  );
}
```

`app/(shell)/profile/languages-section.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { setLanguages } from "@/server/actions/profile";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Item = { id?: number; name: string; proficiency: string; order: number };

export function LanguagesSection({ items: initial }: { profileId: number; items: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Languages"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setLanguages(items.map(({ name, proficiency, order }) => ({ name, proficiency, order })));
              })
            }
          >
            {pending ? "Saving..." : "Save"}
          </Button>
        }
      />
      {items
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((item, i) => (
          <div key={i} className="flex items-center gap-md">
            <Input
              value={item.name}
              onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
            />
            <Input
              value={item.proficiency}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, proficiency: e.target.value } : x)))
              }
            />
            <Input
              type="number"
              value={item.order}
              onChange={(e) =>
                setItems(items.map((x, j) => (j === i ? { ...x, order: Number(e.target.value) } : x)))
              }
              className="w-16"
            />
            <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
          </div>
        ))}
      <Button variant="secondary" onClick={() => setItems([...items, { name: "", proficiency: "", order: items.length }])}>
        Add language
      </Button>
    </div>
  );
}
```

- [ ] **Step 11: Smoke test in browser**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy && npx tsx prisma/seed.ts
npm run dev
```

Open `/profile`. Fill out the identity form, save. Reload — fields persist. Add a qualification, save. Add a language, save. Stop server + DB.

- [ ] **Step 12: Commit**

```bash
git add app/\(shell\)/profile/
git commit -m "phase 3: add Profile page (identity form + qualifications + languages)"
```

---

## Task 7: Experience — validation + actions

**Files:**
- Create: `server/validation/experience.ts`
- Create: `server/actions/experience.ts`, `server/actions/achievement.ts`, `server/actions/highlight.ts`
- Tests: `tests/unit/server/validation/experience.test.ts`, `tests/integration/server/actions/experience.test.ts`

- [ ] **Step 1: Validation test**

```ts
import { describe, it, expect } from "vitest";
import { ExperienceRoleSchema, AchievementSchema, HighlightSchema } from "@/server/validation/experience";

describe("ExperienceRoleSchema", () => {
  it("rejects missing required fields", () => {
    const r = ExperienceRoleSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(fe.slug).toBeDefined();
    expect(fe.company).toBeDefined();
    expect(fe.title).toBeDefined();
    expect(fe.startDate).toBeDefined();
    expect(fe.employmentType).toBeDefined();
    expect(fe.overview).toBeDefined();
  });
  it("accepts valid input with present endDate as null", () => {
    expect(
      ExperienceRoleSchema.parse({
        slug: "acme-engineer",
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01",
        endDate: null,
        employmentType: "full_time",
        overview: "did things",
      }),
    ).toMatchObject({ endDate: null });
  });
  it("requires startDate in YYYY-MM", () => {
    expect(() =>
      ExperienceRoleSchema.parse({
        slug: "x",
        company: "X",
        title: "X",
        startDate: "2020/01",
        employmentType: "full_time",
        overview: "x",
      }),
    ).toThrow();
  });
});

describe("AchievementSchema", () => {
  it("requires title + result + context + action", () => {
    const r = AchievementSchema.safeParse({});
    if (r.success) throw new Error("expected failure");
    const fe = r.error.flatten().fieldErrors;
    expect(Object.keys(fe).sort()).toEqual(["action", "context", "order", "result", "title"]);
  });
});

describe("HighlightSchema", () => {
  it("requires text", () => {
    expect(() => HighlightSchema.parse({ text: "", order: 0 })).toThrow();
  });
});
```

- [ ] **Step 2: Run → FAIL, implement, → PASS**

`server/validation/experience.ts`:

```ts
import { z } from "zod";
import { Slug, YearMonth, TagSlug } from "@/server/validation/common";

export const ExperienceRoleSchema = z.object({
  id: z.number().optional(),
  slug: Slug,
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM"),
  endDate: z.union([z.string().regex(/^\d{4}-\d{2}$/), z.null(), z.literal("")]).transform((v) => (v ? v : null)),
  location: z.string().optional().nullable(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  companyUrl: z.string().url().optional().nullable().or(z.literal("")),
  overview: z.string().min(1, "Overview is required"),
  scopeTeamSize: z.string().optional().nullable(),
  scopeReportingTo: z.string().optional().nullable(),
  scopeTechStack: z.string().optional().nullable(),
  scopeBudget: z.string().optional().nullable(),
  isHighlightsOnly: z.boolean().default(false),
  tagSlugs: z.array(TagSlug).default([]),
});

export const AchievementSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  result: z.string().min(1, "Result is required"),
  context: z.string().min(1, "Context is required"),
  action: z.string().min(1, "Action is required"),
  order: z.number().int().nonnegative(),
  tagSlugs: z.array(TagSlug).default([]),
});

export const HighlightSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export type ExperienceRoleInput = z.infer<typeof ExperienceRoleSchema>;
export type AchievementInput = z.infer<typeof AchievementSchema>;
export type HighlightInput = z.infer<typeof HighlightSchema>;
```

```bash
npm test -- tests/unit/server/validation/experience.test.ts
git add server/validation/experience.ts tests/unit/server/validation/experience.test.ts
git commit -m "phase 3: add Experience Zod schemas"
```

- [ ] **Step 3: Action integration test**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("experience actions", () => {
  beforeAll(async () => resetDb());
  afterAll(async () => db.$disconnect());
  beforeEach(async () => {
    await db.achievement.deleteMany();
    await db.highlight.deleteMany();
    await db.experienceRole.deleteMany();
  });

  it("createRole creates a row with tags", async () => {
    const { createRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "acme-engineer");
    fd.set("company", "Acme");
    fd.set("title", "Engineer");
    fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time");
    fd.set("overview", "did stuff");
    fd.set("tagSlugs", "leadership,technical");
    const r = await createRole(fd);
    expect(r.ok).toBe(true);
    const role = await db.experienceRole.findFirst({ include: { tags: { include: { tag: true } } } });
    expect(role?.slug).toBe("acme-engineer");
    expect(role?.tags.map((t) => t.tag.slug).sort()).toEqual(["leadership", "technical"]);
  });

  it("createRole returns UNIQUE_CONFLICT on duplicate slug", async () => {
    const { createRole } = await import("@/server/actions/experience");
    const make = () => {
      const fd = new FormData();
      fd.set("slug", "dupe");
      fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
      fd.set("employmentType", "full_time"); fd.set("overview", "x");
      return fd;
    };
    await createRole(make());
    const r = await createRole(make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("updateRole replaces tags", async () => {
    const { createRole, updateRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "x"); fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time"); fd.set("overview", "x"); fd.set("tagSlugs", "leadership");
    await createRole(fd);
    const role = await db.experienceRole.findFirstOrThrow();
    const fd2 = new FormData();
    fd2.set("slug", "x"); fd2.set("company", "X"); fd2.set("title", "X"); fd2.set("startDate", "2020-01");
    fd2.set("employmentType", "full_time"); fd2.set("overview", "x"); fd2.set("tagSlugs", "technical,delivery");
    await updateRole(role.id, fd2);
    const updated = await db.experienceRole.findUnique({ where: { id: role.id }, include: { tags: { include: { tag: true } } } });
    expect(updated?.tags.map((t) => t.tag.slug).sort()).toEqual(["delivery", "technical"]);
  });

  it("deleteRole cascades to achievements", async () => {
    const { createRole, createAchievement, deleteRole } = await import("@/server/actions/experience");
    const fd = new FormData();
    fd.set("slug", "x"); fd.set("company", "X"); fd.set("title", "X"); fd.set("startDate", "2020-01");
    fd.set("employmentType", "full_time"); fd.set("overview", "x");
    await createRole(fd);
    const role = await db.experienceRole.findFirstOrThrow();
    const ach = new FormData();
    ach.set("title", "a"); ach.set("result", "r"); ach.set("context", "c"); ach.set("action", "ac"); ach.set("order", "0");
    await createAchievement(role.id, ach);
    expect(await db.achievement.count()).toBe(1);
    await deleteRole(role.id);
    expect(await db.achievement.count()).toBe(0);
    expect(await db.experienceRole.count()).toBe(0);
  });
});
```

- [ ] **Step 4: Run → FAIL, implement, → PASS**

`server/actions/experience.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ExperienceRoleSchema } from "@/server/validation/experience";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  return {
    slug: String(fd.get("slug") ?? ""),
    company: String(fd.get("company") ?? ""),
    title: String(fd.get("title") ?? ""),
    startDate: String(fd.get("startDate") ?? ""),
    endDate: String(fd.get("endDate") ?? "") || null,
    location: String(fd.get("location") ?? "") || null,
    employmentType: String(fd.get("employmentType") ?? "") as "full_time" | "part_time" | "contract" | "internship",
    companyUrl: String(fd.get("companyUrl") ?? "") || null,
    overview: String(fd.get("overview") ?? ""),
    scopeTeamSize: String(fd.get("scopeTeamSize") ?? "") || null,
    scopeReportingTo: String(fd.get("scopeReportingTo") ?? "") || null,
    scopeTechStack: String(fd.get("scopeTechStack") ?? "") || null,
    scopeBudget: String(fd.get("scopeBudget") ?? "") || null,
    isHighlightsOnly: fd.get("isHighlightsOnly") === "on",
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

async function setRoleTags(roleId: number, tagSlugs: string[]) {
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } });
  await db.$transaction([
    db.roleTag.deleteMany({ where: { roleId } }),
    db.roleTag.createMany({ data: tags.map((t) => ({ roleId, tagId: t.id })) }),
  ]);
}

export async function createRole(fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ExperienceRoleSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  try {
    const role = await db.experienceRole.create({ data: { ...data, userId: CURRENT_USER_ID } });
    await setRoleTags(role.id, tagSlugs);
    revalidatePath("/experience");
    return ok({ id: role.id, slug: role.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "A role with this slug already exists.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function updateRole(id: number, fd: FormData): Promise<ActionResult<{ id: number; slug: string }>> {
  const parsed = ExperienceRoleSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Please fix the highlighted fields.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const existing = await db.experienceRole.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Role not found.");
  try {
    const role = await db.experienceRole.update({ where: { id }, data });
    await setRoleTags(role.id, tagSlugs);
    revalidatePath(`/experience/${role.slug}`);
    revalidatePath("/experience");
    return ok({ id: role.id, slug: role.slug });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "A role with this slug already exists.", { slug: "Already taken" });
    }
    throw e;
  }
}

export async function deleteRole(id: number): Promise<ActionResult<null>> {
  const existing = await db.experienceRole.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Role not found.");
  await db.experienceRole.delete({ where: { id } });
  revalidatePath("/experience");
  return ok(null);
}

export async function createAchievement(roleId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  const input = {
    title: String(fd.get("title") ?? ""),
    result: String(fd.get("result") ?? ""),
    context: String(fd.get("context") ?? ""),
    action: String(fd.get("action") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
  const { AchievementSchema } = await import("@/server/validation/experience");
  const parsed = AchievementSchema.safeParse(input);
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid achievement.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const role = await db.experienceRole.findFirst({ where: { id: roleId, userId: CURRENT_USER_ID } });
  if (!role) return err("NOT_FOUND", "Role not found.");
  const a = await db.achievement.create({ data: { ...data, roleId } });
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } });
  if (tags.length) await db.achievementTag.createMany({ data: tags.map((t) => ({ achievementId: a.id, tagId: t.id })) });
  revalidatePath(`/experience/${role.slug}`);
  return ok({ id: a.id });
}

export async function updateAchievement(id: number, fd: FormData): Promise<ActionResult<null>> {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  const input = {
    title: String(fd.get("title") ?? ""),
    result: String(fd.get("result") ?? ""),
    context: String(fd.get("context") ?? ""),
    action: String(fd.get("action") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
  const { AchievementSchema } = await import("@/server/validation/experience");
  const parsed = AchievementSchema.safeParse(input);
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid achievement.", zodToFieldErrors(parsed.error));
  const ach = await db.achievement.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } });
  if (!ach) return err("NOT_FOUND", "Achievement not found.");
  const { tagSlugs, ...data } = parsed.data;
  await db.$transaction([
    db.achievement.update({ where: { id }, data }),
    db.achievementTag.deleteMany({ where: { achievementId: id } }),
  ]);
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } });
  if (tags.length) await db.achievementTag.createMany({ data: tags.map((t) => ({ achievementId: id, tagId: t.id })) });
  revalidatePath(`/experience/${ach.role.slug}`);
  return ok(null);
}

export async function deleteAchievement(id: number): Promise<ActionResult<null>> {
  const ach = await db.achievement.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } });
  if (!ach) return err("NOT_FOUND", "Achievement not found.");
  await db.achievement.delete({ where: { id } });
  revalidatePath(`/experience/${ach.role.slug}`);
  return ok(null);
}

export async function createHighlight(roleId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const { HighlightSchema } = await import("@/server/validation/experience");
  const parsed = HighlightSchema.safeParse({ text: String(fd.get("text") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid highlight.", zodToFieldErrors(parsed.error));
  const role = await db.experienceRole.findFirst({ where: { id: roleId, userId: CURRENT_USER_ID } });
  if (!role) return err("NOT_FOUND", "Role not found.");
  const h = await db.highlight.create({ data: { ...parsed.data, roleId } });
  revalidatePath(`/experience/${role.slug}`);
  return ok({ id: h.id });
}

export async function updateHighlight(id: number, fd: FormData): Promise<ActionResult<null>> {
  const { HighlightSchema } = await import("@/server/validation/experience");
  const parsed = HighlightSchema.safeParse({ text: String(fd.get("text") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid highlight.", zodToFieldErrors(parsed.error));
  const h = await db.highlight.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } });
  if (!h) return err("NOT_FOUND", "Highlight not found.");
  await db.highlight.update({ where: { id }, data: parsed.data });
  revalidatePath(`/experience/${h.role.slug}`);
  return ok(null);
}

export async function deleteHighlight(id: number): Promise<ActionResult<null>> {
  const h = await db.highlight.findFirst({ where: { id, role: { userId: CURRENT_USER_ID } }, include: { role: true } });
  if (!h) return err("NOT_FOUND", "Highlight not found.");
  await db.highlight.delete({ where: { id } });
  revalidatePath(`/experience/${h.role.slug}`);
  return ok(null);
}
```

```bash
npm test -- tests/integration/server/actions/experience.test.ts
git add server/actions/experience.ts tests/integration/server/actions/experience.test.ts
git commit -m "phase 3: add Experience actions (create/update/delete role + achievement + highlight)"
```

---

## Task 8: Experience list page

**File:** `app/(shell)/experience/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ExperienceListPage() {
  const roles = await db.experienceRole.findMany({
    where: { userId: CURRENT_USER_ID },
    include: { tags: { include: { tag: true } } },
    orderBy: { startDate: "desc" },
  });

  return (
    <>
      <Header
        title="Experience"
        subtitle={`${roles.length} role${roles.length === 1 ? "" : "s"}`}
        actions={
          <Link href="/experience/new">
            <Button>Add role</Button>
          </Link>
        }
      />
      <div className="p-2xl flex flex-col gap-md">
        {roles.length === 0 ? (
          <EmptyState
            title="No roles yet"
            description="You haven't added any roles. Import your existing markdown KB or add your first role manually."
            actions={
              <>
                <Link href="/settings"><Button>Import from markdown</Button></Link>
                <Link href="/experience/new"><Button variant="secondary">Add role</Button></Link>
              </>
            }
          />
        ) : (
          roles.map((role) => (
            <Link key={role.id} href={`/experience/${role.slug}`}>
              <Card className="hover:bg-surface-raised">
                <CardBody className="flex flex-col gap-sm">
                  <p className="text-subheading">{role.title}</p>
                  <p className="text-small text-text-secondary">
                    {role.company} · {role.employmentType.replace("_", "-")} · {role.location ?? "—"} · {role.startDate} — {role.endDate ?? "present"}
                  </p>
                  <p className="text-body text-text-secondary line-clamp-2">{role.overview}</p>
                  <div className="flex flex-wrap gap-xs">
                    {role.tags.map((t) => <Tag key={t.tagId}>{t.tag.label}</Tag>)}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Smoke test, commit**

```bash
git add app/\(shell\)/experience/page.tsx
git commit -m "phase 3: add Experience list page"
```

---

## Task 9: Experience new page

**File:** `app/(shell)/experience/new/page.tsx` + `experience-form.tsx`

- [ ] **Step 1: Implement `app/(shell)/experience/new/page.tsx`**

```tsx
import { db } from "@/server/data/db";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { ExperienceForm } from "../experience-form";

export default async function NewExperiencePage() {
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });
  return (
    <>
      <Header title="Add role" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-md">
        <BackLink href="/experience" label="Experience" />
        <ExperienceForm mode="create" role={null} availableTags={tags} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Implement `app/(shell)/experience/experience-form.tsx`** (used by both new and detail)

```tsx
"use client";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRole, updateRole, deleteRole } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { FormDate } from "@/components/forms/form-date";
import { SlugField } from "@/components/forms/slug-field";
import { TagSelector } from "@/components/forms/tag-selector";
import { slugify } from "@/server/actions/helpers";

type Role = {
  id: number;
  slug: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  employmentType: "full_time" | "part_time" | "contract" | "internship";
  companyUrl: string | null;
  overview: string;
  scopeTeamSize: string | null;
  scopeReportingTo: string | null;
  scopeTechStack: string | null;
  scopeBudget: string | null;
  isHighlightsOnly: boolean;
  tags: { tag: { slug: string; label: string } }[];
} | null;

type AvailableTag = { slug: string; label: string };

export function ExperienceForm({
  mode,
  role,
  availableTags,
}: {
  mode: "create" | "edit";
  role: Role;
  availableTags: AvailableTag[];
}) {
  const router = useRouter();
  const [company, setCompany] = useState(role?.company ?? "");
  const [title, setTitle] = useState(role?.title ?? "");
  const derived = slugify(company, title);
  const initial = { ok: true as const, data: { id: 0, slug: "" } };
  const [state, action] = useFormState(async (_: any, fd: FormData) => {
    const res = mode === "create" ? await createRole(fd) : await updateRole(role!.id, fd);
    if (res.ok && mode === "create") router.push(`/experience/${res.data.slug}`);
    return res;
  }, initial);
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  const [pending, start] = useTransition();

  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader
        title={mode === "create" ? "New role" : "Role details"}
        actions={
          <>
            {mode === "edit" && role ? (
              <Button
                variant="ghost"
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await deleteRole(role.id);
                    router.push("/experience");
                  })
                }
              >
                Delete role
              </Button>
            ) : null}
            <Button type="submit">Save</Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-md">
        <FormField label="Company" name="company" defaultValue={company} onChange={(e) => setCompany(e.currentTarget.value)} error={fe.company} />
        <FormField label="Title" name="title" defaultValue={title} onChange={(e) => setTitle(e.currentTarget.value)} error={fe.title} />
        <FormDate label="Start date" name="startDate" defaultValue={role?.startDate ?? ""} error={fe.startDate} />
        <FormDate label="End date" name="endDate" defaultValue={role?.endDate ?? ""} hint="Leave blank for present" error={fe.endDate} />
        <FormField label="Location" name="location" defaultValue={role?.location ?? ""} error={fe.location} />
        <FormSelect
          label="Employment type"
          name="employmentType"
          defaultValue={role?.employmentType ?? "full_time"}
          options={[
            { value: "full_time", label: "Full-time" },
            { value: "part_time", label: "Part-time" },
            { value: "contract", label: "Contract" },
            { value: "internship", label: "Internship" },
          ]}
          error={fe.employmentType}
        />
        <FormField label="Company URL" name="companyUrl" defaultValue={role?.companyUrl ?? ""} error={fe.companyUrl} />
        <label className="flex flex-col gap-xs">
          <span className="text-label uppercase text-text-secondary">Slug</span>
          <SlugField name="slug" defaultValue={role?.slug ?? ""} derivedFrom={mode === "create" ? derived : undefined} />
          {fe.slug ? <span className="text-caption text-danger">{fe.slug}</span> : null}
        </label>
      </div>
      <FormField label="Team size" name="scopeTeamSize" defaultValue={role?.scopeTeamSize ?? ""} error={fe.scopeTeamSize} />
      <FormField label="Reporting to" name="scopeReportingTo" defaultValue={role?.scopeReportingTo ?? ""} error={fe.scopeReportingTo} />
      <FormField label="Budget" name="scopeBudget" defaultValue={role?.scopeBudget ?? ""} error={fe.scopeBudget} />
      <FormTextarea label="Tech stack" name="scopeTechStack" rows={3} defaultValue={role?.scopeTechStack ?? ""} error={fe.scopeTechStack} />
      <FormTextarea label="Overview" name="overview" rows={6} defaultValue={role?.overview ?? ""} error={fe.overview} />
      <FormCheckbox label="Highlights only (older role — no per-achievement entries)" name="isHighlightsOnly" defaultChecked={role?.isHighlightsOnly ?? false} />
      <div>
        <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
        <TagSelector name="tagSlugs" available={availableTags} selected={role?.tags.map((t) => t.tag.slug) ?? []} />
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(shell\)/experience/new/page.tsx app/\(shell\)/experience/experience-form.tsx
git commit -m "phase 3: add Experience new page + shared ExperienceForm"
```

---

## Task 10: Experience detail page

**Files:** `app/(shell)/experience/[slug]/page.tsx` + `achievements-section.tsx` + `highlights-section.tsx` + `linked-skills-section.tsx`

- [ ] **Step 1: Implement `app/(shell)/experience/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { ExperienceForm } from "../experience-form";
import { AchievementsSection } from "./achievements-section";
import { HighlightsSection } from "./highlights-section";
import { LinkedSkillsSection } from "./linked-skills-section";

export default async function ExperienceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = await db.experienceRole.findFirst({
    where: { userId: CURRENT_USER_ID, slug },
    include: {
      tags: { include: { tag: true } },
      achievements: { include: { tags: { include: { tag: true } } }, orderBy: { order: "asc" } },
      highlights: { orderBy: { order: "asc" } },
      skillApplications: { include: { skill: { include: { category: true } } } },
    },
  });
  if (!role) notFound();
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });

  return (
    <>
      <Header title={role.title} subtitle={role.company} />
      <div className="p-2xl flex flex-col gap-3xl">
        <BackLink href="/experience" label="Experience" />
        <ExperienceForm mode="edit" role={role} availableTags={tags} />
        {role.isHighlightsOnly ? (
          <HighlightsSection roleId={role.id} items={role.highlights} />
        ) : (
          <AchievementsSection roleId={role.id} items={role.achievements} availableTags={tags} />
        )}
        <LinkedSkillsSection
          skills={role.skillApplications.map((sa) => ({
            id: sa.skill.id,
            name: sa.skill.name,
            categoryName: sa.skill.category.name,
            proficiency: sa.skill.proficiency,
          }))}
        />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Implement `achievements-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createAchievement, updateAchievement, deleteAchievement } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";
import { TagSelector } from "@/components/forms/tag-selector";

type Achievement = {
  id: number;
  title: string;
  result: string;
  context: string;
  action: string;
  order: number;
  tags: { tag: { slug: string; label: string } }[];
};

type AvailableTag = { slug: string; label: string };

export function AchievementsSection({
  roleId,
  items,
  availableTags,
}: {
  roleId: number;
  items: Achievement[];
  availableTags: AvailableTag[];
}) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function AchievementForm({ achievement, onClose }: { achievement: Achievement | null; onClose: () => void }) {
    return (
      <form
        action={(fd) =>
          start(async () => {
            if (achievement) {
              const r = await updateAchievement(achievement.id, fd);
              if (r.ok) onClose();
            } else {
              const r = await createAchievement(roleId, fd);
              if (r.ok) onClose();
            }
          })
        }
        className="flex flex-col gap-md"
      >
        <FormField label="Title" name="title" defaultValue={achievement?.title ?? ""} />
        <FormTextarea label="Context" name="context" rows={3} defaultValue={achievement?.context ?? ""} />
        <FormTextarea label="Action" name="action" rows={3} defaultValue={achievement?.action ?? ""} />
        <FormTextarea label="Result" name="result" rows={3} defaultValue={achievement?.result ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={achievement?.order ?? items.length} />
        <div>
          <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
          <TagSelector
            name="tagSlugs"
            available={availableTags}
            selected={achievement?.tags.map((t) => t.tag.slug) ?? []}
          />
        </div>
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{achievement ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Achievements" actions={<Button onClick={() => setAdding(true)}>Add achievement</Button>} />
      {items.map((a) => (
        <Card key={a.id}>
          <CardBody className="flex flex-col gap-sm">
            {editingId === a.id ? (
              <AchievementForm achievement={a} onClose={() => setEditingId(null)} />
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-subheading">{a.title}</p>
                    <p className="text-small text-text-tertiary">order {a.order}</p>
                  </div>
                  <div className="flex gap-sm">
                    <Button variant="ghost" onClick={() => setEditingId(a.id)}>Edit</Button>
                    <Button
                      variant="ghost"
                      onClick={() => start(async () => { await deleteAchievement(a.id); })}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-body"><strong>Result:</strong> {a.result}</p>
                <p className="text-body"><strong>Context:</strong> {a.context}</p>
                <p className="text-body"><strong>Action:</strong> {a.action}</p>
              </>
            )}
          </CardBody>
        </Card>
      ))}
      {adding ? (
        <Card>
          <CardBody>
            <AchievementForm achievement={null} onClose={() => setAdding(false)} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Implement `highlights-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createHighlight, updateHighlight, deleteHighlight } from "@/server/actions/experience";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";

type Highlight = { id: number; text: string; order: number };

export function HighlightsSection({ roleId, items }: { roleId: number; items: Highlight[] }) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function Form({ highlight, onClose }: { highlight: Highlight | null; onClose: () => void }) {
    return (
      <form
        action={(fd) =>
          start(async () => {
            const r = highlight ? await updateHighlight(highlight.id, fd) : await createHighlight(roleId, fd);
            if (r.ok) onClose();
          })
        }
        className="flex flex-col gap-md"
      >
        <FormTextarea label="Text" name="text" rows={3} defaultValue={highlight?.text ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={highlight?.order ?? items.length} />
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{highlight ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Highlights" actions={<Button onClick={() => setAdding(true)}>Add highlight</Button>} />
      {items.map((h) => (
        <div key={h.id} className="flex items-start gap-md p-md bg-surface rounded-md border border-border">
          {editingId === h.id ? (
            <Form highlight={h} onClose={() => setEditingId(null)} />
          ) : (
            <>
              <p className="flex-1 text-body">{h.text}</p>
              <Button variant="ghost" onClick={() => setEditingId(h.id)}>Edit</Button>
              <Button variant="ghost" onClick={() => start(async () => { await deleteHighlight(h.id); })}>Delete</Button>
            </>
          )}
        </div>
      ))}
      {adding ? <Form highlight={null} onClose={() => setAdding(false)} /> : null}
    </div>
  );
}
```

- [ ] **Step 4: Implement `linked-skills-section.tsx`**

```tsx
import { SectionHeader } from "@/components/sections/section-header";

type Linked = { id: number; name: string; categoryName: string; proficiency: "familiar" | "proficient" | "expert" };

export function LinkedSkillsSection({ skills }: { skills: Linked[] }) {
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Linked skills" />
      {skills.length === 0 ? (
        <p className="text-small text-text-secondary">
          No skills linked. Skills are connected via the Skills page.
        </p>
      ) : (
        <ul className="flex flex-col gap-xs">
          {skills.map((s) => (
            <li key={s.id} className="flex items-center justify-between p-sm border-b border-border-subtle text-body">
              <span>
                {s.name} <span className="text-text-secondary text-small">— {s.categoryName}</span>
              </span>
              <span className="text-label uppercase text-text-secondary">{s.proficiency}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Smoke test, commit**

```bash
git add app/\(shell\)/experience/\[slug\]/ app/\(shell\)/experience/
git commit -m "phase 3: add Experience detail page (form + achievements + highlights + linked skills)"
```

---

## Task 11: Skills — validation + actions

**Files:**
- `server/validation/skills.ts`, `server/actions/skill-category.ts`, `server/actions/skill.ts`, `server/actions/soft-skill.ts`, `server/actions/skill-application.ts`
- Tests under `tests/unit/server/validation/skills.test.ts` and `tests/integration/server/actions/skills.test.ts`

- [ ] **Step 1: Implement `server/validation/skills.ts`**

```ts
import { z } from "zod";
import { TagSlug } from "@/server/validation/common";

export const SkillCategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  order: z.number().int().nonnegative(),
});

export const SkillSchema = z.object({
  id: z.number().optional(),
  categoryId: z.number().int().positive(),
  name: z.string().min(1, "Name is required"),
  proficiency: z.enum(["familiar", "proficient", "expert"]),
  notes: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

export const SoftSkillSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  whereDemonstrated: z.string().min(1, "Required"),
  whatHappened: z.string().min(1, "Required"),
  order: z.number().int().nonnegative(),
  tagSlugs: z.array(TagSlug).default([]),
});

export type SkillCategoryInput = z.infer<typeof SkillCategorySchema>;
export type SkillInput = z.infer<typeof SkillSchema>;
export type SoftSkillInput = z.infer<typeof SoftSkillSchema>;
```

- [ ] **Step 2: Implement actions (4 files)**

`server/actions/skill-category.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SkillCategorySchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function createSkillCategory(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SkillCategorySchema.safeParse({ name: String(fd.get("name") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid category.", zodToFieldErrors(parsed.error));
  try {
    const c = await db.skillCategory.create({ data: { ...parsed.data, userId: CURRENT_USER_ID } });
    revalidatePath("/skills");
    return ok({ id: c.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Category name already exists.", { name: "Already taken" });
    }
    throw e;
  }
}

export async function updateSkillCategory(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = SkillCategorySchema.safeParse({ name: String(fd.get("name") ?? ""), order: Number(fd.get("order") ?? 0) });
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid category.", zodToFieldErrors(parsed.error));
  const existing = await db.skillCategory.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Category not found.");
  await db.skillCategory.update({ where: { id }, data: parsed.data });
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSkillCategory(id: number): Promise<ActionResult<null>> {
  const existing = await db.skillCategory.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Category not found.");
  await db.skillCategory.delete({ where: { id } });
  revalidatePath("/skills");
  return ok(null);
}
```

`server/actions/skill.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SkillSchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData, categoryId: number) {
  return {
    categoryId,
    name: String(fd.get("name") ?? ""),
    proficiency: String(fd.get("proficiency") ?? "proficient") as "familiar" | "proficient" | "expert",
    notes: String(fd.get("notes") ?? "") || null,
    order: Number(fd.get("order") ?? 0),
  };
}

export async function createSkill(categoryId: number, fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SkillSchema.safeParse(fdToInput(fd, categoryId));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid skill.", zodToFieldErrors(parsed.error));
  const cat = await db.skillCategory.findFirst({ where: { id: categoryId, userId: CURRENT_USER_ID } });
  if (!cat) return err("NOT_FOUND", "Category not found.");
  try {
    const s = await db.skill.create({ data: parsed.data });
    revalidatePath("/skills");
    return ok({ id: s.id });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return err("UNIQUE_CONFLICT", "Skill name already exists in this category.", { name: "Already taken" });
    }
    throw e;
  }
}

export async function updateSkill(id: number, fd: FormData): Promise<ActionResult<null>> {
  const existing = await db.skill.findFirst({
    where: { id, category: { userId: CURRENT_USER_ID } },
    include: { category: true },
  });
  if (!existing) return err("NOT_FOUND", "Skill not found.");
  const parsed = SkillSchema.safeParse(fdToInput(fd, existing.categoryId));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid skill.", zodToFieldErrors(parsed.error));
  await db.skill.update({ where: { id }, data: parsed.data });
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSkill(id: number): Promise<ActionResult<null>> {
  const existing = await db.skill.findFirst({ where: { id, category: { userId: CURRENT_USER_ID } } });
  if (!existing) return err("NOT_FOUND", "Skill not found.");
  await db.skill.delete({ where: { id } });
  revalidatePath("/skills");
  return ok(null);
}
```

`server/actions/soft-skill.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { SoftSkillSchema } from "@/server/validation/skills";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  const tagCsv = String(fd.get("tagSlugs") ?? "");
  return {
    name: String(fd.get("name") ?? ""),
    whereDemonstrated: String(fd.get("whereDemonstrated") ?? ""),
    whatHappened: String(fd.get("whatHappened") ?? ""),
    order: Number(fd.get("order") ?? 0),
    tagSlugs: tagCsv ? tagCsv.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

async function setTags(softSkillId: number, tagSlugs: string[]) {
  const tags = await db.tag.findMany({ where: { slug: { in: tagSlugs } } });
  await db.$transaction([
    db.softSkillTag.deleteMany({ where: { softSkillId } }),
    db.softSkillTag.createMany({ data: tags.map((t) => ({ softSkillId, tagId: t.id })) }),
  ]);
}

export async function createSoftSkill(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = SoftSkillSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid soft skill.", zodToFieldErrors(parsed.error));
  const { tagSlugs, ...data } = parsed.data;
  const s = await db.softSkill.create({ data: { ...data, userId: CURRENT_USER_ID } });
  await setTags(s.id, tagSlugs);
  revalidatePath("/skills");
  return ok({ id: s.id });
}

export async function updateSoftSkill(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = SoftSkillSchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid soft skill.", zodToFieldErrors(parsed.error));
  const existing = await db.softSkill.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Soft skill not found.");
  const { tagSlugs, ...data } = parsed.data;
  await db.softSkill.update({ where: { id }, data });
  await setTags(id, tagSlugs);
  revalidatePath("/skills");
  return ok(null);
}

export async function deleteSoftSkill(id: number): Promise<ActionResult<null>> {
  const existing = await db.softSkill.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Soft skill not found.");
  await db.softSkill.delete({ where: { id } });
  revalidatePath("/skills");
  return ok(null);
}
```

`server/actions/skill-application.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { ok, err, type ActionResult } from "@/server/actions/result";

export async function setSkillApplications(skillId: number, roleIds: number[]): Promise<ActionResult<null>> {
  const skill = await db.skill.findFirst({ where: { id: skillId, category: { userId: CURRENT_USER_ID } } });
  if (!skill) return err("NOT_FOUND", "Skill not found.");
  // Verify all roles belong to current user.
  const validRoles = await db.experienceRole.findMany({ where: { id: { in: roleIds }, userId: CURRENT_USER_ID }, select: { id: true } });
  const validIds = new Set(validRoles.map((r) => r.id));
  await db.$transaction([
    db.skillApplication.deleteMany({ where: { skillId } }),
    db.skillApplication.createMany({ data: [...validIds].map((roleId) => ({ skillId, roleId })) }),
  ]);
  revalidatePath("/skills");
  revalidatePath("/experience", "layout");
  return ok(null);
}
```

- [ ] **Step 3: Action integration test (covers the four files)**

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { resetDb, db } from "@/tests/helpers/db";

describe("skill actions", () => {
  beforeAll(async () => resetDb());
  afterAll(async () => db.$disconnect());

  let categoryId: number;
  beforeEach(async () => {
    await db.skillApplication.deleteMany();
    await db.skill.deleteMany();
    await db.softSkill.deleteMany();
    // categories survive between tests; locate Languages
    const c = await db.skillCategory.findFirstOrThrow({ where: { name: "Languages", userId: 1 } });
    categoryId = c.id;
  });

  it("creates a skill under a category", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const fd = new FormData();
    fd.set("name", "TypeScript"); fd.set("proficiency", "expert"); fd.set("order", "0");
    const r = await createSkill(categoryId, fd);
    expect(r.ok).toBe(true);
    expect(await db.skill.count()).toBe(1);
  });

  it("rejects duplicate skill name within a category", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const make = () => {
      const fd = new FormData();
      fd.set("name", "TypeScript"); fd.set("proficiency", "expert"); fd.set("order", "0");
      return fd;
    };
    await createSkill(categoryId, make());
    const r = await createSkill(categoryId, make());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("UNIQUE_CONFLICT");
  });

  it("setSkillApplications links a skill to roles", async () => {
    const { createSkill } = await import("@/server/actions/skill");
    const { createRole } = await import("@/server/actions/experience");
    const { setSkillApplications } = await import("@/server/actions/skill-application");
    const fd = new FormData();
    fd.set("name", "Rust"); fd.set("proficiency", "familiar"); fd.set("order", "0");
    const s = await createSkill(categoryId, fd);
    expect(s.ok).toBe(true);
    const rfd = new FormData();
    rfd.set("slug", "acme"); rfd.set("company", "Acme"); rfd.set("title", "E"); rfd.set("startDate", "2020-01");
    rfd.set("employmentType", "full_time"); rfd.set("overview", "x");
    const r = await createRole(rfd);
    expect(r.ok).toBe(true);
    if (!s.ok || !r.ok) return;
    const link = await setSkillApplications(s.data.id, [r.data.id]);
    expect(link.ok).toBe(true);
    expect(await db.skillApplication.count()).toBe(1);
  });
});
```

- [ ] **Step 4: Run, fix, commit**

```bash
npm test -- tests/integration/server/actions/skills.test.ts
git add server/validation/skills.ts server/actions/skill-category.ts server/actions/skill.ts server/actions/soft-skill.ts server/actions/skill-application.ts tests/integration/server/actions/skills.test.ts
git commit -m "phase 3: add Skills validation + actions (categories, skills, soft skills, applications)"
```

---

## Task 12: Skills page

**File:** `app/(shell)/skills/page.tsx` + child sections

- [ ] **Step 1: Implement `app/(shell)/skills/page.tsx`**

```tsx
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HardSkillsCategorySection } from "./hard-skills-category-section";
import { SoftSkillsSection } from "./soft-skills-section";
import { NewCategoryButton } from "./new-category-button";

export default async function SkillsPage() {
  const categories = await db.skillCategory.findMany({
    where: { userId: CURRENT_USER_ID },
    include: { skills: { orderBy: { order: "asc" }, include: { applications: { include: { role: true } } } } },
    orderBy: { order: "asc" },
  });
  const softSkills = await db.softSkill.findMany({
    where: { userId: CURRENT_USER_ID },
    include: { tags: { include: { tag: true } } },
    orderBy: { order: "asc" },
  });
  const tags = await db.tag.findMany({ orderBy: { slug: "asc" } });
  const roles = await db.experienceRole.findMany({ where: { userId: CURRENT_USER_ID }, select: { id: true, company: true, title: true } });

  return (
    <>
      <Header title="Skills" actions={<NewCategoryButton nextOrder={categories.length} />} />
      <div className="p-2xl flex flex-col gap-3xl">
        {categories.length === 0 ? (
          <EmptyState title="No skills yet" description="Import your KB or add categories and skills manually." actions={<Button>Add category</Button>} />
        ) : (
          categories.map((c) => (
            <HardSkillsCategorySection
              key={c.id}
              category={{ id: c.id, name: c.name, order: c.order }}
              skills={c.skills.map((s) => ({
                id: s.id,
                name: s.name,
                proficiency: s.proficiency,
                notes: s.notes,
                order: s.order,
                roleIds: s.applications.map((a) => a.role.id),
              }))}
              availableRoles={roles}
            />
          ))
        )}
        <SoftSkillsSection items={softSkills.map((s) => ({
          id: s.id,
          name: s.name,
          whereDemonstrated: s.whereDemonstrated,
          whatHappened: s.whatHappened,
          order: s.order,
          tags: s.tags.map((t) => t.tag.slug),
        }))} availableTags={tags} />
      </div>
    </>
  );
}
```

- [ ] **Step 2: Implement `new-category-button.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createSkillCategory } from "@/server/actions/skill-category";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewCategoryButton({ nextOrder }: { nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <Button onClick={() => setOpen(true)}>Add category</Button>;
  return (
    <div className="flex items-center gap-sm">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" />
      <Button
        disabled={pending || !name}
        onClick={() =>
          start(async () => {
            const fd = new FormData();
            fd.set("name", name);
            fd.set("order", String(nextOrder));
            await createSkillCategory(fd);
            setName("");
            setOpen(false);
          })
        }
      >
        Create
      </Button>
      <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
```

- [ ] **Step 3: Implement `hard-skills-category-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createSkill, updateSkill, deleteSkill } from "@/server/actions/skill";
import { setSkillApplications } from "@/server/actions/skill-application";
import { deleteSkillCategory, updateSkillCategory } from "@/server/actions/skill-category";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Skill = {
  id: number;
  name: string;
  proficiency: "familiar" | "proficient" | "expert";
  notes: string | null;
  order: number;
  roleIds: number[];
};

type Role = { id: number; company: string; title: string };

export function HardSkillsCategorySection({
  category,
  skills,
  availableRoles,
}: {
  category: { id: number; name: string; order: number };
  skills: Skill[];
  availableRoles: Role[];
}) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function SkillRow({ skill }: { skill: Skill | null }) {
    const [name, setName] = useState(skill?.name ?? "");
    const [proficiency, setProficiency] = useState<Skill["proficiency"]>(skill?.proficiency ?? "proficient");
    const [notes, setNotes] = useState(skill?.notes ?? "");
    const [order, setOrder] = useState(String(skill?.order ?? skills.length));
    const [roleIds, setRoleIds] = useState<number[]>(skill?.roleIds ?? []);
    return (
      <div className="grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm items-center px-md py-sm">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Skill name" />
        <Select value={proficiency} onChange={(e) => setProficiency(e.target.value as Skill["proficiency"])}>
          <option value="familiar">Familiar</option>
          <option value="proficient">Proficient</option>
          <option value="expert">Expert</option>
        </Select>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
        <Input type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        <div className="flex gap-xs">
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const fd = new FormData();
                fd.set("name", name); fd.set("proficiency", proficiency); fd.set("notes", notes); fd.set("order", order);
                const r = skill ? await updateSkill(skill.id, fd) : await createSkill(category.id, fd);
                if (r.ok && !skill && "id" in r.data) await setSkillApplications(r.data.id, roleIds);
                if (skill) await setSkillApplications(skill.id, roleIds);
                setEditingId(null); setAdding(false);
              })
            }
          >
            Save
          </Button>
          {skill ? (
            <Button variant="ghost" onClick={() => start(async () => { await deleteSkill(skill.id); })}>×</Button>
          ) : (
            <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-sm">
            {category.name}
            <span className="text-small text-text-tertiary">order {category.order}</span>
          </span>
        }
        actions={
          <>
            <Button onClick={() => setAdding(true)}>Add skill</Button>
            <Button
              variant="ghost"
              onClick={() => start(async () => { if (confirm(`Delete category "${category.name}"?`)) await deleteSkillCategory(category.id); })}
            >
              Delete category
            </Button>
          </>
        }
      />
      <div className="px-md py-sm border-b border-border-subtle grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm text-label uppercase text-text-secondary">
        <span>Name</span><span>Proficiency</span><span>Notes</span><span>Order</span><span>Actions</span>
      </div>
      {skills.map((s) =>
        editingId === s.id ? (
          <SkillRow key={s.id} skill={s} />
        ) : (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_120px_1fr_60px_auto] gap-sm items-center px-md py-sm hover:bg-surface-raised cursor-pointer"
            onClick={() => setEditingId(s.id)}
          >
            <span className="text-body">{s.name}</span>
            <span className="text-label uppercase text-text-secondary">{s.proficiency}</span>
            <span className="text-small text-text-secondary truncate">{s.notes ?? "—"}</span>
            <span className="text-small">{s.order}</span>
            <span />
          </div>
        ),
      )}
      {adding ? <SkillRow skill={null} /> : null}
    </Card>
  );
}
```

(SkillRow above doesn't yet expose role linking UI — full role-link UI is a stretch goal; the action is wired, but in v1 we expose it on the detail page only. Iterate later.)

- [ ] **Step 4: Implement `soft-skills-section.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { createSoftSkill, updateSoftSkill, deleteSoftSkill } from "@/server/actions/soft-skill";
import { SectionHeader } from "@/components/sections/section-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormNumber } from "@/components/forms/form-number";
import { TagSelector } from "@/components/forms/tag-selector";

type SoftSkill = {
  id: number;
  name: string;
  whereDemonstrated: string;
  whatHappened: string;
  order: number;
  tags: string[];
};
type AvailableTag = { slug: string; label: string };

export function SoftSkillsSection({ items, availableTags }: { items: SoftSkill[]; availableTags: AvailableTag[] }) {
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  function Form({ skill, onClose }: { skill: SoftSkill | null; onClose: () => void }) {
    return (
      <form
        action={(fd) => start(async () => {
          const r = skill ? await updateSoftSkill(skill.id, fd) : await createSoftSkill(fd);
          if (r.ok) onClose();
        })}
        className="flex flex-col gap-md"
      >
        <FormField label="Name" name="name" defaultValue={skill?.name ?? ""} />
        <FormTextarea label="Where demonstrated" name="whereDemonstrated" rows={3} defaultValue={skill?.whereDemonstrated ?? ""} />
        <FormTextarea label="What happened" name="whatHappened" rows={3} defaultValue={skill?.whatHappened ?? ""} />
        <FormNumber label="Order" name="order" defaultValue={skill?.order ?? items.length} />
        <div>
          <p className="text-label uppercase text-text-secondary mb-xs">Tags</p>
          <TagSelector name="tagSlugs" available={availableTags} selected={skill?.tags ?? []} />
        </div>
        <div className="flex justify-end gap-sm">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={pending}>{skill ? "Save" : "Add"}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <SectionHeader title="Soft skills" actions={<Button onClick={() => setAdding(true)}>Add soft skill</Button>} />
      {items.map((s) => (
        <Card key={s.id}>
          <CardBody>
            {editingId === s.id ? (
              <Form skill={s} onClose={() => setEditingId(null)} />
            ) : (
              <div className="flex flex-col gap-sm">
                <div className="flex items-start justify-between">
                  <p className="text-subheading">{s.name}</p>
                  <div className="flex gap-sm">
                    <Button variant="ghost" onClick={() => setEditingId(s.id)}>Edit</Button>
                    <Button variant="ghost" onClick={() => start(async () => { await deleteSoftSkill(s.id); })}>Delete</Button>
                  </div>
                </div>
                <p className="text-body"><strong>Where:</strong> {s.whereDemonstrated}</p>
                <p className="text-body"><strong>What:</strong> {s.whatHappened}</p>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
      {adding ? (
        <Card>
          <CardBody>
            <Form skill={null} onClose={() => setAdding(false)} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 5: Smoke test, commit**

```bash
git add app/\(shell\)/skills/
git commit -m "phase 3: add Skills page (hard skills by category + soft skills)"
```

---

## Task 13: Education — validation + actions + pages

**Files:**
- `server/validation/education.ts`
- `server/actions/education.ts`
- `app/(shell)/education/page.tsx`
- `app/(shell)/education/new/page.tsx`
- `app/(shell)/education/education-form.tsx`

- [ ] **Step 1: Implement validation + action**

`server/validation/education.ts`:

```ts
import { z } from "zod";

export const EducationEntrySchema = z.object({
  id: z.number().optional(),
  kind: z.enum(["degree", "certification", "course"]),
  institution: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  field: z.string().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable().or(z.literal("")),
  endDate: z.string().regex(/^\d{4}-\d{2}$/).optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  order: z.number().int().nonnegative(),
});

export type EducationEntryInput = z.infer<typeof EducationEntrySchema>;
```

`server/actions/education.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { EducationEntrySchema } from "@/server/validation/education";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

function fdToInput(fd: FormData) {
  return {
    kind: String(fd.get("kind") ?? "degree") as "degree" | "certification" | "course",
    institution: String(fd.get("institution") ?? "") || null,
    name: String(fd.get("name") ?? ""),
    field: String(fd.get("field") ?? "") || null,
    startDate: String(fd.get("startDate") ?? "") || null,
    endDate: String(fd.get("endDate") ?? "") || null,
    notes: String(fd.get("notes") ?? "") || null,
    order: Number(fd.get("order") ?? 0),
  };
}

export async function createEducationEntry(fd: FormData): Promise<ActionResult<{ id: number }>> {
  const parsed = EducationEntrySchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid education entry.", zodToFieldErrors(parsed.error));
  const e = await db.educationEntry.create({ data: { ...parsed.data, userId: CURRENT_USER_ID } });
  revalidatePath("/education");
  return ok({ id: e.id });
}

export async function updateEducationEntry(id: number, fd: FormData): Promise<ActionResult<null>> {
  const parsed = EducationEntrySchema.safeParse(fdToInput(fd));
  if (!parsed.success) return err("VALIDATION_FAILED", "Invalid education entry.", zodToFieldErrors(parsed.error));
  const existing = await db.educationEntry.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Entry not found.");
  await db.educationEntry.update({ where: { id }, data: parsed.data });
  revalidatePath("/education");
  return ok(null);
}

export async function deleteEducationEntry(id: number): Promise<ActionResult<null>> {
  const existing = await db.educationEntry.findFirst({ where: { id, userId: CURRENT_USER_ID } });
  if (!existing) return err("NOT_FOUND", "Entry not found.");
  await db.educationEntry.delete({ where: { id } });
  revalidatePath("/education");
  return ok(null);
}
```

- [ ] **Step 2: Implement `education-form.tsx` (shared between new + inline edit)**

```tsx
"use client";
import { useTransition, useState } from "react";
import { createEducationEntry, updateEducationEntry } from "@/server/actions/education";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormSelect } from "@/components/forms/form-select";
import { FormDate } from "@/components/forms/form-date";
import { FormNumber } from "@/components/forms/form-number";

export type EducationEntry = {
  id: number;
  kind: "degree" | "certification" | "course";
  institution: string | null;
  name: string;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  order: number;
};

export function EducationForm({
  entry,
  onSaved,
  onCancel,
}: {
  entry: EducationEntry | null;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<EducationEntry["kind"]>(entry?.kind ?? "degree");
  return (
    <form
      action={(fd) =>
        start(async () => {
          const r = entry ? await updateEducationEntry(entry.id, fd) : await createEducationEntry(fd);
          if (r.ok) onSaved?.();
        })
      }
      className="flex flex-col gap-md"
    >
      <FormSelect
        label="Kind"
        name="kind"
        value={kind}
        onChange={(e) => setKind(e.target.value as EducationEntry["kind"])}
        options={[
          { value: "degree", label: "Degree" },
          { value: "certification", label: "Certification" },
          { value: "course", label: "Course" },
        ]}
      />
      <FormField label="Name" name="name" defaultValue={entry?.name ?? ""} />
      <FormField label="Institution" name="institution" defaultValue={entry?.institution ?? ""} />
      {kind === "degree" ? <FormField label="Field" name="field" defaultValue={entry?.field ?? ""} /> : null}
      <div className="grid grid-cols-2 gap-md">
        <FormDate label="Start date" name="startDate" defaultValue={entry?.startDate ?? ""} />
        <FormDate label="End date" name="endDate" defaultValue={entry?.endDate ?? ""} />
      </div>
      <FormTextarea label="Notes" name="notes" rows={3} defaultValue={entry?.notes ?? ""} />
      <FormNumber label="Order" name="order" defaultValue={entry?.order ?? 0} />
      <div className="flex justify-end gap-sm">
        {onCancel ? <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button> : null}
        <Button type="submit" disabled={pending}>{entry ? "Save" : "Add"}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Implement `app/(shell)/education/page.tsx`**

```tsx
import Link from "next/link";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EducationItem } from "./education-item";

const KIND_LABEL = { degree: "Degrees", certification: "Certifications", course: "Courses" } as const;

export default async function EducationPage() {
  const entries = await db.educationEntry.findMany({
    where: { userId: CURRENT_USER_ID },
    orderBy: [{ kind: "asc" }, { order: "asc" }],
  });
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    (acc[e.kind] ??= []).push(e);
    return acc;
  }, {});

  return (
    <>
      <Header title="Education" actions={<Link href="/education/new"><Button>Add education</Button></Link>} />
      <div className="p-2xl flex flex-col gap-3xl max-w-[720px]">
        {entries.length === 0 ? (
          <EmptyState
            title="No education entries yet"
            description="Add degrees, certifications, or courses."
            actions={<Link href="/education/new"><Button>Add education</Button></Link>}
          />
        ) : (
          (["degree", "certification", "course"] as const).map((k) =>
            grouped[k]?.length ? (
              <Card key={k}>
                <CardHeader title={KIND_LABEL[k]} />
                <CardBody className="flex flex-col gap-md">
                  {grouped[k]!.map((e) => <EducationItem key={e.id} entry={e} />)}
                </CardBody>
              </Card>
            ) : null,
          )
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Implement `app/(shell)/education/education-item.tsx`**

```tsx
"use client";
import { useState, useTransition } from "react";
import { deleteEducationEntry } from "@/server/actions/education";
import { Button } from "@/components/ui/button";
import { EducationForm, type EducationEntry } from "./education-form";

export function EducationItem({ entry }: { entry: EducationEntry }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  if (editing) return <EducationForm entry={entry} onSaved={() => setEditing(false)} onCancel={() => setEditing(false)} />;
  return (
    <div className="flex items-start justify-between gap-md">
      <div>
        <p className="text-body"><strong>{entry.name}</strong>{entry.institution ? ` — ${entry.institution}` : ""}</p>
        {entry.field ? <p className="text-small text-text-secondary">{entry.field}</p> : null}
        <p className="text-small text-text-secondary">{entry.startDate ?? "?"} — {entry.endDate ?? "?"}</p>
        {entry.notes ? <p className="text-small text-text-secondary">{entry.notes}</p> : null}
      </div>
      <div className="flex gap-sm">
        <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="ghost" disabled={pending} onClick={() => start(async () => { await deleteEducationEntry(entry.id); })}>Delete</Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement `app/(shell)/education/new/page.tsx`**

```tsx
import { Header } from "@/components/navigation/header";
import { BackLink } from "@/components/navigation/back-link";
import { EducationFormPage } from "./education-form-page";

export default function NewEducationPage() {
  return (
    <>
      <Header title="Add education" />
      <div className="p-2xl max-w-[560px] flex flex-col gap-md">
        <BackLink href="/education" label="Education" />
        <EducationFormPage />
      </div>
    </>
  );
}
```

`app/(shell)/education/new/education-form-page.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { EducationForm } from "../education-form";

export function EducationFormPage() {
  const router = useRouter();
  return <EducationForm entry={null} onSaved={() => router.push("/education")} onCancel={() => router.push("/education")} />;
}
```

- [ ] **Step 6: Commit**

```bash
git add server/validation/education.ts server/actions/education.ts app/\(shell\)/education/
git commit -m "phase 3: add Education page (list grouped by kind) + new + form"
```

---

## Task 14: Values — validation + actions + page

**Files:**
- `server/validation/values.ts`, `server/actions/values.ts`
- `app/(shell)/values/page.tsx` + four section components

- [ ] **Step 1: Implement validation**

`server/validation/values.ts`:

```ts
import { z } from "zod";

export const PrincipleSchema = z.object({
  id: z.number().optional(),
  statement: z.string().min(1, "Statement is required"),
  justification: z.string().min(1, "Justification is required"),
  order: z.number().int().nonnegative(),
});

export const CareerNarrativeSchema = z.object({
  text: z.string().min(1, "Narrative is required"),
});

export const IndustryOpinionSchema = z.object({
  id: z.number().optional(),
  position: z.string().min(1, "Position is required"),
  why: z.string().min(1, "Why is required"),
  counterargument: z.string().min(1, "Counterargument is required"),
  order: z.number().int().nonnegative(),
});

export const LinkedInThemeSchema = z.object({
  id: z.number().optional(),
  text: z.string().min(1, "Text is required"),
  order: z.number().int().nonnegative(),
});

export type PrincipleInput = z.infer<typeof PrincipleSchema>;
export type CareerNarrativeInput = z.infer<typeof CareerNarrativeSchema>;
export type IndustryOpinionInput = z.infer<typeof IndustryOpinionSchema>;
export type LinkedInThemeInput = z.infer<typeof LinkedInThemeSchema>;
```

- [ ] **Step 2: Implement actions**

`server/actions/values.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import {
  PrincipleSchema, CareerNarrativeSchema, IndustryOpinionSchema, LinkedInThemeSchema,
  type PrincipleInput, type IndustryOpinionInput, type LinkedInThemeInput,
} from "@/server/validation/values";
import { ok, err, type ActionResult } from "@/server/actions/result";
import { zodToFieldErrors } from "@/server/actions/helpers";

export async function setPrinciples(items: PrincipleInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = PrincipleSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid principle.", zodToFieldErrors(r.error));
  }
  await db.$transaction([
    db.valuePrinciple.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valuePrinciple.createMany({
      data: items.map((i) => ({ statement: i.statement, justification: i.justification, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}

export async function setCareerNarrative(fd: FormData): Promise<ActionResult<null>> {
  const parsed = CareerNarrativeSchema.safeParse({ text: String(fd.get("text") ?? "") });
  if (!parsed.success) return err("VALIDATION_FAILED", "Narrative required.", zodToFieldErrors(parsed.error));
  await db.valueCareerNarrative.upsert({
    where: { userId: CURRENT_USER_ID },
    create: { userId: CURRENT_USER_ID, text: parsed.data.text },
    update: { text: parsed.data.text },
  });
  revalidatePath("/values");
  return ok(null);
}

export async function setIndustryOpinions(items: IndustryOpinionInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = IndustryOpinionSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid opinion.", zodToFieldErrors(r.error));
  }
  await db.$transaction([
    db.valueIndustryOpinion.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valueIndustryOpinion.createMany({
      data: items.map((i) => ({ position: i.position, why: i.why, counterargument: i.counterargument, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}

export async function setLinkedInThemes(items: LinkedInThemeInput[]): Promise<ActionResult<null>> {
  for (const i of items) {
    const r = LinkedInThemeSchema.safeParse(i);
    if (!r.success) return err("VALIDATION_FAILED", "Invalid theme.", zodToFieldErrors(r.error));
  }
  await db.$transaction([
    db.valueLinkedInTheme.deleteMany({ where: { userId: CURRENT_USER_ID } }),
    db.valueLinkedInTheme.createMany({
      data: items.map((i) => ({ text: i.text, order: i.order, userId: CURRENT_USER_ID })),
    }),
  ]);
  revalidatePath("/values");
  return ok(null);
}
```

- [ ] **Step 3: Implement `app/(shell)/values/page.tsx`**

```tsx
import { db } from "@/server/data/db";
import { CURRENT_USER_ID } from "@/server/data/current-user";
import { Header } from "@/components/navigation/header";
import { PrinciplesSection } from "./principles-section";
import { NarrativeSection } from "./narrative-section";
import { OpinionsSection } from "./opinions-section";
import { ThemesSection } from "./themes-section";

export default async function ValuesPage() {
  const [principles, narrative, opinions, themes] = await Promise.all([
    db.valuePrinciple.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }),
    db.valueCareerNarrative.findUnique({ where: { userId: CURRENT_USER_ID } }),
    db.valueIndustryOpinion.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }),
    db.valueLinkedInTheme.findMany({ where: { userId: CURRENT_USER_ID }, orderBy: { order: "asc" } }),
  ]);

  return (
    <>
      <Header title="Values" />
      <div className="p-2xl max-w-[720px] flex flex-col gap-3xl">
        <PrinciplesSection items={principles.map((p) => ({ id: p.id, statement: p.statement, justification: p.justification, order: p.order }))} />
        <NarrativeSection text={narrative?.text ?? ""} />
        <OpinionsSection items={opinions.map((o) => ({ id: o.id, position: o.position, why: o.why, counterargument: o.counterargument, order: o.order }))} />
        <ThemesSection items={themes.map((t) => ({ id: t.id, text: t.text, order: t.order }))} />
      </div>
    </>
  );
}
```

- [ ] **Step 4: Implement the four sections**

`principles-section.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { setPrinciples } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; statement: string; justification: string; order: number };

export function PrinciplesSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Principles"
        hasUnsavedChanges={dirty}
        actions={
          <Button
            disabled={pending}
            onClick={() => start(async () => { await setPrinciples(items.map(({ statement, justification, order }) => ({ statement, justification, order }))); })}
          >
            Save
          </Button>
        }
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={p.order} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <div className="flex-1 flex flex-col gap-xs">
            <Textarea rows={4} value={p.statement} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, statement: e.target.value } : x))} placeholder="Statement" />
            <Textarea rows={4} value={p.justification} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, justification: e.target.value } : x))} placeholder="Justification" />
          </div>
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { statement: "", justification: "", order: items.length }])}>Add principle</Button>
    </div>
  );
}
```

`narrative-section.tsx`:

```tsx
"use client";
import { useFormState } from "react-dom";
import { setCareerNarrative } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { FormTextarea } from "@/components/forms/form-textarea";

const initial = { ok: true as const, data: null };
export function NarrativeSection({ text }: { text: string }) {
  const [state, action] = useFormState(async (_: any, fd: FormData) => setCareerNarrative(fd), initial);
  const fe = state.ok ? {} : state.error.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-md">
      <SectionHeader title="Career narrative" actions={<Button type="submit">Save</Button>} />
      <FormTextarea label="Narrative" name="text" rows={12} defaultValue={text} error={fe.text} />
    </form>
  );
}
```

`opinions-section.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { setIndustryOpinions } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; position: string; why: string; counterargument: string; order: number };

export function OpinionsSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="Industry opinions"
        hasUnsavedChanges={dirty}
        actions={<Button disabled={pending} onClick={() => start(async () => { await setIndustryOpinions(items.map(({ position, why, counterargument, order }) => ({ position, why, counterargument, order }))); })}>Save</Button>}
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={p.order} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <div className="flex-1 flex flex-col gap-xs">
            <Textarea rows={3} placeholder="Position" value={p.position} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, position: e.target.value } : x))} />
            <Textarea rows={3} placeholder="Why" value={p.why} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, why: e.target.value } : x))} />
            <Textarea rows={3} placeholder="Counterargument" value={p.counterargument} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, counterargument: e.target.value } : x))} />
          </div>
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { position: "", why: "", counterargument: "", order: items.length }])}>Add opinion</Button>
    </div>
  );
}
```

`themes-section.tsx`:

```tsx
"use client";
import { useState, useTransition } from "react";
import { setLinkedInThemes } from "@/server/actions/values";
import { SectionHeader } from "@/components/sections/section-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Item = { id?: number; text: string; order: number };

export function ThemesSection({ items: initial }: { items: Item[] }) {
  const [items, setItems] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(items) !== JSON.stringify(initial);
  return (
    <div className="flex flex-col gap-md">
      <SectionHeader
        title="LinkedIn themes"
        hasUnsavedChanges={dirty}
        actions={<Button disabled={pending} onClick={() => start(async () => { await setLinkedInThemes(items.map(({ text, order }) => ({ text, order }))); })}>Save</Button>}
      />
      {items.slice().sort((a, b) => a.order - b.order).map((p, i) => (
        <div key={i} className="flex items-start gap-md">
          <Input type="number" className="w-16" value={p.order} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, order: Number(e.target.value) } : x))} />
          <Textarea rows={4} className="flex-1" value={p.text} onChange={(e) => setItems(items.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} />
          <Button variant="ghost" onClick={() => setItems(items.filter((_, j) => j !== i))}>×</Button>
        </div>
      ))}
      <Button variant="secondary" onClick={() => setItems([...items, { text: "", order: items.length }])}>Add theme</Button>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add server/validation/values.ts server/actions/values.ts app/\(shell\)/values/
git commit -m "phase 3: add Values page (principles, narrative, opinions, themes)"
```

---

## Task 15: Final Phase 3 verification

- [ ] **Step 1: Run full test suite**

```bash
docker run --rm -d --name kb-pg-tmp -e POSTGRES_PASSWORD=kb -e POSTGRES_USER=kb -e POSTGRES_DB=kb -p 5432:5432 postgres:16 && sleep 3
export DATABASE_URL="postgresql://kb:kb@localhost:5432/kb"
npx prisma migrate deploy && npx tsx prisma/seed.ts
npm test
```

Expected: all PASS.

- [ ] **Step 2: Typecheck + build**

```bash
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 3: Manual smoke test of each page**

```bash
npm run dev
```

Walk through `/profile`, `/experience`, `/experience/new`, `/experience/[slug]`, `/skills`, `/education`, `/education/new`, `/values`. Add data, edit, delete. Stop server + DB.

- [ ] **Step 4: Confirm Phase 3 acceptance**

Every KB surface CRUD works end-to-end. Phase 4 (Applications + JSONB editors) begins from here.
