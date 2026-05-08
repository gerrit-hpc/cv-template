# Typst Build

How to compile generated `.typ` files to PDF in this project.

---

## Compile command

From the **repo root** (the directory containing `profile.md`, `experience/`, `applications/`, `.claude/`):

```bash
typst compile --root . applications/<slug>/cv.typ
typst compile --root . applications/<slug>/cover-letter.typ
```

Output PDFs land next to the `.typ` files (`cv.pdf`, `cover-letter.pdf`).

The `--root .` flag is required because the application `.typ` files import templates from `../../.claude/skills/cv-tailor/templates/`. Typst sandboxes file access to the input file's directory by default; `--root` tells it the project boundary.

If you forget `--root .`, you'll see:

> error: file not found (searched at /Users/.../applications/...applications/<slug>/.claude/skills/cv-tailor/templates/cv.typ)

That's the signal to add the flag.

---

## Install

If `typst` is not on PATH:

- **macOS**: `brew install typst`
- **Linux**: package available in most distros, or download a binary from https://github.com/typst/typst/releases
- **Windows**: `winget install --id Typst.Typst` or scoop / chocolatey

Verify with `typst --version`. The skill was developed against Typst 0.14.

If installation isn't possible at the moment, **don't fail the whole run**. Generate the `.typ` files, surface this install instruction in chat, and tell the user the PDFs can be compiled later by running the commands above.

---

## Watch mode (optional, during iteration)

While iterating on a generated `.typ` file:

```bash
typst watch --root . applications/<slug>/cv.typ
```

Re-renders on every save. Useful when the user wants to make small text edits and immediately see the result. Background it (`run_in_background: true`) and stop it when iteration is done.

---

## Common issues

**"file not found" on import** — almost always means `--root .` was omitted. Re-run from the repo root with the flag.

**"unknown variable" referencing a parameter name** — a typo in the parameter passed to `cv(...)` or `cover_letter(...)`. The template doesn't have a default for arbitrary names; only the parameters declared in the template signature are accepted. Compare against `templates/cv.typ` or `templates/cover-letter.typ`.

**Layout looks broken (overlapping text, weird margins)** — usually means a string with embedded special characters wasn't escaped. Typst's `[...]` content blocks treat `#`, `*`, `_`, `[`, `]` specially. Wrap problem content in plain string mode (use Typst's string escapes) or pass the content with `[...]` block syntax.

**Font missing warning** — Typst falls back automatically; the PDF still compiles. Safe to ignore unless visual fidelity matters. The templates use "New Computer Modern" which ships with Typst.

**Page breaks in awkward places** — the experience block uses `block(breakable: false, ...)` to keep role headers with their first bullets. If a single role has many bullets, this can push a role to the next page. Acceptable.

---

## Re-compiling after edits

If the user requests an edit and the `.typ` already exists:

1. Edit the parameters in `applications/<slug>/cv.typ` or `cover-letter.typ`.
2. Run the compile command again from the repo root.
3. The PDF is overwritten.

There's no incremental build — every compile is a full rebuild. It's fast (sub-second for these documents).
