# Stage Playbooks

One playbook per canonical stage. Each playbook tells you: what the round tests, which question clusters to include, which experience tags to lean on, which calibration overrides apply.

For custom stages (`peer-panel`, `case-study`, etc.), substring-match against canonical names. If no clear match, default to the `hiring-manager` playbook and tell the user.

---

## recruiter-screen

**What it tests**: narrative coherence ("walk me through your career"), motivation (why this role, why now), compensation alignment, basic logistics (timeline, notice period, location, work authorization), red-flag checks (gaps, churn, anything contradictory).

**Question clusters**:
1. **Career narrative** — 2–3 questions. "Walk me through your background." "What's your story?"
2. **Why us / why this role** — 2 questions. "What attracted you to <company>?" "Why are you looking?"
3. **Logistics** — 3–4 questions. Salary expectations, timeline, notice period, remote/on-site, work auth.
4. **Light fit** — 1–2 questions. "What kind of environment do you thrive in?"

**Lean on**: `profile.md § Professional Summary` for the career narrative. `values.md § Career Narrative` for the through-line. The cover letter angle from the tailoring strategy for "why us".

**Anchor story count**: 2–3. Light on stories — the recruiter screen is mostly narrative + logistics.

**Calibration overrides**:
- Always include salary anchors in **Logistics & talking points**, even if `tone: corporate` (recruiters always ask).
- If `tone: startup-scrappy`, lead the career narrative with energy and curiosity, not credentials.

---

## hiring-manager

**What it tests**: fit with the team's actual work, leadership and delivery patterns, how the user thinks about scope and trade-offs, culture alignment with the manager.

**Question clusters**:
1. **Tell me about a time...** — 4–6 behavioral questions tied to the JD's must-haves (delivery under constraint, handling disagreement, scaling a team, recovering from a bad situation).
2. **Scope and trade-offs** — 2–3 questions. "Tell me about a hard prioritization decision." "When did you have to push back on scope?"
3. **People** — 2–3 questions. "Tell me about someone you grew." "Tell me about a difficult report or peer." (Skip if the role is pure IC.)
4. **Why this team** — 1–2 questions. "What attracted you to this team specifically?"

**Lean on**: `experience/*.md` tagged `leadership`, `delivery`, `culture`. `values.md § Core Principles` for the "how I think" framing. `tailoring-strategy.md`'s recommended angle.

**Anchor story count**: 4–5. This is the story-heaviest stage.

**Calibration overrides**:
- `difficulty: staff-level-deep-dive` → expect "tell me about a time you influenced beyond your team" or "tell me about an org-design call you made". Include at least one strategy story.
- `difficulty: leadership-fit` → ratio shifts: 60% people, 30% delivery, 10% technical. Add a "tell me about a value you defended internally" question.
- `style: structured-behavioral` → format all anchor stories rigorously in STAR. Lead with the situation, end with quantified result.
- `style: unstructured-conversational` → soften the STAR scaffolding; tell stories as stories, not as templates.

---

## technical

**What it tests**: depth in the stack, system-design judgment, problem-solving under live conditions, code quality opinions, debugging instincts.

**Question clusters**:
1. **Stack-depth** — 3–5 questions tied to the JD's listed technologies. "How do you think about <X>?" "What's a hard problem you solved in <Y>?"
2. **System design** — 1–2 prompts. Calibrate scope to `difficulty`.
3. **Decisions and trade-offs** — 2–3 questions. "Tell me about a technical decision you regret." "When did you over-engineer?"
4. **Live problem-solving prep** — 1 section (not Q&A). Tips for whatever the format is (whiteboard / pairing / take-home). Pull format from `company-notes.md § Process`.
5. **Code review and quality opinions** — 1–2 questions. "What's a code smell you always push back on?"

**Lean on**: `skills.md` for the stack inventory. `experience/*.md` tagged `technical`, `innovation`, `delivery`. `values.md § Industry Opinions` for the quality / craft opinions.

