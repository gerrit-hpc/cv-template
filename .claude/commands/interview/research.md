---
description: "Research a target company and capture interview-process intel into applications/<slug>/company-notes.md. Web pass on the company URL + conversational interview about what you know and what the process looks like. Idempotent — extend the file across sessions as you learn more. Prerequisite: /tailor must have already created the application folder."
---

# Research a Company for Interview Prep

You are helping the user research a company they're interviewing with and capture process intel into `applications/<slug>/company-notes.md`. The output is read by `/interview:prep <stage>` to calibrate question style, difficulty, and tone.

**Input**: the argument after `/interview:research` is one of:
- A slug (e.g. `acme-staff-engineer`) — resolves to `applications/<slug>/`
- A path (e.g. `applications/acme-staff-engineer/`) — used directly
- Empty — list the folders under `applications/` and ask the user which one

---

## Phase 1: Resolve the folder

Resolve `$ARGUMENTS` to an absolute folder path.

- If empty: `ls applications/`, present the list, ask the user to pick.
- If the folder does not exist: stop. Tell the user `/tailor <jd>` must run first to create the application folder. Do not create a stub folder.
- If `applications/<slug>/job-description.md` is missing: stop with the same message — there's nothing to anchor the research against.

## Phase 2: Hand off to the research-company skill

Read `.claude/skills/research-company/SKILL.md` and follow its workflow, passing along the resolved application folder path.

---

## Behavioral Guidelines

- **Don't create stub folders.** This command is downstream of `/tailor` by design.
- **No external side effects.** No commits, no pushes, no Slack, no email. Strictly local file generation.
- **Idempotent.** If `company-notes.md` already exists, the skill extends it rather than clobbers it.
