# AGENTS.md — Stint Analyzer

## Start here

Read [README.md](README.md) before changing the repository. It is the shared
reference for the current product scope, architecture, codebase structure,
package responsibilities, commands, testing, and deployment.

Keep this file focused on instructions for AI agents. Do not recreate a
`docs/` folder, `START_HERE.md`, or implementation-history documents unless a
future request explicitly requires them.

## Working rules

- Inspect the relevant code, tests, configuration, and README before editing.
- Choose the smallest coherent change that satisfies the request.
- Preserve existing work and repository conventions; avoid unrelated cleanup
  and speculative abstractions.
- Use `pnpm` and keep `pnpm-lock.yaml` in sync when dependencies change.
- Keep the project buildable after each change.
- Do not expose, persist, or log secrets, workbook contents, or user analysis
  data.
- Update README.md when durable codebase facts change. Keep agent-only rules in
  this file instead of duplicating the README.

## File routing

- Keep Astro route entry points in `src/pages`.
- Keep all React components and their UI-adjacent support code under
  `src/components`: application composition in `app`, generic controls in
  `reusable`, and product-facing workflows in `features`.
- Colocate UI state with the narrowest component area that owns it; do not
  recreate a root `state` category.
- Keep framework-independent workbook, analytics, report, and export behavior
  in `src/domain`.
- Use `src/shared` only for named framework-independent behavior consumed by
  multiple top-level areas. Do not recreate generic `lib`, `utils`, or `helpers`
  buckets.
- Name modules after the product or domain responsibility they own; avoid vague
  names such as `progression` when a more explicit domain term is available.

## Product boundaries

- The app is a static Astro site with a React analyzer and no backend.
- Workbook files are read locally in the browser and must never be uploaded or
  sent to a hosted AI service.
- The product is accountless and ephemeral. Do not add login, profiles, team
  workspaces, cloud saves, shared history, cross-device sync, or analysis
  persistence.
- Raw telemetry CSV analysis is out of scope.

## Analysis invariants

README's Analysis rules and Exports and privacy sections define the semantics.
When changing analysis, import, or export code:

- Keep runtime and pace eligibility separate; `Clean` never affects runtime.
- Keep clean percentage reporting its numerator, denominator, and percentage.
- Do not treat `Clean = 0` as a penalty or infer penalties or black flags.
- Keep an auditable inclusion/exclusion result for every lap.
- Keep domain calculations framework-independent pure TypeScript.
- Feed the UI and every export from the same canonical `AnalysisReport`.
- Keep JSON `1.0` compatible; change it only through its explicit mappers.
- Preserve dynamic sector discovery and actionable validation for malformed or
  unrelated workbooks.

## UI and documentation discipline

- Treat imported data and analysis results as the primary content.
- Prefer table-first analysis and progressive disclosure for methodology or
  audit detail.
- Do not repeat tab labels as panel headings or repeat context already visible
  in the surrounding scope review.
- Keep table surfaces full width and put explanatory padding on inner advisory
  content.
- Format motorsport durations as `m:ss.ddd`, or `h:mm:ss.ddd` above one hour.
- Keep interfaces direct and pragmatic; do not add decorative ceremony.

## Verification

Use the commands documented in README.md, in proportion to the change:

- Documentation only: `pnpm format`.
- Application code: `pnpm format`, `pnpm lint`, `pnpm check`, `pnpm test`, and
  `pnpm build`.
- User-visible workflows: also `pnpm e2e`.
- Routing or asset behavior: also run README's base-path build check.
