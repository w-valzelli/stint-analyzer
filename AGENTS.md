# AGENTS.md — Garage 61 Stint Analyzer

## Mission

Build a production-quality, privacy-first static web application that analyzes one or more Garage 61 `.xlsx` session/stint exports entirely in the browser.

The application must deploy to **GitHub Pages** using **Astro + React**, require **no backend**, and export analysis to:

1. `.xlsx` — human-friendly multi-sheet workbook;
2. `.md` — deterministic, LLM-friendly analysis report;
3. `.json` — exact machine-readable report.

Raw telemetry CSV analysis is **out of scope for MVP**.

## Read before coding

Read in this order:

1. `docs/01_PRODUCT_DATA_EXPORT_SPEC.md`
2. `docs/02_ARCHITECTURE_GITHUB_PAGES.md`
3. `docs/03_IMPLEMENTATION_PLAN.md`
4. `docs/04_TESTING_ACCEPTANCE.md`

If there is a conflict, this file wins.

## Autonomous execution rules

- Do not stop for minor product or implementation questions.
- Prefer a sensible default and record non-trivial choices in `docs/DECISIONS.md`.
- Keep the repository buildable after every milestone.
- Use `pnpm`.
- Use current stable package releases at implementation time and commit `pnpm-lock.yaml`.
- Do not add a server, database, API route, authentication system, user accounts, cloud storage, serverless function, hosted AI call, or shared persistence for MVP.
- Uploaded workbooks must never be sent over the network.
- The product is intentionally ephemeral: the user drops files in, gets the analysis, exports what they want, and can then close or refresh the page. Analysis state does not need to survive refresh.
- Do not add login, signup, profiles, team workspaces, cloud saves, cross-device history, or account-related UI.
- Do not infer penalties or black flags from Garage 61's `Clean` field.
- Runtime and pace eligibility are separate concepts.
- Pit laps can count toward run runtime but are excluded from default pace statistics.
- Do not implement median, standard deviation, MAD, IQR, table sorting/filtering, XLSX parsing, XLSX writing, or drag/drop from scratch when the selected packages already provide them.
- Domain calculations must be framework-independent pure TypeScript.
- UI, XLSX export, Markdown export and JSON export must all consume the same canonical analysis report.
- Do not build telemetry abstractions in MVP.

## Required stack

- Astro static output
- React
- TypeScript strict mode
- Tailwind CSS
- GitHub Actions -> GitHub Pages
- `react-dropzone`
- `read-excel-file`
- `write-excel-file`
- `zod`
- `simple-statistics`
- `@tanstack/react-table`
- `recharts`
- `zustand`
- `lucide-react`
- Vitest + Testing Library
- Playwright

Selected shadcn/ui components are encouraged; do not add a second large UI framework.

## Suggested structure

```text
/
├── AGENTS.md
├── README.md
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── public/
├── src/
│   ├── components/
│   ├── features/
│   │   ├── import/
│   │   ├── overview/
│   │   ├── leaderboard/
│   │   ├── sectors/
│   │   ├── consistency/
│   │   ├── drivers/
│   │   ├── audit/
│   │   └── export/
│   ├── domain/
│   │   ├── model/
│   │   ├── parsing/
│   │   ├── analytics/
│   │   ├── penalties/
│   │   └── export/
│   ├── state/
│   ├── pages/
│   └── styles/
├── tests/
│   ├── fixtures/
│   ├── unit/
│   └── e2e/
├── docs/
└── .github/workflows/
```

## Product invariants

1. Files stay local.
2. The app is accountless and ephemeral by design: upload -> analyze -> export -> discard.
3. No analysis persistence is required by default; refresh may clear all imported data and results.
4. `Clean = 0` is not a penalty.
5. Runtime uses selected timed run laps, not only clean laps.
6. Default pace statistics use clean, non-pit, full timed laps.
7. Pit-in/pit-out laps are excluded from pace but can remain in runtime.
8. Every statistic displays or exports its sample count.
9. Every lap can be audited for inclusion/exclusion.
10. Exports include methodology and assumptions.
11. Same normalized data and same derived report feed every view/export.
12. Malformed files produce actionable validation messages.

## Quality gate

Before completing any milestone:

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```

For user-visible workflow changes:

```bash
pnpm e2e
```

Also test the built application under a repository base path such as `/garage61-analyzer/`.

## MVP completion

A user must be able to:

1. open the static site;
2. drag in multiple Garage 61 `.xlsx` exports;
3. review detected drivers/stints/laps;
4. choose the runtime/pace scope;
5. manually enter real penalty counts/seconds;
6. view overview, leaderboard, sectors, consistency, driver detail and lap audit;
7. export `.xlsx`, `.md` and `.json`;
8. use the app successfully from GitHub Pages;
9. do all of the above without source files leaving the browser;
10. complete the full workflow without creating an account or storing analysis remotely.
