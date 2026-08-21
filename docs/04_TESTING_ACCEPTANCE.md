# 04 — Testing and final acceptance

## 1. Test layers

Use:

1. domain unit tests;
2. React component/integration tests;
3. Playwright E2E tests.

Domain correctness is the priority.

---

## 2. Parser tests

Cover:

- exact session sheet name;
- fallback sheet detection by headers;
- header case/whitespace normalization;
- dynamic sector discovery;
- Excel time conversion;
- partial lap 0;
- trailing partial;
- non-numeric sector placeholder;
- clean flag;
- pit in/out;
- fuel fields;
- missing optional fields;
- unrelated workbook rejection;
- duplicate hash detection.

---

## 3. Eligibility tests

Explicitly prove:

- clean non-pit full lap -> pace eligible;
- clean pit-in -> pace ineligible;
- clean pit-out -> pace ineligible;
- unclean non-pit -> excluded in default pace;
- unclean non-pit -> included in exploratory all-non-pit;
- pit laps can still be runtime eligible;
- Clean does not affect runtime;
- Clean does not create penalties.

---

## 4. Analytics unit tests

Use small hand-checkable arrays.

Test:

- mean;
- median;
- population SD;
- MAD;
- IQR;
- range;
- IQR outlier flags;
- % within median bands;
- theoretical best;
- execution gap;
- best mean/median/single benchmark;
- sector gaps;
- ties;
- missing sample behavior.

Use tolerances only where floating conversion requires it.

---

## 5. Leaderboard tests

Test:

- runtime sum;
- 0 penalty default;
- manual count;
- global seconds-per-penalty;
- direct seconds override;
- adjusted order;
- leader gap 0;
- other gaps;
- tie deterministic ordering.

Required regression:
two identical datasets differing only in `Clean` flags must have identical penalty values until manual penalty input changes.

---

## 6. Synthetic XLSX fixture

Commit synthetic, non-private fixtures mimicking Garage 61.

Fixture should include:

- 3 drivers;
- 7 sectors;
- at least 2 stints;
- pit-in/out;
- clean/unclean;
- lap 0 partial;
- trailing fragment;
- statistical outlier marked clean;
- fuel progression.

Prefer a fixture generator plus generated committed fixtures if stable.

Do not commit private real session files unless explicitly approved.

---

## 7. Golden expected report

Create an expected report fixture with known values.

Do not rely only on giant snapshot equality.

Assert important fields directly:

- runtime seconds;
- clean numerator/denominator;
- clean %;
- best lap;
- median;
- mean;
- SD;
- MAD;
- sector gaps;
- theoretical best;
- penalties;
- adjusted order.

---

## 8. Component tests

Test:

- dropzone accepts multiple XLSX;
- rejects unsupported files;
- parsing state;
- warning rendering;
- one driver card across multiple source files;
- no source filename or row count in driver scope cards;
- shared select-like multi-stint control;
- `All stints` option;
- zero-timed stints omitted;
- global pace-mode control;
- pace control disabled before import;
- user-facing audit reasons;
- benchmark selector;
- penalty editor;
- leaderboard response;
- empty/no-clean-lap state;
- export dialog.

---

## 9. E2E scenarios

### Happy path

1. open app;
2. drop 3 fixture workbooks;
3. see the driver scope;
4. analyze;
5. verify leaderboard;
6. open sectors;
7. switch Median -> Average;
8. inspect driver detail;
9. download Markdown.

### Penalty

1. import;
2. set penalty seconds/count;
3. verify adjusted time/order/gap;
4. verify export includes manual source.

### Bad file

Drop unrelated workbook.
Expected: actionable rejection, no crash.

### No clean laps

Runtime still available; pace stats show unavailable warning.

### Driver scope

Import files for the same driver.
Expected: one driver card, merged stints, and no source filename in the scope card.
Select `All stints`.
Expected: every non-empty stint contributes to runtime and pace eligibility.

### Duplicate

Drop same bytes twice.
Expected: duplicate identified.

### Base path

Run production output from `/garage61-analyzer/`.
Verify no asset or navigation failures.

### Privacy and ephemeral lifecycle

Intercept network while importing workbook.
Assert no request contains:

- workbook bytes;
- filename;
- parsed driver/lap data.

Static asset requests are allowed.

Also verify:

1. no login/signup/profile/workspace UI exists;
2. no session data is automatically written to localStorage or IndexedDB;
3. refresh may clear the current analysis;
4. export works before reset/refresh;
5. the user can complete the entire product workflow without an account.

---

## 10. Export tests

### Markdown

Assert:

- YAML frontmatter parseable;
- schema version;
- deterministic section order;
- no NaN/Infinity;
- methodology included;
- exact compact JSON parseable;
- Summary excludes lap audit;
- Full includes lap audit.

### JSON

Validate against Zod schema.

### XLSX

Read generated workbook back:

- expected sheet names;
- expected row counts;
- key values are numeric;
- leaderboard penalty values correct;
- sector summary rows correct;
- audit rows correct.

Correctness > styling.

---

## 11. Accessibility

Minimum:

- keyboard usable upload;
- visible focus;
- controls have labels;
- accessible tabs;
- semantic tables;
- color not sole information channel;
- table equivalents for charts.

Add automated accessibility tooling if current maintained package fits cleanly; otherwise document manual checks.

---

## 12. Performance acceptance

Test with ~20 representative small/medium session workbooks.

Requirements:

- UI does not appear frozen;
- parsing progress/status visible;
- post-parse benchmark/filter interactions are immediate enough;
- export completes reliably.

Do not invent strict latency targets until fixture sizes are known.

---

## 13. GitHub Pages acceptance

Verify:

- official Actions deployment;
- Astro static output;
- non-root base path;
- static page refresh;
- no dynamic server route;
- no secret required;
- source workbook not deployed/stored;
- custom domain not required.

---

## 14. Release checklist

- [ ] Astro static app
- [ ] React analyzer
- [ ] Tailwind/shadcn UI
- [ ] Multiple XLSX drop
- [ ] Garage 61 sheet detection
- [ ] Dynamic sector count
- [ ] Duplicate detection
- [ ] Scope review
- [ ] Stint suggestions
- [ ] Runtime calculation
- [ ] Pace eligibility
- [ ] Clean %
- [ ] Manual penalties
- [ ] Adjusted leaderboard/gaps
- [ ] Lap best/mean/median
- [ ] Population SD
- [ ] MAD
- [ ] IQR
- [ ] Outlier flags
- [ ] Sector benchmarks
- [ ] Theoretical best
- [ ] Consistency view
- [ ] Driver detail
- [ ] Lap audit
- [ ] Stint progression
- [ ] XLSX export
- [ ] Markdown Summary export
- [ ] Markdown Full export
- [ ] JSON export
- [ ] Methodology export
- [ ] No file-data network requests
- [ ] No account/login/signup system
- [ ] No cloud or shared analysis persistence
- [ ] No automatic local persistence of workbooks or analysis
- [ ] Refresh/reset may discard current analysis
- [ ] Export is the intended persistence mechanism
- [ ] Responsive tables
- [ ] Accessibility review
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] `pnpm lint`
- [ ] `pnpm check`
- [ ] `pnpm test`
- [ ] `pnpm e2e`
- [ ] `pnpm build`
- [ ] Pages live deployment verified

MVP is done only when this checklist is satisfied.
