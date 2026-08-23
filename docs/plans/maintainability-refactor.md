# Maintainability refactor — Roadmap

**Specification:** [`../specs/maintainability-refactor.md`](../specs/maintainability-refactor.md)

## Purpose

Track the order and durable status of the behavior-preserving maintainability
work. Detailed working instructions are intentionally local and mutable under
the gitignored `.todo/maintainability-refactor/` folder.

## Working model

- The tracked specification defines required outcomes and boundaries.
- This roadmap defines status and dependencies.
- Each `.todo` ticket explains the current implementation, reading order,
  desired result, implementation steps, preserved behavior, and verification.
- Complete one ticket at a time. Keep the repository buildable after each.
- If a ticket conflicts with the current source, revise the ticket before
  implementing rather than guessing.

## Status and sequence

| ID    | Outcome                                                      | Status       | Depends on   |
| ----- | ------------------------------------------------------------ | ------------ | ------------ |
| MR-01 | Characterize report, JSON, scorecard, and duration contracts | Complete     | —            |
| MR-02 | Establish shared duration behavior and one source schema     | Complete     | MR-01        |
| MR-03 | Make scorecard value, sample, and direction rules explicit   | Ready — next | MR-01        |
| MR-04 | Make `buildAnalysisReport` readable orchestration            | Blocked      | MR-03        |
| MR-05 | Declare and map every JSON 1.0 field explicitly              | Blocked      | MR-04        |
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
| R-1 Readable canonical report construction       | MR-04          |
| R-2 Explicit JSON 1.0 contract                   | MR-05          |
| R-3 One ordered import record model              | MR-06          |
| R-4 Shared anchored-popup mechanics              | MR-07          |
| R-5 Shared lap-series presentation               | MR-08          |
| R-6 Human-navigable styles and dead-code removal | MR-09          |
| R-7 Canonical duration behavior                  | MR-02 complete |
| R-8 Shared domain schemas                        | MR-02 complete |
| R-9 Explicit scorecard rules                     | MR-03          |
| R-10 Remove Impeccable                           | MR-10          |
| R-11 Concise human and agent guidance            | MR-11          |

## Local tickets

| ID    | Local file                                                    |
| ----- | ------------------------------------------------------------- |
| MR-03 | `.todo/maintainability-refactor/03-scorecard-metric-rules.md` |
| MR-04 | `.todo/maintainability-refactor/04-report-construction.md`    |
| MR-05 | `.todo/maintainability-refactor/05-json-contract.md`          |
| MR-06 | `.todo/maintainability-refactor/06-import-record-flow.md`     |
| MR-07 | `.todo/maintainability-refactor/07-anchored-popups.md`        |
| MR-08 | `.todo/maintainability-refactor/08-lap-series-charts.md`      |
| MR-09 | `.todo/maintainability-refactor/09-styles-and-dead-ui.md`     |
| MR-10 | `.todo/maintainability-refactor/10-remove-impeccable.md`      |
| MR-11 | `.todo/maintainability-refactor/11-maintainer-handoff.md`     |

Because `.todo` is ignored, these files are not available in a fresh clone.
Recreate them from this roadmap and the tracked specification if local working
state is lost.

## Completed foundation

MR-01 added deterministic characterization coverage for the complete serialized
JSON object, all five scorecard directions, duration edge cases, and the fixed
canonical report.

MR-02 moved canonical duration behavior to `src/shared/durations.ts`, kept
workbook interpretation in `src/domain/parsing/workbook-duration.ts`, and reused
`sourceSummarySchema` in report validation.

The separately approved type-first restructure also established the final source
routing used by the remaining work:

- Astro routes: `src/pages`
- React application, reusable controls, and product UI: `src/components`
- Framework-independent product logic: `src/domain`
- Named cross-area framework-independent behavior: `src/shared`
- Styles: `src/styles`

## Global boundaries

- Preserve analysis, import, rendered, accessibility, and export behavior.
- Keep workbook data local to the browser.
- Add no dependency without separate approval.
- Do not fix unrelated defects inside these tickets.
- Do not publish or deploy.
- Run each ticket’s focused checks followed by its listed full gate.

## Completion

After MR-11 and its retrospective, this roadmap and specification may be removed
as a separate housekeeping action if README and AGENTS fully describe the final
repository and no active maintainability work remains.
