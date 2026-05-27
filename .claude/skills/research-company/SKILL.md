---
name: research-company
description: "Use when researching a target company to prepare for interviews. Combines a light web pass (company URL from the JD) with a conversational interview of the user about process intel and existing knowledge, then synthesises calibration bands that downstream interview-prep uses. Triggered by the /interview:research command. Writes applications/<slug>/company-notes.md. Idempotent and extensible across sessions."
---

# Research Company

You are gathering everything needed to calibrate interview prep for one specific role at one specific company. The output is `applications/<slug>/company-notes.md`. It is read by the `interview-prep` skill to tune question selection, difficulty, and tone.

You are invoked with an absolute path to an application folder that already contains `job-description.md` (and usually `tailoring-strategy.md` and CV / cover letter artifacts from `/tailor`).

The work has two pieces, in order:

1. **Web pass** — best-effort fetch of company-owned pages.
2. **User interview pass** — direct chat, two or three questions per turn, save as you go.

Then synthesise calibration bands and write the file.

---

## Phase 0: Inventory

Read:

- `<app-folder>/job-description.md` (the `source:` frontmatter field tells you whether you have a URL)
- `<app-folder>/tailoring-strategy.md` if present (the "Signals" section may already have useful context)
- `<app-folder>/company-notes.md` if it exists (treat as starting point; only fill gaps)

Tell the user, in 3–5 lines, what you found and what you plan to do. Mark sections as **build / extend / skip**.

If `company-notes.md` already has substantive content (e.g. > 40 lines and several sections filled), ask whether they want to **extend** (default), **refresh a specific section**, or **start over**. Never clobber without explicit approval.

---

## Phase 1: Web pass (best-effort)

Look at the `source:` field in `job-description.md` frontmatter:

- **If `source:` is a URL**: WebFetch it with a prompt like `"Extract the company name, what they do, size/stage if mentioned, and any leadership names. Return concise notes."`
  - If the URL is a job board (LinkedIn, Lever, Greenhouse, Workday, Ashby, Smartrecruiters, etc.), also derive the company domain heuristically (often visible in the JD body or the URL path) and try a second fetch on the homepage + `/about`. If the company domain isn't obvious, ask the user for it in one chat line.
- **If `source:` is a path or `"pasted"`**: no URL is available. Ask the user once in chat: *"What's the company's website URL? If you don't have one or want to skip the web pass, just say so."* Then proceed accordingly.

For each successful fetch, capture:

- Size, stage, sector, founded year, locations (where stated)
- Products / what they sell, target customers
- Leadership names that might appear in the panel
- Recent news from the last ~12 months (funding, layoffs, product launches, leadership changes) — only what's on the company's own site, no external search

If a fetch fails (paywall, 403, JS-rendered, network error): surface it briefly to the user, and continue. The web pass is best-effort — it never blocks the workflow.

Save these notes to draft sections in your working memory; you'll write them to `company-notes.md` at the end of Phase 3.

---

## Phase 2: User interview pass

Direct chat. **Do not use the `AskUserQuestion` tool.** This is conversational, like `/interview`.

Two or three questions per turn, not ten. Save the file as soon as each section is "done enough"; the user can stop and resume any time.

Walk through three topics in order. Skip any topic where `company-notes.md` already has substantive content (offer a refresh instead).

### 2a. Process intel

What you need:

- **Stages told to expect**: how many rounds, names of each round if known.
- **Format per stage**: on-site / remote / hybrid; panel size; whiteboard / pairing / take-home / system design / behavioral / case study.
- **Durations and dates** for each stage.
- **People to meet** per stage: names, titles, LinkedIn URLs if known.

If the user doesn't know yet (e.g. they've only had a recruiter call), capture what is known and explicitly mark the rest as `unknown — to update after <event>`.

### 2b. Existing knowledge

