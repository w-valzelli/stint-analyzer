# Maintainability refactor — Plan

**Specification:** [`../specs/maintainability-refactor.md`](../specs/maintainability-refactor.md)

## Purpose

Execute the behavior-preserving maintainability work in a fixed order. This
file is the complete executable plan: each ticket below states its outcome,
steps, acceptance criteria, and verification. No other working notes are
required.

## Working model

- The specification defines required outcomes and boundaries.
- This plan defines order, status, and per-ticket steps.
- Complete one ticket at a time and keep the repository buildable after each.
- If a ticket conflicts with the current source, update the ticket here before
  implementing rather than guessing.
- Update the status table when a ticket completes.

## Status and sequence

| ID    | Outcome                                                      | Status       | Depends on   |
| ----- | ------------------------------------------------------------ | ------------ | ------------ |
| MR-01 | Characterize report, JSON, scorecard, and duration contracts | Complete     | —            |
| MR-02 | Establish shared duration behavior and one source schema     | Complete     | MR-01        |
| MR-03 | Make scorecard value, sample, and direction rules explicit   | Complete     | MR-01        |
| MR-04 | Make `buildAnalysisReport` readable orchestration            | Complete     | MR-03        |
| MR-05 | Declare and map every JSON 1.0 field explicitly              | Ready — next | MR-04        |
| MR-06 | Use one ordered import record flow                           | Blocked      | MR-05        |
| MR-07 | Share anchored-popup mechanics                               | Blocked      | MR-06        |
| MR-08 | Share lap-series chart presentation                          | Blocked      | MR-06        |
| MR-09 | Split styles and remove confirmed dead UI                    | Blocked      | MR-07, MR-08 |
| MR-10 | Remove the Impeccable integration                            | Blocked      | MR-09        |
| MR-11 | Finalize maintainer guidance and run the complete gate       | Blocked      | MR-10        |

MR-07 and MR-08 may proceed independently after MR-06. MR-09 is their join
point and must wait for both.

## Requirement coverage

| Specification requirement                        | Ticket         |
| ------------------------------------------------ | -------------- |
| R-1 Readable canonical report construction       | MR-04 complete |
| R-2 Explicit JSON 1.0 contract                   | MR-05          |
| R-3 One ordered import record model              | MR-06          |
| R-4 Shared anchored-popup mechanics              | MR-07          |
| R-5 Shared lap-series presentation               | MR-08          |
| R-6 Human-navigable styles and dead-code removal | MR-09          |
| R-7 Canonical duration behavior                  | MR-02 complete |
| R-8 Shared domain schemas                        | MR-02 complete |
| R-9 Explicit scorecard rules                     | MR-03 complete |
| R-10 Remove Impeccable                           | MR-10          |
| R-11 Concise human and agent guidance            | MR-11          |

## Global boundaries

- Preserve analysis, import, rendered, accessibility, and export behavior.
- Keep workbook data local to the browser.
- Add no dependency without separate approval.
- Do not fix unrelated defects inside these tickets; record them instead.
- Do not publish or deploy.
- Run each ticket’s focused checks, then the standard gate: `pnpm lint`,
  `pnpm check`, `pnpm test`, and `pnpm build`.

## Completed foundation

MR-01 added deterministic characterization coverage for the complete serialized
JSON object (`tests/fixtures/serializedAnalysisReport.ts`), all five scorecard
directions, duration edge cases, and the fixed canonical report.

MR-02 moved canonical duration behavior to `src/shared/durations.ts`, kept
workbook interpretation in `src/domain/parsing/workbook-duration.ts`, and reused
`sourceSummarySchema` in report validation.

MR-03 replaced positional scorecard arguments and the Boolean direction with
named metric definitions in `src/domain/analytics/summaries.ts`. Definitions are
keyed by `DriverScorecard` metric and checked with `satisfies`, so a missing or
extra metric is a type error rather than an unchecked cast.

