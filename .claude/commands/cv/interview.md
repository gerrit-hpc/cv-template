---
description: "Interview the user to build the career knowledge base in this repo (profile, education, experience, skills, values). Idempotent — already-populated files are skipped unless the user wants a refresh. After this, the repo is ready for /cv:tailor."
---

# Interview to Build the Career Knowledge Base

You are interviewing the user to build the career knowledge base that lives in this repo. The end state is the file set documented in `README.md`:

- `profile.md` — name, contact, headline, summary, key qualifications, languages
- `education.md` — degrees, certifications, courses
- `experience/<company>-<title>.md` — one per role, following `experience/_template.md`
- `skills.md` — categorized skills with proficiency
- `values.md` — narrative: principles, career arc, opinions, themes

When done, the repo is ready for `/cv:tailor`.

This is a long conversation — likely an hour or more, spread across as many sessions as the user wants. Save files as you go; never lose progress to a long chat.

---

## Behavioral rules

- **Ask directly in chat. Do not use the AskUserQuestion tool.** This needs to feel like a conversation, not a form.
- **Two or three questions per turn**, not ten. Let them answer before going deeper.
- **Save as you go.** As soon as a section is "done enough", write the file. The user can stop and resume any time — disk state is the source of truth.
- **Suggest, never fabricate.** Propose drafts based on what they've said and ask them to confirm or correct. Never invent numbers, dates, employers, or technologies.
- **Read existing files first.** If `profile.md`, `experience/*.md`, etc. already have substantive content, treat them as starting points and only ask about gaps. Skip whole phases whose files are populated, unless the user asks to refresh.
- **Mirror existing shapes.** `experience/_template.md` is the source of truth for experience files. The existing `profile.md`, `values.md`, `skills.md`, `education.md` (if present) show the expected structure for those files; match it.
- **No external side effects.** No commits, no pushes, no network calls. Strictly local file generation.

---

## Phase 0: Inventory

Read what's already on disk:

- `README.md` (always — it documents the structure and tag taxonomy)
- `experience/_template.md` (always — the shape of experience files)
- `profile.md`, `education.md`, `skills.md`, `values.md`, `jobs.md` (if present)
- Every file in `experience/` other than the template (if any)

Tell the user, in 3–5 lines, what you found and what you'll work on. Mark each phase as **build / extend / skip** based on whether the relevant file(s) exist and have substantive content.

If nothing exists beyond `README.md` and `_template.md`, ask:

> "Do you want to start by pasting a list of your roles (LinkedIn-style — company, title, dates) into chat so I save it as `jobs.md` and use it as the worklist? Or just talk through your career and I'll capture as we go?"

Either path is fine.

---

## Phase 1: Profile (~10 min)

If `profile.md` already has substantive content, skip and ask whether they want a refresh.

Otherwise gather, conversationally:

1. Full name. Location (city, country). Email, phone, LinkedIn URL. GitHub / website (optional, "" if none).
2. **One-line headline.** If they're unsure, propose 2–3 candidates based on the rest of the conversation and let them pick or rewrite.
3. **Professional summary** (3–5 sentences). If they're stuck, ask three priming questions:
   - "What problem do you solve for the companies that hire you?"
   - "What's the through-line across the moves you've made?"
   - "What outcome should the next role produce?"
   Draft a summary from their answers; iterate.
4. **4–6 key qualifications** — evidence-backed bullets with numbers, named outcomes, specific scope. Push for specifics: "you said you grew teams — by how much, where?"
5. Spoken languages with proficiency.

Write `profile.md` mirroring the existing format (frontmatter + `# Professional Summary` + `# Key Qualifications` + `# Languages`). Show it; iterate on edits.

---

## Phase 2: Education (~3 min)

Skip if `education.md` is populated, unless the user asks to refresh.

Otherwise:

- Degrees: institution, field, dates, anything notable.
- Certifications, or none.
- Courses & training that materially shaped them, or none.

Write `education.md`. If "none" for certifications or courses, write one honest sentence about how their learning actually happens (self-directed, on the job, etc.) instead of leaving an empty section.

---

## Phase 3: Experience (the main course)

One file per role under `experience/`. This is most of the work.

### 3a. Get the role list

If `jobs.md` exists, use it as the source list.

Otherwise, ask the user to list every role they want to include — oldest to newest, just `Company / Title / Dates`. Save the response as `jobs.md` so there's a stable worklist you can return to across sessions.

### 3b. Walk through each role, **most-recent-first**

For each role missing an `experience/<slug>.md` file:

1. **Context (3–5 conversational questions):**
   - What did the company do? (one sentence)
   - Why did you join, why did you leave?
   - Team size, who you reported to, what hat(s) you wore.
   - Tech stack relevant to the role.
   - Anything organizational or political that shaped the role (CEO changes, funding events, reorgs, customer dynamics, market shifts).

