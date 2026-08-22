# Maintainability refactor — Human ticket backlog

**Source plan:** [`index.md`](./index.md)  
**Source spec:** [`../../specs/maintainability-refactor.md`](../../specs/maintainability-refactor.md)

## Backlog rules

- Complete the tickets in dependency order.
- Keep the repository buildable after each ticket.
- Preserve all current product behavior and export contracts.
- If a required behavior changes, stop.
- Record an unrelated defect in a separate ticket.
- Do not add a dependency without separate approval.
- Do not publish or deploy from these tickets.

Project terms and code identifiers are technical names. Use them exactly as this backlog shows them.

## Ticket sequence

| ID    | Title                                                | Depends on   |
| ----- | ---------------------------------------------------- | ------------ |
| MR-01 | Add contract characterization tests                  | None         |
| MR-02 | Consolidate duration utilities and the source schema | MR-01        |
| MR-03 | Make scorecard metric rules explicit                 | MR-01        |
| MR-04 | Simplify canonical report construction               | MR-01, MR-03 |
| MR-05 | Make the JSON 1.0 contract explicit                  | MR-02, MR-04 |
| MR-06 | Create one ordered import record flow                | MR-05        |
| MR-07 | Consolidate anchored-popup mechanics                 | MR-06        |
| MR-08 | Consolidate progression-chart presentation           | MR-06        |
| MR-09 | Split styles and remove dead UI code                 | MR-07, MR-08 |
| MR-10 | Remove the Impeccable integration                    | MR-09        |
| MR-11 | Update maintainer guidance and run the final gate    | MR-10        |

MR-07 and MR-08 can occur in parallel. MR-09 must start after both tickets are complete.

---

## MR-01 — Add contract characterization tests

**Suggested labels:** `refactor`, `tests`, `domain`, `export`  
**Depends on:** None

### Outcome

Add exact tests for the behavior that later tickets must preserve.

### Scope

- Test the complete serialized JSON 1.0 object.
- Test all five scorecard ranking directions.
- Test all important duration format cases.
- Use a fixed input and a fixed timestamp for report tests.

### Procedure

1. Add a complete expected JSON 1.0 object to the export tests.
2. If an inline object is difficult to read, put the object in a fixture.
3. Test `lower-first` behavior for pace, fuel efficiency, and consistency.
4. Test `higher-first` behavior for cleanliness and potential.
5. Test null, zero, and negative duration values.
6. Test minute boundaries and durations longer than one hour.
7. Confirm that the fixed canonical report passes `analysisReportSchema`.
8. Do not change production code in this ticket.

### Files

- `tests/unit/durations.test.ts`
- `tests/unit/report.test.ts`
- `tests/unit/exports.test.ts`
- If stronger equality proof is necessary: `tests/unit/golden-regression.test.ts`
- If the export test needs a separate fixture: `tests/fixtures/serializedAnalysisReport.ts`

### Acceptance criteria

- [x] The export test compares the complete serialized JSON object.
- [x] The report test names the direction of each scorecard metric.
- [x] The duration tests cover all specified edge cases.
- [x] The tests use fixed data and give deterministic results.
- [x] Existing production behavior does not change.

### Verification

- [x] Run `pnpm exec vitest run tests/unit/durations.test.ts tests/unit/report.test.ts tests/unit/golden-regression.test.ts tests/unit/exports.test.ts`.
- [x] Confirm that all selected tests pass.
- [x] Run `pnpm lint`.
- [x] Run `pnpm check`.

### Not included

- Do not change report construction.
- Do not change serialization code.
- Do not correct an unrelated defect.

---

## MR-02 — Consolidate duration utilities and the source schema

**Suggested labels:** `refactor`, `domain`  
**Depends on:** MR-01

### Outcome

Give duration rules and `SourceSummary` validation one canonical implementation.

### Scope

- Define duration constants in one domain module.
- Define microsecond conversion in the same module.
- Define standard motorsport duration format in the same module.
- Reuse `sourceSummarySchema` in `analysisReportSchema`.

### Procedure

