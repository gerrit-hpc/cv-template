# Career Knowledge Base — Template

A repo template for building and maintaining a structured career knowledge base, then turning it into tailored CVs and cover letters with [Claude Code](https://claude.ai/code).

The idea: instead of editing one big CV file every time you apply somewhere, you write down your career *once* — broken into stable, reusable pieces — and then ask Claude to compose a fresh CV + cover letter for each specific job description.

---

## Quick start

1. **Use this template / clone this repo.** On GitHub, click *Use this template*. Locally, clone or copy the contents into a fresh repo.
2. **Open it in Claude Code.** From the repo root, run `claude` (or open the folder in your IDE plugin).
3. **Build the knowledge base.** Run `/cv:interview` and let Claude walk you through it. ~1 hour, can be split across sessions — files are saved as you go.
4. **Tailor for a job.** Run `/cv:tailor <jd-url-or-path>` once you have a job description. Outputs land in `applications/<company>-<role>/` as Typst sources and PDFs.
5. **Prep for the interview.** Once invited to interview, run `/interview:research <slug>` to capture company intel and calibration bands. Then run `/interview:prep <slug> <stage>` once per round (`recruiter-screen`, `hiring-manager`, `technical`, `leadership`, `final`) to generate a focused study brief.
6. **Debrief after each round.** Run `/interview:debrief <slug> <stage>` while it's fresh. It records what happened (people, questions, signals, gut feel) and syncs the durable intel back into the company notes — so the next round's `/interview:prep` brief is sharper.

---

## What's in this template

```
.claude/
  commands/
    cv/                   # The cv: command group
      interview.md        # /cv:interview — builds the knowledge base from a conversation
      tailor.md           # /cv:tailor — generates CV + cover letter from the KB for one JD
    interview/            # The interview: command group
      research.md         # /interview:research — captures company intel + calibration
      prep.md             # /interview:prep — generates per-stage prep briefs
      debrief.md          # /interview:debrief — captures a finished round, syncs intel back
  skills/
    cv-tailor/            # Skill that does the actual tailoring + Typst rendering
      SKILL.md
      templates/          # Parameterized Typst templates for CV + cover letter
      references/         # Heuristics, voice guidelines, Typst build notes
    research-company/     # Skill that does company research + interviewing the user
      SKILL.md
      references/         # Calibration bands taxonomy
    interview-prep/       # Skill that generates per-stage interview prep briefs
      SKILL.md
      references/         # Stage playbooks, anchor-story selection, interviewer questions
    interview-debrief/    # Skill that captures a finished round + syncs company-notes
      SKILL.md
experience/
  _template.md            # Shape of one experience-file entry. Don't delete.
README.md                 # This file
.gitignore
```

After running `/cv:interview`, the repo will also contain:

```
profile.md            # Name, contact, headline, summary, key qualifications, languages
education.md          # Degrees, certifications, courses
skills.md             # Categorized skills with proficiency
values.md             # Career values, narrative, opinions, LinkedIn themes
experience/<...>.md   # One file per role
jobs.md               # (Optional) raw role list, used as a worklist by /cv:interview
```

After running `/cv:tailor`, you'll also get:

```
applications/
  <company>-<role>/
    job-description.md
    tailoring-strategy.md
    cv.typ + cv.pdf
    cover-letter.typ + cover-letter.pdf
```

After running `/interview:research`, `/interview:prep`, and `/interview:debrief`:

```
applications/
  <company>-<role>/
    company-notes.md                       # Company intel + calibration bands (updated by debriefs)
    interview-prep-recruiter-screen.md     # One brief per stage you've prepped for
    interview-prep-hiring-manager.md
    interview-prep-technical.md
    interview-debrief-recruiter-screen.md  # One debrief per round you've completed
    ...
```

---

## Granularity guidance

Inside `experience/`, **one markdown file per role**. Naming: `company-title.md`, lowercase, hyphenated. Example: `acme-senior-engineer.md`.

- **Recent roles** (last ~5 years): Use per-achievement entries (Result / Context / Action / Tags). This lets `/cv:tailor` pick which achievements to lead with for each JD.
- **Older roles**: Use a short `# Highlights` bulleted list instead. Nobody reads deep history.

The `_template.md` file shows both patterns.

## Tags

Achievements and skills use tags so `/cv:tailor` can filter by what matches a JD:

| Tag | Use for |
|-----|---------|
| `leadership` | People management, hiring, team building |
| `technical` | Architecture, coding, engineering decisions |
| `strategy` | Planning, roadmaps, cross-org influence |
| `delivery` | Shipping, timelines, execution |
| `culture` | Process, rituals, values work |
| `growth` | Revenue, users, metrics improvement |
| `innovation` | New products, R&D, experimentation |

---

## Requirements

- **[Claude Code](https://claude.ai/code)** — the CLI / IDE integration. The `/cv:interview` and `/cv:tailor` commands are auto-discovered from `.claude/commands/` when you open this repo.
- **[Typst](https://typst.app)** (only for compiling PDFs at the end of `/cv:tailor`):
  - macOS: `brew install typst`
  - Linux: package or binary from <https://github.com/typst/typst/releases>
  - Windows: `winget install --id Typst.Typst`
  - The skill was developed against Typst 0.14. If `typst` isn't installed, `/cv:tailor` still produces the `.typ` source files — you can compile later.

---

## How `/cv:interview` works

It reads what already exists, then walks five phases (skipping any whose file is already populated):

1. **Profile** — name, contact, headline, summary, key qualifications, languages.
2. **Education** — degrees, certifications, courses.
3. **Experience** — one file per role, most-recent-first. For each role: company context, achievements (with quantified results where you can), and tags. Older roles get a short `# Highlights` list instead.
4. **Skills** — synthesized from your experience files; you confirm proficiency levels and trim.
5. **Values** — narrative file with core principles, career arc, industry opinions, and LinkedIn themes. (This is the one most people skip and then regret when writing cover letters.)

You can pause and resume any time — the disk is the state. Re-running `/cv:interview` picks up where you left off.

## How `/cv:tailor` works

Given a job description (URL, file path, or pasted text):

1. **Captures the JD** into `applications/<company>-<role>/job-description.md`.
2. **Analyses** the JD against your knowledge base, then writes a `tailoring-strategy.md` proposing what to lead with, what to drop, and any gaps.
3. **Waits for your approval** (this is the gate — read the strategy, push back, iterate).
4. **Generates** `cv.typ` and `cover-letter.typ` from parameterized Typst templates, then compiles to PDF.
5. **Iterates** in chat — "tighten the second paragraph", "drop the X bullet", "give me a sharper voice variant", etc.

It will never fabricate skills, dates, or achievements. If the JD asks for something your KB doesn't cover, it gets flagged with options instead of invented.

## How `/interview:research` works

Once you've been invited to interview, this command captures everything needed to calibrate prep:

1. **Web pass** — fetches the company URL captured in the JD frontmatter (or asks you for one if the JD source isn't a URL). Pulls size, stage, sector, products, leadership, recent news from the company's own site.
2. **Interview pass** — asks you (in chat, conversationally) about the process you've been told to expect, who you'll meet, what you already know about the company, and what you've heard through your network.
3. **Calibration synthesis** — assigns three bands (`style`, `difficulty`, `tone`) that downstream prep reads. A FAANG interview gets calibrated differently to a 5-person startup.

Writes `applications/<company>-<role>/company-notes.md`. Idempotent — you can re-run it across sessions as you learn more (e.g. after the recruiter call you know the panel; after the hiring-manager call you know the technical-round format).

## How `/interview:prep` works

Given an application folder and a stage name:

1. **Reads everything** — KB, JD, tailoring strategy, company notes.
2. **Proposes a prep plan** — anchor stories (3–5 from your KB, picked to cover the JD's must-haves) and question clusters tuned to the stage and calibration.
3. **Waits for your approval** (same gate model as `/cv:tailor`).
4. **Generates** `applications/<company>-<role>/interview-prep-<stage>.md` — a focused markdown brief with: stage context, anchor stories in STAR form, likely questions with how-to-answer guidance, tough questions / gaps from the tailoring strategy, questions to ask the interviewer, and stage-specific logistics.
5. **Iterates in chat** — swap stories, deepen sections, regenerate.

One brief per stage, one file per stage. Run it again for each round.

---

## Customising and updating

- **Tweak the look** (fonts, spacing, sections): edit `.claude/skills/cv-tailor/templates/cv.typ` and `cover-letter.typ` directly, or just ask Claude conversationally — e.g. "make the header smaller", "switch to a serif font for the body".
- **Pull template improvements** from upstream: this is a GitHub template repo, so your copy is independent once forked. To get later changes, add the source as a remote and cherry-pick:
  ```sh
  git remote add upstream <this-template-repo-url>
  git fetch upstream
  git log upstream/main --oneline   # see what's new
  git cherry-pick <commit>          # or merge selectively
  ```

---

## Privacy

This repo is intended to be **private**. The knowledge base will contain personal details (contact info, employer history, opinions). If you put it on GitHub, make sure it's a private repo — and consider a separate repo for the published artifacts you actually want to share.

The `.gitignore` excludes `applications/` by default to keep generated CVs out of version control. Remove that line if you want to track them.

---

## License

The scaffolding (`.claude/`, `_template.md`, `README.md`, `.gitignore`) is licensed MIT — see [LICENSE](LICENSE) if present, or treat it as MIT if absent. Your own knowledge base content is yours.
