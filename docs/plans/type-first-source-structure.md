# Type-first source structure — Implementation plan

**Spec:** Standalone — this plan defines requirements and behavior

## Goal

Reorganize the source tree around one predictable type-first rule so a human
maintainer can locate Astro routes, React presentation, framework-independent
domain behavior, shared cross-boundary utilities, and styles without first
learning a hybrid feature/layer convention.

## Requirements

- Keep Astro routes in `src/pages`.
- Put all React application, reusable-control, and product-feature code under
  `src/components`.
- Distinguish application composition, reusable controls, and product-facing
  components as `components/app`, `components/reusable`, and
  `components/features`.
- Group all analysis-view components and their shared UI state under
  `components/features/analysis`.
- Keep framework-independent workbook, analytics, report, and export behavior
  under `src/domain`.
- Put canonical duration constants, conversion, and motorsport formatting in
  `src/shared/durations.ts` because domain parsing, exports, and React views all
  consume them.
- Replace vague duration and progression module names with names that state
  their current responsibility.
- Preserve calculations, report and export field names, serialized contracts,
  rendered behavior, CSS classes, lazy loading, and browser interaction.
- Add no dependency and perform no unrelated cleanup or behavioral refactor.

## Context

- The current tree mixes type-first roots (`components`, `state`, `styles`) with
  a feature-first root (`features`) and generic buckets (`lib`, `components/ui`).
- `src/domain/durations.ts` is consumed across domain, export, and UI boundaries.
- `src/domain/parsing/durations.ts` parses workbook-specific values and is a
  distinct responsibility.
- `src/domain/analytics/progression.ts` calculates selected-stint pace
  progression, lap deltas to stint medians, and sector deltas to driver medians.
- The canonical `AnalysisReport` and JSON 1.0 names are compatibility contracts
  and do not change in this plan.
- The active maintainability spec and plans name current source paths; update
  those references mechanically so subsequent work remains executable.

## Prerequisites

