# Anchor Story Selection

Heuristics for picking the 3–5 anchor stories that anchor the prep brief. These stories appear at the top of the brief, written out in STAR shape, and are referenced by name in the "Likely questions" section instead of being re-told.

The goal: cover ~80% of the behavioral questions the user will face with a small portable set of stories. Each story is something the user can tell in 2–3 minutes from memory.

---

## Selection criteria, in order

1. **Covers a JD must-have**. Each anchor story should map to at least one explicit requirement in the JD. If two stories cover the same must-have, prefer the one with stronger evidence.

2. **Recent over old**. Prefer stories from the last ~5 years. Older stories are OK as supporting examples but rarely as anchors — interviewers want to know who the user is *now*.

3. **Quantified outcomes**. Prefer stories with numbers (team grew from 4 to 12, latency dropped 60%, revenue +€2M, NPS +20). Stories without numbers feel hollow at staff and leadership levels.

4. **Tellable in 2–3 minutes**. If the story needs 8 minutes to make sense, it's too complex for an anchor. Use it as a supporting reference. Anchor stories should compress without losing the punchline.

5. **Tag diversity**. Don't pick 5 stories all tagged `delivery`. Spread across the JD's emphasis:
   - JD heavy on leadership → 2 `leadership`, 1 `delivery`, 1 `culture`, 1 `strategy`
   - JD heavy on technical → 2 `technical`, 1 `innovation`, 1 `delivery`, 1 `leadership` (always at least one non-technical for hiring-manager rounds)
   - Mixed JD → 1 per major tag the JD touches

6. **Avoid stories the user has explicitly flagged as risky** in `company-notes.md § Risk areas` unless no alternative covers a critical must-have. If forced to use one, flag it in the brief's "Tough questions / gaps" section.

---

## Stage-specific tag bias

- **recruiter-screen**: 2–3 stories, light. Prefer 1 `delivery` (something shipped recently), 1 `leadership` or `strategy` (something showing seniority), 1 `culture` (something showing fit).
- **hiring-manager**: 4–5 stories. Tags from the JD's must-haves. Always include at least 1 `culture` or `leadership` story even on technical roles — managers want to know how the candidate works with people.
- **technical**: 3–4 stories. Bias to `technical`, `innovation`, `delivery`. But include at least 1 `leadership` if the role mentions tech lead, staff, or principal — they probe collaboration depth.
- **leadership**: 4–5 stories. Bias to `leadership`, `culture`, `strategy`. Always include at least 1 conflict / disagreement story.
- **final**: 1–2 stories at most. Most stories should reference the earlier briefs — at this stage, the panel has already heard the user's stories. The final brief is more about closing energy than new content.

---

## Surfacing the shortlist

When proposing the anchor stories at the approval gate, format each as:

```
**<Story name>**  (tags: leadership, delivery)
Source: experience/acme-head-of-engineering.md
Covers: "build and grow engineering teams", "ship under constraint"
Why anchor: led restructure of 30-person org during runway crunch; quantified retention and velocity outcomes
```

Keep proposals tight. The user is choosing from 8–15 candidate stories; they want signal, not paragraphs.

---

## When the KB has gaps

If the JD has a must-have for which no story exists in `experience/*.md`:

1. Flag it in the proposal: *"No KB story covers <must-have X>. Options: (a) lean on adjacent story Y, which touches it; (b) you have undocumented experience here — add to the KB before the interview."*
2. Default to option (a) unless the user opts in to (b).
3. **Never fabricate a story.** If the user picks (b), pause prep, walk them through adding the achievement to the relevant `experience/<role>.md` file, then re-read and continue.

---

## STAR formatting in the brief

For each anchor story, render in the brief as:

```markdown
### <Story name>
**Source**: experience/<file>.md
**Covers**: <bullet of JD must-haves>
**STAR**:
- **Situation**: <1–2 sentences setting the scene>
- **Task**: <1 sentence on what was at stake / what was asked>
- **Action**: <2–4 sentences on what the user specifically did — "I", not "we", where defensible>
- **Result**: <1–2 sentences with quantified outcome>
**One-line summary**: <how to pitch this in ~30 seconds when an interviewer asks "do you have a quick example?">
```

The **One-line summary** is the safety net — sometimes the interviewer cuts the story short or asks a different angle, and the user needs to land the result in a single beat.

---

## "I" vs "we"

Default to **"I"** in the Action when describing decisions and direct work. Use **"we"** only when the action was genuinely collective (e.g. "the team and I shipped"). Interviewers calibrate on individual contribution — overuse of "we" is one of the most common flags against senior candidates.

This is a guideline for the prep brief, not a script. The user can tell the story however they like; the brief just primes them to default to "I" where they often default to "we".
