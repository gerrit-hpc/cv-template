---
version: alpha
name: KB Web App Design System
description: Visual system for the cv-template knowledge-base CRUD web app. Clean, dense, developer-tool aesthetic.
colors:
  background: "#0C0E12"
  surface: "#14161B"
  surface-raised: "#1C1F27"
  surface-overlay: "#242833"
  text: "#E8E9EC"
  text-secondary: "#9BA3AF"
  text-tertiary: "#6B7280"
  border: "#2A2E38"
  border-subtle: "#1E2128"
  accent: "#5B8DEF"
  accent-hover: "#7AA4F2"
  accent-muted: "#2A3A5C"
  success: "#4ADE80"
  success-muted: "#1A3A2A"
  warning: "#FBBF24"
  warning-muted: "#3A3010"
  danger: "#F87171"
  danger-muted: "#3A1A1A"
  status-draft: "#6B7280"
  status-applied: "#5B8DEF"
  status-interviewing: "#A78BFA"
  status-offer: "#4ADE80"
  status-closed: "#F87171"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#0C0E12"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  textarea:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  nav-item:
    height: "34px"
    padding: "0 10px"
    rounded: "{rounded.sm}"
  tag:
    backgroundColor: "{colors.accent-muted}"
    textColor: "{colors.accent}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  status-badge:
    rounded: "{rounded.full}"
    padding: "2px 10px"
---

## Overview

A dark-themed, developer-oriented CRUD interface for managing a personal knowledge base and job applications. The aesthetic is functional and dense: every pixel serves information density. No decorative gradients, no hero sections, no marketing fluff. The UI should feel like a well-crafted internal tool — fast, predictable, and respectful of the user's time.

## Design Principles

1. **Content first**: The data (profile, experience, applications) is the hero. Chrome is minimal and recedes.
2. **Edit-in-place**: Users stay in context. No modal dialogs for editing unless unavoidable.
3. **Feedback is immediate but quiet**: Save states, errors, and success appear inline. No toast storms.
4. **Desktop-native**: v1 is desktop-only. Layouts can assume ≥1024px width.
5. **Dark by default**: Reduces eye strain for a tool that may be used for long sessions. Single theme — no light mode in v1.

## Colors

The palette is built on a near-black background with a subtle blue cast. Surfaces step up in lightness in three tiers. The accent is a muted blue that feels technical without being corporate.

- **Base**: `#0C0E12` — the canvas
- **Surface**: `#14161B` — cards, panels, sidebar
- **Surface raised**: `#1C1F27` — inputs, hover states, active nav
- **Surface overlay**: `#242833` — dropdowns, popovers, focused elements
- **Text primary**: `#E8E9EC` — headings, body copy
- **Text secondary**: `#9BA3AF` — labels, metadata, placeholders
- **Text tertiary**: `#6B7280` — disabled, timestamps, hints
- **Border**: `#2A2E38` — dividers, input borders
- **Border subtle**: `#1E2128` — section separators inside cards
- **Accent**: `#5B8DEF` — primary actions, links, active indicators
- **Accent hover**: `#7AA4F2` — button hover, link hover
- **Accent muted**: `#2A3A5C` — tag backgrounds, focus rings
- **Success**: `#4ADE80` — offer status, positive feedback
- **Warning**: `#FBBF24` — drafting status, caution
- **Danger**: `#F87171` — errors, destructive actions, closed status

### Application status colors

| Status | Color | Muted background |
|---|---|---|
| drafting | `#6B7280` | `#2A2E38` |
| applied | `#5B8DEF` | `#2A3A5C` |
| interviewing | `#A78BFA` | `#3A305C` |
| offer | `#4ADE80` | `#1A3A2A` |
| closed | `#F87171` | `#3A1A1A` |

## Typography

**Primary**: Geist (sans) — modern, technical, excellent at small sizes. Falls back to system sans.
**Mono**: Geist Mono — for slugs, dates, code-like content. Falls back to system mono.

Scale:
- **Display**: 28px / 600 / -0.02em — page titles
- **Heading**: 20px / 600 / -0.01em — section titles, card headers
- **Subheading**: 16px / 500 / 0 — pane titles within a page
- **Body**: 14px / 400 / 1.5 — primary reading text
- **Small**: 13px / 400 / 1.5 — secondary text, nav items, buttons
- **Label**: 12px / 500 / 0.01em / uppercase — field labels, column headers
- **Caption**: 11px / 400 / 1.4 — timestamps, meta

## Layout

### Shell

- **Left rail**: 220px fixed width. Contains product name, nav groups, and footer links.
- **Header**: 56px fixed height. Contains page title, breadcrumbs, and primary actions.
- **Work area**: fills remaining viewport. Scrollable independently.
- **Max content width**: none (fluid). Cards and forms have internal max-widths where appropriate.

### Spacing scale

- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `2xl`: 32px
- `3xl`: 48px

Base grid: 8px. All spacing values are multiples of 4.

## Elevation & Depth

No drop shadows in v1. Depth is communicated through surface lightness and borders only:
- Base → Surface: +1 lightness tier + border
- Surface → Raised: +1 lightness tier
- Raised → Overlay: +1 lightness tier

This keeps the UI flat but layered.

## Shapes

- **Buttons**: 6px radius
- **Inputs**: 6px radius
- **Cards/panels**: 8px radius
- **Tags/badges**: pill (full radius)
- **Nav items**: 4px radius

## Components

### Button

Three variants:
- **Primary**: Accent background, dark text. For the main action on a page or section.
- **Secondary**: Raised surface background, border, light text. For secondary actions.
- **Ghost**: Transparent background. For tertiary actions, icon buttons, and nav.

All buttons: 13px font, medium weight, 8px 14px padding. 32px minimum height.

### Input / Textarea

- Raised surface background
- 1px border (subtle)
- 6px radius
- On focus: 2px accent-muted ring, border transitions to accent
- Error state: border transitions to danger, danger text below
- Disabled: opacity 0.5, no pointer events

### Card

- Surface background
- 1px border
- 8px radius
- 16px internal padding
- Optional header with bottom border (border-subtle) and 12px padding

### Tag (pill)

- Accent-muted background
- Accent text
- Pill shape
- 12px font, medium weight
- 2px 10px padding
- Hover: slightly lighter background

### Status badge

- Pill shape
- Colored dot (8px) + text
- Background is the status's muted color
- Text is the status's primary color

### Empty state

- Centered within parent container
- 48px muted icon (optional)
- 16px heading: "No [items] yet"
- 14px secondary text: description + action link
- No border, no background — sits inside the content area

### Table / List row

- Full-width rows
- 44px minimum height
- Hover: surface-raised background
- Active/selected: accent-muted background left border (2px)
- Divider: 1px border-subtle between rows

### Form section

- Grouped under a heading with a "Save" button aligned to the right of the heading
- Fields stack vertically with 16px gap
- Label above input, 4px gap
- Inline error text below input, 4px gap

## Do's and Don'ts

**Do**
- Use sentence case for all UI text (headings, buttons, labels)
- Show the current section's unsaved state with a dot indicator on the Save button
- Use mono font for slugs, dates (YYYY-MM), and technical identifiers
- Truncate long text with ellipsis; provide a tooltip or expandable area
- Keep the left rail visible at all times; collapse only if viewport < 900px

**Don't**
- Don't use modals for editing unless the action is destructive
- Don't use animated transitions in v1 (no animation library)
- Don't show empty tables — use the empty state component
- Don't use icons without labels in the left rail (except the logo)
- Don't use border-radius on full-width elements inside cards
