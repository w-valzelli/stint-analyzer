# Stint Analyzer — Codex handoff

This directory is intended to be dropped into a new repository and handed to an autonomous coding agent.

## Start

Read:

1. `AGENTS.md`
2. every file in `docs/` in numeric order

Then execute the milestones in `docs/03_IMPLEMENTATION_PLAN.md`.

## Target

A static Astro + React GitHub Pages application that locally analyzes multiple Garage 61 `.xlsx` files and exports `.xlsx`, LLM-friendly `.md`, and exact `.json` reports.

The product is deliberately **accountless, backend-free and ephemeral**:

`drop files -> analyze locally -> export -> do whatever you want with the output`

No signup, login, profiles, cloud history, team workspace, remote save, or cross-device persistence is part of the product. Refreshing/closing the page may discard the current analysis.

## Important semantic rules

- Garage 61 `Clean = 0` is **not** an actual penalty.
- Runtime includes selected timed race/run laps, including pit laps where appropriate.
- Pace statistics default to clean, non-pit, full timed laps.
- Raw telemetry analysis is not MVP.

## Agent behavior

Work independently, prefer documented defaults over blocking questions, and record non-trivial choices in `docs/DECISIONS.md`.

The final gate is `docs/04_TESTING_ACCEPTANCE.md`.
