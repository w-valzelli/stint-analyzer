# Matter-of-fact dark theme — Implementation plan

**Spec:** Standalone — this plan defines the revised visual behavior.

## Goal

Reduce decorative and privacy-forward UI language. Keep the analysis task primary. Add a dark theme that follows the same restrained system.

The result keeps the existing ruled layout, typography, signal colors, import flow, and analysis semantics. It removes visual elements that do not help a user import, review, or compare data.

## Requirements

- **REQ-01 — Direct header:** Show a two-line uppercase Stint Analyzer wordmark, an icon-only GitHub source link, and the theme control. Remove the lock icon, status dot, `Local / ephemeral` header label, and header export action.
- **REQ-02 — Direct import surface:** Remove the standalone source-card topline and footer. Use `Source files` as the main heading with its state subtitle. Remove `Comparison sheet`, `G61 / 001`, and the Waypoints icon. Preserve the subtle paper and registration texture as a functional source-card material.
- **REQ-03 — Direct copy:** Use functional labels such as `Source files`, `Reading workbooks`, and `Choose one or more Garage 61 files`. Do not repeat privacy claims in the header, import copy, or status rows.
- **REQ-04 — Small privacy statement:** Keep one factual footer statement: `All workbook data stays in your browser.` Do not show account, upload, sync, or ephemeral messaging as a primary product benefit.
- **REQ-05 — Functional ornament only:** Remove the numbered workflow strip, Waypoints icon, decorative panel rule, and diagonal panel mask. Keep the source-card paper texture, FileSpreadsheet import icon, needed file-status icons, Export/remove icons, audit ShieldCheck icon, theme icons, focus indicators, warning colors, tables, rules, and semantic empty states.
- **REQ-06 — Preserve product truth:** Keep runtime and pace separation, penalty semantics, source warnings, auditability, local file processing, and all existing import behavior. Do not repeat runtime, pace, or penalty methodology in the empty-state source card.
- **REQ-07 — Theme behavior:** Default to the operating system preference. Provide an accessible `System`, `Light`, and `Dark` control. Persist only the selected theme preference.
- **REQ-08 — No data persistence:** Never store workbooks, filenames, normalized laps, reports, penalties, or analysis history in browser storage.
- **REQ-09 — Dark palette:** Use dark graphite/slate surfaces with the same tonal hierarchy as the light paper surfaces. Keep cobalt for active states, vermilion for attention, ochre for secondary warnings, and moss for readiness. Do not use pure black, glow, neon, or gradients.
- **REQ-10 — Documentation alignment:** Record the revised visual direction, theme tokens, removed chrome, and privacy copy placement in the durable design documentation.
- **REQ-11 — Stacked import rows:** Render each imported file row at full width. Show the filename and any needed status icon on the first line, omit the useless `Ready` label, show Driver name, Track, and Car inside a collapsed `File information` disclosure, and put parser warnings inside a separate native disclosure that stays closed by default. Keep duplicate, error, and rejection recovery messages visible.
- **REQ-12 — Control placement:** Remove the source-card topline. Place Export report in the analysis views section beside its heading. Keep Export out of the header and provide no global reset control.
- **REQ-13 — Per-file removal:** Add an icon-only destructive remove action to each terminal file row. Center it vertically against the row. Removing a ready file removes its row and matching workbook. Removing a duplicate, error, or rejected row removes only that row. Disable removal while hashing or parsing.
- **REQ-14 — Site identity:** Name the site and product `Stint Analyzer`. Use a plain, more prominent two-line uppercase `STINT / ANALYZER` wordmark without a square badge. Use `Garage 61` only when identifying the supported workbook export and source format. Do not use a `G61` or `SA` mark or Garage 61 as the site brand.
- **REQ-15 — Source link:** Place an icon-only GitHub link beside the theme button. Link to `https://github.com/w-valzelli/stint-analyzer`, open it in a new tab, and expose `View source on GitHub` through its accessible label and title.

## Context

- The primary surface is an Astro page with one hydrated React analyzer in `src/components/AnalyzerShell.tsx`.
- The current visual system is documented in `DESIGN.md` as `The Calibration Ledger`.
- Most visual rules live in `src/styles/global.css`.
- `ImportRegister` owns the file drop area and file-status rows.
- The repository permits local storage for harmless theme preferences only.
- The user selected System + toggle behavior. Use one compact icon button. With no stored preference, it starts in System mode and cycles `System → Light → Dark → System`.
- CSS class names may keep the `calibration-` prefix to avoid unrelated refactoring. User-facing copy and documented visual rules must use the revised language.

