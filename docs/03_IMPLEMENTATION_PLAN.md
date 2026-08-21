# 03 — Autonomous implementation plan

## Milestone 0 — Bootstrap

### Tasks

- Initialize Astro TypeScript project.
- Add React integration.
- Configure Tailwind.
- Add selected shadcn/ui primitives.
- Set strict TypeScript.
- Configure pnpm.
- Configure ESLint and Prettier.
- Configure Vitest and Playwright.
- Add static Stint Analyzer shell and one factual local-processing footer statement.
- Add source-format copy that identifies Garage 61 workbook exports without using Garage 61 as the site brand.
- Add GitHub Pages deploy workflow.
- Add `THIRD_PARTY_NOTICES.md`.
- Add `docs/DECISIONS.md`.

### Acceptance

- `pnpm dev` works.
- `pnpm build` emits static site.
- build works under a non-root base path.
- basic test suite runs.
- no server adapter/API route.

---

## Milestone 1 — XLSX import and normalization

### Packages

- `react-dropzone`
- `read-excel-file`
- `zod`

### Tasks

1. Build drag/drop input.
2. Read workbook sheets.
3. Detect `Session - Practice` or fallback by headers.
4. Normalize headers.
5. Discover `Sector N`.
6. Parse rows into normalized laps.
7. Convert time values to internal duration unit.
8. Detect full/partial rows.
9. Preserve pit/clean/run/fuel/environment fields.
10. Hash source bytes and reject exact duplicate imports.
11. Generate parser warnings.
12. Add synthetic fixture(s).

### Acceptance

- multiple files parse;
- drivers detected;
- sectors detected;
- lap 0/partial rows do not contaminate pace;
- pit flags preserved;
- invalid workbook gives useful error;
- duplicate content warning works.

---

## Milestone 2 — Scope, stints and eligibility

### Tasks

- implement runtime scope from selected stints;
- implement one global pace scope modifier;
- detect candidates within each source and driver partition;
- merge candidates into one driver scope;
- omit zero-timed stints from selection;
- build source-card-styled driver cards;
- add select-like multi-stint controls with `All stints`;
- expose lap counts instead of workbook row counts;
- expose user-facing audit reasons.

### Acceptance

- every imported driver is included automatically;
- the same driver across files has one scope card;
- any non-empty stint subset can be selected;
- selecting `All stints` selects every available stint;
- selected stints use their full timed-lap ranges;
- the global pace mode applies to every driver;
- the pace control is disabled before import;
- pit lap can count in runtime;
- pit lap is excluded from pace;
- unclean lap is excluded only from default pace;
- `Clean` never changes penalty count;
- every lap has an explicit inclusion/exclusion state.

---

## Milestone 3 — Analytics engine

### Package

- `simple-statistics`

### Pure domain functions

- runtime sum;
- best/mean/median lap;
- population SD;
- MAD;
- IQR;
- range;
- median proximity percentages;
- IQR outlier flags;
- sector best/mean/median;
- benchmark gaps;
- theoretical best;
- execution gap;
- stint progression;
- data-quality warnings.

### Canonical report

Build `AnalysisReport` and ensure it is the only derived-data source for UI/export.

### Acceptance

- no React imports in domain;
- hand-checkable unit tests;
- deterministic report from same input/config.

---

## Milestone 4 — Runtime leaderboard facts

The approved product amendment supersedes the original penalty-adjustment proposal for this milestone. M4 remains read-only and does not add penalty inputs or adjusted runtime.

### Tasks

- show clean laps as a fraction and clean percentage;
- derive the best pace lap and median pace lap from the selected pace scope;
- sort by selected runtime and calculate deterministic gaps;
- add position, gap, and lap facts to the canonical leaderboard rows;
- build the read-only leaderboard screen.

### Acceptance

- runtime remains the only ranking measure;
- unclean laps remain part of runtime when they are full timed and selected;
- best and median pace values use the selected `clean-non-pit` or `all-non-pit` pace sample;
- clean-lap fractions use selected full timed non-pit laps as the denominator;
- leader gap = 0;
- changing only Clean flags does not change runtime, position, or gap;
- ties use deterministic driver-name ordering;
- no manual penalty input or adjusted runtime appears in M4.

---

## Milestone 5 — Main analysis UI

### Packages

- `@tanstack/react-table`
- `recharts`
- `zustand`
- `lucide-react`

### Screens

#### Overview

- counts;
- fastest best/median;
- warning summary;
- compact leaderboard;
- lap progression.

#### Leaderboard

Full table.

#### Sectors

- benchmark selector: Average / Median / Best;
- wide driver gap matrix;
- detail table;
- sample counts;
- sector progression chart.

#### Consistency

