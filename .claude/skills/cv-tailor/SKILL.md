---
name: cv-tailor
description: "Use when tailoring a CV and cover letter for a specific job description. Reads the career knowledge base in this repo, proposes a tailoring strategy you approve, then generates Typst sources and PDFs into applications/<slug>/. Triggered by the /tailor command or by user requests like 'tailor my CV for this job'. Never fabricates skills or achievements."
---

# CV Tailor

You turn the career knowledge base in this repo into a CV and cover letter targeted to one specific job description.

The knowledge base files (in the repo root):
- `profile.md` — name, headline, contact, professional summary, languages, key qualifications
- `values.md` — career values, narrative themes, opinions (use as voice/angle source, not as content)
- `skills.md` — categorized skills with proficiency
- `education.md` — degrees, certifications, courses
- `experience/*.md` — one file per role; recent roles have per-achievement entries with tags

The skill is invoked with an application folder path (e.g. `applications/acme-staff-engineer/`) that already contains a `job-description.md`. Your job is to take it from analysis through to compiled PDFs.

---

## Workflow

### Step 1: Analyze the JD

Read `<app-folder>/job-description.md`. Then:

**Detect language.** Look at the body of the JD (not the metadata header). If clearly German, set `language: de`. If clearly English, set `language: en`. If mixed or ambiguous (very short, code-heavy, etc.), surface your guess with a confidence note and ask the user before proceeding. Detected language drives section headings, salutation, sign-off, and date format.

**Extract structure** from the JD:
- **Company** and **role title**
- **Must-haves**: explicit hard requirements ("5+ years of X", "fluent in German")
- **Nice-to-haves**: soft requirements ("ideally", "bonus", "plus")
- **Signals**: team size, seniority context, domain, culture cues, stage (post-Series-A, scale-up, public), tech context
- **Ambiguities**: phrases that could be interpreted multiple ways and are worth surfacing

Don't paraphrase requirement wording in the strategy — quote it. The user needs to recognize the JD's language when reviewing.

### Step 2: Read the knowledge base

Read all of these — don't skip:
- `profile.md` (frontmatter + summary + qualifications + languages)
- `skills.md` (all categories)
- `education.md`
- Every file in `experience/` (template file `_template.md` excluded)
- `values.md` for narrative angle hints (especially the "Career Narrative" and "Themes" sections)

Load `references/tailoring-strategy.md` for heuristics on mapping JD requirements to KB content.

### Step 3: Propose a tailoring strategy

Write `<app-folder>/tailoring-strategy.md` using the structure documented in `references/tailoring-strategy.md`. Sections, in order:

1. **Frontmatter** — company, role, language, jd_source, generated_at
2. **JD Summary** — must-haves, nice-to-haves, signals, ambiguities (use the JD's wording)
3. **Tailoring Strategy** — headline & summary; experience to include in order with which achievements to lead with and which to drop; skills to lead with (and to deprioritize); cover letter angle (hook, body 1, body 2, close)
4. **Gaps flagged** — JD asks not covered by the KB. For each gap, state Option A (drop / lean on adjacent strength X) and Option B (confirm undocumented experience exists). Pick a default recommendation.

After writing the file, present a concise summary in chat:

```
Strategy written to applications/<slug>/tailoring-strategy.md.

Language: <en|de>
Lead with: <top 2-3 angles>
Including: <count> roles, <count> achievements
Gaps flagged: <count> — <one-line summary>

Review the file and let me know:
  - approved as-is → I generate CV + cover letter
  - tell me what to change
  - want to address a gap by adding to the knowledge base first
```

**STOP HERE. This is the approval gate.** Do not generate CV or cover letter until the user explicitly approves.

If the user requests strategy changes, edit `tailoring-strategy.md` and present an updated summary. Loop until approved.

If the user wants to address a gap by editing the KB, walk them through the edit (or do it together) and then re-run analysis from Step 1 to refresh the strategy.

### Step 4: Generate

After approval:

1. **Load templates**: `references/voice-guidelines.md`, `templates/cv.typ`, `templates/cover-letter.typ`. The templates are parameterized — you populate parameters, never write free-form Typst.

2. **Render `<app-folder>/cv.typ`**: emit a Typst file that imports the CV template and calls it with populated parameters. Selection of experience entries, achievements per entry, and skills follows the approved strategy. Section headings are not your concern — the template handles localization based on the `language` parameter.

3. **Render `<app-folder>/cover-letter.typ`**: same pattern. The voice guide governs tone (default: professional but warm). Paragraphs follow the approved cover letter angle (hook, body 1, body 2, close). Salutation, sign-off, and date format come from the template's language-aware defaults — but you can pass explicit values if the user requested something specific.

4. **Compile PDFs**: load `references/typst-build.md` and run the documented `typst compile` command on each `.typ` file. If `typst` is not installed, surface the install instruction from the reference and stop after generating the `.typ` files (don't fail the whole run).

5. **Report** the absolute paths of the generated artifacts and any compile warnings. Note empty contact fields from `profile.md` if any were omitted.

### Step 5: Iterate

The user can request edits in chat:
- "tighten the second cover letter paragraph" → edit `cover-letter.typ` paragraphs, recompile
- "show me a sharper-voice variant of the cover letter" → regenerate cover letter only with `references/voice-guidelines.md`'s sharper rules; CV stays
- "drop the Initech bullet" → edit `cv.typ`, recompile
- "use the gap-flagged ‘adjacent strength’ option for Kafka" → already handled in strategy; if changing now, update strategy + regenerate

No more gates after this. Pure conversation.

---

## Re-runs

If invoked with an existing `<app-folder>` (the folder already has `job-description.md`), re-enter at Step 1 (re-analyze, re-propose strategy). Don't clobber existing PDFs until the user approves the new strategy.

If the user passes a `--regen` flag (or asks to "just regenerate from the existing strategy"), skip Steps 1–3 and go straight to Step 4 using the existing `tailoring-strategy.md`.

---

## Gap-flagging behavior

**Never fabricate** a skill, date, achievement, number, or company experience to fit a JD. If the JD asks for X and the KB doesn't have X:

1. List X under "Gaps flagged" in the strategy.
2. State **Option A**: drop the requirement, lean on a named adjacent strength from the KB.
3. State **Option B**: ask the user to confirm whether undocumented X experience exists. If yes, the user edits the KB before continuing.
4. Pick a default — usually A unless the JD treats X as critical.

Examples:
- JD asks for Kafka, KB has other message-based systems and event-driven architecture → Option A: lean on event-driven architecture experience. Default: A.
- JD asks for fintech background, KB has no fintech → Recommend addressing head-on in the cover letter, not pretending fintech exists. Default: address-head-on.
- JD asks for Rust, KB has no Rust → Option A: drop. Don't mention Rust at all. Default: A.

---

## What the skill must NOT do

- Fabricate skills, dates, achievements, or numbers.
- Write Typst layout code outside the parameterized template — only call the template with populated arguments.
- Modify `profile.md`, `experience/*.md`, `skills.md`, etc. without explicit user approval.
- Push, commit, or send anything anywhere. Strictly local file generation.
- Skip the approval gate, even on re-runs.

---

## File path conventions

- The application folder is the absolute path you were handed (typically `<repo-root>/applications/<slug>/`).
- Templates and references live at fixed paths relative to this skill file: `templates/cv.typ`, `templates/cover-letter.typ`, `references/voice-guidelines.md`, etc. Use absolute paths derived from the skill file's location when reading them.
