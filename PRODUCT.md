# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are drivers and coaches preparing for motorsport events. They compare drivers and stints from Garage 61 exports to understand runtime, pace, sector performance, consistency, and lap evidence.

## Product Purpose

Stint Analyzer analyzes one or more Garage 61 session or stint `.xlsx` exports in the browser. It helps users compare selected runs, review data quality, inspect lap inclusion, and export a structured report. Success means that a user can complete this workflow without an account, backend, or file upload.

## Positioning

Stint Analyzer provides browser-local analysis of Garage 61 source workbooks. It keeps source workbooks and analysis in memory, then produces deterministic `.xlsx`, Markdown, and JSON exports from one canonical report.

## Operating Context

A user drops local Garage 61 workbooks into the site, reviews detected drivers, stints, laps, and scope, then inspects overview, leaderboard, sector, consistency, and driver views. The user reviews lap evidence inline during scope review and in exports. The user can keep, share, upload, or discard the exported files as needed.

## Capabilities and Constraints

- The application uses Garage 61 `.xlsx` session or stint exports as its MVP input.
- The application supports multiple files and discovers sector columns dynamically.
- The application separates runtime eligibility from pace eligibility.
- Runtime can include selected timed pit laps. Default pace statistics use full, clean, non-pit laps.
- Garage 61 `Clean` values do not create penalties. The current leaderboard is runtime-only and does not apply penalty adjustments.
- The application exposes lap inclusion and exclusion reasons for audit.
- All views and exports consume the same canonical analysis report.
- The application exports `.xlsx`, Markdown, and JSON reports with methodology and assumptions.
- The application does not analyze raw telemetry in MVP.
- The application has no account, backend, API route, cloud storage, shared history, or hosted AI connection.
- The analysis is ephemeral. Refreshing or closing the page may discard the current session.
- Source workbooks and analysis results must not leave the browser or enter automatic browser persistence.
- The site must deploy as a static Astro application on GitHub Pages under a repository base path.

## Brand Commitments

The product name is **Stint Analyzer**. Garage 61 identifies the supported workbook export format, not the site brand. The interface uses one factual footer statement: “All workbook data stays in your browser.” Future work must preserve the accountless, local-only behavior without making privacy the primary visual message.

## Evidence on Hand

`README.md` is the shared current reference for the product scope, architecture, codebase structure, commands, dependencies, testing, and deployment. The current Astro and React shell in `src/` provides the Stint Analyzer name, local workbook flow, and analysis sections. The repository contains no customer testimonials, private source workbooks, or customer performance claims. Future work must not fabricate them.

## Product Principles

- Keep user files private and local.
- Make analysis semantics correct and explicit.
- Make every result traceable to source laps and stated rules.
- Use exports as the portable persistence mechanism.
- Keep the MVP focused on Garage 61 workbook analysis.

## Accessibility & Inclusion

The application must support keyboard file selection and visible focus states. Controls must have clear labels. Analysis must use semantic tables alongside charts. Color must not be the only way to communicate meaning. The site targets current Chrome, Edge, Firefox, and Safari browsers.
