# 02 — Architecture, packages and GitHub Pages

## 1. Architecture decision

Build a static Astro site containing one primary React analysis application.

```text
GitHub Pages
    ↓
Static Astro shell
    ↓
React analyzer
    ↓
Browser File API
    ↓
XLSX parser
    ↓
Validation + normalization
    ↓
Pure TypeScript analytics engine
    ↓
Canonical AnalysisReport
    ├── UI
    ├── XLSX exporter
    ├── Markdown exporter
    └── JSON exporter
```

There is no backend.

Uploaded files are read locally and never sent to a server.

The application is intentionally **accountless and ephemeral**. The desired lifecycle is:

```text
select local files -> analyze in memory -> export -> discard
```

No login, signup, profile, cloud save, workspace, shared history or cross-device sync should be introduced unless a future product directive explicitly changes this architecture.

---

## 2. Why GitHub Pages works

GitHub Pages is static hosting. That is sufficient because:

- the deployed app is HTML/CSS/JS;
- browser JavaScript can read user-selected local files;
- parsing happens locally;
- statistics happen locally;
- browser JavaScript can generate downloadable files.

Server-side languages and dynamic API routes are not available on GitHub Pages, so do not design MVP around them.

---

## 3. Astro setup

Use Astro static output.

Use React through `@astrojs/react`.

Recommended architecture:

- Astro for page shell, metadata, static methodology/licenses pages;
- one React island for the interactive analyzer.

Example:

```astro
<AnalyzerApp client:load />
```

Do not fragment tightly coupled analysis state into many independent islands.

Avoid React Router for analyzer tabs.

Use:

- `/` static analyzer page;
- internal tabs/state;
- optional static Astro pages such as `/methodology/` and `/licenses/`.

This avoids GitHub Pages SPA deep-link 404 problems.

---

## 4. Required package set

Use current stable releases at implementation time and pin through `pnpm-lock.yaml`.

### Core

- `astro`
- `@astrojs/react`
- `react`
- `react-dom`
- `typescript`

### Styling/UI

- `tailwindcss`
- `@tailwindcss/vite`
- `lucide-react`
- `clsx`
- `tailwind-merge`
- `class-variance-authority`
- selected `shadcn/ui` components
- optionally `sonner` for notifications

Use shadcn selectively:

- Button
- Card
- Tabs
- Select
- Tooltip
- Dialog
- Dropdown Menu
- Badge
- Alert
- Progress

Do not add Material UI/Ant/etc. alongside it.

### Drag/drop

- `react-dropzone`

Use for accessible local file selection. It is not a network uploader.

### XLSX read

- `read-excel-file`

Rationale:

- focused browser XLSX reader;
- supports `File`, `Blob`, `ArrayBuffer`;
- supports multiple sheets;
- browser-oriented worker implementation;
- enough for standardized Garage 61 data.

### XLSX write

- `write-excel-file`

Rationale:

- browser-side workbook generation;
- multiple sheets;
- cell formats/styles;
- Blob/file output;
- browser worker support.

### Validation

- `zod`

Use Zod for normalized domain models, configuration and export validation.

### Statistics

- `simple-statistics`

Use it for:

- mean;
- median;
- population standard deviation;
- MAD;
- IQR/quantiles.

Do not manually implement these statistics.

### Charts

- `recharts`

Charts should support tables, not replace them.

Useful:

- lap-time progression;
- sector progression;
- stint delta trend;
- consistency comparisons.

### State

- `zustand`

Use for cross-feature UI/config/session state.

Keep derived statistics in pure domain code rather than duplicating them in store state.

### Local persistence

Do not add session-data persistence by default.

`Dexie`, IndexedDB, or other persistence libraries are **not needed for the current product directive**.

Permitted persistent browser state is limited to non-sensitive UI preferences such as theme or default benchmark. Do not persist workbooks, filenames, normalized laps, reports, penalties, or analysis history.

---

## 5. Why not SheetJS as first choice

SheetJS CE remains a valid fallback and is capable of browser read/write. Its official current distribution is outside the stale npm registry package, and its community edition intentionally limits advanced spreadsheet styling.

For this product:

- input format is narrow and standardized;
- output requires a polished but straightforward workbook.

`read-excel-file` + `write-excel-file` are simpler first choices.

If real Garage 61 fixtures reveal an incompatibility, document the failure and evaluate SheetJS CE as fallback rather than building a custom XLSX parser.

Do not use an old `xlsx` npm package by accident.

---

## 6. Domain module layout

Suggested:

```text
src/domain/
├── model/
│   ├── normalized.ts
│   ├── config.ts
│   └── report.ts
├── parsing/
│   ├── workbook.ts
│   ├── headers.ts
│   ├── garage61.ts
│   └── warnings.ts
├── analytics/
│   ├── eligibility.ts
│   ├── runtime.ts
│   ├── laps.ts
│   ├── sectors.ts
│   ├── consistency.ts
│   ├── stints.ts
│   ├── benchmarks.ts
│   └── leaderboard.ts
├── penalties/
│   └── penalties.ts
└── export/
    ├── markdown.ts
    ├── spreadsheet.ts
    ├── json.ts
    └── validation.ts
```

