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

## 2026-08-21 — Normalize durations as integer microseconds

Status: Accepted

### Context

Garage 61 XLSX exports store durations as Excel day fractions, while statistics need stable precision.

### Decision

Convert day fractions and supported duration strings to integer microseconds at the parser boundary. Preserve exact numeric values until a view or export formats them.

### Consequences

The domain layer avoids repeated conversion and millisecond rounding. Export formatters can convert microseconds to numeric seconds later.

## 2026-08-21 — Treat sector-sum mismatch as an informational warning

Status: Accepted

### Context

Garage 61 sector totals can differ from lap time because of export and timing details. The MVP does not yet have enough real fixtures to choose a safe rejection rule.

### Decision

Keep rows with a positive lap time and positive values for every discovered sector. Add an informational warning when the absolute sector-sum difference exceeds 0.250 seconds. Do not reject the row for this mismatch.

### Consequences

Users can inspect questionable rows without losing exploratory data. Later fixtures can refine the tolerance without changing the normalized model.

## 2026-08-21 — Use Stint Analyzer as the site identity

Status: Accepted

### Context

Garage 61 is the source workbook format. It is not the name of the analysis site.

### Decision

Use `Stint Analyzer` in the site wordmark, metadata, accessible labels, footer, and product documents. Keep `Garage 61` only when identifying supported source exports and parsing rules.

### Consequences

The site separates its identity from the input format. Internal parser names may continue to use Garage 61 where they describe source compatibility.

## 2026-08-21 — Keep theme preference local and minimal

Status: Accepted

### Context

Users need a dark working surface without persisting private analysis data.

### Decision

Default to the system theme. Cycle one icon button through System, Light, and Dark. Store only the selected preference under `stint-analyzer-theme`.

### Consequences

Theme choice survives reload without storing workbooks, filenames, laps, reports, penalties, or session history.

## 2026-08-21 — Keep functional material and icons

Status: Accepted

### Context

The source card texture and analysis-panel color marks establish the visual system. Some icons explain state or action.

### Decision

Keep the paper texture, short analysis-panel stripes, and meaningful icons. Remove only useless text, identifiers, repeated privacy copy, and icons without a task meaning.

### Consequences

The interface stays matter-of-fact while preserving a recognizable working surface.

## 2026-08-21 — Use driver-level multi-stint scope selection

Status: Accepted

### Context

Users compare imported drivers. They do not need workbook row details or repeated source cards during scope review.

### Decision

Group the review UI by driver. Detect stints within each source and driver partition, then merge those stints into one driver card. Include every imported driver automatically. Use one shared select-like control for single and multi-stint selection. The multi-stint control includes an `All stints` option. Close controls on outside click and after a single selection. Omit candidates with zero full timed laps. Apply one global pace mode to every driver. Use the full timed-lap range for each selected stint.

Keep source file IDs and row numbers in internal domain data. Do not show them in the driver scope card.

### Consequences

The scope model supports one driver across multiple files without crossing source-local stint boundaries. Runtime and pace counts aggregate selected stints. The UI stays focused on driver comparison and lap evidence. Audit cells show concise status colors and reveal friendly exclusion reasons on hover or click.

## 2026-08-21 — Use runtime-only standings with factual invalid-lap counts

Status: Accepted

### Context

The original Milestone 4 plan proposed manual penalty inputs and penalty-adjusted runtime. The product decision is to show facts from the workbook without adding manual controls or inferring penalties.

### Decision

Rank the leaderboard by selected runtime only. Calculate gaps from the runtime leader. Count selected full timed non-pit laps with `Clean = 0` as invalid laps for factual display. Keep invalid-lap counts separate from clean percentage and runtime eligibility. Do not call invalid laps penalties, and do not infer penalty seconds from `Clean`.

### Consequences

The leaderboard stays read-only and uses one runtime measure. A clean flag can explain lap quality without changing runtime or ranking. The original penalty seconds, override, and adjusted-runtime requirements are superseded for this milestone.
