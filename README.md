# Stint Analyzer

An entirely vibe-coded static Astro and React application for local analysis of Garage 61 stint exports.
This is a personal experiment, not a production-ready application.

## Status

Milestone 5 provides local import, scope review, canonical report calculations, and the main analysis UI.

The app detects the Garage 61 session sheet, discovers sectors, preserves source fields, identifies duplicate file bytes, and checks track consistency across imports. Scope review hides incomplete laps from analysis while keeping them available in the lap audit. The analysis views now include an overview, runtime leaderboard, sector benchmarks and progression, consistency metrics, driver detail, and a sortable and filterable lap audit. Exports remain planned for Milestone 6.

## Development

```bash
pnpm install
pnpm dev
```

The local site uses `/stint-analyzer/` as its default base path. Set `BASE_PATH=/` for root hosting.

## Local processing

Analysis runs in the browser. The application does not upload workbooks or store analysis data remotely.

All workbook data stays in your browser.
