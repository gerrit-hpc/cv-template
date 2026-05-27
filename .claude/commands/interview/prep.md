---
description: "Generate a stage-specific interview prep brief into applications/<slug>/interview-prep-<stage>.md. Reads the KB, JD, tailoring strategy, and company notes; proposes anchor stories + question clusters for your approval; then writes the brief. Stages: recruiter-screen, hiring-manager, technical, leadership, final (or a custom name)."
---

# Generate an Interview Prep Brief

You are helping the user prepare for one specific stage of one specific interview process. The output is `applications/<slug>/interview-prep-<stage>.md`, a markdown brief read before walking into the room.

**Inputs**: arguments after `/interview:prep` are:
- `<slug-or-path>`: e.g. `acme-staff-engineer` or `applications/acme-staff-engineer/`. If omitted, list folders under `applications/` and ask.
- `<stage>`: one of `recruiter-screen`, `hiring-manager`, `technical`, `leadership`, `final`. A custom stage name (e.g. `peer-panel`, `case-study`) is also valid — the skill picks the closest-matching playbook. If omitted, ask.

---

## Phase 1: Resolve folder + stage

Resolve `$ARGUMENTS` into a folder path and a stage name.

- If folder missing: stop. Tell the user `/cv:tailor <jd>` must run first.
- If `applications/<slug>/job-description.md` missing: stop with the same message.

## Phase 2: Pre-flight checks

Check the folder contents:

- `tailoring-strategy.md` — should exist; warn if missing (the brief loses access to the gaps analysis).
- `company-notes.md` — if missing, offer to run `/interview:research` first. If the user declines, proceed with a banner at the top of the generated brief warning that calibration is missing and question selection will be generic.

## Phase 3: Hand off to the interview-prep skill

Read `.claude/skills/interview-prep/SKILL.md` and follow its workflow, passing the resolved folder path and stage name.

---

## Behavioral Guidelines

- **Don't fabricate.** If the KB doesn't have a story, don't invent one. Reference what exists or flag the gap.
- **No external side effects.** No commits, no pushes, no email, no Slack. Strictly local file generation.
- **One stage per run.** Don't try to generate all stages in a single invocation — each stage is a separate file and deserves a separate approval gate.
