# Open Pajak Codebase Recommendations

Audit date: 2026-06-08

Scope reviewed:

- Repository root: `C:\Users\alpi\Documents\GitHub\hitung-pajak`
- Application workspace: `open-pajak-v1`
- Stack: React 19, Vite, TanStack Router, Tailwind CSS 4, i18next, Bun-oriented package setup, Cloudflare Pages/Workers static hosting

## Executive Summary

The app has a solid foundation: calculators are mostly pure functions, the UI is split into reusable components, the project is client-only, and the production build succeeds. The biggest issues are not structural rewrites; they are correctness assurance, quality gates, and a few security/tooling gaps.

Recommended order:

1. Restore reliable quality gates without changing runtime behavior.
2. Add tax calculator regression tests before changing formulas.
3. Fix confirmed correctness and security issues behind those tests.
4. Improve localization, documentation, and deployment consistency.
5. Refactor larger pages only after behavior is protected by tests.

## Verification Results

Commands were run through `rtk` as required by local instructions. Bun was available at `C:\Users\alpi\.bun\bin\bun.exe` and reported version `1.3.14`.

| Check | Result | Notes |
| --- | --- | --- |
| `bun install --frozen-lockfile` | Passed | Installed from the existing `bun.lock`. |
| `bun run build` | Passed | Vite build and `tsc` completed successfully. |
| `bun run lint` | Failed | 63 ESLint errors, mostly import order, array type style, unnecessary condition checks, and worker config coverage. |
| `bun run test` | Failed | No test files exist, so Vitest exits with code 1. |
| `bun run format` | Failed | Script runs bare `prettier` without a file target or mode. |
| `bun audit --json` | Failed | Multiple dependency advisories, including critical `vitest < 4.1.0` and high-severity advisories affecting build/test dependencies such as Vite, Rollup, minimatch, picomatch, seroval, and flatted. |

Important environment note:

- Bun is installed, but `C:\Users\alpi\.bun\bin` was not on PATH for this shell session. Commands were run by absolute executable path.
- Final dependency updates should be made with Bun and committed through `bun.lock`.

## Safety Principles For Fixes

Use these guardrails so improvements do not crash the app:

- Make tooling-only fixes first. These should not change runtime behavior.
- Add tests before changing tax formulas.
- For formula changes, keep old and new values visible in tests until expected behavior is confirmed.
- Do not refactor UI and formula behavior in the same PR.
- Preserve route paths and public static asset paths unless deployment is tested.
- Keep receipt/localStorage migrations backward-compatible.
- Avoid deleting Cloudflare fallback files until the selected deployment mode is verified with deep links.
- Run these checks after each fix batch:
  - `bun run lint`
  - `bun run test`
  - `bun run build`
  - browser smoke test for `/`, `/pph21`, `/ppn`, and one deep link refresh

## Priority 1: Restore Quality Gates

### 1. Fix the `format` script

Current issue:

- `open-pajak-v1/package.json` defines `"format": "prettier"`.
- Running it fails because Prettier has no target and no parser context.
- The root README says `bun run format` is a format check, but the script is not a check.

Safe fix:

```json
{
  "scripts": {
    "format": "prettier --check .",
    "format:write": "prettier --write .",
    "check": "prettier --write . && eslint --fix"
  }
}
```

Why this should not crash the app:

- This only changes developer tooling scripts.
- It does not affect bundled runtime code.

Verification:

- `bun run format`
- `bun run check`
- `bun run build`

### 2. Fix ESLint configuration and current lint errors

Current issue:

- `npm run lint` reports 64 errors.
- Most are auto-fixable import order/style issues.
- `worker/_worker.js` is linted with a TypeScript project parser but is not included in `tsconfig.json`.

Safe fix approach:

- Run `bun run check` or `eslint --fix` for import/order and array-type style issues.
- Add an ESLint override or ignore for generated/deployment JS files such as `worker/_worker.js`.
- Keep strict rules enabled for `src`.

