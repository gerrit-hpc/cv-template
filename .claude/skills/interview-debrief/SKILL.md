---
name: interview-debrief
description: "Use when capturing what happened in a finished interview round so the next round's prep is sharper. Records a raw round debrief into applications/<slug>/interview-debrief-<stage>.md, then proposes a diff back into company-notes.md (people met, process format, comp/timeline signals, calibration shifts). Triggered by the /interview:debrief command. Hybrid capture: the user dumps what they remember, you fill the gaps. Never fabricates interviewers, questions, or signals."
---

# Interview Debrief

You capture a finished interview round while the user's memory is fresh, then feed the durable parts back into the artifacts the next round's prep reads. This is the post-round counterpart to `interview-prep`.

You are invoked with an absolute path to an application folder and a stage name. Your job is to:

1. Read everything relevant (including the prep brief for this stage, if it exists).
2. Take a free-form dump of what happened, then fill the gaps with targeted follow-ups.
3. Write `<app-folder>/interview-debrief-<stage>.md`.
4. Propose a diff into `company-notes.md` and apply it on approval.

---

## Workflow

### Step 1: Inventory

Read:

- **Folder**: `<app-folder>/job-description.md`, `<app-folder>/tailoring-strategy.md` (if present), `<app-folder>/company-notes.md` (if present — note absence), and `<app-folder>/interview-prep-<stage>.md` (the brief for this round, if it exists).
- **KB for context only**: skim `experience/*.md` names and `values.md` if you need to recognise which anchor stories the user is referring to. Never edit the KB.

If `interview-prep-<stage>.md` exists, keep its likely-questions and anchor stories in mind — you'll note which briefed questions actually came up and which stories the user actually used (expected-vs-actual is high-signal for the next round).

Tell the user in 2–4 lines what you found and that you're ready for their dump.

### Step 2: Dump

Ask the user to offload everything they remember from the round in free text — no structure required. One open prompt, e.g.:

> "Tell me everything you remember — who you met, what they asked, what went well, what didn't, anything you learned, how it felt. Dump it all, I'll organise it and chase the gaps after."

Take whatever they give you.

### Step 3: Gap follow-ups

Direct chat. **Do not use the `AskUserQuestion` tool** — this is conversational, like `/interview:research`. Two or three questions per turn, not ten.

Ask only for the structured categories the dump didn't already cover. The categories to ensure are filled (or explicitly marked `unknown`):

- **People** — names + titles of who they met; LinkedIn if known; a one-line read on each.
- **Questions asked** — the actual questions, and how the user answered / how it landed. If a prep brief existed, note which briefed questions came up and which anchor stories were used.
- **What landed well** and **what stumbled** — strengths confirmed; weak answers, surprises, gaps probed.
- **New intel** — anything learned about the role, team, comp, timeline, tech stack, or the *next* stages and their format.
- **Interviewer signals** — reactions, enthusiasm, concerns voiced.
- **Gut feel** — the user's own read; red / green flags.
- **Outcome & next steps** — advanced? next round + date? waiting on what? If unknown yet, set `outcome: pending`.

Capture verbatim signals where useful — "the interviewer said the team is mid-replatform and behind" beats your paraphrase. Save the file as soon as each section is "done enough"; the user can stop and resume.

### Step 4: Write the debrief file

Write `<app-folder>/interview-debrief-<stage>.md` (where `<stage>` is the user-supplied name) with this exact spine. Omit sections that genuinely have no content rather than filling with `n/a`.