MR-04 reduced `src/domain/analytics/report.ts` to shared input calculation,
ordered section construction, the leaderboard/driver integrity check, and schema
validation. Warnings live in `report-warnings.ts`, sectors, leaderboard, and
drivers with scorecards in `report-drivers.ts`, and stints and lap audit in
`report-audit.ts`, each behind named input and output types. The analytics
modules share `compareText` from `text-order.ts`.

The separately approved type-first restructure established the source routing
used by the remaining work:

- Astro routes: `src/pages`
- React application, reusable controls, and product UI: `src/components`
- Framework-independent product logic: `src/domain`
- Named cross-area framework-independent behavior: `src/shared`
- Styles: `src/styles`

---

## MR-04 — Make `buildAnalysisReport` readable orchestration

**Outcome:** `buildAnalysisReport` reads as an ordered construction sequence.

**Steps**

1. Add `src/domain/analytics/report-warnings.ts` and move warning projection
   there, preserving deterministic warning order.
2. Add `src/domain/analytics/report-drivers.ts` and move driver, sector,
   leaderboard, and scorecard projection there.
3. Add `src/domain/analytics/report-audit.ts` and move stint and lap audit
   projection there.
4. Give each new module boundary named input and output types. Remove opaque
   `Parameters<typeof ...>` and nested `ReturnType<typeof ...>` from these
   boundaries.
5. Keep shared input calculation, final assembly, cross-section integrity
   checks, and `analysisReportSchema` validation in `report.ts`.
6. Do not add a report pipeline or split cohesive analytics modules.

**Acceptance**

- `buildAnalysisReport` remains the only public report-building entry point.
- Fixed-input reports remain deeply equal and schema-valid; order is unchanged.
- Named types define every new module boundary.

**Verification**

- `pnpm exec vitest run tests/unit/report.test.ts tests/unit/golden-regression.test.ts tests/unit/exports.test.ts`
- `rg -n "Parameters<typeof|ReturnType<typeof" src/domain/analytics/report*.ts`
  returns no cross-module signature.
- Standard gate.

## MR-05 — Declare and map every JSON 1.0 field explicitly

**Outcome:** every serialized JSON 1.0 field is declared and mapped explicitly.

**Steps**

1. Add `src/domain/export/serialized-report.ts` with field-level Zod schemas
   for every serialized section and nested object; infer the serialized types
   from them. Replace the `jsonValueSchema` record placeholders.
2. Add one typed mapper per report section that returns its inferred serialized
   type. Use narrow helpers only for exact repeated structures (for example
   lap statistics or microsecond-to-second conversion).
3. Preserve snake-case names, `_seconds` units, values, key order, source
   basenames, and every current identifier and hash omission (`hash`, `id`,
   `lapId`, `sourceFileId`, `stintId`, `firstLapId`, `lastLapId`, `outLapId`,
   `inLapId`).
4. Delete `snakeCase`, `exportKey`, `exportValue`, `objectValue`, and
   `omittedKeys`.
5. Keep `serializeAnalysisReport`, `compactAnalysisData`, and `sourceBasename`
   exported from `src/domain/export/serialization.ts`, and keep
   `createJsonExport` in `json.ts`, so Markdown and test imports are unchanged.
6. Keep schema version `1.0`.

**Acceptance**

- Explicit schemas represent the complete JSON 1.0 shape.
- A new `AnalysisReport` field cannot enter JSON without a mapper change.
- `expectedSerializedAnalysisReport` remains deeply equal, including key order
  in `JSON.stringify` output.
- The compact JSON embedded in Markdown exports is unchanged.

**Verification**

- `pnpm exec vitest run tests/unit/report.test.ts tests/unit/golden-regression.test.ts tests/unit/exports.test.ts`
- `rg -n "omittedKeys|exportKey|exportValue|objectValue|jsonValueSchema" src/domain/export`
  returns nothing.
- Standard gate.

## MR-06 — Use one ordered import record flow

**Outcome:** one ordered record collection drives import from selection
through removal.

**Current shape:** `importWorkbookFiles` in `src/domain/parsing/imports.ts`
returns `parsed` in completion order and reports progress by index;
`ImportRegister.tsx` keeps a separate workbook list, `pendingParsedByIndex`, and
applies `trackMismatchMessage` itself.

