# Unit 04 — Repository cleanup and human handoff

**Spec:** `../../specs/maintainability-refactor.md`  
**Index:** `./index.md`

## Goal

Finish the refactor against the final source shape: make styles navigable, remove dead
UI code and the complete Impeccable integration, and leave concise authoritative
directions for human maintainers and agents.

## Requirements

- Preserve the finalized rendered interface and existing CSS/BEM approach.
- Remove only confirmed dead application code and styles.
- Remove every Impeccable integration/artifact approved by the spec, including ignored
  local review output.
- Make README human-facing and AGENTS agent-specific without creating more permanent
  documentation.
- Run the complete unit, browser, production, and repository-base-path gate.

## Context

- `global.css` is 1,977 lines and currently owns foundations, shell, import, scope,
  analysis, component primitives, and responsive rules.
- `Card` and `MetricStrip` have no consumers; additional obsolete selectors must be
  confirmed by source search before deletion.
- Impeccable is present as a submodule, skill symlink, tracked/generated configuration,
  root documentation, source comment, and configuration exclusions.
- README and AGENTS overlap on durable facts and should be rewritten after source paths
  are final.

## Prerequisites

- Prior units: Units 01–03 completed with passing unit gates and relevant E2E tests.
- External gates: Playwright browser availability. No publication or deployment is
  authorized or required.
- Working directory: repository root.
- Destructive scope: deletion targets are limited to the exact Impeccable and dead-code
  paths enumerated by the approved spec and this unit.
- Baseline: `pnpm test`, `pnpm build`, and targeted Unit 03 E2E tests pass.

## Existing system to reuse

- Existing CSS tokens, BEM class names, source order, and responsive breakpoints.
- `src/pages/index.astro` as the single stylesheet entry point.
- README's current architecture/data-flow explanation.
- AGENTS' current invariant and verification guidance.
- `package.json`, Astro config, test config, and workflow files as authoritative command
  and deployment sources.

## Files

- `src/styles/global.css` (modify) — retain imports as the single entry point and remove
  the monolithic rule body.
- `src/styles/foundations.css` (add) — theme tokens, resets, and global
  accessibility/motion foundations.
- `src/styles/shell.css` (add) — application shell, header, intro, source sheet, analysis
  index shell, and footer.
- `src/styles/import-scope.css` (add) — dropzone, import register, scope review, and audit
  presentation.
- `src/styles/analysis.css` (add) — analysis surfaces, tables, controls, charts,
  scorecard, and analysis-responsive rules.
- `src/styles/ui.css` (add) — buttons, tabs, custom select, anchored popups, export menu,
  and shared primitive-responsive rules.
- `src/components/ui/card.tsx` (delete) — unused primitive.
- `src/features/analysis/AnalysisPrimitives.tsx` (modify) — remove unused `MetricStrip`
  and retain used primitives.
- `src/pages/index.astro` (modify) — remove the non-rendered design-generation thesis
  block while preserving theme bootstrap and page markup.
- `.gitmodules` (delete) — remove Impeccable submodule configuration.
- `vendor/impeccable` (delete gitlink and checked-out submodule) — remove vendored tool.
- `.agents/skills/impeccable` (delete, then remove empty parent directories) — remove
  repository skill link.
- `.impeccable/` (delete tracked files and ignored local review output) — remove tool
  configuration and generated artifacts.
- `DESIGN.md`, `PRODUCT.md`, and `MANIFEST.json` (delete) — remove obsolete Impeccable
  documentation/artifacts without migration.
- `.gitignore` (modify) — remove the Impeccable review exclusion.
- `.prettierignore` (modify) — remove Impeccable paths and stale absent legacy-doc paths.
- `eslint.config.js` (modify) — remove Impeccable ignores.
- `tsconfig.json` (modify) — remove the Impeccable exclusion.
- `README.md` (modify) — concise human-maintainer product, semantics, data flow,
  change-routing, commands, verification, export, privacy, and deployment guidance.
- `AGENTS.md` (modify) — concise agent workflow, invariants, routing, scope, verification,
  and documentation rules without repeating README.
- Relevant component/E2E tests (modify only if selectors identify missing coverage) —
  preserve rendered and interaction contracts rather than updating expected behavior.

## Implementation notes

1. Inventory CSS selectors against JSX/TSX and external Recharts-generated classes.
   Delete only selectors and primitives confirmed unused; account for dynamically
   composed status classes before classifying a selector as dead.
