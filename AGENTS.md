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

## Product boundaries

- The app is a static Astro site with a React analyzer and no backend.
- Workbook files are read locally in the browser and must never be uploaded or
  sent to a hosted AI service.
- The product is accountless and ephemeral. Do not add login, profiles, team
  workspaces, cloud saves, shared history, cross-device sync, or analysis
  persistence.
- Raw telemetry CSV analysis is out of scope.

## Analysis invariants

- Runtime and pace eligibility are separate concepts.
- Runtime sums selected full timed laps, including pit laps when they are in
  the selected scope. `Clean` does not affect runtime.
- Default pace uses full timed, clean, non-pit laps. The exploratory all-non-pit
  mode may include unclean non-pit laps.
- Clean percentage uses full timed non-pit laps as its denominator and always
  exposes numerator, denominator, and percentage.
- `Clean = 0` is not a penalty. Do not infer penalties or black flags from it;
  the current product has no penalty-adjusted leaderboard.
- Every lap must retain an auditable inclusion/exclusion result.
- Domain calculations remain framework-independent pure TypeScript.
- The UI and all export formats consume the same canonical `AnalysisReport`.
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

Use the relevant commands documented in README.md. For normal application
changes, run linting, type checking, unit tests, and a production build. Run
Playwright for user-visible workflow changes and verify the configured GitHub
Pages base path when routing or asset behavior changes.
