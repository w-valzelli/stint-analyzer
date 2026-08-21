# Garage 61 Stint Analyzer

A privacy-first static Astro and React application for local Garage 61 stint analysis.

## Status

Milestone 1 provides local multi-file `.xlsx` import and Garage 61 lap normalization.

The app detects the Garage 61 session sheet, discovers sectors, preserves source fields, classifies full and partial rows, and identifies duplicate file bytes. Scope selection, analytics, penalties, and exports arrive in later milestones.

## Development

```bash
pnpm install
pnpm dev
```

The local site uses `/stint-analyzer/` as its default base path. Set `BASE_PATH=/` for root hosting.

## Privacy

Analysis runs in the browser. The application does not upload workbooks or store analysis data remotely.

No account. No upload. Analyze locally and export when done.
