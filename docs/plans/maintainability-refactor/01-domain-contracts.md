# Unit 01 — Explicit domain and export contracts

**Spec:** `../../specs/maintainability-refactor.md`  
**Index:** `./index.md`

## Goal

Make canonical report construction, serialized JSON, durations, shared schemas, and
scorecard ranking rules explicit and human-readable while proving that every existing
domain and export result remains exact.

## Requirements

- Preserve `AnalysisReport`, JSON 1.0, Markdown, and spreadsheet behavior exactly.
- Keep `buildAnalysisReport` as the public report entry point.
- Prefer a few cohesive report-section modules over tiny helpers or a pipeline system.
- Use explicit serialized schemas and mappings; do not retain recursive
  convention-based transformation as a fallback.
- Preserve potential as improvement headroom, where a larger execution gap ranks
  higher.

## Context

- `report.ts` currently owns warning generation, driver/leaderboard projection, sector
  projection, stint projection, lap audit, methodology, and final orchestration.
- `serialization.ts` currently applies suffix conversion and omission rules recursively
  into broadly typed JSON records.
- Duration conversion and formatting currently exist in parsing, UI, and export
  modules.
- `sourceSummarySchema` is repeated inside the analysis report schema.
- Existing report, golden, export, statistics, and duration tests are the compatibility
  baseline.

## Prerequisites

- Prior unit: None.
- External gates: None.
- Working directory: repository root.
- Baseline:
  - `pnpm lint` → pass.
  - `pnpm check` → zero diagnostics.
  - `pnpm test` → 20 files and 91 tests pass.

## Existing system to reuse

- `AnalysisReport` and its Zod schemas.
- Pure analytics in `eligibility.ts`, `laps.ts`, `progression.ts`, `sectors.ts`,
  `statistics.ts`, `stints.ts`, and `summaries.ts`.
- `makeAnalysisReport`, golden workbook fixtures, and existing export tests.
- Current duration parsing behavior and UI/export formatting expectations.

## Files

- `src/domain/analytics/report.ts` (modify) — retain the public entry point and reduce it
  to readable orchestration and final validation.
- `src/domain/analytics/report-warnings.ts` (add) — own parser/analysis warning
  projection and deterministic warning ordering.
- `src/domain/analytics/report-drivers.ts` (add) — own metric projection, sector
  analyses, driver facts, observations, leaderboard rows, and scorecard attachment.
- `src/domain/analytics/report-audit.ts` (add) — own stint-analysis and lap-audit
  projection.
- `src/domain/analytics/summaries.ts` (modify) — replace positional scorecard arguments
  with explicit metric definitions and ranking directions.
- `src/domain/durations.ts` (add) — canonical constants, conversion, and standard
  duration formatter.
- `src/domain/parsing/durations.ts` (modify) — retain parsing and consume canonical
  duration units.
- `src/lib/durations.ts` (delete) — remove the duplicate base formatter after callers
  move to the domain utility.
- `src/domain/model/report.ts` (modify) — reuse `sourceSummarySchema`.
- `src/domain/export/serialized-report.ts` (add) — explicitly declare serialized JSON
  1.0 schemas and inferred types.
- `src/domain/export/serialization.ts` (modify) — replace recursive transformation with
  explicit typed section mappings and narrow repeated-structure helpers.
- `src/domain/export/markdown.ts` (modify) — consume canonical duration formatting.
- `src/domain/export/spreadsheet.ts` (modify) — consume canonical conversion and
  duration formatting.
- `src/domain/export/json.ts` (modify only if imports move) — retain the format-specific
  JSON entry point.
- UI files importing `src/lib/durations.ts` (modify mechanically) — use the canonical
  duration utility without changing semantic gap wrappers.
- `tests/unit/durations.test.ts` (modify) — cover the canonical formatter and preserved
  parsing behavior.
- `tests/unit/report.test.ts` (modify) — state scorecard directions and report-section
  compatibility.
- `tests/unit/exports.test.ts` (modify) — assert full serialized JSON equality rather
  than representative fields only.
- `tests/unit/golden-regression.test.ts` (modify only if stronger equality evidence is
  required) — preserve canonical golden values.
- `tests/fixtures/serializedAnalysisReport.ts` (add if keeping the full expected object
  inline would obscure the test) — human-readable JSON 1.0 contract fixture.

