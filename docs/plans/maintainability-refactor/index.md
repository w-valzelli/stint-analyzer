# Maintainability and human handoff refactor — Implementation plan

**Spec:** `../../specs/maintainability-refactor.md`

## Requirements

Implement the approved behavior-preserving maintainability refactor without changing
analysis values, import behavior, UI behavior, visual output, or export contracts. Keep
the custom select, existing CSS/BEM approach, static architecture, local-only workbook
handling, and canonical `AnalysisReport` flow.

## Approach

Work from the most contract-sensitive pure domain code outward:

1. Characterize and simplify canonical report, export, duration, schema, and scorecard
   code while exact fixtures can prove equality.
2. Replace parallel import state with one ordered record model and verify concurrency
   and component behavior independently.
3. Consolidate popup mechanics and chart presentation, preserving feature-specific
   semantics and browser interaction.
4. Split styles, remove dead code and the Impeccable integration, then rewrite the
   maintainer guidance against the final repository shape and run the complete gate.

Existing modules and tests are extended in place. No dependency is planned.

## Why multiple units

The work crosses four genuine risk and verification boundaries:

- canonical data and external export compatibility are verified through pure domain,
  golden-report, and export contract tests;
- concurrent imports require ordered async-result and React state-transition tests;
- popup and chart consolidation requires interaction, accessibility, and browser
  workflow verification;
- stylesheet and submodule teardown changes repository structure and must be followed
  by final documentation, production builds, base-path verification, and the full E2E
  suite.

Combining these boundaries into one unit would make behavior regressions difficult to
localize. Each unit is independently coherent and leaves the repository buildable.

## Preconditions and external gates

- Working directory: repository root.
- External gates: None.
- Deletion of the Impeccable submodule, tracked artifacts, ignored review output, and
  obsolete documentation is explicitly authorized by the approved spec.
- Baseline at planning time: `pnpm lint`, `pnpm check`, and `pnpm test` pass; Vitest
  reports 20 files and 91 tests.
- Preserve any worktree changes not created by this plan. At planning time only the
  approved `docs/` workflow artifacts are untracked.

## Units

1. [01-domain-contracts](./01-domain-contracts.md) — Make report construction and
   serialized contracts explicit; consolidate durations, schemas, and scorecard rules.
2. [02-import-state](./02-import-state.md) — Replace parallel import state with one
   ordered discriminated record flow.
3. [03-ui-infrastructure](./03-ui-infrastructure.md) — Share anchored-popup mechanics
   and progression-chart presentation without changing custom controls.
4. [04-repository-handoff](./04-repository-handoff.md) — Split styles, remove dead code
   and Impeccable, finalize human/agent guidance, and run the complete verification gate.

## Human ticket backlog

Use [`tickets.md`](./tickets.md) for issue-ready human work packages. The backlog
preserves the requirements, dependencies, acceptance criteria, and verification gates
from these implementation units.

## Acceptance coverage

| Spec criterion | Unit(s) | Verification                                                             |
| -------------- | ------- | ------------------------------------------------------------------------ |
| AC-1           | 01      | Canonical and golden report tests                                        |
| AC-2           | 01      | Review report entry point; lint/check/tests                              |
| AC-3           | 01      | Explicit serialized schemas/mappers; source search                       |
| AC-4           | 01      | Full serialized JSON contract equality test                              |
| AC-5           | 02      | Import component and domain tests; source search                         |
| AC-6           | 02      | Delayed concurrent import ordering test                                  |
| AC-7           | 03      | Popup interaction tests and Playwright workflows                         |
| AC-8           | 03      | Analysis view tests and source review                                    |
| AC-9           | 04      | CSS/dead-code review and Playwright workflows                            |
| AC-10          | 01      | Duration tests and duplicate-implementation search                       |
| AC-11          | 01      | Schema tests and source review                                           |
| AC-12          | 01      | Scorecard ranking tests                                                  |
| AC-13          | 04      | Tracked-file/config/source searches, excluding active workflow artifacts |
| AC-14          | 04      | Clean repository configuration and full build gate                       |
| AC-15          | 04      | README/AGENTS review against current files and commands                  |
| AC-16          | 01–04   | Unit gates; complete gate in 04                                          |
| AC-17          | 03–04   | Targeted and complete Playwright runs                                    |
| AC-18          | 04      | `BASE_PATH=/garage61-analyzer pnpm build`                                |

## New architectural surface

- Unit 01: a small set of named internal report-section builders, required to remove
  unrelated construction details from `buildAnalysisReport`; an explicit serialized
  report schema module, required to make JSON 1.0 inspectable; one domain duration
  module, required to own shared unit conversion and formatting.
- Unit 02: one discriminated import-record/result model, required to replace parallel
  UI and domain result representations. It does not add a new state owner.
- Unit 03: one anchored-popup primitive and one progression-line-chart presentation
  component, each required by three and two current consumers respectively.
- Unit 04: several feature-oriented CSS files behind the existing `global.css` entry
  point, required to make styles navigable. No new styling system is introduced.

No new dependency, infrastructure layer, persistence mechanism, extension point, or
parallel implementation is planned.

## Completion note

The spec and plan are workflow artifacts for this refactor, not replacements for
maintainer documentation. Keep them available through `dev-build` and `dev-retro` so
execution can be reviewed against the approved decisions. After the final retro, they
may be removed as a separate documentation-housekeeping action if the repository
should return to the `README.md`/`AGENTS.md`-only documentation model.
