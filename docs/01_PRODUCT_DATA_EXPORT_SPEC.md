# 01 — Product, data and export specification

## 1. Product goal

Build **Stint Analyzer**, a browser-based analysis tool for Garage 61 session `.xlsx` exports.

A user drops in multiple driver/session exports and gets a comparable stint/run report answering:

- Who has the lowest raw and penalty-adjusted runtime?
- What are the gaps at the end of the selected run?
- What percentage of representative laps were clean?
- Who is quickest in each sector by best, average and median?
- How much does each driver lose to the best sector benchmark?
- Which sectors are repeatable versus inconsistent?
- Is an average distorted by an outlier?
- What is each driver's theoretical best lap?
- How does pace progress through a stint?
- What structured report can be exported for LLM interpretation?

The MVP stops before raw telemetry analysis.

---

## 1.1 Product boundary: accountless and ephemeral

This is a deliberate product directive, not merely an MVP shortcut.

The application workflow is:

```text
drop local Garage 61 files
    ↓
analyze locally in the browser
    ↓
inspect results
    ↓
export XLSX / Markdown / JSON
    ↓
user keeps, shares, uploads or discards those exports as they please
```

Do not build:

- user accounts;
- signup/login;
- profiles;
- team workspaces;
- cloud saves;
- shared history;
- cross-device sync;
- server-side persistence;
- automatic remote backup.

The current analysis may be discarded when the user refreshes or closes the page.

The exported files are the persistence and portability mechanism.

This should remain true unless a future product brief explicitly reverses the decision.

## 2. Expected Garage 61 input

Support multiple `.xlsx` files containing a sheet equivalent to `Session - Practice`.

Known columns in the working Garage 61 export:

- Run
- Lap
- Lap time
- Started at
- Driver
- Clean
- Pit in
- Pit out
- Track temp
- Track usage
- Air temperature
- Cloud cover
- Air density
- Air pressure
- Wind velocity
- Wind direction
- Relative humidity
- Fog level
- Precipitation
- Track Wetness
- Fuel level
- Fuel used
- Fuel added
- Sector 1 ... Sector N

Requirements:

- tolerate additional columns;
- normalize header whitespace/case;
- dynamically discover all `Sector N` columns;
- never hard-code seven sectors in the domain layer;
- prefer exact `Session - Practice` sheet, then fall back to header detection;
- detect/reject unrelated spreadsheets with a useful message.

Minimum viable analysis columns:

- Driver
- Lap time
- at least one Sector column

Recommended:

- Lap
- Run
- Clean
- Pit in
- Pit out

If `Clean` is absent, clearly warn that clean-only pace analysis is unavailable.

---

## 3. Canonical normalized lap

Use a domain type similar to:

```ts
type Lap = {
  id: string;
  sourceFileId: string;
  sourceFileName: string;

  driver: string;
  run: number | null;
  lapNumber: number | null;
  startedAt: string | null;

  lapTimeUs: number | null;
  sectorsUs: Record<string, number | null>;

  clean: boolean | null;
  pitIn: boolean;
  pitOut: boolean;

  fuelLevel: number | null;
  fuelUsed: number | null;
  fuelAdded: number | null;

  trackTemp: number | null;
  airTemp: number | null;
};
```

Normalize durations once. Prefer integer microseconds internally.

Excel day fractions:

```text
seconds = value × 86400
microseconds = round(seconds × 1,000,000)
```

Do not round statistical inputs to milliseconds.

---

## 4. Full timed lap detection

Garage 61 exports can contain:

- lap 0 rows;
- partial out-lap rows;
- trailing fragments;
- pit transition rows;
- non-time string placeholders in sector columns.

A representative full timed lap should normally have:

- numeric positive lap time;
- numeric time values for all discovered sectors;
- plausible sector sum relative to lap time.

A sector-sum mismatch should initially be a warning rather than a hard rejection until real fixtures establish safe tolerance.

Partial rows must not silently enter pace statistics.

---

## 5. Runtime versus pace

This distinction is non-negotiable.

### Runtime eligibility

Runtime answers: "How long did the selected run take?"

```text
raw_runtime = sum(full timed lap times inside selected runtime scope)
```

- `Clean` does not affect runtime.
- Pit-in/pit-out laps remain part of runtime when they are part of the selected run.
- Partial setup/output rows outside the run do not count.
- The selected stint set defines the runtime scope.
- Each selected stint uses its full timed-lap range.

### Pace eligibility

Default pace mode:

