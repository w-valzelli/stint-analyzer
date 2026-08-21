# Unit 03 — Shared interactive UI infrastructure

**Spec:** `../../specs/maintainability-refactor.md`  
**Index:** `./index.md`

## Goal

Maintain popup lifecycle/positioning and progression-chart presentation once while
keeping each custom control and chart explicit about its own domain semantics.

## Requirements

- Preserve the custom select; native selects are prohibited by the approved spec.
- Preserve popup visuals, placement, dismissal, focus behavior, roles, and labels.
- Preserve both progression charts' data, controls, formatting, gaps, and dirty markers.
- Add only the two shared surfaces justified by current repeated consumers.

## Context

- `CustomSelect`, `ExportMenu`, and `AuditStatus` separately implement portal rendering,
  outside press, Escape, position calculation, resize/scroll handling, and focus return.
- `ProgressionChart` and `SectorProgressionChart` repeat most Recharts presentation but
  calculate different domain data.
- Existing unit tests cover scope, export, and analysis views; Playwright covers the
  user workflows but may need focused keyboard/focus assertions.

## Prerequisites

- Prior units: Units 01 and 02 completed with passing full gates.
- External gates: Playwright browser availability for E2E verification; if browsers are
  unavailable, report the exact blocked command rather than changing scope.
- Working directory: repository root.
- Baseline: `pnpm test` and `pnpm build` pass after Unit 02.

## Existing system to reuse

- Current popup event handling and position calculations as the behavior baseline.
- Current custom select selection and keyboard logic.
- Current export and audit markup/semantics.
- Recharts and `AnalysisChartTooltip`.
- Existing CSS class names until Unit 04 reorganizes styles.

## Files

- `src/components/ui/anchored-popup.tsx` (add) — shared portal, placement, dismissal,
  repositioning, refs, and focus-return mechanics.
- `src/components/ui/select.tsx` (modify) — retain selection/listbox behavior and consume
  the shared anchored-popup mechanics.
- `src/features/export/ExportMenu.tsx` (modify) — retain export state/content and consume
  the shared mechanics.
- `src/features/scope/ScopeReview.tsx` (modify) — retain `AuditStatus` semantics/content
  and consume the shared mechanics.
- `src/features/analysis/ProgressionLineChart.tsx` (add) — shared Recharts presentation
  for prepared progression points and series.
- `src/features/analysis/ProgressionChart.tsx` (modify) — retain lap/driver data shaping,
  controls, labels, and formatting; delegate presentation.
- `src/features/analysis/SectorProgressionChart.tsx` (modify) — retain sector-delta data
  shaping, controls, labels, and formatting; delegate presentation.
- `src/features/analysis/AnalysisPrimitives.tsx` (modify if tooltip ownership becomes
  clearer) — keep genuinely shared analysis primitives only.
- `tests/unit/scope-review.test.tsx` (modify) — verify popup dismissal and focus return.
- `tests/unit/export-menu.test.tsx` (modify) — verify popup lifecycle through the shared
  mechanics.
- `tests/unit/analysis-views.test.tsx` (modify) — preserve prepared points and chart
  series/labels after presentation extraction.
- `tests/unit/select.test.tsx` (add) — directly cover custom select keyboard, single and
  multi-selection, outside dismissal, Escape, and focus restoration.
- `tests/e2e/scope.spec.ts`, `tests/e2e/analysis.spec.ts`, and
  `tests/e2e/shell.spec.ts` (modify only for missing observable contracts) — browser
  interaction and rendering verification.

## Implementation notes

1. Add direct characterization coverage for custom select and popup focus behavior
   before extraction. Prefer user-observable assertions over implementation details.
2. Extract only shared anchored-popup mechanics. Support the three current alignment
   and sizing needs directly; do not design an extensible placement/configuration API.
3. The primitive owns shared document/window listeners and portal placement. Consumers
   provide open state, trigger/content markup, semantic roles, labels, and content.
4. Preserve `CustomSelect` listbox keyboard navigation, single-select close behavior,
   multi-select retention, all-option behavior, active option focus, and trigger labels.
5. Preserve `ExportMenu` status and selection state and `AuditStatus` hover/click
   semantics; only their popup mechanics move.
6. Extract a progression chart that accepts already prepared data, series definitions,
   Y domain, accessible label, axis/tooltip formatters, and current visual parameters.
   Its API should describe the two current charts, not hypothetical chart types.
7. Keep `pointsForReport` functions and domain-specific selection state in their named
   feature modules. Share audit ordering or lap-key code only if one exact helper serves
   both without mode flags.
8. Run focused unit tests, then the relevant Playwright files. Resolve any focus,
   portal, or responsive regression before Unit 04.

## New architectural surface

- `anchored-popup.tsx`: required by three current independently implemented popup
  consumers.
- `ProgressionLineChart.tsx`: required by two current near-duplicate chart renderers.

No UI framework, popup dependency, chart framework, or native select is added.

## Acceptance criteria

- [ ] AC-7: Popup mechanics have one implementation and custom select behavior remains.
- [ ] AC-8: Chart data preparation remains distinct and chart presentation exists once.
- [ ] AC-16: The unit quality gate passes.
- [ ] AC-17: Relevant browser workflows pass.

## Verification

- [ ] `pnpm exec vitest run tests/unit/select.test.tsx tests/unit/scope-review.test.tsx tests/unit/export-menu.test.tsx tests/unit/analysis-views.test.tsx`
      from the repository root → popup, selection, focus, and chart tests pass.
- [ ] `rg -n "createPortal|addEventListener\('(pointerdown|keydown)'|addEventListener\('(resize|scroll)'" src/components/ui/select.tsx src/features/export/ExportMenu.tsx src/features/scope/ScopeReview.tsx`
      → shared popup mechanics are absent from consumers.
- [ ] Review `ProgressionChart.tsx` and `SectorProgressionChart.tsx` → no duplicate
      Recharts container, axes, legend, line, or dirty-dot rendering remains.
- [ ] `pnpm lint` → pass.
- [ ] `pnpm check` → zero diagnostics.
- [ ] `pnpm test` → all tests pass.
- [ ] `pnpm build` → production build passes.
- [ ] `pnpm exec playwright test tests/e2e/scope.spec.ts tests/e2e/analysis.spec.ts tests/e2e/shell.spec.ts`
      → relevant browser workflows pass.

## Out of scope

- Replacing custom controls, changing their visual design, or broadening their feature
  set.
- Changing chart calculations or introducing an application-wide chart configuration
  system.
- Moving component state into Zustand.
