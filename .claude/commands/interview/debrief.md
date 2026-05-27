---
description: "Capture a finished interview round into applications/<slug>/interview-debrief-<stage>.md, then sync the durable intel (people met, process format, comp/timeline signals, calibration shifts) back into company-notes.md so the next round's prep is sharper. The post-round counterpart to /interview:prep. Stages: recruiter-screen, hiring-manager, technical, leadership, final (or a custom name)."
---

# Debrief a Finished Interview Round

You are helping the user capture what just happened in one specific interview round, while their memory is fresh. The work produces two things: a raw round record at `applications/<slug>/interview-debrief-<stage>.md`, and approved updates synced back into `applications/<slug>/company-notes.md`.

**Inputs**: arguments after `/interview:debrief` are:
- `<slug-or-path>`: e.g. `acme-staff-engineer` or `applications/acme-staff-engineer/`. If omitted, list folders under `applications/` and ask.
- `<stage>`: one of `recruiter-screen`, `hiring-manager`, `technical`, `leadership`, `final`. A custom stage name (e.g. `peer-panel`, `tech-basics`) is also valid — it just keys the output filename. If omitted, ask.

---

## Phase 1: Resolve folder + stage

Resolve `$ARGUMENTS` into a folder path and a stage name.

- If the folder is missing: stop. Tell the user `/tailor <jd>` must run first.
- If `applications/<slug>/job-description.md` is missing: stop with the same message.

## Phase 2: Pre-flight checks

Check the folder contents:

- `company-notes.md` — if missing, warn that the sync step will have nothing to update and offer to run `/interview:research` first. If the user declines, proceed: the debrief file is still written; the sync step is skipped with a note.
- `interview-prep-<stage>.md` — if present, the skill compares expected-vs-actual (which briefed questions came up, which anchor stories were used). If missing, that comparison is skipped — note it and continue.

## Phase 3: Hand off to the interview-debrief skill

Read `.claude/skills/interview-debrief/SKILL.md` and follow its workflow, passing the resolved folder path and stage name.

---

## Behavioral Guidelines

- **Don't fabricate.** Capture only what the user reports. Mark unknowns `unknown` — never invent interviewer names, questions, or signals.
- **No external side effects.** No commits, no pushes, no email, no Slack. Strictly local file generation.
- **Never touch the KB or JD.** The debrief reads `experience/*.md` etc. for context but never edits them, the job description, or the tailoring strategy.
- **One round per run.** Each round is its own debrief file and deserves its own capture pass.
