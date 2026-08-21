# Maintainability and human handoff refactor

## Summary

Refactor the repository so its central analysis, import, export, UI infrastructure,
styles, and documentation are easier for a human maintainer to understand and
change safely.

This work is behavior-preserving. It must not change analysis results, import
behavior, the rendered interface, or any export contract. The refactor removes
obsolete Impeccable tooling and artifacts now that the visual design is finalized,
and leaves `README.md` and `AGENTS.md` as concise, non-duplicative entry points for
human and agent contributors.

## Goals

- Make the canonical report-building sequence readable from its public entry point.
- Make the versioned JSON export contract explicit instead of convention-driven.
- Give every imported file one traceable state model from selection through removal.
- Maintain popup lifecycle and positioning behavior in one shared implementation.
- Remove duplicated chart presentation while retaining clear domain-specific charts.
- Organize styles into a small number of human-navigable areas and remove dead UI
  scaffolding.
- Establish one canonical implementation for duration units, conversion, and base
  formatting.
- Reuse validation schemas for domain concepts that have one shared contract.
- Make scorecard metric meaning and ranking direction explicit.
- Remove the complete Impeccable repository integration and its generated artifacts.
- Make `README.md` the concise human-maintainer entry point and `AGENTS.md` the
  concise agent operating contract.

## Non-goals

- Changing product behavior, calculations, rankings, or analysis eligibility rules.
- Correcting unrelated latent defects discovered during the refactor. Record those
  separately unless they block behavior preservation.
- Changing JSON schema version `1.0`, exported field names, units, omissions, or
  workbook and Markdown output.
- Redesigning the interface or changing its controls, interaction model, responsive
  layout, visual treatment, or copy except for removal of non-rendered tool comments.
- Replacing the custom select with a native select.
- Migrating styling to Tailwind utilities, CSS Modules, or another styling system.
- Creating a generic report pipeline, serializer framework, state-machine framework,
  popup framework, chart framework, ranking framework, or schema factory.
- Adding a backend, persistence, authentication, hosted processing, or network
  handling of uploaded workbooks.
- Adding documentation hierarchies, implementation histories, or a contributor guide.
- Upgrading unrelated dependencies or performing unrelated cleanup.

## User-visible behavior

The completed refactor must be invisible to application users.

- Workbook selection, hashing, parsing, progress feedback, duplicate handling, track
  mismatch handling, parser warnings, removal, and recovery messages behave as before.
- Scope selection, custom selects, export selection, audit explanations, tabs, charts,
  keyboard interaction, focus restoration, and responsive placement behave as before.
- Analysis values, ordering, warnings, scorecards, stints, and lap audit output remain
  deterministic for the same input.
- JSON, Markdown, and spreadsheet exports retain their current names, shapes, values,
  units, formatting, and privacy-related omissions.
- Light and dark themes, responsive layouts, focus treatment, and reduced-motion
  behavior remain visually unchanged.

## Requirements

### R-1: Canonical report construction

- `buildAnalysisReport` remains the single public entry point for canonical report
  construction.
- The entry point exposes the report-building sequence without embedding the details
  of warning formatting, driver and leaderboard projection, stint projection, or lap
  audit projection.
- Cohesive existing analytics modules remain separate; the refactor must not replace
  them with a pipeline framework or split them into trivial files.
- Named types replace `Parameters<typeof ...>` and nested `ReturnType` expressions at
  meaningful module boundaries.
- The existing `AnalysisReport` schema, output ordering, determinism, and final runtime
  validation are preserved.

### R-2: Explicit serialized export contract

- The serialized JSON schema describes the actual fields of every exported section.
- Each exported section has an explicit typed mapping from `AnalysisReport` rather than
  relying on recursive key rewriting.
- Current snake-case names, microsecond-to-second conversion, source basenames, and
  omission of internal IDs and hashes remain exact.
- Narrow helpers may map repeated structures such as metric statistics, but there is
  no generic recursive object transformer, suffix-based conversion rule, or global
  omission blacklist.
- Contract regression coverage prevents a new canonical report field from silently
  becoming part of JSON output.

### R-3: Single import record model

- One ordered collection of import records is the source of truth for the import UI.
- A successful record owns its parsed workbook; the accepted workbook collection is
  derived from successful records rather than synchronized independently.
- Per-file state is discriminated and covers hashing, parsing, ready, duplicate,
  rejected, and failed outcomes.
- Stable input ordering and file identity survive concurrent hashing and parsing.
- Final ordered import results are authoritative; the UI does not reconstruct them
  from a mutable pending-result map or fallback result ordering.
- Same-track validation belongs to the domain import workflow rather than the React
  component.
- Stale-batch protection and the current concurrency behavior remain intact.
- Import state remains local to the feature; no new global store or state-machine
  dependency is introduced.

### R-4: Shared anchored-popup mechanics