1. Add `src/domain/durations.ts`.
2. Move the shared duration constants to this module.
3. Move `microsecondsToSeconds` to this module.
4. Move the standard duration formatter to this module.
5. Update UI and export imports.
6. Keep signed deltas near their presentation code.
7. Keep leaderboard zero gaps near their presentation code.
8. Keep workbook duration parsing in `src/domain/parsing/durations.ts`.
9. Delete `src/lib/durations.ts` after all callers use the domain module.
10. Import `sourceSummarySchema` into `src/domain/model/report.ts`.
11. Remove the duplicate source schema definition.
12. Do not merge schemas for different domain concepts.

### Files

- `src/domain/durations.ts`
- `src/domain/parsing/durations.ts`
- `src/lib/durations.ts`
- `src/domain/model/report.ts`
- `src/domain/export/markdown.ts`
- `src/domain/export/spreadsheet.ts`
- UI files that import `src/lib/durations.ts`
- `tests/unit/durations.test.ts`

### Acceptance criteria

- [ ] One module owns duration constants, conversion, and standard format.
- [ ] UI and export code use the canonical duration module.
- [ ] Workbook parsing stays in the parsing area.
- [ ] `analysisReportSchema` reuses `sourceSummarySchema`.
- [ ] Duration output and validation behavior stay exact.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/durations.test.ts tests/unit/exports.test.ts`.
- [ ] Run `rg -n "function formatDurationUs|function microsecondsToSeconds|const MICROSECONDS_PER_SECOND" src`.
- [ ] Confirm that each canonical implementation occurs once.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not change displayed or exported duration values.
- Do not move workbook parsing into the shared module.
- Do not create a duration framework.

---

## MR-03 — Make scorecard metric rules explicit

**Suggested labels:** `refactor`, `domain`, `analytics`  
**Depends on:** MR-01

### Outcome

Make each scorecard value, sample size, and ranking direction easy to inspect.

### Scope

- Replace positional scorecard arguments with named metric definitions.
- Use domain terms for ranking direction.
- Preserve all current ranks, ties, and radar scores.

### Procedure

1. Define one fixed list of scorecard metric definitions.
2. Give each definition a metric key.
3. Give each definition a value selector.
4. Give each definition a sample selector.
5. Give each definition a `lower-first` or `higher-first` direction.
6. Rank pace, fuel efficiency, and consistency with `lower-first`.
7. Rank cleanliness and potential with `higher-first`.
8. Keep potential as improvement headroom.
9. Remove the trailing Boolean direction argument.
10. Do not create a generic ranking framework.

### Files

- `src/domain/analytics/summaries.ts`
- `tests/unit/report.test.ts`
- If current coverage uses another file: other scorecard test files

### Acceptance criteria

- [ ] Each metric definition names its value, sample size, and direction.
- [ ] No scorecard call uses a Boolean direction argument.
- [ ] Potential ranks a larger execution gap higher.
- [ ] Field eligibility, ties, ranks, and radar scores stay exact.
- [ ] Unavailable-value behavior stays exact.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/report.test.ts tests/unit/statistics.test.ts`.
- [ ] Confirm that all five direction tests pass.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not change a scorecard formula.
- Do not change field eligibility.
- Do not change the meaning of potential.

---

## MR-04 — Simplify canonical report construction

**Suggested labels:** `refactor`, `domain`, `analytics`  
**Depends on:** MR-01, MR-03

### Outcome

Make `buildAnalysisReport` show a clear report construction sequence.

### Scope

- Keep `buildAnalysisReport` as the public entry point.
- Extract warnings, driver projections, and audit projections.
- Keep final integrity checks and schema validation in the entry point.
- Preserve exact report order and values.

### Procedure