**Steps**

1. Define the final import result as a discriminated union keyed by status.
   Each result carries its stable input index, file identity, filename, the
   hash when available, and status-specific data. Ready results own their
   `ParsedWorkbook`.
2. Key every progress event by stable input index. Keep concurrent hashing and
   parsing and the current concurrency limit.
3. Store final results by input index and apply same-track validation in the
   domain workflow, in original input order, against existing ready
   workbooks.
4. In `ImportRegister`, keep one record collection (including dropzone
   rejections), derive `workbooks` from ready records, keep only the batch
   token for stale-result protection, and remove `pendingParsedByIndex` and
   fallback result-order logic.
5. Add a unit test that makes parsing complete out of order (control
   `arrayBuffer` resolution and mock `./workbook`) and asserts that every
   result stays attached to its own file and that results keep input order.
6. Do not add a global store, state-machine dependency, cancellation, or
   persistence.

**Acceptance**

- Ready records own parsed workbooks; accepted workbooks are derived.
- Same-track validation happens in the domain workflow in input order.
- Messages, warnings, removal rules, accepted file types, and concurrency are
  unchanged.

**Verification**

- `pnpm exec vitest run tests/unit/hash.test.ts tests/unit/imports.test.ts tests/unit/import-register.test.tsx tests/unit/analyzer-shell.test.tsx`
- `rg -n "pendingParsedByIndex|setWorkbooks|trackMismatchMessage" src/components/features/import`
  returns nothing.
- Standard gate, then `pnpm exec playwright test tests/e2e/import.spec.ts`.

## MR-07 — Share anchored-popup mechanics

**Outcome:** one component owns portal, placement, repositioning, dismissal,
and focus restoration for `CustomSelect`, `ExportMenu`, and `AuditStatus` (in
`ScopeReview.tsx`).

**Steps**

1. Before extracting, add `tests/unit/select.test.tsx` covering single-select,
   multi-select, the all option, keyboard navigation, Escape and outside
   dismissal, and trigger focus restoration.
2. Add `src/components/reusable/AnchoredPopup.tsx` owning `createPortal`,
   viewport placement, `resize`/`scroll` repositioning, outside-press and
   Escape dismissal, and trigger focus restoration.
3. Move each consumer onto it while keeping its own roles, labels, content,
   and selection or export state.
4. Do not add a popup dependency or a modal or menu framework.

**Acceptance**

- Duplicate portal and listener code is absent from the three consumers.
- Roles, labels, placement, keyboard behavior, and focus restoration are
  unchanged.

**Verification**

- `pnpm exec vitest run tests/unit/select.test.tsx tests/unit/scope-review.test.tsx tests/unit/export-menu.test.tsx`
- `rg -n "createPortal|addEventListener" src/components/reusable/CustomSelect.tsx src/components/features/export/ExportMenu.tsx src/components/features/scope/ScopeReview.tsx`
  returns nothing.
- Standard gate, then `pnpm exec playwright test tests/e2e/scope.spec.ts tests/e2e/shell.spec.ts`.

## MR-08 — Share lap-series chart presentation

**Outcome:** `LapSeriesChart` owns the repeated Recharts presentation for
both progression charts.

**Steps**

1. Add `src/components/features/analysis/LapSeriesChart.tsx` owning the
   container, axes, legend, tooltip wiring, lines, and dirty-point markers.
2. Pass it prepared points and series, the Y domain, format functions, and the
   accessible label.
3. Keep `pointsForReport` and selection state in `PaceProgressionChart` and
   `SectorDeltaProgressionChart`.
4. Preserve pit-lap gaps, dirty markers, empty states, and duration format.
   Do not add application-wide chart configuration or move chart state to
   Zustand.

**Verification**

- `pnpm exec vitest run tests/unit/analysis-views.test.tsx`
- Neither feature chart imports Recharts primitives directly.
- Standard gate, then `pnpm exec playwright test tests/e2e/analysis.spec.ts`.

## MR-09 — Split styles and remove confirmed dead UI

