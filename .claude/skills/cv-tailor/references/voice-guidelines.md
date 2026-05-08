# Voice Guidelines

Two voices are available. Default is **professional but warm**. Switch to **sharper** only when the user explicitly asks ("sharper variant", "more direct", "lean into the values voice").

The CV is voice-neutral — these guidelines apply only to the cover letter and to free-text in the strategy doc (cover-letter angle, summary tweaks).

---

## Default voice: professional but warm

**Goal**: a cover letter that lands warmly with hiring teams across cultures and industries — without sounding generic. The reader should finish the letter thinking "this person has substance" and "they understand what we need", not "this is a template".

### Rules

- **Open with the company's situation, not yours.** First sentence of paragraph 1 should reference what the company is dealing with — the inflection point, the team they're building, the challenge in the JD. The second sentence is where you connect your experience.
- **One concrete story per body paragraph.** Pick one achievement, name the company, give a number or scope marker, name the outcome. Don't list three half-stories — pick one and tell it.
- **Quantify where the KB has numbers.** "Grew the team from 5 to 20" beats "grew the team substantially". "Cut deploy time from 45 minutes to 90 seconds" beats "much faster". Use the numbers that already exist in the KB; don't invent.
- **Name the company by name, not "your company".** "At Acme, …" is warmer than "at your company, …".
- **Avoid résumé-paste sentences.** If a sentence reads like a CV bullet (verb + scope + outcome), rewrite it to sound like a person describing their work.
- **Close with logistics + invitation.** Location, language, availability, willingness to talk. Keep it to one sentence — don't pad.
- **Length**: 3 to 5 paragraphs. Most letters land at 4. The hook is one paragraph. The close is one paragraph. The body is 2–3.

### Avoid

- "I am writing to express my interest in…" — use the JD-context opener instead.
- "I would be a great fit because…" — show fit through stories, don't declare it.
- "Synergy", "passionate", "rockstar", "ninja", "10x", "growth mindset", "best-in-class" — generic vocabulary the reader has seen 1000 times.
- "Throughout my career" / "my entire career has prepared me" — vague time-spans are filler.
- Buzzword stacks ("agile, lean, DevOps, cloud-native") — pick the two that match the JD; explain how you've used them.
- Apologetic phrasing about gaps. If a gap is addressed, do it head-on without apology.

### Tone calibration

- Confident but not boastful. "I built X" is better than "I was instrumental in X".
- Concrete but not cold. The voice should feel like a smart colleague writing to a hiring manager, not a contract.
- Warm but not casual. No "Hi there" or "I love what you're doing!" — but a sentence like "I would welcome the chance to talk this through" is fine.

---

## Sharper variant (on request)

**When**: the user explicitly asks for it. Examples: "give me a sharper version", "more direct", "lean into the values.md voice", "make it less safe".

**Goal**: a letter that takes a position. Reader should think "this person has opinions and would be interesting to talk to".

### Rules

- **Open with a take, not a topic.** The hook is a position you hold about what the company / role / industry needs. ("Most engineering orgs treat AI tools as a productivity boost. The companies that win will redesign the org around them. That's the work I want to do at Acme.")
- **One concrete story per body paragraph, framed against the take.** The story isn't just an achievement — it's evidence for the position you opened with.
- **Use one or two values-sourced lines.** Direct references to a position from `values.md` are fair game — pick a stated belief that's actually relevant to the JD (a position on hiring, team structure, process, or how engineering should be done) and weave it into one body sentence. Don't dump all opinions; pick the one that's relevant.
- **Same close as the default voice.** Logistics + invitation. Don't end on a polemic.
- **Same length** (3–5 paragraphs).

### Calibration

- Confident bordering on opinionated. The reader should feel a personality.
- Still respectful of the company. A position is not a critique. ("Most companies do X badly" is fine. "I think you're doing X badly" is not — unless you've been invited to critique their setup.)
- One sharper letter per application is enough. Don't generate both variants by default — only when asked.

---

## Working with the strategy doc

When you write the "Cover letter angle" section in `tailoring-strategy.md`, sketch the hook, body 1, body 2, and close — but **as bullets, not full prose**. The full prose is generated in step 4.

The two examples below use a fictional candidate with a platform-engineering background — `Acme` is the target company, `Initech` and `Globex` stand in for the candidate's prior employers. Treat them as illustrations of *shape*, not content; your own angles will pull on whatever the candidate's KB actually says.

Example angle (default voice):
```
- Hook: Acme is mid-migration from monolith to services. Connect that to the service-extraction work the candidate did at Initech.
- Body 1: Initech case — extracted 4 services without freezing product work. Quantify: 6 services in flight, 2-week migration window, p95 latency held flat.
- Body 2: Mentoring track record. Two engineers from the Globex team have grown into staff-level roles since.
- Close: <city> + <language(s)> + availability.
```

Example angle (sharper variant, on request):
```
- Hook: Position — most teams treat platform work as cleanup. The teams that win treat it as enablement. That's the work to do at Acme.
- Body 1: Initech case — service extraction delivered without a product freeze. Evidence for the position.
- Body 2: How the candidate thinks about hiring platform engineers (less framework recall, more system thinking + ownership). Reference whichever values.md theme is actually relevant to this JD.
- Close: same as default.
```
