---
description: "Tailor a CV and cover letter for a specific job description. Takes a URL or file path; proposes a tailoring strategy for your approval; generates Typst sources + PDFs into applications/<company>-<role>/."
---

# Tailor a CV and Cover Letter

You are helping the user tailor a CV and cover letter for a specific job. The career knowledge base lives in this repo (`profile.md`, `values.md`, `skills.md`, `education.md`, `experience/*.md`). Outputs go into `applications/<company>-<role>/`.

**Input**: the argument after `/tailor` is one of:
- A URL to a job posting — fetched via `WebFetch`
- A file path to a JD (markdown / text) — read from disk
- Empty — prompt the user to paste the JD

---

## Phase 1: Capture the JD

Resolve `$ARGUMENTS`:

- **URL** (starts with `http://` or `https://`): use `WebFetch` with prompt `"Extract the full job description text. Return only the JD content, not navigation, ads, or footer."`. If the result looks like nav/footer or is suspiciously short (<200 chars), show what you got and ask whether the JD was successfully extracted before saving. If fetch fails (paywall, JS-rendered, 403), report the failure and ask the user to paste the JD instead.
- **Path** (a string that resolves to a file): `Read` it.
- **Empty**: ask the user to paste the JD into chat.

You now have the raw JD text. Do a light cleanup pass — remove ad copy, "Apply now" boilerplate, repeated nav text — but **never paraphrase the requirements**. Keep the original wording for must-haves, nice-to-haves, and responsibilities.

## Phase 2: Derive the slug and create the folder

From the JD, extract `<company>` and `<role-title>`. Build the slug: lowercase, hyphenated, ASCII-only (`Acme GmbH` → `acme`, `Staff Engineer, Platform` → `staff-engineer-platform`). Combine: `<company>-<role-slug>`.

If `applications/<slug>/` already exists, append `-2`, `-3`, etc. until you find a free name. **Never overwrite an existing application folder.**

If `applications/` itself doesn't exist, create it.

Create the folder and write the cleaned JD to `applications/<slug>/job-description.md` with a small header:

```markdown
---
source: <url-or-path-or-"pasted">
captured_at: <YYYY-MM-DD>
---

# <Company> — <Role title>

<JD content>
```

## Phase 3: Hand off to the cv-tailor skill

Read `.claude/skills/cv-tailor/SKILL.md` and follow its workflow from step 2 (Analyze) onward, passing along the application folder path you just created.

---

## Behavioral Guidelines

- **Don't paraphrase the JD** when capturing it. Cleanup means removing nav/ad/boilerplate, not rewriting requirements.
- **Don't proceed silently if URL fetch is suspicious** — show what was extracted and ask.
- **Idempotent on slug collisions**: re-running on the same JD lands in a `-2` folder rather than clobbering. The skill handles intentional re-runs (passing an existing folder path) at step 2.
- **No external side effects**: do not commit, push, or send anything. Strictly local file generation.