1. Add `src/domain/analytics/report-warnings.ts`.
2. Move warning projection to this module.
3. Preserve deterministic warning order.
4. Add `src/domain/analytics/report-drivers.ts`.
5. Move driver, sector, leaderboard, and scorecard projection to this module.
6. Add `src/domain/analytics/report-audit.ts`.
7. Move stint and lap audit projection to this module.
8. Add named input and output types at module boundaries.
9. Remove opaque `Parameters<typeof ...>` types from these boundaries.
10. Remove opaque nested `ReturnType` types from these boundaries.
11. Keep cohesive analytics modules separate.
12. Keep shared input calculation in `report.ts`.
13. Keep final report assembly in `report.ts`.
14. Keep cross-section integrity checks in `report.ts`.
15. Keep final schema validation in `report.ts`.
16. Do not add a report pipeline.

### Files

- `src/domain/analytics/report.ts`
- `src/domain/analytics/report-warnings.ts`
- `src/domain/analytics/report-drivers.ts`
- `src/domain/analytics/report-audit.ts`
- `tests/unit/report.test.ts`
- `tests/unit/golden-regression.test.ts`

### Acceptance criteria

- [ ] `buildAnalysisReport` remains the public entry point.
- [ ] The entry point shows a clear construction sequence.
- [ ] Named types define all new module boundaries.
- [ ] Fixed-input reports remain deeply equal.
- [ ] Each report passes `analysisReportSchema`.
- [ ] Output order stays deterministic.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/report.test.ts tests/unit/golden-regression.test.ts`.
- [ ] Run `rg -n "Parameters<typeof|ReturnType<typeof" src/domain/analytics/report*.ts`.
- [ ] Confirm that no opaque cross-module signature remains.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not change analysis formulas.
- Do not split cohesive analytics modules.
- Do not change report field names.

---

## MR-05 — Make the JSON 1.0 contract explicit

**Suggested labels:** `refactor`, `domain`, `export`  
**Depends on:** MR-02, MR-04

### Outcome

Define every serialized JSON 1.0 field with explicit schemas and mappings.

### Scope

- Define the complete serialized report schema.
- Map each `AnalysisReport` section explicitly.
- Remove recursive key conversion.
- Preserve all names, units, values, and omissions.

### Procedure

1. Add `src/domain/export/serialized-report.ts`.
2. Define each serialized section field by field.
3. Infer the serialized TypeScript types from these schemas.
4. Add one typed mapper for each report section.
5. Use narrow helpers only for repeated exact structures.
6. Preserve current snake-case field names.
7. Preserve microsecond-to-second conversion.
8. Preserve source basenames.
9. Preserve all current identifier and hash omissions.
10. Delete `exportKey`.
11. Delete the recursive `exportValue` helper.
12. Delete `objectValue`.
13. Delete the global omitted-key set.
14. Keep the JSON format entry point in `src/domain/export/json.ts`.
15. Do not change JSON schema version `1.0`.

### Files

- `src/domain/export/serialized-report.ts`
- `src/domain/export/serialization.ts`
- If imports move: `src/domain/export/json.ts`
- `tests/unit/exports.test.ts`
- If MR-01 added this fixture: `tests/fixtures/serializedAnalysisReport.ts`

### Acceptance criteria

- [ ] Explicit schemas represent the complete JSON 1.0 shape.
- [ ] Explicit typed functions map every exported section.
- [ ] No recursive key transformer remains.
- [ ] No global omission blacklist remains.
- [ ] The complete JSON fixture stays deeply equal.
- [ ] A new report field cannot enter JSON without an explicit mapping.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/report.test.ts tests/unit/golden-regression.test.ts tests/unit/exports.test.ts`.
- [ ] Run `rg -n "omittedKeys|exportKey|exportValue|objectValue" src/domain/export`.
- [ ] Confirm that no recursive serializer symbol remains.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not change JSON field names.
- Do not add JSON schema version 2.
- Do not change Markdown or spreadsheet contracts.
- Do not create a serialization framework.

---

## MR-06 — Create one ordered import record flow

**Suggested labels:** `refactor`, `import`, `react`  
**Depends on:** MR-05

### Outcome

Use one ordered record collection from file selection through removal.

### Scope

- Define one discriminated import result model.
- Keep a stable input index and identity for each file.
- Store the parsed workbook in each ready record.
- Derive accepted workbooks from ready records.
- Move same-track validation to the domain workflow.

### Procedure