**Anchor story count**: 3–4. Technical stories with specific decisions, named systems, real numbers.

**Calibration overrides**:
- `difficulty: junior-screen` → drop system design entirely. Add an "explain a project end-to-end" cluster.
- `difficulty: staff-level-deep-dive` → system design becomes the biggest cluster. Add a "tell me about an architectural rewrite or migration" prompt.
- `style: coding-heavy` → include a "topics to refresh" subsection with specific algorithms / data structures / patterns the user might be rusty on. Reference `skills.md` proficiency bands.
- `style: case-heavy` → drop system design, replace with a case-walkthrough section. Pull example cases from the JD's domain.

---

## leadership

**What it tests**: judgment under organisational pressure, ability to defend an opinion, how the user handles conflict and ambiguity, whether they have a real point of view on the work and the industry.

**Question clusters**:
1. **Opinions** — 3–5 questions probing the user's `values.md § Industry Opinions`. Frame each as "what's a belief about your industry that not everyone agrees with?" — but the interviewer may probe specific ones if the cover letter or CV signalled them.
2. **Conflict and disagreement** — 2–3 questions. "Tell me about a time you disagreed with your manager and what happened." "When did you change your mind on something important?"
3. **People growth at scale** — 2–3 questions. "Tell me about scaling a team." "When did you hire wrong, and what did you learn?"
4. **Strategy and direction** — 2 questions. "How would you think about the first 90 days?" "What would you do if the team you inherited didn't believe in the strategy?"

**Lean on**: `values.md` in full. `experience/*.md` tagged `leadership`, `strategy`, `culture`. The cover letter angle for the narrative through-line.

**Anchor story count**: 4–5, weighted toward leadership / people / strategy tags.

**Calibration overrides**:
- `style: structured-behavioral` → format all answers rigorously, include explicit "what I learned" closures.
- `tone: corporate` → tone down the opinions section — present positions with full counterargument acknowledgement, never aggressively.
- `tone: startup-scrappy` → sharpen the opinions; vague opinions die here.

---

## final

**What it tests**: usually a senior leader (skip-level, exec, founder) closing on fit, salary alignment, mutual interest. Not technical depth — that's already been screened.

**Question clusters**:
1. **Mutual close** — 2–3 questions. "What questions do you still have for us?" "What concerns, if any, remain?"
2. **Why us at decision time** — 2 questions. "Now that you've met the team, why are you still excited?"
3. **Compensation and timeline** — 2 questions. Specific to where the user is in process with competing offers.
4. **References and start date** — logistics-only. Capture in **Logistics & talking points**.

**Lean on**: the entire process up to this point. By the final stage, the user should know which stories and angles are working — this brief is more about closing energy than new content.

**Anchor story count**: 1–2 at most. Reference earlier briefs for the rest.

**Calibration overrides**:
- Always include offer-negotiation prep in **Logistics & talking points**: anchor, ranges, must-haves, walk-aways, competing-offer framing. Use `company-notes.md § Calibration` to tune (corporate vs startup negotiation styles are different).
- Always include a "what to ask if a verbal offer comes in this round" line. Cover: timeline to written, deadline to respond, references they need, start-date flexibility.

---

## Custom stages

If the user passes a stage name not in the canonical list:

1. Substring match: does it contain any canonical name? (e.g. `senior-hiring-manager` → `hiring-manager`)
2. Match by keyword: `panel` → `hiring-manager`; `coding` / `pairing` / `take-home` → `technical`; `culture` / `values` → `leadership`; `exec` / `executive` / `founder` → `final`; `screen` / `phone` / `initial` → `recruiter-screen`.
3. No match → default to `hiring-manager`. Tell the user explicitly which playbook you picked and offer to switch.

The output filename always uses the user-supplied stage name verbatim (kebab-cased): `interview-prep-peer-panel.md`, not `interview-prep-hiring-manager.md`.
