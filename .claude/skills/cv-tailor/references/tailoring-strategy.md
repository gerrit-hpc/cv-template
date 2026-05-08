# Tailoring Strategy Heuristics

How to derive a tailoring strategy from a JD and the career knowledge base. Used in step 3 of the cv-tailor workflow.

---

## The strategy artifact

Write to `<app-folder>/tailoring-strategy.md`. Required structure:

```markdown
---
company: <Company name as it appears in JD>
role: <Role title as it appears in JD>
language: <en|de>
jd_source: <url or path or "pasted">
generated_at: <YYYY-MM-DD>
---

# JD Summary

**Must-haves**:
- <quoted or near-quoted requirement from JD>
- ...

**Nice-to-haves**:
- ...

**Signals**:
- Team size: <inferred or stated>
- Seniority: <staff / lead / IC / management track>
- Domain: <fintech / logistics / consumer / etc.>
- Stage: <early-stage / Series-A / scale-up / public>
- Tech context: <stack mentioned in JD>
- Culture cues: <remote / hybrid / in-office; pace; values stated>

**Ambiguities**:
- "<phrase>" — could mean X or Y; worth surfacing.

# Tailoring Strategy

## Headline & summary
- Headline: <use existing | tweak to ...>
- Summary: <one-line description of the angle, e.g. "Lead with platform-extraction work; keep the mentoring line; drop the legacy database detail">

## Experience to include (in order)

1. **<Company>** — full / condensed / one-line.
   - Lead with: <achievement title>, <achievement title>
   - Drop: <achievement title> (reason)
2. **<Company>** — ...

## Skills to lead with
- <skill> (matches "<JD requirement>")
- <skill>
- (deprioritize) <skill> — <reason>

## Cover letter angle
- Hook: <one bullet — what the opening does>
- Body 1: <one bullet — story to tell>
- Body 2: <one bullet — story to tell>
- Close: <one bullet — logistics + invitation>

# Gaps flagged

- **<JD requirement>**: KB doesn't cover this.
  → Option A: drop, lean on <adjacent strength from KB>.
  → Option B: confirm whether undocumented experience exists.
  → **Default: A** — <one-line reason>
- ...
```

If there are no gaps, write `*No gaps — JD requirements all map to the knowledge base.*` instead of leaving the section empty.

---

## Heuristics

### Language detection

Read the *body* of the JD (skip metadata header, "Apply now" buttons). Decide:
- Mostly German vocabulary, articles, sentence structure → `de`.
- Mostly English vocabulary, articles, sentence structure → `en`.
- Mixed (e.g. German JD with embedded English tech terms) → still pick the dominant language.
- Genuinely ambiguous (very short, code-heavy, half-and-half) → ask the user.

### Mapping JD requirements to KB content

For each must-have / nice-to-have in the JD:

1. Search the knowledge base for direct matches first:
   - `skills.md` for technical skills, methods, infrastructure, AI/dev experience, soft skills
   - `experience/*.md` achievement tags (`technical`, `leadership`, `strategy`, `delivery`, `culture`, `growth`, `innovation`)
   - `experience/*.md` achievement bodies for keyword hits
2. If no direct match, look for honest adjacencies. The test: you're claiming the experience *transfers*, not that it's identical. Patterns:
   - **Specific tool → other tools in the same category.** A specific message broker the JD asks for could lean on other message-based systems the candidate has used. A specific cloud could lean on a different cloud (note the difference; don't pretend they're the same).
   - **Specific framework → same paradigm in another language.** A Spring Boot requirement could lean on ASP.NET / Rails / Django experience. A React requirement could lean on another component-based framework.
   - **Specific language → a sibling language.** Rust ↔ C++/Go; Kotlin ↔ Java/Swift; etc. Be honest about which one it is.
   - **Title mismatch → equivalent prior scope.** "Manager track" can pull on prior "Head of", "Lead", or "Tech Lead" roles even if the title differed.
3. If no direct match and no honest adjacency → flag as a gap.

### Selecting experience entries

- **Recent roles (last ~5 years)**: usually full-detail. Pick 3–5 achievements per role that match the JD's must-haves and signals. Drop achievements that don't generalize beyond the previous employer (internal-only initiatives, niche customer integrations, etc.) unless the JD specifically asks for that domain.
- **Mid-range roles**: condense to a single role-summary block with 1–3 highlight bullets, oriented to what's relevant.
- **Older roles** (>10 years): often a single line (e.g. "Mobile Developer at Initech — iOS/Android SDK work"). Sometimes drop entirely if the role doesn't add signal.
- **Ordering**: chronological reverse (most recent first). Don't reorder for relevance — the reader expects timeline.

### Selecting achievements within a role

For recent roles where the user has per-achievement entries:
- Lead with achievements whose tags match the JD's emphasis. JD heavy on "leadership" and "scale" → lead with `leadership` + `culture` + `growth` tagged achievements. JD heavy on architecture → lead with `technical` + `strategy`.
- Drop achievements that don't help. Especially: company-specific work that doesn't generalize to outside readers, unless the JD specifically asks for that domain.
- Aim for 3–5 achievements per recent role on the CV. More than 5 dilutes; fewer than 3 makes the role look thin.

### Selecting skills

The CV's Skills section should not be a brain dump of `skills.md`. Curate:
- **Lead with** skills the JD explicitly asks for (must-haves first, nice-to-haves after).
- **Group by category** as in `skills.md` (Languages, Infrastructure, Architecture, AI & DevEx, Methods).
- **Drop categories** that don't match the JD. A backend role doesn't need every iOS skill listed.
- Within a category, list the most relevant 4–6 items. Don't list 12.
- If the user has familiar-level skills the JD asks for, list them — but also flag in the gaps section that the level is "familiar", so the user can decide whether to claim them.

### Headline tweaks

The user's existing headline (in `profile.md` frontmatter) is the default. Only change it if:
- The JD has a clear emphasis the headline doesn't reflect (e.g. JD is specifically about staff IC track and current headline emphasizes leadership — propose a tweak).
- The JD is in German and the headline is in English (translate or rephrase).

If you change the headline, propose the new one in the strategy and let the user approve. Don't silently rewrite.

### Summary tweaks

Same logic as headline. The default is `profile.md`'s "Professional Summary" verbatim. Tweak only if:
- A specific phrase in the summary doesn't match the JD's emphasis (e.g. summary leads with team-scaling language but the JD is for a senior IC role with no leadership remit — soften that line).
- Numbers in the summary should be foregrounded or backgrounded depending on JD emphasis.

Keep the summary to 3–4 sentences. The CV's Summary section is the elevator pitch; longer than 4 sentences and the reader's eye glazes.

---

## Quality checks before presenting the strategy

- Did you quote (or near-quote) the JD's must-haves and nice-to-haves so the user can verify you read it correctly?
- Did you call out at least one signal (team size / stage / domain / culture) that informs the angle?
- Did the cover-letter angle's hook reference the company's situation, not your background?
- Are gaps explicit, with both options stated and a default picked?
- Is the language label correct?