- Prior contact with the company (interviewed before, knows people there, used the product).
- Network signals: anything heard from Glassdoor, Reddit, friends-of-friends, ex-employees.
- What the recruiter said about the team, the manager, the bar, the role pitch.
- People the user already knows at the company.

Capture verbatim signals where useful — "the recruiter said the team has been through three reorgs in two years" is more useful than your paraphrase of it.

### 2c. Role context beyond the JD

- What attracted the user to this specific role.
- What the recruiter emphasised vs. what's in the JD.
- Gut-feel concerns (red flags, unknowns the user is anxious about).

---

## Phase 3: Calibration synthesis

Load `references/calibration-bands.md` and use the heuristics there to pick:

- **style**: one of `structured-behavioral / unstructured-conversational / case-heavy / coding-heavy / culture-heavy / mixed`
- **difficulty**: one of `junior-screen / mid-rigorous / staff-level-deep-dive / leadership-fit / hybrid`
- **tone**: one of `formal / casual / startup-scrappy / corporate`

When signals are ambiguous, ask the user one or two targeted questions from the reference's prompt bank before assigning a band. Don't guess silently.

Write a one-paragraph **Justification** explaining why these bands were picked, citing specific signals (web findings, recruiter quotes, user impressions).

Show the synthesis to the user and take edits before writing the file.

---

## Phase 4: Write `company-notes.md`

Write the file in this exact shape (omit sections that have no content rather than filling with `n/a`):

```markdown
---
company: <name>
url: <url or "no website available">
researched_at: <YYYY-MM-DD>
last_updated: <YYYY-MM-DD>
---

# Company

## Overview
<size, stage, sector, founded, locations>

## Products
<what they sell, who they sell to>

## Recent signals
<news from last ~12 months from the company's own site>

## Leadership
<names the user might encounter>

## Reputation
<user-contributed: Glassdoor / Reddit / network impressions>

# Role

## Beyond the JD
<what the user knows that isn't in the JD>

## Why this role
<user's angle, motivation>

# Process

## Stages
<list of stages with format, duration, who, dates if known>

## People to meet
<names, titles, LinkedIn URLs if known>

## Logistics
<on-site/remote, location, travel, equipment, etc.>

# Calibration

```yaml
style: <one of the style bands>
difficulty: <one of the difficulty bands>
tone: <one of the tone bands>
```

## Justification
<one paragraph explaining why these bands were picked, citing signals>

## Risk areas
<things the user is nervous about, gaps they expect to be probed>
```

Always set `last_updated` to today's date. Set `researched_at` only when writing the file for the first time.

Report the path and a 3–5 line summary of what's captured. Suggest the next step:

> *"Try `/interview:prep <stage>` to generate a focused brief for the round you're about to face."*

---

## Re-runs and updates

Re-running on an existing folder:

1. Read the current `company-notes.md`.
2. Ask the user what changed since `last_updated`: *"What do you want to update? (process intel, people to meet, calibration, or specific sections)"*
3. Ask targeted follow-up questions only for the sections being updated. Don't re-walk topics that are already filled.
4. Update `last_updated`. Never touch `researched_at`.

Never overwrite existing content silently. If a refresh would replace material, show the diff and ask.

---

## What this skill must NOT do

- Fabricate company facts, panel names, salaries, or process details. If the user doesn't know, write `unknown` in the file.
- Run external searches beyond WebFetch on company-owned pages (no Reddit scraping, no Glassdoor API, no levels.fyi). User-contributed reputation signals only.
- Commit, push, or send anything. Strictly local file generation.
- Modify `profile.md`, `experience/*.md`, the JD, or the tailoring strategy.
- Create application folders. The folder must already exist from `/tailor`.

---

## File path conventions

- The application folder is the absolute path you were handed (typically `<repo-root>/applications/<slug>/`).
- References live at fixed paths relative to this skill file: `references/calibration-bands.md`. Use absolute paths derived from the skill file's location when reading them.
