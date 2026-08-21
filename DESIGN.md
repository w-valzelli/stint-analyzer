---
name: Garage 61 Stint Analyzer
description: A calibration-ledger interface for private and auditable Garage 61 stint comparison.
colors:
  paper: '#f4f1e8'
  paper-deep: '#e8e5dc'
  sheet: '#fbfaf5'
  ink: '#182126'
  ink-soft: '#4d5a5e'
  muted: '#6f7a7c'
  rule: '#c9cbc2'
  rule-strong: '#939d9e'
  cobalt: '#2e5aa8'
  vermilion: '#d84b2f'
  ochre: '#c7982e'
  moss: '#2f756a'
typography:
  display:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(3.2rem, 7vw, 6.6rem)'
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.45rem, 2.6vw, 2.25rem)'
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: '-0.035em'
  body:
    fontFamily: 'Recursive Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Fragment Mono, ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.63rem'
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: '0.08em'
rounded:
  sm: '6px'
  md: '8px'
  lg: '12px'
spacing:
  unit: '4px'
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '24px'
  xl: '32px'
  section: '72px'
components:
  button-primary:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.sheet}'
    rounded: '{rounded.sm}'
    padding: '0 17px'
    height: '42px'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.sm}'
    padding: '0 13px'
    height: '36px'
  comparison-sheet:
    backgroundColor: '{colors.sheet}'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
    padding: '0'
---

# Design System: Garage 61 Stint Analyzer

## Overview

**Creative North Star: "The Calibration Ledger"**

The interface treats a Garage 61 analysis as a measured instrument. It uses mineral paper, graphite ink, registration marks, and ruled evidence surfaces. The visual language feels like a careful post-session debrief, not a generic dashboard or motorsport display.

The system keeps the first comparison broad and legible. It uses a strong sans-serif hierarchy for decisions and a mono register for labels, counts, times, and state. Cobalt marks the active comparison path. Vermilion marks change, attention, and required source state. Moss confirms local readiness without becoming a decorative accent.

**Key Characteristics:**

- Calibration-sheet surfaces with functional measurement lines.
- Strong black and cobalt headline contrast.
- Mono labels for data, scope, and state.
- Flat layers with one soft ambient shadow.
- Tables and ruled rows instead of nested dashboard cards.

## Colors

The palette uses cool mineral paper as the working surface, graphite as the instrument ink, and a small set of measured signals.

### Primary