2. Split CSS by the five approved areas while preserving rule order and cascade. Keep
   fonts and Tailwind import directives at the valid top-level entry point. Do not
   rename classes or restyle components during the move.
3. Keep responsive rules with their owning feature area unless a single global rule is
   genuinely cross-cutting. Add short boundary comments, not commentary on obvious
   declarations.
4. Remove `Card`, `MetricStrip`, associated styles, obsolete selectors, and the Astro
   thesis comment. Run formatting and component tests before repository teardown.
5. Resolve and validate each destructive Impeccable target explicitly, then remove the
   gitlink, submodule declaration, skill symlink, tracked `.impeccable` files, ignored
   `.impeccable/review` output, and the three approved root artifacts. Do not delete
   `THIRD_PARTY_NOTICES.md`.
6. Remove only configuration entries made obsolete by those deletions, including the
   four absent legacy-doc Prettier exclusions. Do not rewrite unrelated configuration.
7. Rewrite README against the final paths:
   - concise purpose and non-goals;
   - runtime/pace/clean/pit/audit invariants;
   - canonical data flow;
   - a practical "where to change what" table;
   - exact commands and base-path build;
   - export compatibility and local-only constraints.
8. Rewrite AGENTS as the agent contract:
   - read README and inspect before editing;
   - use the lightest approved workflow;
   - preserve core invariants and scope;
   - route parsing, analytics, report, export, UI, state, and styles correctly;
   - run proportional verification and update README only for durable facts.
     Link to README instead of duplicating its explanations.
9. Verify there are no Impeccable traces outside the active spec/plan workflow records.
   Those records remain through build and retro as stated in the index completion note.
10. Run the full quality gate, complete E2E suite, and repository-base-path production
    build. Do not publish or deploy.

## New architectural surface

- `foundations.css`, `shell.css`, `import-scope.css`, `analysis.css`, and `ui.css` behind
  the existing `global.css` entry point, required to replace one 1,977-line stylesheet
  with a small number of current feature boundaries.

No styling system, dependency, permanent documentation hierarchy, or runtime surface
is added.

## Acceptance criteria

- [ ] AC-9: Styles are discoverable, dead primitives/styles are gone, and visuals remain.
- [ ] AC-13: No Impeccable integration or artifact remains outside active workflow
      records retained for build/retro review.
- [ ] AC-14: Fresh-clone development and build no longer require a submodule.
- [ ] AC-15: README and AGENTS are concise, current, distinct entry points.
- [ ] AC-16: The complete quality gate passes.
- [ ] AC-17: The complete Playwright suite passes.
- [ ] AC-18: The repository-base-path production build passes.

## Verification

- [ ] `rg -n "MetricStrip|from ['\"].*ui/card|calibration-card" src tests` → no dead
      primitive references or styles remain.
- [ ] Compare the set of CSS class names before/after the split, excluding confirmed
      dead selectors → no live class is lost or renamed.
- [ ] `test ! -e .gitmodules && test ! -e vendor/impeccable && test ! -e .agents/skills/impeccable && test ! -e .impeccable && test ! -e DESIGN.md && test ! -e PRODUCT.md && test ! -e MANIFEST.json`
      → all approved Impeccable targets are absent.
- [ ] `git grep -n -i impeccable -- ':!docs/specs/maintainability-refactor.md' ':!docs/plans/maintainability-refactor/**'`
      → no output.
- [ ] `rg -n "docs/0[1-4]_" .prettierignore` → no stale legacy-doc exclusions.
- [ ] Review README against `package.json`, `astro.config.mjs`, source paths, and
      `.github/workflows/deploy.yml` → commands, paths, and deployment claims are exact.
- [ ] Review AGENTS against README and current source paths → no substantial duplicate
      prose or removed-document references.
- [ ] `pnpm format` → pass.
- [ ] `pnpm lint` → pass.
- [ ] `pnpm check` → zero diagnostics.
- [ ] `pnpm test` → all tests pass.
- [ ] `pnpm build` → default production build passes.
- [ ] `pnpm e2e` → complete Playwright suite passes.
- [ ] `BASE_PATH=/garage61-analyzer pnpm build` → repository-base-path build passes.
- [ ] `git status --short` and `git diff --check` → only approved implementation,
      deletion, documentation, spec, and plan changes remain; no whitespace errors.

## Out of scope

- Visual redesign, class renaming, CSS architecture migration, or dependency changes.
- Removing `README.md`, `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, the approved spec, or the
  active plan before build and retro are complete.
- Publishing, deploying, or changing GitHub Actions behavior.