```text
pace_eligible =
  full_timed_lap
  AND in_selected_scope
  AND clean == true
  AND pit_in == false
  AND pit_out == false
```

Optional exploratory mode:

```text
all_non_pit =
  full_timed_lap
  AND in_selected_scope
  AND pit_in == false
  AND pit_out == false
```

The selected mode must be visible in the UI and exports.

---

## 6. Clean-lap percentage

Do not use pit or partial laps in the denominator.

Default:

```text
denominator = all full timed non-pit laps in selected pace scope
numerator   = denominator laps where Clean == true

clean_pct = numerator / denominator
```

Always show:

- numerator;
- denominator;
- percentage.

`Clean` describes Garage 61 lap cleanliness. It is not a penalty count.

---

## 7. Penalties

### Critical rule

**Never infer black flags or penalties from `Clean = 0`.**

MVP penalty source is manual unless a future import format exposes a genuine, explicit penalty field.

UI:

Global:

- seconds per penalty; default `1.000`

Per driver:

- penalty count;
- optional direct penalty-seconds override;
- penalty source: `none | manual | imported`

Calculations:

```text
penalty_seconds =
  direct_override
  OR penalty_count × seconds_per_penalty

adjusted_runtime =
  raw_runtime + penalty_seconds
```

Leaderboard:

- rank ascending by adjusted runtime;
- gap = adjusted runtime − leader adjusted runtime.

Show raw runtime and penalty separately.

---

## 8. Stint detection

Build suggested stint groupings from:

- `Run`;
- `Pit out`;
- `Pit in`;
- chronological order;
- lap number.

Do not assume `Run` alone always maps perfectly to a fuel stint.

Represent:

- stint index;
- out-lap;
- representative laps;
- in-lap;
- start/end lap;
- pace-eligible count.

Allow the user to select any non-empty stints. The user can select all stints.

---

## 9. Required analytics

Use `simple-statistics`.

For each driver's eligible lap times:

- count;
- best;
- arithmetic mean;
- median;
- population standard deviation;
- median absolute deviation;
- interquartile range;
- min/max/range.

### Why population SD

The app describes the dispersion of the complete selected run sample rather than estimating an unseen population. Therefore the user-facing default is population SD.

---

## 10. Sector statistics

For every driver × sector:

```ts
type SectorStats = {
  n: number;
  bestUs: number | null;
  meanUs: number | null;
  medianUs: number | null;
  sdUs: number | null;
  madUs: number | null;
  iqrUs: number | null;
  rangeUs: number | null;
  pctWithin100msOfMedian: number | null;
  pctWithin200msOfMedian: number | null;
  pctWithin500msOfMedian: number | null;
  outlierCountIqr: number;
};
```

Also compute best-to-worst range and Q1/Q3 if useful for details.

---

## 11. Sector benchmarks

For each sector:

```text
best_mean   = minimum driver mean
best_median = minimum driver median
best_single = minimum driver best
```

For every driver:

```text
gap_to_best_mean   = driver_mean   − best_mean
gap_to_best_median = driver_median − best_median
gap_to_best_single = driver_best   − best_single
```

A benchmark leader displays `0.000`.

User can switch primary benchmark:

- Average
- Median
- Best

Median should be the recommended "representative pace" view.

---

## 12. Theoretical best lap

```text
theoretical_best =
  sum(personal best eligible sector for every sector)
```

Label clearly as theoretical, not an actual lap.

```text
execution_gap =
  best_actual_lap − theoretical_best
```

This indicates how much demonstrated sector potential was not combined into one lap.

---

## 13. Consistency

Required per sector:

- population SD;
- MAD;
- IQR;
- range;
- % within +0.100 s of personal median;
- % within +0.200 s;
- % within +0.500 s.

### Outliers

Use the IQR rule for informational flags:

```text
lower = Q1 - 1.5 × IQR
upper = Q3 + 1.5 × IQR
```

Do **not** automatically remove outliers from the default mean/SD.

Median/MAD are the robust alternative.

This matters because a `Clean = 1` lap can still contain a non-representative slowdown.

---

## 14. Driver factual flags

Generate deterministic observations, not AI coaching.

Examples:

- closest median sector to benchmark;
- largest median deficit;
- highest-SD sector;
- sector where best is close to benchmark but median is much worse;
- sector lead(s);
- best actual vs theoretical execution gap.

Safe wording:

> S7 has the driver's largest median deficit (+0.264 s) and highest sector SD.

Do not infer corner technique from sector XLSX data.

---

## 15. Stint progression

For every selected stint:

- lap index;
- lap time;
- delta to stint median;
- each sector delta to driver sector median;
- fuel level if present.