- **Cobalt Registration** (#2e5aa8): Use for the active comparison path, measurement marks, and selected navigation states.

### Secondary

- **Vermilion Change Signal** (#d84b2f): Use for source requirements, active rules, and changes that need attention.

### Tertiary

- **Ochre Calibration Mark** (#c7982e): Use sparingly for secondary measurement marks and supporting state.
- **Moss Local Ready** (#2f756a): Use for local-only readiness and audit confirmation.

### Neutral

- **Mineral Paper** (#f4f1e8): Use as the primary application ground.
- **Deep Paper** (#e8e5dc): Use for quiet panels and lower-priority surfaces.
- **Clean Sheet** (#fbfaf5): Use for the primary comparison sheet and high-focus controls.
- **Graphite Ink** (#182126): Use for headings, primary controls, and structural rules.
- **Soft Ink** (#4d5a5e): Use for body copy and supporting explanations.
- **Muted Register** (#6f7a7c): Use for labels, secondary metadata, and disabled information.
- **Measurement Rule** (#c9cbc2): Use for quiet dividers and table rows.
- **Strong Rule** (#939d9e): Use for section boundaries and sheet edges.

### Named Rules

**The Signal Scarcity Rule.** Cobalt, vermilion, ochre, and moss mark state or evidence. They do not fill decorative regions without a task reason.

**The Paper Before Chrome Rule.** Let the mineral surface and ruled structure carry hierarchy before adding another container.

## Typography

**Display Font:** Recursive Variable (with `ui-sans-serif`, `system-ui`, and `sans-serif` fallbacks)
**Body Font:** Recursive Variable (with `ui-sans-serif`, `system-ui`, and `sans-serif` fallbacks)
**Label/Mono Font:** Fragment Mono (with `ui-monospace` and `SFMono-Regular` fallbacks)

**Character:** Recursive Variable provides a variable, workmanlike voice for post-session decisions. Fragment Mono acts as the measurement register for labels, counts, times, and scope metadata.

### Hierarchy

- **Display** (600, `clamp(3.2rem, 7vw, 6.6rem)`, 0.92 line-height): The opening product thesis. Keep it to a few words and let the scale establish the first reading path.
- **Headline** (600, `clamp(1.45rem, 2.6vw, 2.25rem)`, 1.05 line-height): Section titles, sheet state, and empty-state decisions.
- **Title** (600, `1.3rem` to `1.85rem`, 1.05 line-height): Panel titles and focused supporting states.
- **Body** (400, `1rem`, 1.6 line-height): Explanations and product copy. Keep long copy near 65ch.
- **Label** (500, `0.63rem`, 0.08em tracking, uppercase): Data headers, status, scope, and navigation metadata.

### Named Rules

**The Decision Then Register Rule.** Use the sans hierarchy for the decision. Use mono only when the content is a measurement, label, state, or identifier.

**The Compressed Headline Rule.** Headings use tight tracking, but body copy keeps readable line spacing and width.

## Layout

The application uses a centered working width of `min(100% - 48px, 1360px)` on wide screens and `min(100% - 28px, 1360px)` on narrow screens. The header uses a three-part rail: product mark, privacy state, and export action. The opening surface uses a two-column comparison composition. The copy side establishes the decision; the comparison sheet carries the immediate state and import path.

The opening grid stacks below `1000px`. Mobile layouts keep the product mark and export action in the first row, move privacy state below them, then stack the thesis, workflow, sheet, ledger, and analysis index. Tables keep their minimum width and scroll horizontally rather than compressing measurement columns into unreadable text.

Use 4px as the base spacing unit. Use larger separation before a new section than inside a sheet. Keep a visible rule before major analysis regions. Do not use equal card grids as the primary page structure.

## Elevation & Depth

The system uses layered, mostly flat surfaces. The mineral paper ground, clean sheet, deep paper panel, and ruled boundaries create depth before shadows. The comparison sheet uses one soft ambient shadow (`0 18px 42px -26px rgb(24 33 38 / 35%)`) to separate the active working sheet from the desk. Do not stack borders and shadows on every region.

### Shadow Vocabulary

- **Ledger ambient** (`0 18px 42px -26px rgb(24 33 38 / 35%)`): Use only for the active comparison sheet or an equivalent primary working surface.

### Named Rules

**The Flat-By-Default Rule.** Use tonal layering and rules at rest. Use the ambient shadow only where a working sheet must separate from the ground.

## Shapes

Use gently curved working surfaces with `6px`, `8px`, or `12px` radii. Use the smallest radius for controls and badges, the middle radius for drop zones, and the largest radius for sheets and quiet panels. Use 1px rules for registration and 2px rules only for the top or bottom edge of a primary table. Avoid pill shapes except for small status markers.

## Components

### Buttons

Buttons feel tactile and exact. Primary actions use graphite ink on a clean sheet, while outline actions use a transparent mineral surface and a firm ink boundary.

- **Shape:** `6px` radius for standard and small buttons; `8px` for large buttons.
- **Primary:** Graphite background, clean-sheet text, `42px` height, and `17px` horizontal padding.
- **Hover / Focus:** Primary buttons shift to cobalt on hover. All buttons use a visible cobalt focus outline with a `4px` offset.
- **Secondary / Ghost:** Outline buttons keep a transparent background and dark rule. Ghost buttons gain the deep paper surface on hover.

### Cards / Containers

Cards are secondary primitives, not the page's primary composition.

- **Corner Style:** `12px` for a working sheet or panel.
- **Background:** Clean sheet for active work; deep paper for quiet states.
- **Shadow Strategy:** Use Ledger ambient only on an active working sheet.
- **Border:** Use a strong rule or ink rule. Do not add a colored side stripe.
- **Internal Padding:** Use `24px` as a normal panel rhythm and increase to `32px` or `48px` for a primary sheet.

### Inputs / Fields

The current shell uses a dashed drop zone as the import affordance. Keep it direct and rectangular.

- **Style:** Cobalt dashed boundary, clean-sheet or lightly tinted background, `8px` radius.
- **Focus:** Use a cobalt outline and preserve the dashed boundary.
- **Error / Disabled:** Use vermilion for source errors. Reduce opacity for unavailable actions without hiding the reason.

### Navigation

The analysis index uses a ruled horizontal tab strip. Tabs use uppercase mono labels, quiet muted text, and a clean-sheet active state. The active state receives a vermilion 2px underline. On narrow screens, the strip scrolls horizontally without wrapping the labels into multiple lines.

### Comparison Sheet

The comparison sheet is the signature component. It uses a clean-sheet surface, a ruled top register, a small source identifier, a large current state, tabular readouts, and a bordered import zone. Functional measurement lines may appear inside this component because it represents a calibration surface.

### Privacy Status

The privacy status uses a moss readiness dot, a lock icon, and a mono `LOCAL / EPHEMERAL` label. Keep it visible in the header. The status must never imply remote storage or background synchronization.

## Do's and Don'ts

### Do

- **Do** use mineral paper and ruled surfaces to organize analysis.
- **Do** reserve cobalt, vermilion, ochre, and moss for measurable state.
- **Do** use tables and evidence rows when the user needs to compare values.
- **Do** use Fragment Mono for numeric and scope content.
- **Do** keep privacy, runtime, pace, and audit language visible.
- **Do** keep the interface readable when the data becomes dense.

### Don't

- **Don't** add carbon-fiber textures, racing stripes, neon speed lines, or decorative motorsport graphics.
- **Don't** turn the page into a generic light SaaS dashboard with equal cards.
- **Don't** use full-page grid backgrounds. Keep measurement lines inside real sheets or data surfaces.
- **Don't** use gradient text, hard offset shadows, or decorative glass effects.
- **Don't** place eyebrow labels above headings. Let headings carry the hierarchy.
- **Don't** use color as the only state signal.