1. Define the final import results as a discriminated union.
2. Include the stable index in each result.
3. Include file identity and filename in each result.
4. If the hash is available, include it.
5. Include status-specific data in each result.
6. Put the parsed workbook in each ready result.
7. Key each progress event with the stable input index.
8. Preserve concurrent file hash and parse operations.
9. Store final results by input index.
10. Apply same-track validation in original input order.
11. Pass existing ready workbooks to the domain workflow.
12. Use one record collection in `ImportRegister`.
13. Derive `workbooks` from ready records.
14. Keep only the batch token for stale-result protection.
15. Remove `pendingParsedByIndex`.
16. Remove all fallback result-order logic.
17. Keep dropzone rejections in the same record collection.
18. Add a test with deliberately out-of-order operation completion.
19. Do not add a global store or state-machine dependency.

### Files

- `src/domain/parsing/imports.ts`
- `src/features/import/ImportRegister.tsx`
- If the derived state contract changes: `src/components/AnalyzerShell.tsx`
- `tests/unit/imports.test.ts`
- `tests/unit/import-register.test.tsx`
- If its fixture changes: `tests/unit/analyzer-shell.test.tsx`
- If observable coverage is missing: `tests/e2e/import.spec.ts`

### Acceptance criteria

- [ ] One ordered discriminated record model drives import behavior.
- [ ] Each ready record owns its parsed workbook.
- [ ] The component derives accepted workbooks from ready records.
- [ ] Same-track validation occurs in the domain workflow.
- [ ] Out-of-order completion cannot associate data with the wrong file.
- [ ] Current messages, warnings, removal rules, and concurrency stay exact.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/hash.test.ts tests/unit/imports.test.ts tests/unit/import-register.test.tsx tests/unit/analyzer-shell.test.tsx`.
- [ ] Run `rg -n "pendingParsedByIndex|setWorkbooks" src/features/import/ImportRegister.tsx`.
- [ ] Confirm that no parallel workbook state remains.
- [ ] Run `rg -n "trackMismatchMessage" src/features/import`.
- [ ] Confirm that the React feature does not apply the track policy.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not change accepted file types.
- Do not change concurrency limits.
- Do not change validation messages.
- Do not add cancellation or persistence.

---

## MR-07 — Consolidate anchored-popup mechanics

**Suggested labels:** `refactor`, `ui`, `accessibility`  
**Depends on:** MR-06

### Outcome

Use one implementation for the shared anchored-popup mechanics.

### Scope

- Share portal render and viewport placement.
- Share resize and scroll reposition.
- Share outside-press and Escape dismissal.
- Share trigger focus restoration.
- Keep feature semantics in each consumer.

### Procedure

1. Add direct custom-select behavior tests before the extraction.
2. Add `src/components/ui/anchored-popup.tsx`.
3. Move shared portal mechanics to this component.
4. Move shared position mechanics to this component.
5. Move shared document and window listeners to this component.
6. Move trigger focus restoration to this component.
7. Update `CustomSelect` to use the shared component.
8. Keep selection and listbox behavior in `CustomSelect`.
9. Update `ExportMenu` to use the shared component.
10. Keep export state and content in `ExportMenu`.
11. Update `AuditStatus` to use the shared component.
12. Keep audit semantics and content in `AuditStatus`.
13. Preserve single-select and multi-select behavior.
14. Preserve all-option behavior.
15. Preserve roles, labels, placement, and focus behavior.
16. Do not add a popup dependency.

### Files

- `src/components/ui/anchored-popup.tsx`
- `src/components/ui/select.tsx`
- `src/features/export/ExportMenu.tsx`
- `src/features/scope/ScopeReview.tsx`
- `tests/unit/select.test.tsx`
- `tests/unit/scope-review.test.tsx`
- `tests/unit/export-menu.test.tsx`
- If observable coverage is missing: relevant E2E tests

### Acceptance criteria

- [ ] One component owns the shared popup mechanics.
- [ ] Each consumer keeps its feature semantics.
- [ ] The custom select remains the current control.
- [ ] Keyboard behavior and focus restoration stay exact.
- [ ] Popup placement and dismissal stay exact.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/select.test.tsx tests/unit/scope-review.test.tsx tests/unit/export-menu.test.tsx`.
- [ ] Search the three consumers for duplicate portal and event-listener code.
- [ ] Confirm that the duplicate mechanics are absent.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm exec playwright test tests/e2e/scope.spec.ts tests/e2e/shell.spec.ts`.

### Not included

- Do not replace the custom select.
- Do not change control visuals.
- Do not create a modal or menu framework.
- Do not add new popup features.

---

## MR-08 — Consolidate progression-chart presentation

**Suggested labels:** `refactor`, `ui`, `charts`  
**Depends on:** MR-06

### Outcome

Use one presentation component for both progression charts.

### Scope

- Share the repeated Recharts presentation.
- Keep lap data preparation in `ProgressionChart`.
- Keep sector data preparation in `SectorProgressionChart`.
- Preserve all chart controls and output.

### Procedure

1. Add `src/features/analysis/ProgressionLineChart.tsx`.
2. Move the repeated Recharts container to this component.
3. Move the repeated axes to this component.
4. Move repeated legend and tooltip wiring to this component.
5. Move repeated line and dirty-point presentation to this component.
6. Pass prepared points and series to the shared component.
7. Pass the Y domain and format functions to the shared component.
8. Pass the accessible label to the shared component.
9. Keep `pointsForReport` in each feature module.
10. Keep feature selection state in each feature module.
11. Preserve pit-lap gaps and dirty-lap markers.
12. Preserve empty states and duration format.
13. Do not add a chart framework.

### Files

- `src/features/analysis/ProgressionLineChart.tsx`
- `src/features/analysis/ProgressionChart.tsx`
- `src/features/analysis/SectorProgressionChart.tsx`
- If tooltip ownership changes: `src/features/analysis/AnalysisPrimitives.tsx`
- `tests/unit/analysis-views.test.tsx`
- If observable coverage is missing: relevant E2E tests

### Acceptance criteria

- [ ] One component owns common chart presentation.
- [ ] Each feature keeps its domain data preparation.
- [ ] Both charts keep their current data and controls.
- [ ] Gaps, markers, labels, and format stay exact.
- [ ] No duplicate Recharts structure remains in the feature components.

### Verification

- [ ] Run `pnpm exec vitest run tests/unit/analysis-views.test.tsx`.
- [ ] Review `ProgressionChart.tsx` and `SectorProgressionChart.tsx`.
- [ ] Confirm that duplicate Recharts presentation is absent.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm exec playwright test tests/e2e/analysis.spec.ts`.