**Outcome:** styles live in five stable areas behind `global.css`; confirmed
dead UI is gone.

**Steps**

1. Record the class selectors in `src/styles/global.css` before the split.
2. Check every removal candidate against TSX sources, dynamic status classes,
   and Recharts classes.
3. Split into `foundations.css` (tokens, resets, accessibility, motion),
   `shell.css`, `import-scope.css`, `analysis.css`, and `ui.css` (shared
   controls and popups). Keep font and Tailwind directives in `global.css`,
   import the five files in the original cascade order, and keep responsive
   rules with their area.
4. Delete `src/components/reusable/Card.tsx` and its `calibration-card` styles.
5. Remove `MetricStrip` from `AnalysisPrimitives.tsx` and its styles.
6. Remove the design-thesis HTML comment from `src/pages/index.astro`.
7. Do not rename a live class.

**Verification**

- `rg -n "MetricStrip|reusable/Card|calibration-card" src tests` returns
  nothing.
- Compare before and after selector sets; only approved dead selectors differ.
- `pnpm format`, standard gate, then
  `pnpm exec playwright test tests/e2e/scope.spec.ts tests/e2e/analysis.spec.ts tests/e2e/shell.spec.ts`.

## MR-10 — Remove the Impeccable integration

**Outcome:** no Impeccable files or configuration remain.

**Current shape:** `vendor/impeccable` is a tracked but uninitialized gitlink;
`.agents/skills/impeccable` is a tracked symlink into it.

**Steps**

1. Confirm `.gitmodules` refers only to `vendor/impeccable` and `.impeccable/`
   contains only Impeccable data.
2. `git rm` the gitlink, `.gitmodules`, the `.agents/skills/impeccable`
   symlink, `.impeccable/`, `DESIGN.md`, `PRODUCT.md`, and `MANIFEST.json`;
   remove the now-empty `.agents/` and `vendor/` directories and any ignored
   `.impeccable/review/` output.
3. Remove the Impeccable rule from `.gitignore`, Impeccable and absent
   `docs/0[1-4]_*` paths from `.prettierignore`, Impeccable paths from
   `eslint.config.js`, and `vendor/impeccable` from `tsconfig.json`.
4. Keep `THIRD_PARTY_NOTICES.md`, `README.md`, `AGENTS.md`, and this spec and
   plan. Do not change GitHub Actions.

**Verification**

- None of `.gitmodules`, `vendor/impeccable`, `.agents/skills/impeccable`,
  `.impeccable`, `DESIGN.md`, `PRODUCT.md`, or `MANIFEST.json` exist.
- `rg -i impeccable --hidden -g '!.git' -g '!node_modules' -g '!docs/**'` and
  `rg -n "docs/0[1-4]_" .prettierignore` return nothing.
- `pnpm format` and standard gate.

## MR-11 — Finalize maintainer guidance and run the complete gate

**Outcome:** README and AGENTS accurately describe the final repository with
distinct responsibilities, and the complete gate passes.

**Steps**

1. Verify final source paths, `package.json` scripts, `astro.config.mjs`, and
   `.github/workflows/deploy.yml` before editing.
2. `README.md`: product scope and non-goals, critical analysis rules, canonical
   data flow, a change-location table, exact commands, export compatibility and
   privacy, and static deployment with the base path. Replace the stale
   `BASE_PATH=/garage61-analyzer` example with `/stint-analyzer`, which matches
   the deploy workflow.
3. `AGENTS.md`: workflow, invariants, routing, and proportional verification;
   link to README for durable facts and remove substantial duplication.
4. Add no contributor guide or documentation hierarchy.

**Verification**

- `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, `pnpm build`, and
  `pnpm e2e`.
- `BASE_PATH=/stint-analyzer pnpm build`, then confirm `dist/index.html`
  references assets under `/stint-analyzer/`.
- `git status --short` and `git diff --check` show only approved changes.

## Completion

After MR-11 and its retrospective, this plan and the specification may be
removed as a separate housekeeping action if README and AGENTS fully describe
the final repository and no active maintainability work remains.