Display pace progression, not claimed tyre degradation.

---

## 16. Data-quality warnings

Warn when:

- different selected runtime lengths;
- different pace sample sizes;
- `n < 3` for sector statistics;
- one driver uses a partial stint while others use a full run;
- sector counts differ;
- missing clean flag;
- missing sector;
- duplicate file;
- suspicious partial row;
- selected sessions appear to have materially different conditions.

Do not block exploratory analysis unless data structures are incompatible.

---

## 17. Duplicate detection

Hash input file bytes using browser `crypto.subtle.digest("SHA-256", ...)`.

Do not import identical content twice.

Filename alone is not sufficient.

---

## 18. Canonical report object

All UI views and exports consume one derived object:

```ts
type AnalysisReport = {
  schemaVersion: '1.0';
  generatedAt: string;
  configuration: AnalysisConfig;
  methodology: Methodology;
  sources: SourceSummary[];
  warnings: AnalysisWarning[];

  leaderboard: LeaderboardRow[];
  drivers: DriverAnalysis[];
  sectors: SectorAnalysis[];
  stints: StintAnalysis[];
  lapAudit: LapAuditRow[];
};
```

Never independently recalculate report values inside the XLSX or Markdown exporters.

---

# Product UI

## 19. Main flow

```text
Upload
  ↓
Review driver scope
  ↓
Overview | Leaderboard | Sectors | Consistency | Drivers | Audit
  ↓
Export
```

One primary React application; tab navigation is internal state, not SPA routes.

### Header

- Stint Analyzer wordmark;
- icon-only GitHub source link;
- System/Light/Dark icon toggle;

The source card has no reset action. Each processed file keeps one remove action. Export belongs beside the analysis views heading. Keep local processing as one factual footer statement: `All workbook data stays in your browser.`

Do not show login, signup, profile, workspace, sync, save-to-cloud, or account controls.

### Upload

Drag/drop multiple `.xlsx`.

File rows show:

- basename and status;
- a collapsed `File information` disclosure with Driver name, Track, and Car;
- warnings in a separate collapsed disclosure;
- parsing state;
- a single-file remove action after processing.

### Scope review

Show one source-card-styled card per imported driver.

Driver cards show:

- driver name;
- lap count;
- timed-lap count;
- selected runtime-lap count;
- eligible pace-lap count.

Do not show source filenames or workbook row counts in driver cards. Merge stints from all files for the same driver. Keep source identity in internal audit data.

Controls:

- one select-like multi-stint picker per driver;
- `All stints` as the first option;
- only stints with at least one full timed lap;
- one global pace mode: clean non-pit or all non-pit.

Use the full timed-lap range for every selected stint. Disable the global pace control before a file is imported.

### Penalty editor

- seconds per count;
- count per driver;
- override seconds.

Explicit text:

> Garage 61 `Clean` is not used as a penalty count.

---

## 20. Overview

Show:

- driver count;
- source file count;
- selected runtime laps;
- eligible clean pace laps;
- fastest best lap;
- fastest median lap;
- warning count.

Include:

- compact leaderboard;
- lap pace progression chart;
- sector leader summary.

---

## 21. Leaderboard

Columns:

- Pos
- Driver
- Raw runtime
- Penalty count
- Penalty seconds
- Adjusted runtime
- Gap
- Clean laps
- Clean %
- Best lap
- Median lap

---

## 22. Sector screen

Controls:

- Benchmark: Average | Median | Best
- Pace mode
- Driver selection

Primary matrix:

```text
| Sector | Fastest benchmark | Driver A | Driver B | ... |
```

Driver cells are signed gaps.

Sector detail table:

- Driver
- N
- Best
- Mean
- Median
- SD
- MAD
- IQR
- Gap

Optional supporting chart:

- sector time over lap index.

---

## 23. Consistency screen

Metric selector:

- SD
- MAD
- IQR
- Range

Matrix:

- sector rows;
- driver columns.

Also show:

- most/least consistent sector;
- mean SD;
- mean MAD;
- outlier count.

Lower is better.

---

## 24. Driver detail

Summary:

- best;
- mean;
- median;
- SD;
- clean %;
- theoretical best;
- execution gap.

Sector table:

- best;
- mean;
- median;
- SD;
- MAD;
- gap to best median;
- rank.

Rule-based factual observations.

Lap progression chart.

---

## 25. Audit

Use TanStack Table.

Columns:

- Driver
- Source file
- Run
- Lap
- Lap time
- Clean
- Pit in
- Pit out
- Runtime eligible
- Pace eligible
- Exclusion reason
- Fuel
- S1 ... SN

This screen is essential for trust.

---

# Export specification

## 26. Required exports

- `.xlsx`
- `.md`
- `.json`

Filename pattern:

```text
garage61-analysis-YYYY-MM-DD-HHmm.ext
```

---

## 27. Excel workbook

Use `write-excel-file`.

Create:

1. `Overview`
2. `Leaderboard`
3. `Sector Summary`
4. `Sector Matrix Median`
5. `Sector Matrix Average`
6. `Best Sectors`
7. `Stints`
8. `Lap Audit`
9. `Methodology`

### Leaderboard sheet

Store both exact numeric seconds and formatted values.

Suggested columns:

- Position
- Driver
- Raw Runtime Seconds
- Raw Runtime
- Penalty Count
- Penalty Seconds
- Adjusted Runtime Seconds
- Adjusted Runtime
- Gap Seconds
- Gap
- Clean Laps
- Eligible Non-Pit Laps
- Clean %
- Best Lap Seconds
- Mean Lap Seconds
- Median Lap Seconds
- Lap SD Seconds
- Theoretical Best Seconds

### Sector Summary sheet

Long format: one driver × sector per row.

Columns:

- Driver
- Sector
- N
- Best
- Mean
- Median
- SD
- MAD
- IQR
- Range
- Gap to Best Mean
- Gap to Best Median
- Gap to Best Single
- % within 0.100
- % within 0.200
- % within 0.500
- IQR Outliers

### Audit sheet

One row per normalized lap, including source, flags and all sectors.

### Methodology sheet

Define:

- runtime scope;
- clean %;
- pace eligibility;
- penalty source;
- benchmark;
- population SD;
- MAD;
- IQR;
- outliers;
- theoretical lap.

Use numeric cells for exact data and formatting only for presentation.

---

## 28. Markdown export

Two modes:

### Summary

Optimized for LLM interpretation.

### Full

Adds the complete lap audit.

Use deterministic ordering and exact section names.

Required structure:

```markdown
---
schema_version: '1.0'
report_type: 'garage61-stint-analysis'
generated_at: '...'
pace_mode: 'clean-non-pit'
benchmark_default: 'median'
penalty_seconds_per_count: 1
---

# Garage 61 Stint Analysis

## Analysis scope

## Data quality and warnings

## Leaderboard

## Driver overview

## Sector benchmark — median

## Sector benchmark — average

## Best sectors and theoretical laps

## Sector consistency

## Stint progression summary

## Driver detail

## Methodology

## Machine-readable compact data
```

In Full mode add:

```markdown
## Lap audit
```

### LLM-friendly compact data

At the bottom of Summary mode, embed a JSON code block containing:

- exact leaderboard seconds;
- exact lap stats;
- per-driver/sector best, mean, median, SD, MAD and gaps;
- warnings;
- methodology.

Do not include raw lap audit in the Summary compact JSON.

Reason: an LLM gets readable Markdown plus exact typed numbers without needing to reverse-engineer formatted times.

---

## 29. Standalone JSON export

Schema-versioned exact report.

Rules:

- snake_case or consistently documented property naming;
- durations in numeric seconds;
- `null`, never NaN/Infinity;
- source basenames only;
- deterministic structure.

Suggested top level:

```json
{
  "schema_version": "1.0",
  "report_type": "garage61-stint-analysis",
  "generated_at": "...",
  "configuration": {},
  "methodology": {},
  "warnings": [],
  "leaderboard": [],
  "drivers": [],
  "sectors": [],
  "stints": [],
  "lap_audit": []
}
```

Validate before download.

---

## 30. Persistence and lifecycle

The app does not need to retain a session after refresh.

Default lifecycle:

```text
File objects -> normalized in-memory data -> AnalysisReport -> export
```

After reset, refresh, tab close or browser close, imported data and analysis may disappear.

Do not automatically store source workbooks or normalized analysis in IndexedDB/localStorage.

LocalStorage may be used only for harmless UI preferences such as:

- theme;
- default benchmark;
- table density;

and must not contain session data, driver data, lap data, filenames, or analysis results.

Exports are the intended persistence layer.

## 31. Export validation

Before any export:

- no non-finite numbers;
- all leaderboard drivers exist in driver analysis;
- sector layouts agree;
- adjusted = raw + penalty;
- leader gap = zero;
- benchmark gaps are non-negative within tiny numeric tolerance;
- methodology present.

If invalid, block export and display a useful error.
