# Architecture decision log

## 2026-08-21 — Use Astro static output with one React island

Status: Accepted

### Context

GitHub Pages provides static hosting. The analyzer needs interactive tabs and later local file analysis.

### Decision

Use Astro for the static document shell and one hydrated React analyzer island. Keep the analyzer tabs in React state instead of adding client-side routing.

### Consequences

The app has no server adapter or API route. GitHub Pages can serve the app without a deep-link fallback.

## 2026-08-21 — Use Tailwind CSS 4 through the Vite plugin

Status: Accepted

### Context

Tailwind CSS 4 provides an official Vite plugin for Astro projects.

### Decision

Configure `@tailwindcss/vite` in `astro.config.mjs` and import Tailwind from `src/styles/global.css`. Do not add the deprecated Astro Tailwind integration.

### Consequences

The project does not need a Tailwind configuration file for the initial design system.

## 2026-08-21 — Keep the GitHub Pages path configurable

Status: Accepted

### Context

GitHub Pages project sites use a repository path, while local development often uses a root path.

### Decision

Read `SITE_URL` and `BASE_PATH` from the environment. Default to `https://w-valzelli.github.io` and `/stint-analyzer` for this repository.

### Consequences

The same static build can target another repository path without changing application source files.

## 2026-08-21 — Pin TypeScript to the supported current release line

Status: Accepted

### Context

The newest TypeScript package is not yet supported by `@astrojs/check` and `typescript-eslint`.

### Decision

Use TypeScript `6.0.3`, which both tools support, and record the newer release as a future upgrade check.

### Consequences

The project uses the newest compatible TypeScript release instead of the newest published release.

## 2026-08-21 — Add minimal local UI primitives

Status: Accepted

### Context

Milestone 0 needs accessible button, card, and tab behavior before the full analyzer exists.

### Decision

Implement small shadcn-style primitives in `src/components/ui` instead of running the shadcn initializer.

### Consequences

The shell has the required UI foundation without adding a generator, unused components, or a second UI framework.
