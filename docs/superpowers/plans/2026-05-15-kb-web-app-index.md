# KB Web App — Sub-project 1 Implementation Plans (Index)

**Spec:** `docs/superpowers/specs/2026-05-15-kb-web-app-data-model-and-crud-design.md`
**Design system:** `design/DESIGN.md`
**UI spec:** `design/ui-design-spec.md`

This sub-project is split across five phase-plans. Each one ends in a runnable state and is a natural review checkpoint.

| Phase | File | Scope |
|---|---|---|
| 1 | `2026-05-15-kb-web-app-phase-1-foundation.md` | Next.js + TS + Tailwind bootstrap; Prisma schema, migrations, seed; test infra; Server Action result helpers; single-user scoping; env validation; auth middleware; Docker compose. **End state:** project boots, schema applied, login + middleware works, no UI surfaces yet. |
| 2 | `2026-05-15-kb-web-app-phase-2-design-system.md` | Geist fonts; Tailwind theme from `design/DESIGN.md`; primitive components (Button, Input, Textarea, Card, Tag, StatusBadge, EmptyState, ConfirmModal, InfoBanner, RelativeDate); form field wrappers; shell (left rail, header, layout). **End state:** every page renders the shell with the design system; no data yet. |
| 3 | `2026-05-15-kb-web-app-phase-3-kb-crud.md` | Profile, Experience (list + detail), Skills (categories + skills + soft skills + SkillApplication joins), Education, Values pages with Server Actions, Zod validation, integration tests. **End state:** all KB surfaces work end-to-end. |
| 4 | `2026-05-15-kb-web-app-phase-4-applications.md` | Applications list + new + detail; JSONB sub-form editors for tailoring strategy, company notes, prep briefs; artifact listing (read-only); chat-pane stub. **End state:** application detail page renders all panes, edits persist. |
| 5 | `2026-05-15-kb-web-app-phase-5-importer-settings-a11y.md` | Markdown parsers (profile, education, experience, skills, values, applications); importer driver + CLI; Settings page (tags, auth status, importer button + SSE, danger zone); axe-core smoke pass; Playwright E2E happy paths. **End state:** acceptance criteria met. |

Each plan starts with its own "For agentic workers" header and can be executed with `superpowers:subagent-driven-development` or `superpowers:executing-plans` independently.

## Cross-phase invariants

These hold throughout. Any task in any phase that contradicts them is wrong.

1. **Every Server Action** returns `ActionResult<T>` from `server/actions/result.ts`.
2. **Every Prisma query** that selects user-owned data goes through `server/data/current-user.ts`. CI grep guard rejects raw `prisma.x.findMany` / `findFirst` / `create` in `app/` and `server/actions/`.
3. **Every form** uses `useFormState` + a Server Action. Errors render via `fieldErrors`.
4. **Every commit** follows red-green-commit: failing test → minimal code → passing test → commit.
5. **No off-palette colors.** Tailwind theme is configured from `design/DESIGN.md` tokens; any literal hex outside the theme is a violation.
6. **No animation libraries.** v1 is static.
7. **No autosave.** Per-section Save button with unsaved-changes dot indicator.