- External gates: None.
- Working directory: repository root.
- Baseline: `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass; Vitest
  reports 20 files and 90 tests.

## Existing system to reuse

- Astro's required `src/pages` routing convention.
- Existing React component and lazy-import boundaries.
- Existing domain subdivisions: `model`, `parsing`, `analytics`, and `export`.
- Existing unit, component, and Playwright coverage.
- Existing canonical duration implementation and report contracts; this plan
  relocates and renames ownership without reimplementing behavior.

## Files

- `src/pages/index.astro` (modify) — import the relocated application shell.
- `src/components/AnalyzerShell.tsx` (move) — become
  `src/components/app/AnalyzerShell.tsx` and update lazy feature imports.
- `src/components/ThemeControl.tsx` (move) — become
  `src/components/app/ThemeControl.tsx`.
- `src/lib/theme.ts` (move) — become `src/components/app/theme.ts`.
- `src/components/ui/*.tsx` (move/rename) — become explicitly named reusable
  components under `src/components/reusable`.
- `src/lib/utils.ts` (move/rename) — become
  `src/components/reusable/classNames.ts`.
- `src/features/import/*` (move) — become
  `src/components/features/import/*`.
- `src/features/scope/*` (move) — become
  `src/components/features/scope/*`.
- `src/features/export/*` (move) — become
  `src/components/features/export/*`.
- `src/features/{analysis,overview,leaderboard,sectors,consistency,drivers}/*`
  (move/reorganize) — become one analysis component area under
  `src/components/features/analysis`, retaining meaningful subareas.
- `src/state/analysis-view.ts` (move/rename) — become
  `src/components/features/analysis/analysisViewStore.ts`.
- `src/domain/durations.ts` (move) — become `src/shared/durations.ts`.
- `src/domain/parsing/durations.ts` (move/rename) — become
  `src/domain/parsing/workbook-duration.ts`; rename its exported parser to state
  workbook ownership.
- `src/domain/analytics/progression.ts` (move/rename) — become
  `src/domain/analytics/stint-pace-progression.ts`; rename internal public types
  and calculation function consistently.
- `src/features/analysis/ProgressionChart.tsx` (move/rename) — become
  `PaceProgressionChart.tsx` under the analysis component area.
- `src/features/analysis/SectorProgressionChart.tsx` (move/rename) — become
  `SectorDeltaProgressionChart.tsx` under the analysis component area.
- `src/**/*.ts`, `src/**/*.tsx`, and `tests/**/*.ts*` (modify mechanically) —
  update imports, mocks, and renamed internal symbols.
- `README.md` and `AGENTS.md` (modify) — document the final type-first routing
  rules without duplicating guidance.
- `docs/specs/maintainability-refactor.md` and
  `docs/plans/maintainability-refactor/*.md` (modify mechanically) — update
  affected paths and component names so the active workflow remains usable.

## Implementation notes

1. Create the target directories and move files without changing their logic.
2. Apply imports from the moved files outward, keeping relative paths valid.
3. Use PascalCase filenames for reusable React components so filenames match
   their exported component names.
4. Keep `Card.tsx` and `MetricStrip` during this unit; their approved deletion
   remains in the maintainability cleanup work.
5. Keep analysis product areas as subdirectories beneath
   `components/features/analysis`; keep shared analysis presentation directly in
   that analysis area until MR-08 establishes its final shared chart boundary.
6. Rename `parseDurationToMicroseconds` to
   `parseWorkbookDurationToMicroseconds`, and rename `calculateStintProgression`
   plus its internal types to include `Pace`. Do not rename report properties or
   serialized fields.
7. Rename the two current chart components while preserving their props,
   rendered labels, data preparation, and tests.
8. Remove the now-empty `src/lib`, `src/state`, and `src/features` directories.
9. Update durable maintainer guidance and active plan references after the code
   paths are final.

## New architectural surface

- `src/components/app`: required to distinguish application composition from
  reusable and product-specific React components.
- `src/components/reusable`: required as the explicit owner of generic React
  controls used by multiple product areas.
- `src/components/features`: required to keep product-specific React code under
  the type-first `components` boundary.
- `src/shared`: required for named, framework-independent behavior consumed by
  multiple top-level architectural areas; initially limited to durations.

## Acceptance criteria

- [x] AC-1: Every React source file lives below `src/components`, except the
      Astro route that mounts the React application.
- [x] AC-2: `src/lib`, `src/state`, `src/features`, and `src/components/ui` are
      absent.
- [x] AC-3: Application composition, reusable controls, and product-facing
      components have distinct, documented owners.
- [x] AC-4: Analysis views and their shared UI state are colocated below
      `src/components/features/analysis`.
- [x] AC-5: Canonical duration behavior lives at `src/shared/durations.ts`, while
      workbook duration parsing has an explicit workbook-specific module and API.
- [x] AC-6: Stint pace progression and both progression charts have names that
      identify what progresses and what each view presents.
- [x] AC-7: Analysis values, report shapes, export contracts, rendered output,
      and user workflows remain unchanged.
- [x] AC-8: README and agent routing guidance describe the final type-first
      ownership rules accurately.
- [x] AC-9: The active maintainability spec and plans contain no stale affected
      source paths or old progression component names.
- [x] AC-10: All configured static, unit, browser, production, and base-path
      verification passes.

## Verification

- [x] `rg --files src | sort` from the repository root → only the approved
      top-level source areas and target paths remain.
- [x] Stale-path and former-name search across `README.md`, `AGENTS.md`, the
      active maintainability spec and plans, `src`, and `tests` → no stale affected
      path or former ambiguous symbol remains.
- [x] `pnpm format` → formatting is clean.
- [x] `pnpm lint` → no lint errors.
- [x] `pnpm check` → no Astro or TypeScript diagnostics.
- [x] `pnpm test` → all unit/component tests pass.
- [x] `pnpm build` → production build succeeds.
- [x] `pnpm e2e` → all Playwright workflows pass.
- [x] `BASE_PATH=/garage61-analyzer pnpm build` → repository-style base-path
      build succeeds.
- [x] `git diff --check` → no whitespace errors.
- [x] `git status --short` and final diff review → only approved plan,
      structural, import, naming, and documentation changes remain.

## Out of scope

- Report construction, scorecard, serializer, import-state, popup, or chart
  deduplication refactors.
- Removal of `Card`, `MetricStrip`, Impeccable, or other dead code.
- Changes to CSS organization, class names, visual design, dependencies,
  calculations, report fields, or export schemas.
- Publishing, deployment, dependency upgrades, or unrelated cleanup.