## Prerequisites

- External gates: None.
- Working directory: `/Users/williamvalzelli/Repos/w-valzelli/stint-analyzer`.
- Baseline: Run `pnpm lint`, `pnpm check`, `pnpm test`, and `pnpm build` before implementation. Record any pre-existing failure before changing code.

## Existing system to reuse

- `AnalyzerShell` for the header, import surface, footer, analysis tabs, and control placement.
- `ImportRegister` for local XLSX selection, hashing, parsing, status rows, and per-file removal.
- The existing Button and Tabs primitives.
- CSS custom properties in `src/styles/global.css` as the single visual token source.
- Astro's static document head and the existing React island.
- Vitest, Testing Library, and Playwright fixtures already used by the repository.

## Files

- `src/components/AnalyzerShell.tsx` (modify) — simplify header, hero copy, import surface, empty analysis panel, and footer; use the Stint Analyzer wordmark and GitHub source link; add the theme control; place Export in the analysis views section.
- `src/components/ThemeControl.tsx` (create) — provide the accessible System/Light/Dark control and own only the theme preference state.
- `src/lib/theme.ts` (create) — define the Stint Analyzer theme preference type, storage key, system resolution, and safe DOM application helpers.
- `src/features/import/ImportRegister.tsx` (modify) — replace metaphor-heavy and repeated privacy copy with direct file-processing labels. Render stacked full-width source rows with a closed-by-default warning disclosure and a small terminal-row remove action. Keep parser behavior unchanged and update the import handle state coherently.
- `src/pages/index.astro` (modify) — use Stint Analyzer page metadata, add a small pre-hydration theme initializer, and update the emitted design contract comment to describe the matter-of-fact direction.
- `src/styles/global.css` (modify) — preserve light tokens, add semantic dark overrides, theme browser surfaces, remove decorative masks and ornaments, and style the theme control.
- `tests/unit/analyzer-shell.test.tsx` (modify) — assert the Stint Analyzer mark, direct footer statement, theme control, removal of the header privacy status, and control placement.
- `tests/unit/import-register.test.tsx` (modify) — update direct status and accessible-label assertions while preserving import assertions.
- `tests/unit/theme.test.tsx` (create) — test preference parsing, system resolution, safe storage behavior, DOM theme application, and the icon button.
- `tests/e2e/shell.spec.ts` (modify) — verify Stint Analyzer branding, the direct footer statement, absent header status, control placement, and theme switching.
- `tests/e2e/import.spec.ts` (modify) — update source-surface copy assertions and verify the import workflow remains usable.
- `DESIGN.md` (modify) — document Stint Analyzer as the site identity, replace the privacy-status and decorative calibration rules with the revised `Working Record` direction, component rules, and light/dark token mappings.
- `docs/01_PRODUCT_DATA_EXPORT_SPEC.md` (modify) — name Stint Analyzer as the product, identify Garage 61 only as the supported input format, and change the header requirement from a prominent privacy status to a small factual local-processing statement.
- `docs/03_IMPLEMENTATION_PLAN.md` (modify) — remove the old primary privacy copy requirement and describe the revised footer placement.
- `docs/DECISIONS.md` (modify during implementation) — record the accepted matter-of-fact visual direction and theme preference storage decision.
- `.impeccable/surfaces/src-pages-index-astro.md` (modify during implementation) — update the route brief because the chosen visual direction and Stint Analyzer identity change materially.
- `PRODUCT.md` (modify) — set Stint Analyzer as the product name and keep Garage 61 as the input format reference.
- `README.md` (modify) — use Stint Analyzer as the site name while retaining Garage 61 source-format references.
- `START_HERE.md` (modify) — align the handoff title and site identity.
- `THIRD_PARTY_NOTICES.md` (modify) — align the product name in the notice heading.

## Implementation notes