Recommended ESLint handling:

- Ignore `src/routeTree.gen.ts` if generated code starts causing lint churn.
- Add a JS override for `worker/_worker.js`, or ignore it if Cloudflare Worker code is not part of typed app source.

Why this should not crash the app:

- Import sorting and type-style changes are behavior-neutral.
- Ignoring or separately configuring `worker/_worker.js` prevents lint crashes without changing deployment code.

Verification:

- `bun run lint`
- `bun run build`

### 3. Add CI

Current issue:

- The app has scripts, but quality gates currently fail locally and are not confirmed in CI.

Safe fix:

- Add GitHub Actions workflow with:
  - Bun setup
  - `bun install --frozen-lockfile`
  - `bun run format`
  - `bun run lint`
  - `bun run test`
  - `bun run build`

Why this should not crash the app:

- CI only verifies code; it does not change production behavior.

Verification:

- Confirm CI passes on a branch before merging.

## Priority 2: Add Calculator Regression Tests

Current issue:

- `bun test` currently fails because no test files exist.
- The calculators are financial/tax logic, so untested formula changes are high risk.

Safe fix:

- Add tests under `src/lib/tax`.
- Keep tests pure; avoid rendering React for the first batch.
- Use official examples and hand-calculated edge cases.

Recommended initial test files:

- `src/lib/tax/utils.test.ts`
- `src/lib/tax/pph21.test.ts`
- `src/lib/tax/ppn.test.ts`
- `src/lib/tax/pph22.test.ts`
- `src/lib/tax/pph23.test.ts`
- `src/lib/tax/pph4_2.test.ts`
- `src/lib/tax/ppnbm.test.ts`

Recommended test cases:

- Pasal 17 bracket boundaries:
  - `0`
  - `60_000_000`
  - `60_001_000`
  - `250_000_000`
  - `500_000_000`
  - `5_000_000_000`
- PTKP lookup and zero-floor PKP.
- TER monthly boundaries for categories A, B, C.
- TER daily boundaries.
- PPh21 permanent employee old scheme.
- PPh21 TER annual reconciliation including over-withholding.
- PPh21 non-employee 50 percent DPP.
- PPh26 custom treaty rate.
- PPN exclusive and inclusive mode.
- PPN custom rate.
- Negative or empty inputs normalize to safe zero behavior.

Why this should not crash the app:

- Tests do not change runtime behavior.
- They create a safety net before formula fixes.

Verification:

- `bun run test`
- `bun run build`

## Priority 3: Fix Confirmed PPh21 TER Overpayment Behavior

Current issue:

- In `src/lib/tax/pph21.ts`, the 12-month TER path computes:
  - `difference = pajakSetahun - terPaid`
  - `adjustment = Math.max(0, difference)`
  - `overpaid = difference < 0 ? Math.abs(difference) : 0`
  - `totalTax = terPaid + adjustment`
- If `terPaid` is greater than annual Pasal 17 tax, `totalTax` remains `terPaid`.
- That can overstate total tax and understate take-home pay.

Safe fix approach:

1. Add failing test first for an over-withholding scenario.
2. Keep separate values in the result breakdown:
   - Annual Pasal 17 liability.
   - TER already withheld.
   - December underpayment.
   - Refund/overpayment.
3. Set economic final tax liability to `pajakSetahun`.
4. If the UI needs withholding history, expose it as a separate metric, not as `totalTax`.

Why this needs tests first:

- This is a real behavior change in a tax calculator.
- It affects summaries, receipts, exports, and take-home pay.

Why the fix should not crash the app:

- The return shape can remain `TaxResult`.
- Existing tables can keep reading `breakdown`.
- Summary fields should only be extended, not removed.

Verification:

- `bun run test`
- Manual PPh21 sample calculation in the UI.
- Save a receipt, export Excel, and print PDF to ensure receipt fields still render.

## Priority 4: Fix Receipt Print HTML Injection Risk

Current issue:

- `src/lib/receiptExport.ts` builds printable HTML using string interpolation and assigns it to `iframe.srcdoc`.
- User-controlled or upload-controlled values are inserted without HTML escaping:
  - `receipt.title`
  - `receipt.identifier`
  - `receipt.groupName`
  - `row.label`
  - `row.note`
- XML export has `escapeXml`, but printable HTML needs separate HTML escaping.

Safe fix:

- Add `escapeHtml`.
- Use it for every interpolated text value inside `receiptHtml`.
- Keep CSS and hardcoded SVG unchanged.

Example pattern:

```ts
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
```

Why this should not crash the app:

- It only changes how text is encoded in print HTML.
- Visible output stays the same for normal receipt text.

Verification:

- Print receipt with normal values.
- Print receipt with special characters like `<`, `>`, `&`, quotes.
- Confirm the modal and exports still work.

## Priority 5: Update Vulnerable Dev And Build Tooling

Current issue:

- `vitest` is declared as `^3.0.5`.
- `bun audit --json` reports a critical advisory for `vitest < 4.1.0`.
- The same audit also reports high/moderate advisories in build and test dependency paths, including packages such as Vite, Rollup, minimatch, picomatch, seroval, flatted, PostCSS, and ws.
- The advisory is especially relevant on Windows when Vitest UI or Browser Mode is exposed.

Safe fix:

- Upgrade direct dev dependencies first:
  - `vitest` to `^4.1.0` or newer patched version.
  - `vite` to a patched version above the vulnerable range reported by `bun audit`.
  - `@vitejs/plugin-react`, `@tanstack/router-plugin`, and related Vite plugins if peer compatibility requires it.
- Run `bun install` and review the resulting `bun.lock` diff.
- Run tests and build.
- If no tests exist yet, add at least one smoke test before upgrading so the test command is meaningful.

Why this should not crash the app:

- These are primarily dev/build dependencies.
- They can affect local development and bundling, so keep the upgrade in its own PR and verify production build output.
- Do not combine this dependency upgrade with calculator formula changes.

Verification:

- `bun install`
- `bun run test`
- `bun run build`
- `bun audit --json`

## Priority 6: Correct 2025 PPN Modeling

Current issue:

- `src/lib/tax/constants.ts` sets 2025 PPN to 12 percent.
- Indonesian 2025 PPN treatment includes cases using 12 percent with `11/12 x DPP` formulas for DPP Nilai Lain / Besaran Tertentu.
- A single year-rate selector can mislead users for 2025 scenarios.

Safe fix approach:

1. Add tests for current PPN exclusive and inclusive behavior.
2. Add a `calculationMode` or `dppMode`, for example:
   - `standard`
   - `dppNilaiLain11Per12`
   - `custom`
3. Keep existing 2022-2024 behavior unchanged.
4. Add explanation text for the 2025 mode.

Why this should not crash the app:

- Default mode can preserve current behavior until the user selects another mode.
- The existing `PpnInput` can be extended with an optional field.

Verification:

- PPN unit tests.
- Manual UI checks for inclusive and exclusive mode.
- Export/receipt checks if PPN receipts are added later.

## Priority 7: Complete Traditional Chinese Localization

Current issue:

- Locale key audit found:
  - `id`, `en`, `ja`, `ko`, `nl`, `zh`: 339 keys each.
  - `zh-TW`: 271 keys.
- `zh-TW` is missing 68 keys, mostly receipt-related keys.

Safe fix:

- Copy missing keys from `zh` or `en` into `zh-TW`.
- Translate in a separate pass.
- Add a small locale key parity script/test.

Why this should not crash the app:

- Adding missing JSON keys is additive.
- It reduces runtime fallback/key display risk.

Verification:

- Locale parity script.
- Open app, switch to `zh-TW`, open PPh21 receipt modal/history/bulk UI.
- `bun run build`.

## Priority 8: Lazy-Load Locale Resources

Current issue:

- `src/i18n/config.ts` statically imports every locale JSON file.
- This increases the main bundle size.
- Build output showed the main JS chunk around 469 kB uncompressed.

Safe fix approach:

- Keep default `id` eagerly loaded.
- Load other locales with dynamic imports when selected.
- Keep fallback language configured.

Why this should not crash the app:

- Implement behind `changeLocale`.
- Keep existing locale codes and fallback behavior.
- If dynamic import fails, stay on current language or fallback to `id`.

Verification:

- Build bundle size comparison.
- Switch every language in the UI.
- Hard refresh after saved locale.

## Priority 9: Align Bulk Upload With Documentation

Current issue:

- The root README says bulk upload via Excel.
- Upload accepts only `.xls,.xml`.
- Template is SpreadsheetML `.xls`, not modern `.xlsx`.
- CSV parsing exists but upload UI does not accept `.csv`.
- CSV parser uses simple `split(',')`, so quoted comma values are not supported.

Safe fix options:

Option A: Keep current implementation and clarify docs:

- Say "SpreadsheetML `.xls` / `.xml` template" instead of generic Excel.
- Remove implication that `.xlsx` is supported.

Option B: Add real `.xlsx` support:

- Use a maintained parser such as SheetJS or another tested spreadsheet parser.
- Add parser tests.

Why this should not crash the app:

- Documentation-only change is safe.
- Parser support should be added behind file extension detection and tests.

Verification:

- Upload generated template.
- Upload invalid file and confirm friendly error.
- Upload sample bulk records and confirm receipts/batches are created.

## Priority 10: Clarify Privacy Statement

Current issue:

- The root README says no personal identifiers are collected or stored.
- The receipt workspace stores `title`, `identifier`, and `groupName` in localStorage.
- This is client-side only, but it is still storage.

Safe fix:

- Update wording to:
  - Inputs and receipts are stored only in the browser.
  - No data is sent to a server by the app.
  - Users should avoid entering NIK, names, addresses, or other sensitive identifiers unless they accept browser-local storage.

Why this should not crash the app:

- Documentation-only change.

Verification:

- No runtime verification needed beyond docs review.

## Priority 11: Consolidate Cloudflare SPA Fallbacks

Current issue:

The app has multiple SPA fallback mechanisms:

- `functions/_middleware.ts`
- `worker/_worker.js`
- `public/routes.json`
- `wrangler.jsonc` points to `worker/_worker.js`

This makes deployment behavior harder to reason about.

Safe fix approach:

1. Identify the actual deployment mode:
   - Cloudflare Pages Functions, or
   - Cloudflare Worker with assets binding, or
   - static Pages redirects/routes.
2. Keep only the required fallback.
3. Before deleting anything, test direct refresh on:
   - `/pph21`
   - `/pph22`
   - `/ppn`
   - `/ppnbm`

Why this should not crash the app:

- Do not remove fallback files until the target deployment path is confirmed.
- Keep deep link refresh tests as the acceptance gate.

Verification:

- Local preview if available.
- Cloudflare preview deployment.
- Direct browser refresh on every route.

## Priority 12: Refactor PPh21 Page After Tests Exist

Current issue:

- `src/routes/pph21.tsx` is over 1,000 lines.
- It mixes:
  - form state
  - bulk parsing
  - receipt creation
  - preview modal state
  - export handlers
  - UI rendering

Safe refactor sequence:

1. Add calculator and bulk upload tests first.
2. Extract pure helpers:
   - bulk row parsing
   - bulk row normalization
   - receipt draft construction
   - metric extraction
3. Move receipt workspace logic into a hook:
   - `usePph21ReceiptWorkspace`
4. Keep JSX behavior unchanged while moving code.

Why this should not crash the app:

- Extract pure functions first.
- Avoid changing UI markup and logic in the same step.
- Tests protect parser and receipt behavior.

Verification:

- `bun run test`
- Manual PPh21 flow:
  - edit fields
  - save receipt
  - open history
  - bulk upload
  - export Excel
  - print PDF