- Mode selector for Sectors or Laps;
- SD/MAD/IQR/Range selector;
- sector matrix and driver summary in Sectors mode;
- one lap summary with sample count, best, worst, and selected variation in Laps mode;
- consistent column alignment with right-aligned numeric values.

#### Drivers

- driver selector;
- summary metrics;
- sector detail;
- factual strengths/opportunities;
- theoretical vs actual;
- lap progression.

### Acceptance

- every displayed derived number exists in `AnalysisReport`;
- benchmark switching does not secretly change lap sample;
- tables remain usable on narrow screens.

---

## Milestone 6 — Exports

### Package

- `write-excel-file`

### Markdown

Implement:

- Summary;
- Full.

Include YAML metadata and compact exact JSON block in Summary.

### JSON

Versioned report serialization.

### Excel

Generate required sheets from `01_PRODUCT_DATA_EXPORT_SPEC.md`.

### Acceptance

- all exports download;
- data matches UI;
- Markdown is self-contained;
- JSON contains no NaN/Infinity;
- generated XLSX re-opens in automated test;
- method/filters included.

---

## Milestone 7 — Golden regression fixtures

The approved runtime-only standings decision applies to this milestone. Do not add penalty
inputs, penalty fixture data, adjusted runtime, or adjusted positions.

Create a synthetic Garage 61-style full-export fixture representing:

- 3 drivers;
- 2 stints per driver;
- 7 sectors;
- clean/unclean laps;
- pit in/out;
- partial lap 0;
- trailing partial;
- one clean statistical outlier;
- fuel values;

Prefer a deterministic fixture generator plus a committed `.xlsx` fixture. Real exports may be
used only to confirm the public workbook shape. Keep real private session files and all values,
names, metadata, and document properties from them out of the repo.

Add golden expected values for:

- runtime;
- runtime position and gap;
- clean numerator, denominator, and percentage;
- best/mean/median;
- SD/MAD/IQR;
- benchmark gap;
- theoretical lap.

Assert the important expected fields directly rather than relying only on a whole-report
snapshot. The committed workbook must round-trip through the browser parser before the report
assertions run.

---

## Milestone 8 — GitHub Pages hardening

### Tasks

- test under `/garage61-analyzer/`;
- verify workers/assets;
- verify static routes;
- verify refresh;
- no SPA 404 dependency;
- custom 404 page;
- metadata;
- privacy/methodology/licenses pages;
- mobile review;
- accessibility review;
- dependency audit;
- no production console data dumping.

### Acceptance

Live Pages deployment behaves like local production preview.

---

## Milestone 9 — Release

Create/update:

- README;
- screenshots;
- methodology page;
- privacy note;
- limitations;
- changelog.

Tag MVP.

Do not proceed to telemetry until the MVP acceptance list is green.

---

# Suggested package installation

The agent must check current stable package names/versions first.

Conceptual sequence:

```bash
pnpm create astro@latest .
pnpm astro add react

pnpm add tailwindcss @tailwindcss/vite
pnpm add react-dropzone read-excel-file write-excel-file
pnpm add zod simple-statistics
pnpm add @tanstack/react-table recharts zustand
pnpm add lucide-react clsx tailwind-merge class-variance-authority

pnpm add -D @astrojs/check typescript
pnpm add -D eslint prettier prettier-plugin-astro
pnpm add -D vitest jsdom
pnpm add -D @testing-library/react @testing-library/user-event
pnpm add -D @playwright/test
```

Run current shadcn Astro-compatible initialization after React + Tailwind work.

---

# Implementation details the agent should not improvise incorrectly

## Runtime

Do not sum only clean laps.

## Penalties

Do not map `Clean = 0` to a penalty.

## Pace sample

Default is clean + non-pit + full timed.

## Standard deviation

Use population SD for the selected run population.

## Outliers

Flag; do not silently remove.

## Sectors

Discover dynamically.

## Report

Compute once, reuse everywhere.

## Routing

Use in-app tabs, not arbitrary SPA deep routes.

## Privacy

No network upload.

## AI

Export to LLM; do not embed private hosted-model API keys.

---

# Suggested decision-log format

`docs/DECISIONS.md`:

```markdown
# Architecture decision log

## YYYY-MM-DD — Decision title

Status: Accepted

### Context

...

### Decision

...

### Consequences

...
```

Record:

- package substitutions;
- parser behavior needed for real files;
- duration representation;
- Pages base-path handling;
- changed metric semantics.

---

# Nice-to-have after MVP

Only after all acceptance tests:

- import exported analysis JSON;
- named sector labels;
- track-specific metadata;
- compare sessions;
- downloadable `.zip` of all exports;
- user-configurable outlier view;
- telemetry phase design.

Do **not** add accounts, cloud persistence, team workspaces, cross-device history, or automatic local persistence as nice-to-haves. They are outside the product directive, not deferred MVP work.

Do not let nice-to-have work delay the initial reliable analysis flow.