1. **Inventory the current language before editing.** Replace user-facing uses of `register`, `comparison sheet`, `G61 / 001`, and repeated privacy claims only where they describe presentation. Keep internal component and domain names when they do not affect the interface.
2. **Simplify the first viewport.** Keep the main thesis, direct lede, import control, detected-source table, and analysis tabs. Remove the workflow strip, meaningless identifiers, Waypoints icon, source-card readouts, and diagonal panel treatment. Keep the low-contrast paper and registration texture inside the source card behind its content.
3. **Keep evidence visible.** Keep the FileSpreadsheet import icon and needed file-status icons because they communicate the import action and checking, duplicate, warning, and rejection states. Keep ShieldCheck beside audit evidence, Download beside Export, and X beside each remove action. Keep the source metadata and recovery messages because they support trust and recovery. Place file information and parser warnings in native `<details>` elements with summaries such as `File information` and `Warnings (2)`. Do not add the `open` attribute. Keep duplicate, error, and rejection messages outside the warning disclosure.
4. **Use one privacy sentence.** Render `All workbook data stays in your browser.` in the footer. Remove equivalent sentences from the header, hero paragraph, drop zone, and file status rows. The product remains local-only; the interface stops selling that constraint.
5. **Use semantic theme tokens.** Keep the light values unchanged unless contrast testing requires a correction. Add `[data-theme='dark']` token overrides for the application ground, quiet panel, active sheet, ink, secondary ink, muted text, rules, signals, shadow, and source-card texture. Set `color-scheme` to the resolved theme.
6. **Use slate, not black.** Start the dark palette with a dark graphite ground, a slightly lighter quiet panel, and a lighter active sheet. Brighten signal colors only enough to meet contrast. Do not add gradients, glow, texture, or a second design language.
7. **Prevent theme flash.** Add an inline script in the document head. It reads the theme preference key, resolves `system` with `matchMedia`, applies `data-theme` to `<html>`, and fails safely when storage is unavailable. It must not read or write analysis data.
8. **Handle system changes.** When the preference is `system`, update the resolved theme when the operating system preference changes. Do not override an explicit `light` or `dark` selection.
9. **Keep the control matter-of-fact.** Use one compact icon button with Lucide `Monitor`, `Sun`, and `Moon` icons. Cycle `System → Light → Dark → System`. Expose the current and next mode in the accessible label, such as `Theme: System. Switch to Light`. Use a title for pointer users. Do not use a pill or tooltip dependency.
10. **Update the contract, not the product promise.** The page contract should describe a direct source-review interface. It must still state that analysis happens locally and that the user can trace results to source laps, but it must not make privacy the visual thesis.
11. **Document the revised system after implementation.** `DESIGN.md` should name the new direction, describe the retained ruled surfaces and typography, define the dark palette, and prohibit ornamental identifiers, decorative grid masks, and repeated privacy chrome.
12. **Place controls by task.** Keep only the two-line uppercase Stint Analyzer wordmark, GitHub source link, and theme control in the header. Remove the source-card topline. Put Export report beside the analysis-view heading. Do not add a global reset control.
13. **Remove one file at a time.** Keep removal state inside `ImportRegister`. Render the action as an icon-only destructive button centered against the row. Omit visible `Ready` text. Remove the matching parsed workbook by `source.id` for a ready row. Remove only the row for duplicate, error, or rejected records. Disable the action while hashing or parsing so late progress events cannot restore a row.
14. **Separate site identity from input identity.** Use `Stint Analyzer` in the document title, plain wordmark, accessible labels, footer, and product documents. Make the wordmark more prominent than the surrounding metadata. Keep `Garage 61` in copy only when it identifies the workbook format or source export. Use no square badge or initials mark.
15. **Preserve the pre-hydration choice.** Render `system` as the stable initial React preference. Initialize the stored preference after mount and apply it without overwriting the theme already set by the head script. Use the `stint-analyzer-theme` storage key.

## New architectural surface

- `ThemeControl` and `theme.ts` add one small client-only preference owner. This is required for the selected System/Light/Dark behavior and does not own analysis data.
- No new dependency, store, route, persistence layer, server path, or parallel visual implementation.

## Acceptance criteria