## Priority 13: Remove Duplicate PPNBM Sample Button

Current issue:

- `src/routes/ppnbm.tsx` renders a sample button in the form actions and another sample button inside the form.

Safe fix:

- Remove the inner duplicate button.
- Keep the action-header sample button.

Why this should not crash the app:

- This is a UI-only deletion of duplicated control.
- Existing `sampleForm()` behavior remains.

Verification:

- Open `/ppnbm`.
- Click "Use sample".
- Confirm values populate.

## Priority 14: Improve Input Validation Without Blocking Normal Use

Current issue:

- Some numeric fields allow invalid values temporarily and normalize in calculators.
- PPh21 shows a generic positive-only message if any numeric state is negative.
- `NumberInput` strips all non-digits, so negative values cannot be entered there, but plain number inputs can.

Safe fix:

- Keep calculator-level normalization.
- Add field-level validation messages.
- Clamp months and percent fields on blur, not on every keystroke.
- Avoid blocking calculation unless the value is truly invalid.

Why this should not crash the app:

- Calculators still receive normalized numeric inputs.
- UI only improves feedback.

Verification:

- Try empty values, negative values, `0`, and very large values.
- Confirm the app does not throw and result table remains stable.

## Priority 15: Update App README

Current issue:

- `open-pajak-v1/README.md` is still the default TanStack starter README.
- It references `bun --bun run start`, but no `start` script exists.

Safe fix:

- Replace it with a short workspace README:
  - install
  - dev
  - build
  - test
  - lint
  - deployment notes

Why this should not crash the app:

- Documentation-only change.

Verification:

- Check commands match `package.json`.

## Suggested Implementation Roadmap

### Phase 1: Tooling and Documentation

Low runtime risk.

- Fix `format` script.
- Fix lint configuration and auto-fix lint style errors.
- Update vulnerable dev/build tooling reported by `bun audit`.
- Add CI.
- Replace app README.
- Clarify privacy language.

Acceptance:

- `bun run format` passes.
- `bun run lint` passes.
- `bun run build` passes.

### Phase 2: Test Foundation

Low runtime risk.

- Add pure calculator tests.
- Add locale key parity test/script.
- Add bulk parser tests.

Acceptance:

- `bun run test` passes with meaningful coverage of calculator edge cases.

### Phase 3: Correctness and Security

Moderate runtime risk, protected by tests.

- Fix PPh21 TER overpayment behavior.
- Fix receipt print HTML escaping.
- Correct/extend 2025 PPN modeling.

Acceptance:

- Existing and new tests pass.
- Manual smoke tests pass.
- Receipt export and print still work.

### Phase 4: Product and Architecture Cleanup

Moderate risk if done too broadly; keep scoped.

- Complete `zh-TW`.
- Lazy-load locale JSON.
- Align bulk upload support/docs.
- Refactor `pph21.tsx` into smaller helpers/hooks.
- Consolidate Cloudflare fallback files after deployment mode is confirmed.

Acceptance:

- Bundle size improves or stays acceptable.
- All routes refresh correctly in preview deployment.
- Manual PPh21 receipt workflow still works.

## Do Not Do These First

These actions increase risk without enough protection:

- Do not rewrite all tax calculators before adding tests.
- Do not delete deployment fallback files without deep-link testing.
- Do not replace localStorage receipt schema without a migration.
- Do not combine formula changes, UI refactors, and dependency upgrades in one PR.
- Do not add `.xlsx` support through ad hoc parsing.

## Final Recommendation

The codebase is maintainable, but the current quality gates are not reliable enough for tax-calculation changes. The safest path is:

1. Make scripts/lint/tests trustworthy.
2. Add golden tests for the calculator engines.
3. Fix PPh21 TER overpayment and receipt HTML escaping.
4. Then improve PPN 2025 modeling, localization, docs, deployment, and PPh21 page structure.

This sequence minimizes app-crashing risk because runtime behavior changes only happen after tooling and tests can catch regressions.