- Portal rendering, viewport-aware placement, resize and scroll repositioning,
  outside-press dismissal, Escape dismissal, and trigger focus restoration have one
  shared implementation.
- `CustomSelect`, `ExportMenu`, and `AuditStatus` retain responsibility for their own
  selection, export, and audit semantics and accessibility roles.
- The custom select and all current single- and multi-select behavior are preserved;
  native selects are not introduced.
- The shared implementation stays narrowly scoped to anchored-popup mechanics and
  does not become a general modal or menu framework.
- No new dependency is added unless the existing behavior and accessibility contract
  cannot be met cleanly by consolidating current code.

### R-5: Shared progression-chart presentation

- Lap pace progression and sector progression remain separate, clearly named feature
  components with separate domain-specific data preparation.
- Repeated Recharts structure, axes styling, legend and tooltip wiring, line colors,
  and clean/dirty point presentation are maintained in one shared presentation layer.
- Each feature continues to provide its own series, domain, labels, formatting, and
  prepared points.
- Row-ordering or lap-key helpers are shared only where they retain one obvious domain
  meaning.
- Pit-lap gaps, dirty-lap markers, accessible labels, empty states, controls, and
  duration formatting remain unchanged.

### R-6: Human-navigable styles and dead-code removal

- The existing custom CSS and BEM naming approach remain in use.
- Styles are divided into a small number of stable areas covering foundations, the
  application shell, import and scope review, analysis surfaces, and shared UI
  primitives.
- Astro retains one clear stylesheet entry point.
- Short section comments identify meaningful boundaries where filenames alone are
  insufficient.
- Confirmed unused code is removed, including the Card primitive, `MetricStrip`, their
  associated styles, and obsolete selectors.
- The design-generation thesis comment is removed from `src/pages/index.astro`.
- Styles are not split into one file per small component.
- Rendered appearance, responsive behavior, themes, focus behavior, and reduced-motion
  behavior are preserved.

### R-7: Canonical duration utilities

- One framework-independent source defines microsecond constants,
  microseconds-to-seconds conversion, and standard motorsport duration formatting.
- Workbook-specific parsing remains in the parsing area.
- Context-specific presentation remains explicit where semantics differ, including
  leaderboard zero gaps and signed deltas.
- UI and export code consume the same canonical conversion and base formatter.
- Current rounding, null handling, negative-value handling, and displayed/exported
  formats remain exact.

### R-8: Shared domain schemas

- `analysisReportSchema` reuses `sourceSummarySchema` rather than redefining the same
  source contract.
- Other exact schema duplication may be removed only when both definitions represent
  the same domain concept and validation rules.
- Distinct normalized, report, and serialized models remain distinct when their
  responsibilities or validation differ.
- Runtime validation behavior and inferred TypeScript types remain compatible.

### R-9: Explicit scorecard metric semantics

- Scorecard metrics use named definitions that expose their value, sample size, and
  ranking direction.
- Ranking direction is expressed in domain-readable terms rather than a trailing
  boolean argument.
- Pace, fuel efficiency, and consistency continue to rank lower values higher;
  cleanliness continues to rank higher values higher.
- Potential continues to mean improvement headroom: a larger execution gap from a
  driver's theoretical best represents more unrealized potential and ranks higher.
- Field eligibility, ties, ranks, radar scores, and unavailable-value behavior remain
  unchanged.
- Tests state the intended ranking direction of all five metrics.

### R-10: Remove Impeccable integration and artifacts

- Remove `.gitmodules` and the `vendor/impeccable` submodule.
- Remove `.agents/skills/impeccable` and its empty parent directories.
- Remove tracked and locally generated `.impeccable/` configuration, design data,
  surface briefs, and review artifacts.
- Remove `DESIGN.md`, `PRODUCT.md`, and `MANIFEST.json` without migrating their content.
- Remove Impeccable-specific and obsolete documentation exclusions from `.gitignore`,
  `.prettierignore`, `eslint.config.js`, and `tsconfig.json`.
- Remove stale `.prettierignore` entries for the absent legacy `docs/01_...` through
  `docs/04_...` files.
- Preserve `README.md`, `AGENTS.md`, and `THIRD_PARTY_NOTICES.md`.
- Preserve the finalized design as implemented in application code and CSS.
- A fresh clone must not require submodule initialization for development, testing, or
  deployment.

### R-11: Concise human and agent guidance

- `README.md` is the authoritative human-maintainer entry point.
- The README concisely covers product scope, critical analysis semantics, end-to-end
  data flow, change-location guidance, local commands, verification, static deployment,
  base-path behavior, export compatibility, and privacy constraints.
- Dependency inventories and other facts already authoritative in configuration files
  are linked or summarized only when architecturally relevant.
- `AGENTS.md` is the authoritative agent operating contract.
- Agent guidance covers inspection and approval workflow, product and data invariants,
  scope and dependency discipline, file routing, verification, and documentation
  responsibilities without repeating the README.