- [ ] **AC-01:** The header contains no lock icon, readiness dot, `Local / ephemeral` label, or equivalent privacy status block.
- [ ] **AC-02:** The import surface uses direct source-file language and contains no `Comparison sheet`, `G61 / 001`, or Waypoints icon. Its subtle paper and registration texture remains behind the content in Light and Dark modes.
- [ ] **AC-03:** The page contains one visible local-processing statement in the footer and no repeated privacy-first copy in the header, hero, drop zone, or status rows.
- [ ] **AC-04:** The first viewport keeps the import action, detected source table, analysis tabs, and actionable parser feedback.
- [ ] **AC-05:** File selection, duplicate detection, parser warnings, tabs, per-file removal, and source metadata behave as implemented.
- [ ] **AC-06:** The default resolved theme follows the operating system when no preference exists.
- [ ] **AC-07:** The theme control switches between System, Light, and Dark without a page reload.
- [ ] **AC-08:** The selected theme preference survives reload. No analysis data survives through the theme mechanism or browser storage.
- [ ] **AC-09:** System mode responds to operating system theme changes. Explicit Light and Dark modes do not respond to system changes.
- [ ] **AC-10:** Light and dark views preserve the same layout, type hierarchy, state meaning, focus visibility, and component vocabulary.
- [ ] **AC-11:** Body text and interactive text meet 4.5:1 contrast. Large text meets 3:1 contrast. Signal colors are not the only state channel.
- [ ] **AC-12:** `DESIGN.md`, the surface brief, product UI requirements, and the implementation plan describe the revised visual direction and footer privacy placement.
- [ ] **AC-13:** Each imported file row uses the full available width, shows the filename and needed status first, shows Driver name, Track, and Car in a collapsed `File information` disclosure, and keeps parser warnings collapsed by default.
- [ ] **AC-14:** Duplicate, error, and rejection recovery messages remain visible without opening the warning disclosure.
- [ ] **AC-15:** Export report appears in the analysis views section and does not appear in the header or source card.
- [ ] **AC-16:** Removing one terminal file row removes only that file's data, updates counts immediately, and leaves other imported files available.
- [ ] **AC-17:** Hashing and parsing rows do not expose an enabled remove action.
- [ ] **AC-18:** The visible site identity is a plain, prominent Stint Analyzer wordmark in the header, plus matching document title, accessible labels, footer, and product documents. No square badge or initials mark appears. Garage 61 appears only as the supported source format.
- [ ] **AC-19:** The theme control is one icon button. It starts in System mode without stored preference, cycles System/Light/Dark, exposes current and next mode accessibly, and updates the resolved theme immediately.
- [ ] **AC-20:** The header uses a two-line uppercase Stint Analyzer wordmark without a square badge.
- [ ] **AC-21:** The source card has no standalone topline. Its `Source files` title and state subtitle appear without a global reset control.
- [ ] **AC-22:** Ready file rows show no `Ready` text. Each terminal row has a vertically centered, icon-only destructive remove button with an accessible label.
- [ ] **AC-23:** The header contains an icon-only GitHub source link beside the theme control. It has the required accessible label, title, new-tab target, and repository URL.
- [ ] **AC-24:** The source card has no `Clean is not a penalty`, `Runtime and pace stay separate`, or equivalent methodology footer text.

## Verification

- [ ] `pnpm lint` from the repository root passes.
- [ ] `pnpm check` from the repository root passes.
- [ ] `pnpm test` from the repository root passes.
- [ ] `pnpm e2e` from the repository root passes.
- [ ] `pnpm format` from the repository root passes.
- [ ] `pnpm build` from the repository root passes.
- [ ] `BASE_PATH=/garage61-analyzer pnpm build` passes and serves assets under `/garage61-analyzer/`.
- [ ] Unit tests cover preference parsing, system resolution, storage failure, DOM application, and theme control behavior.
- [ ] Playwright covers default system resolution, explicit theme switching, reload persistence, the GitHub source link, and the existing XLSX import flow.
- [ ] Playwright or a manual browser pass checks light and dark at desktop and mobile widths. Check header, import surface, file rows, tables, tabs, focus rings, selection, scrollbar, disabled buttons, warnings, and footer.
- [ ] Run the Impeccable detector once after UI changes:
      `node vendor/impeccable/.agents/skills/impeccable/scripts/detect.mjs --json src/components/AnalyzerShell.tsx src/components/ThemeControl.tsx src/features/import/ImportRegister.tsx src/pages/index.astro src/styles/global.css`.
- [ ] Review the built page under the repository base path. Confirm that no workbook bytes, filenames, driver data, or lap data enter browser storage or network requests.

## Out of scope

- No analysis calculations, parsing rules, report schema, export behavior, or domain model changes.
- No account, upload service, telemetry, analytics, cloud persistence, or session history.
- No new font family, large UI framework, component library, or state-management dependency.
- No full redesign of the product information architecture.
- No removal of functional parser statuses, source metadata, warnings, audit language, or runtime/pace methodology. Per-file removal is limited to the explicit row action. The source-card paper texture and meaningful state/action icons remain in scope as retained materials.
- No renaming of internal parser identifiers that accurately describe Garage 61 workbook compatibility.