## Implementation notes

1. Strengthen characterization tests before changing implementations:
   - capture the complete serialized JSON object from `makeAnalysisReport`;
   - state each scorecard metric's direction, including potential headroom;
   - preserve duration formatting edge cases, including null, zero, negative values,
     minute boundaries, and runtimes over one hour.
2. Add the canonical domain duration module, move callers, and delete the duplicate UI
   implementation. Keep semantic wrappers such as leaderboard gaps and signed deltas
   near their presentation contexts.
3. Reuse `sourceSummarySchema` directly in `analysisReportSchema`; do not generalize
   other schemas unless they are proven to represent the same domain contract.
4. Replace scorecard helper positional arguments with a fixed list of named definitions
   containing metric key, value selector, sample selector, and `lower-first` or
   `higher-first` direction. Iterate that list without creating a generic ranking API.
5. Extract report construction by current responsibility:
   - warnings remain deterministic and separate from report orchestration;
   - driver projection owns its sector and leaderboard facts;
   - audit projection owns stints and lap rows;
   - `report.ts` computes the shared analytics inputs, invokes these builders, assembles
     the report, checks cross-section integrity, and validates the schema.
6. Use exported named input/output types at these module boundaries. Keep private local
   inference where it remains obvious.
7. Define the serialized schemas field-by-field, including nested metric, scorecard,
   sector, stint, warning, source, and audit structures. Map each report section
   explicitly. Shared metric and filename helpers must be narrow and typed.
8. Delete `exportKey`, recursive `exportValue`, `objectValue`, and the global omitted-key
   set. Confirm no canonical field is exported unless an explicit mapper names it.
9. Run the unit gate before proceeding. Any output difference is a blocker unless the
   approved spec is amended.

## New architectural surface

- `report-warnings.ts`, `report-drivers.ts`, and `report-audit.ts`: required current
  boundaries inside the 550-line canonical builder.
- `serialized-report.ts`: required to make the external JSON 1.0 contract inspectable
  without mixing schema declaration with mapping logic.
- `src/domain/durations.ts`: required as the one framework-independent owner of shared
  duration units and formatting.

No dependency, pipeline framework, schema factory, serialization framework, or new
state is added.

## Acceptance criteria

- [ ] AC-1: Fixed-input canonical reports remain deeply equal and schema-valid.
- [ ] AC-2: `buildAnalysisReport` remains the readable public orchestration entry point.
- [ ] AC-3: Serialized JSON is represented by explicit schemas and mappings only.
- [ ] AC-4: The complete JSON 1.0 fixture remains deeply equal.
- [ ] AC-10: Duration constants, conversion, and base formatting have one implementation.
- [ ] AC-11: `SourceSummary` validation has one shared schema definition.
- [ ] AC-12: Scorecard definitions expose and test every metric direction.
- [ ] AC-16: The unit quality gate passes.

## Verification

- [ ] `pnpm exec vitest run tests/unit/durations.test.ts tests/unit/statistics.test.ts`
      from the repository root → all duration/statistics tests pass.
- [ ] `pnpm exec vitest run tests/unit/report.test.ts tests/unit/golden-regression.test.ts tests/unit/exports.test.ts`
      from the repository root → canonical, golden, and export contract tests pass.
- [ ] `rg -n "Parameters<typeof|ReturnType<typeof" src/domain/analytics/report*.ts` → no
      opaque cross-module report signatures remain.
- [ ] `rg -n "omittedKeys|exportKey|exportValue|objectValue" src/domain/export` → no
      recursive convention serializer remains.
- [ ] `rg -n "function formatDurationUs|function microsecondsToSeconds|const MICROSECONDS_PER_SECOND" src`
      → each canonical implementation appears once; semantic wrapper names may remain.
- [ ] `pnpm lint` → pass.
- [ ] `pnpm check` → zero diagnostics.
- [ ] `pnpm test` → all tests pass.
- [ ] `pnpm build` → production build passes.

## Out of scope

- Any change to analysis formulas, eligibility, warning meaning, ranking results, or
  export content.
- Renaming public report fields or introducing JSON schema version 2.
- Refactoring cohesive analytics modules unrelated to report projection.
