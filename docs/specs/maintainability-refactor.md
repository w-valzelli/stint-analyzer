# Maintainability and human handoff refactor

## Purpose

Make the repository easier for a human maintainer to navigate and change safely
without altering product behavior. The work makes important contracts explicit,
removes duplicated implementation, organizes large surfaces by recognizable
responsibility, and removes obsolete design tooling.

This specification defines durable outcomes and boundaries. Implementation
order and status live in `docs/plans/maintainability-refactor.md`, which links
each open ticket to its GitHub issue
([#2](https://github.com/w-valzelli/stint-analyzer/issues/2)–[#8](https://github.com/w-valzelli/stint-analyzer/issues/8)).

## Goals

### R-1 — Readable canonical report construction

- `buildAnalysisReport` remains the single public report-building entry point.
- Its body exposes the ordered construction of warnings, driver-facing sections,
  stint/audit sections, final integrity checks, and schema validation.
- Meaningful module boundaries use named domain types rather than opaque
  `Parameters<typeof ...>` or nested `ReturnType` expressions.
- The refactor must not introduce a report pipeline or split cohesive analytics
  into trivial modules.

### R-2 — Explicit JSON 1.0 contract

- The complete serialized report is declared with field-level schemas and typed
  section mappings.
- JSON field names, units, values, ordering, source basenames, and privacy-related
  omissions remain compatible with schema version `1.0`.
- A new `AnalysisReport` field cannot enter JSON automatically.
- The compact JSON embedded in Markdown exports remains derived from the same
  serialized report and stays byte-identical.
- Recursive key rewriting, suffix-based conversion, and a global omission
  blacklist are removed rather than replaced with another generic serializer.

### R-3 — One ordered import record model

- One ordered record collection describes every selected or rejected file from
  hashing through its final status.
- A ready record owns its parsed workbook; accepted workbooks are derived rather
  than synchronized separately.
- Stable input identity survives concurrent hashing and parsing.
- Same-track validation belongs to the domain import workflow and is applied in
  original input order.
- Import state remains local to its React feature without a state-machine
  dependency or new global store.

### R-4 — Shared anchored-popup mechanics

- Portal rendering, viewport placement, resize/scroll repositioning, outside and
  Escape dismissal, and trigger-focus restoration have one reusable owner.
- `CustomSelect`, `ExportMenu`, and `AuditStatus` retain their own feature
  semantics, content, roles, and selection behavior.
- The shared implementation remains an anchored-popup mechanic, not a modal or
  menu framework.

### R-5 — Shared lap-series presentation

- `PaceProgressionChart` and `SectorDeltaProgressionChart` retain distinct,
  domain-readable data preparation and controls.
- Their repeated Recharts container, axes, legend, tooltip, line, and dirty-point
  presentation is implemented once by a narrowly scoped `LapSeriesChart`.
- Pit-lap gaps, dirty markers, accessible labels, empty states, and duration
  formatting remain unchanged.

### R-6 — Human-navigable styles and dead-code removal

- Existing custom CSS and BEM names remain in use.
- Styles are grouped into five stable areas: foundations, application shell,
  import/scope, analysis, and reusable UI.
- `global.css` remains the single Astro entry point and preserves cascade order.
- Only confirmed dead UI and selectors are removed, including `Card`,
  `MetricStrip`, and their styles.
- The rendered interface, responsive behavior, themes, focus, and reduced motion
  remain unchanged.

### R-7 — Canonical duration behavior

- `src/shared/durations.ts` remains the single owner of microsecond constants,
  conversion to seconds, and standard motorsport formatting.
- Workbook-specific interpretation remains in
  `src/domain/parsing/workbook-duration.ts`.
- Signed deltas and leaderboard zero-gap presentation remain explicit near their
  consumers.

### R-8 — Shared domain schemas

- `analysisReportSchema` reuses `sourceSummarySchema` for the same domain concept.
- Schemas are shared only when their concepts and validation rules are truly
  identical; normalized, report, and serialized models remain distinct where
  their responsibilities differ.

### R-9 — Explicit scorecard rules

- Each scorecard metric names its value, sample size, and ranking direction.
- Directions use `lower-first` and `higher-first` rather than a trailing Boolean.
- Pace, fuel efficiency, and consistency rank lower values first; cleanliness
  and potential rank higher values first.
- Potential remains unrealized improvement headroom: a larger execution gap
  ranks higher.
- Eligibility, ties, ranks, radar scores, and unavailable values remain exact.

### R-10 — Remove Impeccable

- Remove the Impeccable submodule, repository skill link, tracked/generated
  configuration and review output, and obsolete root artifacts.
- Remove only configuration exclusions made obsolete by those deletions, plus
  stale exclusions for already absent legacy documents.
- Preserve application source/CSS, `README.md`, `AGENTS.md`, and
  `THIRD_PARTY_NOTICES.md`.
- A fresh clone requires no submodule initialization.

### R-11 — Concise human and agent guidance

- `README.md` remains the authoritative human-maintainer entry point for product
  scope, critical semantics, data flow, source routing, commands, exports,
  privacy, and deployment.
- `AGENTS.md` remains the agent operating contract for workflow, invariants,
  scope, routing, verification, and documentation responsibilities.
- The two documents link rather than substantially duplicate one another.
- No contributor guide, architecture history, or additional permanent
  documentation hierarchy is introduced.

## Behavior and contracts to preserve

- The app remains a static, accountless Astro site with all workbook bytes and
  derived analysis kept locally in the browser.
- Runtime and pace eligibility remain separate. Runtime includes selected full
  timed pit laps; default pace uses clean, full timed, non-pit laps.
- `Clean = 0` is not a penalty. Clean percentage retains its numerator,
  denominator, and percentage.
- Dynamic sectors, driver/stint scope, warnings, statistics, theoretical bests,
  scorecards, progression, and lap audit remain deterministic.
- Every lap retains auditable runtime/pace inclusion and exclusion reasons.
- UI and all exports continue to consume the same canonical `AnalysisReport`.
- JSON 1.0, Markdown Summary/Full, and nine-sheet spreadsheet exports remain
  compatible.
- Custom controls, keyboard/focus behavior, responsive layout, light/dark themes,
  and reduced motion remain supported.
- Only theme preference persists; analysis state remains ephemeral.
- GitHub Pages repository-base-path builds remain supported.

## Non-goals

- Product, calculation, ranking, eligibility, copy, visual, or export changes.
- Fixing unrelated defects discovered during the refactor.
- Replacing the custom select, styling system, chart library, or stable package
  choices.
- Adding generic report, serializer, ranking, popup, chart, or state-machine
  frameworks.
- Adding a backend, accounts, persistence, uploads, hosted processing, telemetry
  CSV analysis, or network handling of workbook data.
- Unrelated dependency upgrades or cleanup.

## Acceptance

The refactor is complete when:

- fixed input and time produce a deeply equal, schema-valid canonical report;
- all explicit requirements R-1 through R-11 are satisfied;
- JSON fixtures remain deeply equal and internal identifiers remain private;
- deliberately out-of-order import completion preserves file/result identity;
- popup and chart duplication is removed without interaction or presentation
  regression;
- styles are discoverable and only proven dead UI is removed;
- no Impeccable integration or obsolete exclusion remains;
- README and AGENTS accurately describe the final repository with distinct
  responsibilities;
- `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and
  `pnpm e2e` pass;
- `BASE_PATH=/stint-analyzer pnpm build` succeeds and the built `index.html`
  references assets under `/stint-analyzer/`;
- no dependency was added and no unapproved change remains.