### Not included

- Do not change chart calculations.
- Do not change chart controls.
- Do not add application-wide chart configuration.
- Do not move chart state to Zustand.

---

## MR-09 — Split styles and remove dead UI code

**Suggested labels:** `refactor`, `css`, `ui`  
**Depends on:** MR-07, MR-08

### Outcome

Divide styles into stable areas and remove confirmed dead UI code.

### Scope

- Keep `global.css` as the single entry point.
- Keep the current CSS and BEM approach.
- Preserve the cascade and all rendered output.
- Remove only confirmed dead code and selectors.

### Procedure

1. Record the current CSS class names before the split.
2. Check each candidate dead selector against TSX and JSX sources.
3. Check dynamic status classes before selector removal.
4. Check external Recharts classes before selector removal.
5. Add `src/styles/foundations.css`.
6. Move tokens, resets, accessibility, and motion rules to this file.
7. Add `src/styles/shell.css`.
8. Move application shell rules to this file.
9. Add `src/styles/import-scope.css`.
10. Move import and scope rules to this file.
11. Add `src/styles/analysis.css`.
12. Move analysis and chart rules to this file.
13. Add `src/styles/ui.css`.
14. Move shared control and popup rules to this file.
15. Keep valid font and Tailwind directives in `global.css`.
16. Import the five style files from `global.css`.
17. Preserve the original cascade order.
18. Keep responsive rules with their feature area.
19. Add short comments only at useful boundaries.
20. Delete `src/components/ui/card.tsx`.
21. Remove `MetricStrip` from `AnalysisPrimitives.tsx`.
22. Remove styles for `Card` and `MetricStrip`.
23. Remove the design thesis comment from `src/pages/index.astro`.
24. Do not rename a live class.

