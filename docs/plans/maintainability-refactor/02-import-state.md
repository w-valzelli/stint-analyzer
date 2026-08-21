# Unit 02 — Single ordered import state

**Spec:** `../../specs/maintainability-refactor.md`  
**Index:** `./index.md`

## Goal

Represent every selected file through one ordered, discriminated record flow so a
human maintainer can trace hashing, parsing, validation, success, failure, and removal
without reconciling parallel collections or mutable result maps.

## Requirements

- Preserve concurrency, stable input order, duplicate semantics, progress feedback,
  parser warnings, same-track rejection, stale-batch protection, and removal behavior.
- A ready import record owns its parsed workbook; accepted workbooks are derived.
- Keep import state local to the feature and add no state library.

## Context

- `importWorkbookFiles` currently emits progress events and separately returns parsed,
  duplicate, and failure arrays.
- `ImportRegister` currently maintains records and workbooks separately and reconstructs
  parsed results through `pendingParsedByIndex`.
- Same-track validation currently occurs in the React component after parsing.
- `AnalyzerShell` consumes `ImportRegisterState.workbooks`; that public component
  contract can remain while its value becomes derived.

## Prerequisites

- Prior unit: Unit 01 completed and its full quality gate passing.
- External gates: None.
- Working directory: repository root.
- Baseline: `pnpm test` and `pnpm build` pass after Unit 01.

## Existing system to reuse

- `hashFiles` stable ordered hashing behavior.
- `Garage61ParseError`, `parseWorkbookFile`, and normalized workbook models.
- `react-dropzone` rejection handling.
- Existing ImportRegister status labels, messages, markup, and component callback.
- Existing domain and component import tests.

## Files

- `src/domain/parsing/imports.ts` (modify) — define ordered discriminated final results,
  keep progress events, and apply same-track validation in the domain workflow.
- `src/features/import/ImportRegister.tsx` (modify) — use one record collection, derive
  workbooks, and remove the mutable parsed-result reconstruction path.
- `src/components/AnalyzerShell.tsx` (modify only if the import state contract can be
  simplified without broadening scope) — continue consuming derived ready workbooks.
- `tests/unit/imports.test.ts` (modify) — cover ordered results, duplicates, failures,
  track compatibility, and deliberately out-of-order async completion.
- `tests/unit/import-register.test.tsx` (modify) — cover one-record transitions,
  derived workbooks, stale batches, warnings, rejection, mismatch, and removal.
- `tests/unit/analyzer-shell.test.tsx` (modify only if its import-state fixture changes)
  — preserve shell integration.
- `tests/e2e/import.spec.ts` (modify only if additional observable ordering coverage is
  needed) — retain the complete browser import path.

## Implementation notes

1. Define final per-input results as a discriminated union with stable index, identity,
   filename, hash where available, status, and status-specific data. A ready result
   contains its parsed workbook; duplicate and failure results contain their current
   reason/message.
2. Keep progress events discriminated and keyed by the same stable input index. They
   update the same UI record that receives the final result.
3. Preserve concurrent hashing/parsing, but store results by input index rather than
   completion order. Apply same-track acceptance deterministically in original input
   order against existing ready workbooks and earlier accepted results from the batch.
4. Pass the domain workflow the existing ready workbooks it needs for duplicate and
   track validation. Do not make the component call `trackMismatchMessage`.
5. In `ImportRegister`, use one state collection and centralized functional updates or
   a local React reducer. Do not add a second source of state. Derive `workbooks` from
   records with ready status when invoking `onStateChange`.
6. Preserve the batch token/ref only for stale asynchronous completion protection.
   Remove `pendingParsedByIndex` and any fallback that guesses parsed-result indices.
7. Build accepted and rejected dropzone records into the same collection while keeping
   their current messages and removal rules.
8. Add a domain test in which file operations resolve in a different order than input;
   assert every status and workbook remains paired with the correct index and filename.
9. Run focused component and domain tests before the full unit gate.

## New architectural surface

- One discriminated import-result/record model shared across the domain workflow and UI
  boundary, required to replace the current parallel result representations.

There is no new state owner, global store, state-machine framework, or dependency.

## Acceptance criteria

- [ ] AC-5: One ordered discriminated record model drives import behavior and no
      mutable pending parsed-workbook map remains.
- [ ] AC-6: Deliberately out-of-order completion preserves correct file/result pairing.
- [ ] AC-16: The unit quality gate passes.

## Verification

- [ ] `pnpm exec vitest run tests/unit/hash.test.ts tests/unit/imports.test.ts tests/unit/import-register.test.tsx tests/unit/analyzer-shell.test.tsx`
      from the repository root → all import and shell tests pass.
- [ ] `rg -n "pendingParsedByIndex|setWorkbooks" src/features/import/ImportRegister.tsx`
      → no parallel parsed-workbook state or reconstruction remains.
- [ ] `rg -n "trackMismatchMessage" src/features/import` → the React feature does not
      apply the domain track policy.
- [ ] `pnpm lint` → pass.
- [ ] `pnpm check` → zero diagnostics.
- [ ] `pnpm test` → all tests pass.
- [ ] `pnpm build` → production build passes.

## Out of scope

- Changing accepted file types, concurrency limits, validation messages, or track
  compatibility policy.
- Moving import state to Zustand or persisting it across refreshes.
- Adding cancellation UI or background workers.
