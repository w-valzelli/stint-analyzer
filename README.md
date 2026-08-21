# Stint Analyzer

Stint Analyzer is a static Astro + React app for analyzing one or more Garage
61 `.xlsx` session/stint exports locally in the browser.

## Features

- Multi-file `.xlsx` import with duplicate detection and parser warnings.
- Garage 61 `Session - Practice` sheet detection with header-based fallback.
- Dynamic sector discovery, driver/stint scope review, and pace-mode selection.
- Overview, runtime leaderboard, sector, consistency, and driver scorecard views.
- `.xlsx`, `.json`, and Markdown exports. Markdown has Summary and Full modes;
  the Full report includes the lap audit.

Raw telemetry CSV analysis is out of scope.

## Analysis rules

- Runtime sums selected full timed laps. Pit-in and pit-out laps may count in
  runtime when they belong to the selected scope.
- Default pace statistics use full timed, clean, non-pit laps. `all-non-pit`
  mode removes the clean requirement but still excludes pit laps.
- Clean percentage is clean full timed non-pit laps divided by all full timed
  non-pit laps in the selected scope.
- `Clean = 0` is not a penalty. The leaderboard is runtime-only and does not
  infer black flags or penalty seconds.
- Durations use integer microseconds internally and are formatted as
  motorsport durations for display and export.
- Every lap retains runtime/pace eligibility and exclusion reasons for audit.

## Architecture

```text
Astro page → AnalyzerShell React island → local workbook import
    → normalized workbooks → scope, stints, and eligibility
    → canonical AnalysisReport → views and XLSX/Markdown/JSON exports
```

The app has no backend, account system, hosted analysis service, or analysis
persistence. Workbooks are read through the browser File API and kept in
memory. The only browser preference is the selected theme.

Domain code is framework-independent TypeScript. Parsing, analytics, UI, and
export code share the canonical `AnalysisReport`.

## Repository structure

```text
src/
├── pages/                    Astro routes
├── components/               App shell, theme control, UI primitives
├── domain/
│   ├── model/                Normalized data and report schemas
│   ├── parsing/              Workbook parsing and source validation
│   ├── analytics/            Eligibility, stints, statistics, report building
│   └── export/               XLSX, Markdown, JSON, and validation
├── features/                 Import, scope, analysis, and export UI
├── state/                    Analysis-view preferences
├── lib/                      Shared helpers
└── styles/                   Global CSS and design tokens

tests/
├── unit/                     Vitest and Testing Library tests
├── e2e/                      Playwright tests
└── fixtures/                 Synthetic workbooks and expected reports

.github/workflows/deploy.yml  GitHub Pages deployment
astro.config.mjs              Astro static/base-path configuration
package.json                  Scripts and dependencies
```

## Development

```bash
pnpm install
pnpm dev
```

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `pnpm dev`          | Start the development server.    |
| `pnpm build`        | Build the static site.           |
| `pnpm preview`      | Preview the production build.    |
| `pnpm check`        | Run Astro and TypeScript checks. |
| `pnpm lint`         | Run ESLint.                      |
| `pnpm format`       | Check Prettier formatting.       |
| `pnpm format:write` | Apply Prettier formatting.       |
| `pnpm test`         | Run unit/component tests.        |
| `pnpm test:watch`   | Run tests in watch mode.         |
| `pnpm e2e`          | Run Playwright tests.            |
| `pnpm e2e:ui`       | Open the Playwright UI runner.   |

The default base path is `/stint-analyzer/`. Use `BASE_PATH=/` for root hosting
or verify a repository-style path with:

```bash
BASE_PATH=/garage61-analyzer pnpm build
```

## Dependencies

- Astro, React, and TypeScript provide the static site and interactive app.
- Tailwind CSS and the bundled Recursive/Fragment Mono fonts provide styling.
- `react-dropzone`, `read-excel-file`, and `write-excel-file` handle local file
  selection and workbook read/write.
- `zod` validates normalized data and reports; `simple-statistics` provides
  analytics; `recharts` provides charts; `zustand` stores view preferences.
- `lucide-react`, `clsx`, `tailwind-merge`, and
  `class-variance-authority` support the UI primitives.
- ESLint, Prettier, Vitest, Testing Library, jsdom, and Playwright provide
  verification.

Exact versions are defined in `package.json` and locked in `pnpm-lock.yaml`.

## GitHub Pages

`.github/workflows/deploy.yml` builds and deploys the static site on pushes to
`main` and on manual dispatch. `SITE_URL` and `BASE_PATH` are configurable in
`astro.config.mjs`; the workflow sets `BASE_PATH` to the repository name.

Keep the app static and local-only: do not add server routes, uploads, account
features, hosted AI calls, or shared persistence.
