# Maintainability refactor — Plan

**Specification:** [`../specs/maintainability-refactor.md`](../specs/maintainability-refactor.md)

## Purpose

Track the order and status of the behavior-preserving maintainability work.
Each open ticket is a GitHub issue that states its outcome, steps, acceptance
criteria, and verification.

## Working model

- The specification defines required outcomes and boundaries.
- This plan defines order and status and links each open ticket's issue.
- Each GitHub issue holds that ticket's steps, acceptance, and verification.
- Complete one ticket at a time and keep the repository buildable after each.
- If a ticket conflicts with the current source, update its issue before
  implementing rather than guessing.
- When a ticket completes, update the status table and close its issue.

## Status and sequence

| ID    | Issue                                                       | Outcome                                                      | Status       | Depends on   |
| ----- | ----------------------------------------------------------- | ------------------------------------------------------------ | ------------ | ------------ |
| MR-01 | —                                                           | Characterize report, JSON, scorecard, and duration contracts | Complete     | —            |
| MR-02 | —                                                           | Establish shared duration behavior and one source schema     | Complete     | MR-01        |
| MR-03 | —                                                           | Make scorecard value, sample, and direction rules explicit   | Complete     | MR-01        |
| MR-04 | —                                                           | Make `buildAnalysisReport` readable orchestration            | Complete     | MR-03        |
| MR-05 | —                                                           | Declare and map every JSON 1.0 field explicitly              | Complete     | MR-04        |
| MR-06 | —                                                           | Use one ordered import record flow                           | Complete     | MR-05        |
| MR-07 | —                                                           | Share anchored-popup mechanics                               | Complete     | MR-06        |
| MR-08 | —                                                           | Share lap-series chart presentation                          | Complete     | MR-06        |
| MR-09 | [#6](https://github.com/w-valzelli/stint-analyzer/issues/6) | Split styles and remove confirmed dead UI                    | Ready — next | MR-07, MR-08 |
| MR-10 | [#7](https://github.com/w-valzelli/stint-analyzer/issues/7) | Remove the Impeccable integration                            | Blocked      | MR-09        |
| MR-11 | [#8](https://github.com/w-valzelli/stint-analyzer/issues/8) | Finalize maintainer guidance and run the complete gate       | Blocked      | MR-10        |

## Requirement coverage

| Specification requirement                        | Ticket         |
| ------------------------------------------------ | -------------- |
| R-1 Readable canonical report construction       | MR-04 complete |
| R-2 Explicit JSON 1.0 contract                   | MR-05 complete |
| R-3 One ordered import record model              | MR-06 complete |
| R-4 Shared anchored-popup mechanics              | MR-07 complete |
| R-5 Shared lap-series presentation               | MR-08 complete |
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
- Run each ticket’s focused checks, then the standard gate: `pnpm format`,
  `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build`.

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

MR-05 declared every JSON 1.0 field in `src/domain/export/serialized-report.ts`
and replaced the recursive key rewriter in `serialization.ts` with one typed
mapper per section. Each mapper returns its inferred serialized type, so a new
`AnalysisReport` field reaches JSON only through a mapper change. Two JSON 1.0
quirks are preserved for compatibility: a missing warning source file name
serializes as the string `'null'`, and lowercased sector keys in
`sector_delta_seconds` and `sectors_seconds` keep microsecond values.

MR-06 made `importWorkbookFiles` in `src/domain/parsing/imports.ts` return one
result per input file, keyed by stable input index, as a ready, duplicate, or
error union; ready results own their `ParsedWorkbook`. Parse completions settle
in input order, where same-track validation runs, and hashing failures become
per-file error results. `ImportRegister` keeps one record collection and derives
accepted workbooks from ready records.

MR-07 added `src/components/reusable/AnchoredPopup.tsx`, which owns the body
portal, placement lifecycle (on open, after layout, on resize and captured
scroll), Escape and outside-press dismissal, and trigger focus restoration.
`CustomSelect`, `ExportMenu`, and `AuditStatus` keep their roles, labels,
content, and state, and each supplies its own unchanged placement geometry
through `place`. `AuditStatus` opts out of focus restoration on outside press.
`tests/unit/select.test.tsx` characterizes `CustomSelect` selection, keyboard,
and dismissal behavior.

MR-08 added `src/components/features/analysis/LapSeriesChart.tsx`, which owns
the Recharts container, axes, legend, tooltip wiring, lines, and dirty-point
markers, and exports the shared `LapSeriesPoint` shape and `dirtyKeyFor` key.
`PaceProgressionChart` and `SectorDeltaProgressionChart` keep `pointsForReport`,
Y-domain padding, selection state, and empty states, and pass series colors,
axis width, stroke width, formatters, and the accessible label.

The separately approved type-first restructure established the source routing
used by the remaining work:

- Astro routes: `src/pages`
- React application, reusable controls, and product UI: `src/components`
- Framework-independent product logic: `src/domain`
- Named cross-area framework-independent behavior: `src/shared`
- Styles: `src/styles`

## Completion

After MR-11 and its retrospective, this plan and the specification may be
removed as a separate housekeeping action if README and AGENTS fully describe
the final repository and no active maintainability work remains.
