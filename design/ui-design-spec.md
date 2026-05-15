# KB Web App — UI Design Specification

**Version:** 1.0  
**Date:** 2026-05-15  
**Scope:** Sub-project 1 (Data Model + KB CRUD)  
**Theme:** Dark, desktop-only, content-first developer tool  

---

## Table of Contents

1. [Shared Shell](#shared-shell)
2. [Global Patterns](#global-patterns)
3. [Page: Login](#page-login)
4. [Page: Profile](#page-profile)
5. [Page: Experience List](#page-experience-list)
6. [Page: Experience Detail](#page-experience-detail)
7. [Page: Skills](#page-skills)
8. [Page: Education](#page-education)
9. [Page: Values](#page-values)
10. [Page: Applications List](#page-applications-list)
11. [Page: Application Detail](#page-application-detail)
12. [Page: Settings](#page-settings)
13. [Component Inventory](#component-inventory)

---

## Shared Shell

### Left Rail

- **Width:** 220px, fixed, full viewport height
- **Background:** `surface` (#14161B)
- **Border:** 1px solid `border` on the right edge
- **Content:**
  - **Top (24px padding):**
    - Product wordmark: "KB" in mono font, 14px, `text` color, followed by "Manager" in 13px `text-secondary`
  - **Nav groups (16px padding-x, 8px gap-y):**
    - Group label (if needed): 11px uppercase, `text-tertiary`, 4px bottom margin
    - Nav items: 34px height, 10px horizontal padding, 4px radius
      - Active: `surface-raised` background, `text` color, left 2px accent border (inset)
      - Hover: `surface-raised` background
      - Items:
        - Profile
        - Experience
        - Skills
        - Education
        - Values
        - Applications
    - Separator: 1px `border-subtle`, 16px vertical margin
    - Settings (below separator)
  - **Bottom (16px padding):**
    - App version caption: 11px `text-tertiary`
    - Import status indicator (see Settings)

### Top Header

- **Height:** 56px, fixed, spans content area only (not rail)
- **Background:** `background` (#0C0E12), 1px bottom border
- **Left side:**
  - Page title: display typography (28px, 600)
  - Optional subtitle / breadcrumb below title: 13px `text-secondary`
- **Right side:**
  - Primary action button (if applicable)
  - Status indicators (e.g., application status badge on application detail)

### Content Area

- **Padding:** 32px 40px (top/sides), 48px bottom
- **Max form width:** 720px for single-column forms
- **Full width:** lists and tables span the content area
- **Scroll behavior:** vertical scroll on content area only; rail and header are fixed

---

## Global Patterns

### Edit-in-Place Form Section

Every editable section follows this pattern:

```
+-----------------------------------------------------------+
| Section Title                              [Cancel] [Save] |
+-----------------------------------------------------------+
|                                                           |
|  Label                                                    |
|  +-----------------------------------------------------+  |
|  | Input value                                          |  |
|  +-----------------------------------------------------+  |
|  Error message (if any)                                   |
|                                                           |
|  Label                                                    |
|  +-----------------------------------------------------+  |
|  | Textarea value...                                    |  |
|  |                                                      |  |
|  +-----------------------------------------------------+  |
|                                                           |
+-----------------------------------------------------------+
```

- Section header: 20px heading, left-aligned
- Action buttons: ghost Cancel + primary Save, aligned to the right of the header
- Save button shows a dot indicator (8px, accent) when the form has unsaved changes
- On save: button shows "Saving..." disabled state; on success, dot disappears
- On error: inline field errors + banner at top of section

### List View Pattern

```
+-----------------------------------------------------------+
| Title                                    [Add New]         |
+-----------------------------------------------------------+
|                                                           |
|  ┌-----------------------------------------------------┐  |
|  | Item title                    meta    [Edit] [Del]  |  |
|  | Description line...                                 |  |
|  └-----------------------------------------------------┘  |
|  ┌-----------------------------------------------------┐  |
|  | Item title                    meta    [Edit] [Del]  |  |
|  | Description line...                                 |  |
|  └-----------------------------------------------------┘  |
|                                                           |
+-----------------------------------------------------------+
```

- Items render as bordered cards (8px radius, surface background)
- Each item has a primary text line, optional secondary line, and trailing actions
- Hover: entire card gets `surface-raised` background
- "Add New" is a primary button in the header

### Empty State Pattern

```
+-----------------------------------------------------------+
|                                                           |
|                      (icon, 48px, muted)                  |
|                                                           |
|                    No experience entries yet              |
|                                                           |
|     You haven't added any roles. Import your existing     |
|     markdown KB or add your first role manually.          |
|                                                           |
|              [Import from markdown]  [Add role]           |
|                                                           |
+-----------------------------------------------------------+
```

- Vertically and horizontally centered in the content area
- Icon: generic document/box outline, `text-tertiary` color
- Heading: 16px, `text`
- Description: 14px, `text-secondary`, max-width 400px, centered
- Actions: primary + secondary buttons, 12px gap

### Reordering Pattern

- Each reorderable item has a small number input (48px wide) showing the `order` value
- Editing the number and saving re-sorts the list
- No drag handles in v1

### Tag Selector Pattern

- Existing tags render as removable pills (× on hover)
- Add trigger: "+ Add tag" ghost button
- Opens a dropdown with checkable tag list + "Create new tag" input at bottom
- New tags are immediately available and persisted to the Tag table

---

## Page: Login

**Path:** `/login`  
**Layout:** Centered card, no left rail  

```
+-----------------------------------------------------------+
|                                                           |
|                                                           |
|              ┌-------------------------------------┐      |
|              |  KB Manager                         |      |
|              |                                     |      |
|              |  Password                           |      |
|              |  +-------------------------------+  |      |
|              |  |                               |  |      |
|              |  +-------------------------------+  |      |
|              |                                     |      |
|              |  [Sign in]                          |      |
|              |                                     |      |
|              └-------------------------------------┘      |
|                                                           |
+-----------------------------------------------------------+
```

- Card: 400px max-width, centered vertically and horizontally
- Product wordmark at top of card: "KB Manager" in mono, 18px
- Single password input, label above
- "Sign in" primary button, full width
- Error: inline below input in danger color
- If `ADMIN_PASSWORD` is not set, this page shows: "Authentication is not configured." with a link to `/profile`

---

## Page: Profile

**Path:** `/profile`  
**Purpose:** Edit the single Profile record + child collections  

### Layout

Single column, max-width 720px. Four editable sections stacked vertically with 32px gap.

### Section 1: Identity

Fields (all in one form):
- Full name (text, required)
- Headline (text, required)
- Email (email, required)
- Phone (tel, optional)
- Location city (text, optional)
- Location country (text, optional)
- LinkedIn URL (url, optional)
- GitHub URL (url, optional)
- Website URL (url, optional)

Layout: two-column grid for related fields (city/country, LinkedIn/GitHub).

### Section 2: Professional Summary

- Single textarea, 8 rows
- Markdown is not supported here — plain text only

### Section 3: Key Qualifications

- Reorderable list of text items
- Each item: textarea (3 rows) + order number input
- "Add qualification" secondary button below list
- Remove button (ghost, × icon) on each item

### Section 4: Languages

- Table-like list: Name | Proficiency | Order | Actions
- Name: text input
- Proficiency: text input (free-text: "native", "fluent C1", etc.)
- Order: number input (48px)
- Actions: remove button
- "Add language" secondary button below

### Empty State

If no profile exists (first visit), all sections show empty-state forms with placeholder hints. The top of the page shows a dismissible info banner: "Welcome. Import your existing markdown KB to pre-fill these fields, or start from scratch." with an [Import] button linking to Settings.

---

## Page: Experience List

**Path:** `/experience`  
**Purpose:** Browse and manage ExperienceRole records  

### Layout

Full-width list view.

### Header

- Title: "Experience"
- Subtitle: "{count} roles" in `text-secondary`
- Primary action: [Add role] button (top right)

### List Items

Each role renders as a card:

```
┌-----------------------------------------------------------┐
│ Staff Engineer                              [Edit] [Del]  │
│ Acme Inc · Full-time · Berlin · 2021-03 — present         │
│                                                           │
│ Overview line preview...                                  │
│                                                           │
│ [leadership] [technical] [delivery]                       │
└-----------------------------------------------------------┘
```

- Title: 16px medium, links to `/experience/[slug]`
- Meta line: 13px `text-secondary`, comma-separated
- Overview: 14px `text-secondary`, 2-line clamp
- Tags: pills at bottom
- Trailing actions: Edit (ghost) and Delete (ghost, danger on hover)
- Clicking the card body navigates to detail

### Empty State

"No roles yet" with import and add actions.

### Add Role Flow

Clicking [Add role] navigates to `/experience/new` (or opens inline — spec says no modals, so navigate to a creation page).

**Create page:** Same layout as detail but with empty fields. Slug is auto-generated from company + title (user can override).

---

## Page: Experience Detail

**Path:** `/experience/[slug]`  
**Purpose:** Full edit view for a single role  

### Layout

Full width. Back link at top: "← Experience" linking to list.

### Header

- Title: role title (e.g., "Staff Engineer")
- Subtitle: company name, 13px `text-secondary`
- Right: [Delete role] ghost button (danger hover)

### Section 1: Role Details (form)

Two-column layout where fields pair naturally:
- Company / Title
- Start date / End date (end can be "Present" checkbox)
- Location / Employment type (select)
- Company URL / Slug (slug in mono font)
- Scope: team size, reporting to, budget (optional text fields)
- Tech stack: textarea (3 rows)
- Overview: textarea (6 rows)
- isHighlightsOnly: checkbox

### Section 2: Achievements (conditional)

Shown if `isHighlightsOnly` is false.

Reorderable list. Each achievement:
- Title (text)
- Context (textarea, 3 rows)
- Action (textarea, 3 rows)
- Result (textarea, 3 rows)
- Tags: tag selector
- Order: number input
- Remove button

"Add achievement" secondary button.

### Section 3: Highlights (conditional)

Shown if `isHighlightsOnly` is true.

Reorderable list of text items. Each:
- Text (textarea, 3 rows)
- Order
- Remove

### Section 4: Linked Skills

Read-only list of skills linked via `SkillApplication`. Shows:
- Skill name
- Category name (secondary text)
- Proficiency badge (familiar / proficient / expert)

If none linked: "No skills linked. Skills are connected via the Skills page." in `text-secondary`.

### Section 5: Tags

Tag selector for role-level tags.

---

## Page: Skills

**Path:** `/skills`  
**Purpose:** Manage SkillCategory + Skill + SoftSkill  

### Layout

Two zones stacked: Hard Skills (categories) then Soft Skills.

### Hard Skills

Each category is a card:

```
┌-----------------------------------------------------------┐
│ Languages                              [Add skill]        │
├-----------------------------------------------------------┐
│ Name              Proficiency    Notes    Order   Actions │
│ TypeScript        Expert         —         1      [×]     │
│ Python            Proficient     —         2      [×]     │
│ Rust              Familiar       —         3      [×]     │
│                                                           │
│ [Add skill]                                               │
└-----------------------------------------------------------┘
```

- Category header: 16px subheading + [Add skill] ghost button
- Skills render as compact table rows (44px height)
- Inline edit: clicking a row enters edit mode for that skill (inline inputs)
- Proficiency: select dropdown (familiar / proficient / expert)
- Notes: text input (truncated, expandable on hover/focus)
- Order: number input
- Actions: delete (×)
- "Add skill" at bottom opens inline form row

Category management:
- "Add category" primary button at top of hard skills zone
- Categories are reorderable via number input on the category card header

### Soft Skills

Separate card below hard skills with 32px gap.

Each soft skill:
- Name (text)
- Where demonstrated (textarea, 3 rows)
- What happened (textarea, 3 rows)
- Tags: tag selector
- Order
- Remove

"Add soft skill" secondary button.

### Empty State

If no categories exist: "No skills yet. Import your KB or add categories and skills manually."

---

## Page: Education

**Path:** `/education`  
**Purpose:** Manage EducationEntry records  

### Layout

Grouped by `kind`: Degrees, Certifications, Courses. Each group is a section.

### Section: Degrees

List of cards (same pattern as Experience list):
- Name (e.g., "MSc Computer Science")
- Institution
- Field
- Date range
- Notes preview

### Section: Certifications

Same card pattern, no field column.

### Section: Courses

Same card pattern.

### Add Entry

[Add education] primary button in page header. Opens inline form or navigates to `/education/new`.

Form fields:
- Kind (select: degree / certification / course)
- Institution (optional)
- Name (required)
- Field (optional, only relevant for degrees)
- Start date / End date (YYYY-MM inputs)
- Notes (textarea)
- Order

---

## Page: Values

**Path:** `/values`  
**Purpose:** Edit the four value-sections  

### Layout

Four sections stacked vertically, max-width 720px.

### Section 1: Principles

Reorderable list. Each principle:
- Statement (textarea, 4 rows)
- Justification (textarea, 4 rows)
- Order
- Remove

"Add principle" secondary button.

### Section 2: Career Narrative

Single textarea, 12 rows. This is a long-form text field.

### Section 3: Industry Opinions

Reorderable list. Each opinion:
- Position (textarea, 3 rows)
- Why (textarea, 3 rows)
- Counterargument (textarea, 3 rows)
- Order
- Remove

### Section 4: LinkedIn Themes

Reorderable list of text items. Each:
- Text (textarea, 4 rows)
- Order
- Remove

---

## Page: Applications List

**Path:** `/applications`  
**Purpose:** Browse and manage Application records  

### Layout

Full-width table view.

### Header

- Title: "Applications"
- Subtitle: "{count} applications"
- Primary action: [New application]

### Table

| Column | Width | Content |
|---|---|---|
| Company | 25% | Company name, 14px medium |
| Role | 25% | Role title, 14px |
| Status | 15% | Status badge pill |
| Updated | 20% | "{relative date}" in `text-secondary`, 13px |
| Actions | 15% | [Open] primary button |

- Row height: 48px
- Row hover: `surface-raised` background
- Clicking the row navigates to detail (in addition to [Open] button)
- Sorted by `updatedAt desc`

### Status Badge Display

- drafting: gray dot + "Drafting"
- applied: blue dot + "Applied"
- interviewing: purple dot + "Interviewing"
- offer: green dot + "Offer"
- closed: red dot + "Closed"

### Empty State

"No applications yet" with import and create actions.

### New Application Flow

Clicking [New application] navigates to `/applications/new`.

Form fields:
- Company (text, required)
- Role title (text, required)
- Language (select: EN / DE)
- Slug: auto-generated from company + role, editable (mono font, validated unique)

On create: redirect to `/applications/[slug]`.

---

## Page: Application Detail

**Path:** `/applications/[slug]`  
**Purpose:** View and edit all application-related data  

### Layout

Full width. Back link: "← Applications"

### Header

- Title: "{company} — {roleTitle}"
- Right: Status badge + [Change status] ghost button (opens dropdown)

### Pane 1: Job Description

Card with header:
- Left: "Job Description"
- Right: [Edit] ghost button

Content:
- If exists: rendered markdown (using `remark-gfm` + `rehype-sanitize`)
- If empty: "No job description yet. Will be created by the chat workflow in sub-project 2." in `text-secondary`

Edit mode:
- Source type: select (URL / Path / Pasted)
- Source value: text input (if URL or Path)
- Content: textarea (12 rows)
- Captured at: read-only timestamp

### Pane 2: Tailoring Strategy

Card with header:
- Left: "Tailoring Strategy"
- Right: approval date (if approved) + [Edit] ghost

Content:
- If exists: structured render of the JSONB content:
  - JD Summary section: must-haves, nice-to-haves, signals, ambiguities as tag-like items
  - Strategy section: headline, experience order (numbered list), skills lead/deprioritize as pills, cover letter angle as formatted text
  - Gaps section: table (requirement | option A | option B | recommendation)
- If empty: placeholder text

Edit mode:
- Section-by-section sub-forms (not raw JSON)
- Each top-level key gets its own sub-section with appropriate inputs

### Pane 3: Company Notes

Card with header:
- Left: "Company Notes"
- Right: last updated + [Edit]

Content:
- Structured render of JSONB:
  - Company overview card
  - Role section
  - Process stages as a table
  - People to meet as avatars + names
  - Calibration: style, difficulty, tone as pills + justification text
  - Risk areas

Edit mode: section-by-section sub-forms.

### Pane 4: Interview Prep Briefs

Card with header: "Interview Prep Briefs"

Content:
- If briefs exist: list of cards
  - Each brief: stage name (16px), generated date (caption), [Open] button
  - Clicking [Open] expands inline or navigates to sub-view
- If empty: placeholder

Brief detail (inline or sub-page):
- Stage context paragraph
- Anchor stories: each as a card with STAR breakdown
- Question clusters: collapsible sections
- Tough questions: blockquote style
- Questions to ask: table

### Pane 5: Artifacts

Card with header: "Artifacts"

Content:
- List of artifact rows:
  - Kind (CV / Cover Letter), version, generated date
  - [Download PDF] link (if pdfPath exists)
- In v1, artifacts are read-only (imported). No regenerate button.

### Pane 6: Chat (stub)

Card with muted border style:
- Header: "Chat" with a small "Soon" pill badge (warning color)
- Content: centered text "Conversational workflow lands in sub-project 2."
- No action buttons

### Pane Spacing

Each pane is a card with 24px margin-bottom. No nested cards.

---

## Page: Settings

**Path:** `/settings`  
**Purpose:** Tag management, auth config, importer, danger zone  

### Layout

Single column, max-width 720px. Sections stacked with 32px gap.

### Section 1: Tags

Header: "Tags" + [Add tag] ghost

List of existing tags:
- Slug (mono, 13px)
- Label (text)
- Usage count (e.g., "used in 3 roles")
- [Delete] ghost button (danger on hover)

Add tag inline form:
- Slug (text, validated unique, kebab-case)
- Label (text)
- [Create] primary button

Deletion: confirmation modal (destructive action — modal is acceptable here).

### Section 2: Authentication

Card with header: "Authentication"

Content:
- Current status: "Password protection is {enabled/disabled}"
- If disabled: info text explaining the `ADMIN_PASSWORD_HASH` env var
- No UI toggle (env-var only in v1)

### Section 3: Importer

Card with header: "Import from Markdown"

Content:
- Description: "Import your existing cv-template markdown KB into the database."
- [Run importer] primary button
- Status area below button:
  - Last import: timestamp or "Never"
  - Result: success / partial / failed
  - If partial: expandable list of skipped files with errors

### Section 4: Danger Zone

Card with `danger-muted` left border (2px).

Header: "Danger Zone" in danger color

Content:
- "Wipe all data" with description: "Delete all knowledge base and application data. This cannot be undone."
- [Wipe all data] secondary button with danger border and text
- Click: confirmation modal requiring typed confirmation "DELETE"

---

## Component Inventory

### Already defined in DESIGN.md

- Button (primary, secondary, ghost)
- Input / Textarea
- Card
- Tag (pill)
- Status badge
- Empty state
- Table / List row
- Form section
- Nav item

### Additional components needed

| Component | Location | Description |
|---|---|---|
| `BackLink` | `components/navigation/` | "← {label}" text link, 14px, `text-secondary`, hover `text` |
| `SectionHeader` | `components/sections/` | Title + action buttons, used by every form section |
| `ReorderableList` | `components/sections/` | Wrapper for order-number-input-based reordering |
| `TagSelector` | `components/forms/` | Multi-select dropdown for tags with create-new flow |
| `MarkdownPreview` | `components/sections/` | Rendered markdown output with sanitized HTML |
| `StatusDropdown` | `components/forms/` | Dropdown button to change application status |
| `ConfirmModal` | `components/ui/` | Destructive action confirmation with text input |
| `InlineEditRow` | `components/forms/` | Table row that toggles between read and edit mode |
| `InfoBanner` | `components/ui/` | Dismissible banner for onboarding / status messages |
| `DateInput` | `components/forms/` | YYYY-MM text input with format validation |
| `RelativeDate` | `components/ui/` | "2 days ago", "Mar 15" formatting |
| `SlugField` | `components/forms/` | Auto-generated slug with manual override, mono font |
| `JsonbSection` | `components/sections/` | Generic structured JSONB renderer/editor pair |

### Form Field Components

All form fields should be wrapped to support `useFormState`:

| Wrapper | Purpose |
|---|---|
| `FormField` | Label + input + error message |
| `FormTextarea` | Label + textarea + error |
| `FormSelect` | Label + select + error |
| `FormNumber` | Label + number input + error |
| `FormCheckbox` | Label + checkbox |
| `FormDate` | Label + DateInput + error |

---

## Responsive Behavior

v1 is **desktop-only**. Minimum supported viewport: 1024px width.

- Below 1024px: left rail collapses to a hamburger menu icon in the header; nav opens as an overlay drawer (220px, `surface-overlay` background)
- No mobile-specific layouts
- No touch-specific sizing changes (assume desktop use)

---

## Accessibility

- All interactive elements must have focus rings (2px accent-muted)
- Form labels are explicitly associated with inputs (`htmlFor`)
- Error messages are linked via `aria-describedby`
- Navigation uses `nav` with `ul` / `li` structure
- Status changes are announced via live regions (save success, errors)
- Color is not the sole means of conveying information (status badges include text)
- Minimum contrast ratios: 4.5:1 for body text, 3:1 for UI components
