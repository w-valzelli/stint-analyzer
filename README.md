# Garage 61 Stint Analyzer

A privacy-first static Astro and React application for local Garage 61 stint analysis.

## Status

Milestone 0 provides the static application shell. XLSX import and analysis arrive in later milestones.

## Development

```bash
pnpm install
pnpm dev
```

The local site uses `/stint-analyzer/` as its default base path. Set `BASE_PATH=/` for root hosting.

## Privacy

Analysis runs in the browser. The application does not upload workbooks or store analysis data remotely.

No account. No upload. Analyze locally and export when done.