- Neither document contains obsolete milestone language, design-process residue,
  unverifiable guidance, or references to removed documentation.
- No `CONTRIBUTING.md`, architecture history, or additional permanent documentation
  hierarchy is introduced.

## Constraints

- All uploaded workbook bytes and derived analysis remain local to the browser.
- The application remains a static Astro site deployable to GitHub Pages under a
  repository base path.
- Domain calculations remain framework-independent pure TypeScript.
- UI and all export formats continue to consume the same canonical `AnalysisReport`.
- Runtime and pace eligibility remain separate, pit-lap behavior remains unchanged,
  and `Clean = 0` never creates a penalty.
- No statistic loses its sample count and no lap loses its audit information.
- Existing stable package choices remain in place. Dependency changes require separate
  justification if implementation proves one necessary.
- The repository must remain buildable throughout implementation.

## Existing behavior to preserve

- Multiple Garage 61 `.xlsx` files can be imported with duplicate detection and
  actionable malformed-file feedback.
- Dynamic sectors, drivers, stints, scope selections, and pace mode continue to feed
  one deterministic report.
- Runtime standings, clean fractions, lap statistics, sector benchmarks, consistency,
  theoretical bests, scorecards, progression, warnings, and audit rows remain exact.
- JSON, Markdown Summary, Markdown Full, and nine-sheet spreadsheet exports remain
  compatible with current consumers and fixtures.
- Analysis state remains ephemeral; only theme preference is persisted.
- Keyboard access, focus indication, screen-reader labeling, responsive tables,
  custom-select interaction, popup dismissal, and reduced motion remain supported.

## Acceptance criteria

- AC-1: For fixed input and timestamp, the canonical report before and after the
  refactor is deeply equal and passes `analysisReportSchema` validation.
- AC-2: `buildAnalysisReport` remains the public entry point and reads as orchestration
  across named report sections rather than implementing all section details inline.
- AC-3: The complete serialized JSON 1.0 shape is represented by explicit schemas and
  typed mappings, with no recursive key-convention transformer or omission blacklist.
- AC-4: Existing JSON contract fixtures remain deeply equal, including names, seconds
  conversion, basenames, and omitted internal identifiers.
- AC-5: Import behavior is driven by one ordered discriminated record model, and no
  separate mutable pending parsed-workbook map is required.
- AC-6: Concurrent import completion cannot reorder records or associate a parsed
  workbook, warning, duplicate, failure, or track mismatch with the wrong file.
- AC-7: Popup lifecycle and positioning mechanics have one implementation, and the
  custom select remains the control used by current single- and multi-select flows.
- AC-8: Lap and sector progression retain separate data preparation while their common
  chart presentation is implemented once.
- AC-9: Styles are organized into a small number of discoverable areas; confirmed dead
  primitives and styles are absent; visual and responsive behavior remains unchanged.
- AC-10: Duration constants, base formatting, and unit conversion each have one
  canonical implementation used by UI and export code.
- AC-11: `SourceSummary` has one shared schema definition used by normalized workbook
  and analysis report validation.
- AC-12: Scorecard metric definitions state value, sample size, and direction by name,
  and potential is documented and tested as improvement headroom.
- AC-13: No tracked or local Impeccable integration, submodule, skill link, artifact,
  documentation, ignore rule, compiler/linter exclusion, or source comment remains.
- AC-14: A fresh clone can install, lint, check, test, build, and run without fetching
  or initializing an Impeccable submodule.
- AC-15: `README.md` and `AGENTS.md` have distinct human and agent responsibilities,
  contain current repository facts, and do not duplicate substantial guidance.
- AC-16: `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` pass.
- AC-17: `pnpm e2e` passes because import, popup, chart, styling, and documentation-adjacent
  shell changes touch user-visible workflows.
- AC-18: A production build succeeds with `BASE_PATH=/garage61-analyzer`.

## Context

Primary implementation areas identified by the audit:

- `src/domain/analytics/report.ts`
- `src/domain/analytics/summaries.ts`
- `src/domain/export/serialization.ts`
- `src/domain/model/normalized.ts`
- `src/domain/model/report.ts`
- `src/domain/parsing/imports.ts`
- `src/domain/parsing/durations.ts`
- `src/features/import/ImportRegister.tsx`
- `src/components/ui/select.tsx`
- `src/features/export/ExportMenu.tsx`
- `src/features/scope/ScopeReview.tsx`
- `src/features/analysis/ProgressionChart.tsx`
- `src/features/analysis/SectorProgressionChart.tsx`
- `src/features/analysis/AnalysisPrimitives.tsx`
- `src/styles/global.css`
- `src/pages/index.astro`
- `README.md`
- `AGENTS.md`

The maintainability audit that led to this specification was read-only. At that
baseline, linting, type checking, and all 91 unit/component tests passed.