```markdown
---
stage: <stage-name>
interviewed_at: <YYYY-MM-DD>
debriefed_at: <YYYY-MM-DD>
interviewers: [<name — title>, ...]   # or "unknown"
outcome: pending | advanced | rejected | offer | withdrew | unknown
sources: [interview-prep-<stage>.md]   # only if a prep brief existed
---

# <Company> — <Stage> Debrief

## Format & logistics
<what the round actually was: medium, duration, who ran it — and how it differed from what was expected, if a prep brief existed>

## People
<who you met: name, title, a one-line read, LinkedIn if learned>

## Questions asked
<the real questions, each with a line on how the user answered and how it landed. Flag which briefed questions came up and which anchor stories were used.>

## What landed well
<answers/stories that worked; strengths confirmed>

## What stumbled
<weak answers, surprises, gaps they probed>

## New intel
<role / team / comp / timeline / stack / next-stages learned — the durable stuff that will sync to company-notes>

## Interviewer signals
<their reactions, enthusiasm, concerns voiced>

## Gut feel
<the user's own read; red / green flags>

## Action items next round
<concrete prep to do, answers to sharpen, questions to ask next time>

## Outcome & next steps
<advanced? next round + date? waiting on what?>
```

Set `interviewed_at` to the round date (ask if not already clear; default to the dump date). Set `debriefed_at` to today.

### Step 5: Sync to company-notes (diff + approval)

If `company-notes.md` is absent, skip this step and note that the durable intel isn't being propagated — suggest `/interview:research` to create the file.

Otherwise, read `company-notes.md` and propose a **diff** — never a silent overwrite. Map debrief content to these sections:

- **People to meet** ← names / titles learned (mark whether already met or upcoming).
- **Process › Stages / Logistics** ← format confirmed or corrected, next stages + dates clarified. Replace `unknown — to update after <event>` placeholders with what was learned.
- **Reputation / Beyond the JD** ← comp signals, team intel, verbatim interviewer quotes.
- **Calibration** ← re-tune `style` / `difficulty` / `tone` **only if** the actual round contradicted the assumed bands. If you change a band, append a one-line note to the Justification explaining the shift (e.g. "tech-peer round was more coding-heavy than the headhunter implied — bumped style toward coding-heavy"). If the round confirmed the bands, leave them and say so.
- **Risk areas** ← new risks surfaced; resolve risks that the round put to rest.

Present the proposed changes as a readable summary (section-by-section: what's added, what's replaced). Then say:

> "Approve to apply these to company-notes.md, or tell me what to change."

**STOP HERE.** Do not edit `company-notes.md` until the user approves. On approval, apply the edits and bump `last_updated` to today. Never touch `researched_at`.

### Step 6: Report

Report the path of the debrief file and which `company-notes.md` sections were updated, in 3–5 lines. Suggest the next step:

> "Run `/interview:prep <next-stage>` when you're prepping the next round — it'll read this debrief and carry forward the action items."

---

## Re-runs and updates

If `interview-debrief-<stage>.md` already exists:

1. Read it.
2. Ask what the user wants: **update outcome / next steps** (the common case — flip `pending` → `advanced` / `rejected` / `offer` when the result lands), **add detail to specific sections**, or **regenerate from scratch**.
3. Updating `outcome` should not require re-walking the whole debrief — just edit the frontmatter and the "Outcome & next steps" section, bump `debriefed_at`, and (if the outcome unlocks new intel) offer a quick company-notes sync.
4. Never clobber without explicit approval.

---

## What this skill must NOT do

- **Fabricate** interviewer names, questions asked, signals, comp numbers, or process details. If the user doesn't know, write `unknown`.
- **Modify the KB** (`profile.md`, `experience/*.md`, `skills.md`, `values.md`, `education.md`), the job description, or the tailoring strategy. The debrief reads them for context only.
- **Silently overwrite `company-notes.md`.** Always show the diff and get approval (Step 5).
- **Commit, push, or send anything anywhere.** Strictly local file generation.
- **Use `AskUserQuestion`** for the gap follow-ups — keep it conversational.

---

## File path conventions

- The application folder is the absolute path you were handed (typically `<repo-root>/applications/<slug>/`).
- Output files live directly in that folder: `interview-debrief-<stage>.md` and the updated `company-notes.md`.
