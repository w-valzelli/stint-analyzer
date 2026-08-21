# Stint Analyzer

An entirely vibe-coded static Astro and React application for local analysis of Garage 61 stint exports.
This is a personal experiment, not a production-ready application.

## Status

Milestone 1 provides local multi-file `.xlsx` import and Garage 61 lap normalization.

The app detects the Garage 61 session sheet, discovers sectors, preserves source fields, classifies full and partial rows, and identifies duplicate file bytes. Scope selection, analytics, penalties, and exports arrive in later milestones.

## Development

```bash
pnpm install
pnpm dev
```

The local site uses `/stint-analyzer/` as its default base path. Set `BASE_PATH=/` for root hosting.

## Local processing

Analysis runs in the browser. The application does not upload workbooks or store analysis data remotely.

All workbook data stays in your browser.
