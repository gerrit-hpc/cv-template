---
name: interview-prep
description: "Use when generating a stage-specific interview prep brief for a job the user is interviewing for. Reads the career KB, the JD, the tailoring strategy, and the company notes to produce a focused study artifact (anchor stories + likely questions + tough questions + questions to ask the interviewer). Triggered by the /interview-prep command. Writes applications/<slug>/interview-prep-<stage>.md. Never fabricates achievements or process details."
---

# Interview Prep

You turn the career knowledge base, the job description, the tailoring strategy, and the company notes into a focused interview prep brief for one specific stage of one specific process.

The skill is invoked with an application folder path and a stage name. Your job is to:

1. Read everything relevant.
2. Propose a prep plan (anchor stories + question clusters) and get approval.
3. Generate the markdown brief.
4. Iterate in chat.

---

## Workflow

### Step 1: Read everything

Always read:

- **KB**: `profile.md`, `values.md`, `skills.md`, `education.md`, every file in `experience/` (excluding `_template.md`).
- **Folder**: `<app-folder>/job-description.md`, `<app-folder>/tailoring-strategy.md`, `<app-folder>/company-notes.md` (or note absence).
- **References**: `references/stage-playbooks.md` (always), `references/anchor-story-selection.md` (always), `references/interviewer-questions.md` (always).

Parse the calibration YAML block in `company-notes.md` if present — you'll feed `style`, `difficulty`, and `tone` into question selection. If `company-notes.md` is missing, default to:

```yaml
style: mixed
difficulty: mid-rigorous
tone: casual
```

…and emit a banner at the top of the generated brief noting that calibration is missing.

### Step 2: Pick the playbook

Match `<stage>` to one of the canonical playbooks in `references/stage-playbooks.md`:

- `recruiter-screen`, `hiring-manager`, `technical`, `leadership`, `final` — direct match.
- Custom stage name (e.g. `peer-panel`, `case-study`, `culture-panel`): substring-match against canonical names. If no clear match, default to the `hiring-manager` playbook and tell the user which playbook you picked.

### Step 3: Propose a prep plan

Present in chat, before writing the file:

1. **Anchor story shortlist** — 3–5 stories drawn from `experience/*.md`. For each: a one-line name (e.g. "Acme onboarding rebuild"), the source file, the JD must-haves it covers, and one line on why it's a strong anchor. Use the heuristics in `references/anchor-story-selection.md`.

2. **Question cluster outline** — which clusters this stage's brief will include (e.g. "career narrative, motivation, comp" for recruiter-screen; "system design, code reviews, debugging stories, stack-depth" for technical), with rough question counts per cluster. Tune to the calibration bands.

3. **Open choices to flag** — any cases where the JD or strategy points two ways and you need a steer (e.g. "lean into the most recent leadership role or an older big-company role for scale?", "include or skip live-coding prep section?").

Format the proposal as a short chat message, not a file. Then say:

> "Approve as-is to generate, or tell me what to change."

**STOP HERE. This is the approval gate.** Do not write the brief until the user approves the plan. If they request changes, revise the proposal and re-present.

### Step 4: Generate the brief

After approval, write `<app-folder>/interview-prep-<stage>.md` (where `<stage>` is the user-supplied name — `recruiter-screen`, `peer-panel`, etc.) with this exact spine:

```markdown
---
stage: <stage-name>
generated_at: <YYYY-MM-DD>
sources:
  - job-description.md
  - tailoring-strategy.md
  - company-notes.md  # or: "MISSING — calibration is generic"
calibration:
  style: <from company-notes.md, or "mixed (default)">
  difficulty: <from company-notes.md, or "mid-rigorous (default)">
  tone: <from company-notes.md, or "casual (default)">
---

# <Company> — <Stage>

## Stage context
<3–5 sentences on what this round typically tests, tuned to the calibration bands. Pull from the playbook.>

## Anchor stories
### <Story name 1>
**Source**: experience/<file>.md
**Covers**: <which JD must-haves this story addresses>
**STAR**:
- **Situation**: ...
- **Task**: ...
- **Action**: ...
- **Result**: ...
**One-line summary**: <how the user can pitch this in 30 seconds>

### <Story name 2>
... (repeat for 3–5 stories)

## Likely questions

### Cluster: <name>
**Q**: <question>
**How to answer**: <one paragraph pointing at an anchor story by name or a KB section like `skills.md § Architecture`. Tune phrasing to the `tone` band.>

**Q**: <question>
**How to answer**: ...

### Cluster: <name>
... (more clusters per the playbook)

## Tough questions / gaps
<one paragraph per gap from tailoring-strategy.md's "Gaps flagged" section. Restate the chosen option (drop / lean on adjacent / address head-on) in interview-ready language. If no gaps were flagged, write a one-line note saying so.>

## Questions to ask the interviewer
<4–6 questions from references/interviewer-questions.md, tuned to the stage and the calibration. Each gets a one-line "what you're listening for" follow-up.>

## Logistics & talking points
<stage-specific. For recruiter-screen: comp anchors, timeline, motivation. For hiring-manager: scope and team. For technical: stack to refresh, system-design topics to expect. For leadership: opinions to be ready to defend. For final: offer-negotiation prep, mutual close, references readiness.>
```

Omit sections that genuinely have no content rather than filling with `n/a`.

### Step 5: Report and iterate

Report the path of the generated brief and a 3–5 line summary of what's in it. Then take edits in chat:

- "drop story X, add story Y" → edit the brief, save
- "more system-design depth" → expand the technical cluster, save
- "tighten the salary section" → edit, save
- "generate the technical brief next" → start over from Step 1 with the new stage

No further approval gates after Step 4. Pure conversation.

---

## Re-runs

If the brief file already exists for this stage:

1. Read it.
2. Ask the user whether they want to **regenerate from scratch** (default — briefs are cheap), **edit specific sections**, or **start over with a different anchor story shortlist**.
3. Never clobber without explicit approval.

If the user passes `--regen` or says "just regenerate from the existing plan", skip Step 3's approval gate and go straight to Step 4 using the anchor stories and clusters already in the existing file.

---

## What this skill must NOT do

- **Fabricate** anchor stories, achievements, dates, numbers, or process details. If the KB doesn't have a story that covers a must-have, flag it in the proposal — don't invent one.
- **Modify the KB**. Briefs reference `profile.md`, `experience/*.md`, etc. but never edit them. If the user wants to add a story to the KB, route them to do that manually first.
- **Skip the approval gate** at Step 3, even on re-runs (unless `--regen` is explicit).
- **Generate multiple stages in one run**. Each stage is its own invocation. One brief per file.
- **Commit, push, or send anything anywhere.** Strictly local file generation.

---

## File path conventions

- The application folder is the absolute path you were handed (typically `<repo-root>/applications/<slug>/`).
- References live at fixed paths relative to this skill file: `references/stage-playbooks.md`, `references/anchor-story-selection.md`, `references/interviewer-questions.md`. Use absolute paths derived from the skill file's location when reading them.