No React imports in `src/domain`.

---

## 7. Performance

Normal Garage 61 stint spreadsheets are modest. Avoid premature complexity.

Strategy:

- use browser-oriented XLSX library;
- limit concurrent parse tasks (e.g. 4);
- show file parse status;
- normalize and discard unnecessary workbook structures;
- memoize report derivation;
- avoid duplicate datasets.

Suggested guardrails:

- warning above 25 files;
- warning above 50 MB per workbook;
- defensive hard limit around 100 MB per workbook for MVP unless tested otherwise.

Telemetry files are a different performance problem and must not influence MVP architecture.

Do not add WebAssembly, a dataframe engine, or extra worker infrastructure unless profiling demonstrates a need.

---

## 8. Privacy/security rules

The app must make this statement true:

> Analysis happens locally in your browser. Uploaded files are not sent to a server.

Rules:

- do not POST source data;
- do not put filenames or data in URLs;
- do not add analytics that capture filenames;
- do not dump user data into production logs;
- no error reporter should serialize the report or workbook;
- no third-party AI call;
- no cloud persistence.

React text rendering avoids raw HTML injection; do not render spreadsheet cell contents via unsafe HTML.

Exports use source basenames only, never local paths.

---

## 9. GitHub Pages repository base path

Typical project URL:

```text
https://USERNAME.github.io/REPOSITORY/
```

Astro must configure:

- `site`
- `base`

Test all:

- assets;
- internal links;
- static pages;
- worker assets;
- downloads

under a non-root path like:

```text
/garage61-analyzer/
```

Do not hard-code root-relative assets that break under the repository path.

---

## 10. GitHub Actions

Use Astro's official GitHub Pages deployment pattern.

Repository setting:

- Settings
- Pages
- Source: GitHub Actions

Workflow should:

- checkout;
- install pnpm/dependencies;
- build Astro;
- upload Pages artifact;
- deploy.

Commit the lockfile.

---

## 11. GitHub Pages limitations

As of 2026-08-21, official GitHub documentation states:

- Pages is static hosting;
- no server-side languages such as PHP, Ruby or Python;
- published Pages site maximum is 1 GB;
- source repository recommended maximum is 1 GB;
- deployment timeout is 10 minutes;
- soft bandwidth limit is 100 GB/month;
- soft Pages build limit is 10/hour, with custom Actions workflow caveats.

This app should be far below these limits because user workbooks are local and never deployed.

### What Pages cannot do for this product

Without an external backend:

- no user accounts — intentionally;
- no shared team database — intentionally;
- no cross-device session history — intentionally;
- no server-side uploads;
- no secure API keys;
- no server-side LLM request;
- no arbitrary API endpoints.

This is intentional for MVP.

---

## 12. Future AI integration limitation

Do **not** put an OpenAI/Anthropic/etc. private API key into the browser bundle.

MVP uses `.md` / `.json` export for LLM interpretation.

If direct hosted LLM analysis is added later:

- add a backend/serverless proxy, or
- explicitly support a user-provided local API key with clear security UX.

At that point pure GitHub Pages may no longer be the complete hosting architecture.

---

## 13. Persistence and sharing

This product intentionally uses **exports instead of accounts or saved sessions**.

- report lives in memory;
- refresh/reset may clear the analysis;
- exported XLSX/Markdown/JSON are the persistence mechanism;
- users can share those exported files however they choose;
- no cloud history;
- no cross-device sync;
- no account system.

A future `Import analysis JSON` feature is compatible with this directive because it remains file-based and local.

No URL-only share should reconstruct private analysis without explicitly supplied local data.

---

## 14. Public-site safety

Do not commit:

- real private Garage 61 source files;
- private user exports;
- secrets;
- telemetry;
- customer analysis.

Use synthetic test fixtures.

Treat the published site as public even if repository visibility differs by plan.

---

## 15. Browser compatibility

Target current evergreen:

- Chrome
- Edge
- Firefox
- Safari

Gracefully report unsupported browser/file parsing behavior.

Use web APIs already widely supported:

- File/Blob
- Web Crypto SHA-256
- downloads/Blob URLs

---

## 16. Development/testing dependencies

Recommended:

- `@astrojs/check`
- ESLint
- Prettier
- `prettier-plugin-astro`
- `vitest`
- `@testing-library/react`
- `@testing-library/user-event`
- `jsdom`
- `@playwright/test`

---

## 17. Official references checked 2026-08-21

Astro GitHub Pages:
<https://docs.astro.build/en/guides/deploy/github/>

Astro rendering/static mode:
<https://docs.astro.build/en/basics/rendering-modes/>

Astro React:
<https://docs.astro.build/en/guides/integrations-guide/react/>

GitHub Pages overview:
<https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages>

GitHub Pages static/server limitation:
<https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site>

GitHub Pages limits:
<https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>

react-dropzone:
<https://react-dropzone.org/>

read-excel-file:
<https://github.com/catamphetamine/read-excel-file>

write-excel-file:
<https://github.com/catamphetamine/write-excel-file>

Zod:
<https://zod.dev/>

simple-statistics:
<https://simple-statistics.github.io/docs/>

TanStack Table:
<https://tanstack.com/table/latest/>