2. **Achievements:**
   - Open-ended first: *"What are you proudest of from that role?"*
   - Then probe by category until you have material: shipped products, technical decisions, people growth, process change, scale milestones, recoveries from bad situations.
   - **Suggest topics they may be underselling.** Use the company / era / role to propose plausible angles: *"Did you set up the deployment pipeline?"*, *"Was there hiring during this time?"*, *"Did you introduce agile / restructure teams / coach anyone into a leadership role?"*, *"What broke and you fixed?"*
   - For each achievement, capture **Result / Context / Action**. Quantify Results where the user can.
   - Tag from the README's taxonomy: `leadership`, `technical`, `strategy`, `delivery`, `culture`, `growth`, `innovation`.

3. **Older or early-career roles** (>5 years old, or non-leadership early career): short-circuit. Ask for 3–5 bullet **Highlights** covering scope, what shipped, who they were on the team. Skip the full Result/Context/Action structure. Use a `# Highlights` section instead of `## Achievements` (the template's own comment notes this swap).

4. **Write the file** as `experience/<company>-<title>.md`, lowercase, hyphenated, ASCII-only (e.g. `acme-staff-engineer.md`). Use `experience/_template.md` as the structural base. Frontmatter fields: `company`, `title`, `start_date` (YYYY-MM), `end_date` (YYYY-MM or `present`), `location`, `employment_type`, `company_url`, `tags`.

5. Show the user the resulting file. Take edits. Move to the next role.

Don't try to bang out all roles in one turn. Each role is its own conversation. After each role is written, ask whether they want to continue or pause.

---

## Phase 4: Skills (~10 min, mostly synthesis)

Skip if `skills.md` is populated, unless the user asks to refresh.

You have now read every experience file. **Draft `skills.md`** by synthesizing across them. Mirror the category structure of the existing file if there is one; otherwise propose categories like:

- Languages
- Infrastructure & Platforms
- Architecture & Design
- AI & Developer Experience (if applicable)
- Methods & Practices
- Soft Skills

Each entry: `Skill | Proficiency | Applied at | Notes` (table format). Proficiency is one of `familiar` / `proficient` / `expert`. "Applied at" is a list of company names from the experience files. Notes are a short specific phrase.

**Soft Skills** use a different shape: `### Skill name`, then `Where demonstrated`, `What happened`, `Tags`. Mirror the existing file.

Show the draft. Ask:

- "Anything I missed?"
- "Anything overstated — should I downgrade X from expert to proficient?"
- "Anything to drop as no longer relevant?"

Iterate. Then write `skills.md`.

---

## Phase 5: Values (~15 min, the hardest — do not skip)

Skip if `values.md` is populated, unless the user asks to refresh. This file has high signal for cover letters and LinkedIn content; investing time here pays off later.

This file is narrative, no frontmatter. Sections in order:

1. **Core principles (3–5).** *"What rules of thumb do you bring to every team?"* Each: a one-sentence statement plus 2–3 sentences of justification. Probe trust, ownership, autonomy, disagreement, growth.

2. **Career narrative (one paragraph).** *"What's the through-line of your career? Why have you made the moves you've made?"* Draft 3–5 sentences from their answer; let them refine.

3. **Industry opinions (3–5).** *"What do you believe about your industry that not everyone agrees with?"* For each: **Position**, **Why** (with evidence from their career — incidents, examples, named patterns), **Counterargument they'd address**. **Push back gently** if a "controversial" opinion is actually mainstream — opinions in this section should sting at least a little, otherwise they're not worth writing.

4. **LinkedIn themes (3–5).** Synthesize from the experience files: what 5 topics could they write a series on without repeating themselves? Propose; let them edit.

Write `values.md` as narrative markdown, mirroring the existing file's shape if there is one.

---

## Phase 6: Wrap-up

Report:

- Each KB file's path and rough size (line count is fine).
- Anything you flagged as thin, vague, or worth revisiting later.
- Suggested next step: *"Try `/cv:tailor <jd-url-or-path>` to put the knowledge base through a real job description and see what's missing."*

---

## Operating notes

- **Save state often.** A long interview should never lose progress.
- **Pause and resume freely.** If the user says *"stop, continue tomorrow"*, just stop. No status file needed — the disk is the state. Re-running `/cv:interview` will inventory what exists and pick up where things were left.
- **Don't drift into perfectionism.** Aim for "good first draft", not "publishable". The KB will be edited many times by hand and through future `/cv:tailor` runs.
- **Never overwrite content without asking.** If a refresh would replace existing material, show the diff or summarise what would change and get explicit approval first.