### Files

- `src/styles/global.css`
- `src/styles/foundations.css`
- `src/styles/shell.css`
- `src/styles/import-scope.css`
- `src/styles/analysis.css`
- `src/styles/ui.css`
- `src/components/ui/card.tsx`
- `src/features/analysis/AnalysisPrimitives.tsx`
- `src/pages/index.astro`
- If current coverage is insufficient: relevant tests

### Acceptance criteria

- [ ] Five stable style areas exist behind `global.css`.
- [ ] No live class is lost or renamed.
- [ ] The cascade and responsive behavior stay exact.
- [ ] `Card` and `MetricStrip` are absent.
- [ ] Confirmed dead selectors are absent.
- [ ] The design thesis comment is absent.

### Verification

- [ ] Run `rg -n "MetricStrip|from ['\"].*ui/card|calibration-card" src tests`.
- [ ] Confirm that the search has no result.
- [ ] Compare the CSS class sets from before and after the split.
- [ ] Confirm that only approved dead selectors are absent.
- [ ] Run `pnpm format`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm exec playwright test tests/e2e/scope.spec.ts tests/e2e/analysis.spec.ts tests/e2e/shell.spec.ts`.

### Not included

- Do not redesign the interface.
- Do not rename live CSS classes.
- Do not migrate to another styling system.
- Do not split styles by small component.

---

## MR-10 — Remove the Impeccable integration

**Suggested labels:** `refactor`, `repository`, `cleanup`  
**Depends on:** MR-09

### Outcome

Remove all Impeccable integration files and obsolete exclusions.

### Scope

- Remove only the targets that the approved spec names.
- Preserve finalized application code and CSS.
- Preserve `README.md`, `AGENTS.md`, and `THIRD_PARTY_NOTICES.md`.
- Remove obsolete configuration entries for deleted paths.

### Procedure

1. Confirm that `.gitmodules` refers only to `vendor/impeccable`.
2. Confirm that `.agents/skills/impeccable` is the Impeccable skill link.
3. Confirm that `.impeccable/` contains only Impeccable data.
4. Delete `.gitmodules`.
5. Delete the `vendor/impeccable` gitlink and checked-out directory.
6. Delete `.agents/skills/impeccable`.
7. Delete empty parent directories under `.agents`.
8. Delete `.impeccable/`, including ignored review output.
9. Delete `DESIGN.md`.
10. Delete `PRODUCT.md`.
11. Delete `MANIFEST.json`.
12. Remove the Impeccable rule from `.gitignore`.
13. Remove Impeccable paths from `.prettierignore`.
14. Remove absent `docs/01_...` through `docs/04_...` paths from `.prettierignore`.
15. Remove Impeccable paths from `eslint.config.js`.
16. Remove the Impeccable path from `tsconfig.json`.
17. Do not delete `THIRD_PARTY_NOTICES.md`.
18. Do not remove the active spec or plan files.

### Files

- `.gitmodules`
- `vendor/impeccable`
- `.agents/skills/impeccable`
- `.impeccable/`
- `DESIGN.md`
- `PRODUCT.md`
- `MANIFEST.json`
- `.gitignore`
- `.prettierignore`
- `eslint.config.js`
- `tsconfig.json`

### Acceptance criteria

- [ ] All approved Impeccable targets are absent.
- [ ] No obsolete Impeccable configuration entry remains.
- [ ] No stale legacy-doc Prettier exclusion remains.
- [ ] The repository does not require submodule initialization.
- [ ] Protected repository documents remain present.

### Verification

- [ ] Run `test ! -e .gitmodules`.
- [ ] Run `test ! -e vendor/impeccable`.
- [ ] Run `test ! -e .agents/skills/impeccable`.
- [ ] Run `test ! -e .impeccable`.
- [ ] Run `test ! -e DESIGN.md`.
- [ ] Run `test ! -e PRODUCT.md`.
- [ ] Run `test ! -e MANIFEST.json`.
- [ ] Search for `impeccable` outside the active spec and plan files.
- [ ] Confirm that the search has no result.
- [ ] Run `rg -n "docs/0[1-4]_" .prettierignore`.
- [ ] Confirm that the search has no result.
- [ ] Run `pnpm format`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.

### Not included

- Do not remove active workflow records.
- Do not change application behavior.
- Do not change GitHub Actions.
- Do not publish or deploy.

---

## MR-11 — Update maintainer guidance and run the final gate

**Suggested labels:** `documentation`, `verification`, `repository`  
**Depends on:** MR-10

### Outcome

Give humans and agents clear repository guidance, then verify the complete refactor.

### Scope

- Make `README.md` the human-maintainer entry point.
- Make `AGENTS.md` the agent operating contract.
- Remove substantial duplicate guidance.
- Verify all product and repository contracts.

### Procedure

1. Check final source paths before you change the documents.
2. Check commands in `package.json`.
3. Check deployment facts in `astro.config.mjs` and the deploy workflow.
4. Add concise product scope and non-goals to `README.md`.
5. Add critical analysis rules to `README.md`.
6. Add the canonical data flow to `README.md`.
7. Add a practical change-location table to `README.md`.
8. Add exact local and verification commands to `README.md`.
9. Add export compatibility and privacy constraints to `README.md`.
10. Add static deployment and base-path facts to `README.md`.
11. Keep workflow and approval rules in `AGENTS.md`.
12. Keep product and data invariants in `AGENTS.md`.
13. Add concise file-routing rules to `AGENTS.md`.
14. Add proportional verification rules to `AGENTS.md`.
15. Link to `README.md` for durable repository facts.
16. Remove substantial duplicate prose from `AGENTS.md`.
17. Do not add a contributor guide or documentation hierarchy.
18. Run the complete verification gate.

### Files

- `README.md`
- `AGENTS.md`
- `package.json` for fact verification only
- `astro.config.mjs` for fact verification only
- `.github/workflows/deploy.yml` for fact verification only

### Acceptance criteria

- [ ] `README.md` contains current human-maintainer guidance.
- [ ] `AGENTS.md` contains current agent operating rules.
- [ ] The two documents have distinct responsibilities.
- [ ] Commands, paths, exports, privacy, and deployment facts are exact.
- [ ] The full quality gate passes.
- [ ] The full Playwright suite passes.
- [ ] The repository-base-path build passes.
- [ ] No unapproved file change remains.

### Verification

- [ ] Review `README.md` against source paths and repository configuration.
- [ ] Review `AGENTS.md` against `README.md` and final source paths.
- [ ] Run `pnpm format`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm check`.
- [ ] Run `pnpm test`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm e2e`.
- [ ] Run `BASE_PATH=/garage61-analyzer pnpm build`.
- [ ] Run `git status --short`.
- [ ] Run `git diff --check`.
- [ ] Confirm that only approved changes remain.

### Not included

- Do not add permanent documentation files.
- Do not publish or deploy.
- Do not change GitHub Actions behavior.
- Do not remove the active spec or plan before the retro is complete.

## Acceptance coverage

| Spec criterion | Ticket              |
| -------------- | ------------------- |
| AC-1           | MR-01, MR-04        |
| AC-2           | MR-04               |
| AC-3           | MR-05               |
| AC-4           | MR-01, MR-05        |
| AC-5           | MR-06               |
| AC-6           | MR-06               |
| AC-7           | MR-07               |
| AC-8           | MR-08               |
| AC-9           | MR-09               |
| AC-10          | MR-01, MR-02        |
| AC-11          | MR-02               |
| AC-12          | MR-01, MR-03        |
| AC-13          | MR-10               |
| AC-14          | MR-10, MR-11        |
| AC-15          | MR-11               |
| AC-16          | MR-01 through MR-11 |
| AC-17          | MR-07 through MR-11 |
| AC-18          | MR-11               |
