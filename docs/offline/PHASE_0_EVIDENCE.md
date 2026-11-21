# Phase 0 evidence — 21 November 2026

**Release classification: ONLINE_ONLY.** Both repositories were available. The backend already implements a consistent branch bootstrap and a sale-specific replay protocol. The frontend has a category-cache writer but no durable paid outbox. Its session-cleanup path can discard unresolved retry identity. No offline features, migrations, deployment settings or customer records were changed by this phase.

## Revisions and provenance

| Repository | Working tree inspected | Starting branch and rollback base |
|---|---|---|
| Frontend | D:/Project/SuntechPos-frontend/suntech-pos-frontend | codex/phase-0-1-auth-integration at af601ed5c63347a10b7767d55c7549d2203190cc |
| Backend | D:/Project/SuntechPOS-backend | main at cdcde71ef769abcc630d862f1db33d130565f49b |

Findings describe both **live, dirty working trees**. A checkout of either SHA alone will omit some inspected code. The frontend phase branch is `codex/offline-phase-0-evidence`. Its phase commit contains the three review documents only. The input README and earlier landing, auth and catalog edits belonged to the starting workspace. The untracked 15 November validation report was available at intake and disappeared during the review, along with unrelated changes to docs/time*.md. Those paths were left to their owner.

## Current data path

- Cashier and Admin direct-sale, custom-sale and order pages use the existing POS workspaces. Admin selects an owned business and branch. Cashier context derives from assignments. Super Admin has separate navigation. Next proxy reads a seven-day signed session projection. Live API authority remains with Nest. The session endpoint returns the projection without asking Nest.
- Terminal variant search requests pages of 30. Only successful category responses currently reach Dexie. Database `suntech-pos-offline-v1`, schema version 1, has one `categorySnapshots` store keyed by a JSON tuple of user, business and location. No offline category reader, device grant, full local product/variant snapshot, local committed receipt or payment queue was found.
- The frontend generates online operation identities in sessionStorage. Catalog/custom sale success constructs the receipt from the returned order. Receipt printing uses a new print document with external Bengali font resources. There is no local pending invoice reference or confirmed atomic sale/receipt/outbox transaction.
- The backend working copy of docs/POS.md is substantive. Use [the controller matrix](API_CONTRACT_MATRIX.md) for the 97 handlers. One discrepancy is that the docs’ dashboard table lists Admin, while the controller role decorator also lists Cashier and Super Admin. Actual service scope checks still apply.
- Prisma’s offline-order migration adds unique clientOrderId and separates occurredAt from createdAt. The working tree adds a hash column/index through the untracked 20261107120000_order_sync_payload_hash migration. The cashier session/shift autoclose migration is also untracked. Verify applied migration state in staging before targeting these contracts. Bootstrap uses RepeatableRead with active nested catalog data. The snapshot lacks a signed offline permission. Sync requires original actor/branch context, processes sales per item and returns per-item outcomes. HTTP 200 alone cannot confirm a batch. The live refund endpoint uses a separate 24-hour HTTP-key mechanism. No generic month-long non-sale replay contract was found.
- Next 16.4.3 / React 19.3.0 / Dexie 4.4.7 / next-pwa 10.2.9 in the frontend lockfile. The actual production build uses Turbopack, with the webpack-oriented PWA wrapper disabled. Providers unregister same-origin service workers. The build produced no operating worker in the browser check. The manifest points to /login and a missing /next.svg. next.config.ts assigns a one-day public cache to images and the manifest. No SW-specific update policy is configured. The checked-in BFF explicitly returns no-store on successful proxy responses.
- Local metadata indicates Vercel tooling, and the configured backend URL is a Render hostname. The deployment owner must identify the stable frontend origin, deployed versions and preview separation (D11). No deployment environment or worker-enabled build was assumed or tested.

## Credential and dependency hygiene

- Frontend Git history shows prior init-hook cleanup (ca2da86) and ignore-rule repair (af601ed). Current npm scripts, vitest config, Next config and active Git hook locations were inspected before committing. No current frontend init or ESLint config file was found. The lock marks esbuild, fsevents and unrs-resolver as having install scripts. No dependency install or historical script was executed. Backend ESLint config imports ESLint, TypeScript and Prettier plugins. Its lint script uses --fix.
- Both repos exclude their local environment files and track examples. The backend Docker exclusions also cover local environment files. Local checks found no Git history for the exact .env and .env.local paths in either checkout. Ignore rules do not protect filesystem ZIP exports.
- A local exact-byte comparison tested seven candidate credential values of 16+ characters from the two working trees against tracked files and built client JS/CSS/maps. No client asset matched. The single tracked-file match was the frontend session-secret denylist. The local .env supplies a denylisted example that production signing rejects. Validate deployment-managed signing configuration with its owner. This check does not establish historical archive contents, transformed/short values, active token validity or third-party exposure. No credential values were exported.
- The Next build reported a security advisory for installed 16.4.3. Verify advisory applicability and a patched build before production. The successful build retry retained this warning. Historical archive recipients and any need to rotate/revoke credentials remain owner actions.

## Finding register

“Fixture” means executed against current modules with in-memory synthetic records and a stubbed upstream. “Source” means the affected control flow was traced; it does not imply a witnessed incident. Source paths below are relative to frontend src unless marked backend.

| ID | Current status | Evidence and consequence |
|---|---|---|
| ST-F01 | CONFIRMED | Source: terminal-workspace completeSale, custom-sale-view submit, orders-workspace confirmRefund acquire a lock before validation returns outside the final cleanup. |
| ST-F02 | CONFIRMED | Fixture: throwing on sessionStorage.setItem still returned a key with no stored record in lib/financial-operation. |
| ST-F03 | CONFIRMED | Fixture: changing the payload while pending returned another key and replaced the same scope record. |
| ST-F04 | CONFIRMED | Source: receipt mapping follows successful mutateAsync inside the failure handler’s try; marking failed removes the record. A synchronous local exception can lose recovery identity. |
| ST-F05 | CONFIRMED | Source: refund UI maps all 409s to a quantity conflict. Backend refund.service has multiple conflict paths and the interceptor can also return 409 for an in-flight key. |
| ST-F06 | CONFIRMED | Source: manual reconciliation calls clearOperation, which removes the record. Fixture also showed the separate auth cleanup erasing an unknown operation. |
| ST-F07 | CONFIRMED | Fixture: first unrelated dispatch on createAppStore overwrote a saved draft with an empty list. Providers can dispatch before reading persisted drafts. |
| ST-F08 | CONFIRMED | Source: terminal filters held drafts by business, accepts unscoped records and lacks exact actor/branch matching. Logout now removes persisted drafts but does not reset the Redux draft slice. |
| ST-F09 | CONFIRMED | Source: global five-draft reducer returns unchanged state at capacity. Terminal dispatches save, clears cart and reports success without checking persistence. |
| ST-F10 | CONFIRMED | Source: continueDraft sets the active cart and removes the saved draft without checking existing cart contents. |
| ST-F11 | CONFIRMED | Source: POST submit locks cover the submission button, while ticket edits/dialog dismissal remain possible during submission. |
| ST-F12 | CONFIRMED | Fixture: BFF upstream empty 200 → 200; 204/205/304 → 503. Logout 204 → 200 with serverLogoutConfirmed false. The ArrayBuffer for an empty body is still passed to NextResponse. |
| ST-F13 | CONFIRMED | Source: expense creation uses a new UUID if the caller supplies none; a new form submission after an uncertain result can lose the original identity. |
| ST-F14 | CONFIRMED | Fixture: explicit invalid timestamp mapped to today in formatBusinessDateKey. Backend strict sync timestamp validation is already implemented and tested. |
| ST-F15 | CONFIRMED | Source: reports-dashboard can retain a previously selected view year while the current-month export computes a different year. |
| ST-F16 | CONFIRMED | Source plus fixture: providers route network failure and non-OK session results through auth cleanup. clearAllAuthStorage removed a synthetic unknown financial operation. Online auth rejection must still deny protected access. |
| ST-F17 | CONFIRMED | Source: sale/refund invalidation in use-pos omits the admin-dashboard query family. Expense creation already invalidates it. |
| ST-F18 | CONFIRMED | Source: Admin dashboard omits invalid/reversed date bounds but still enables shift history; any successful panel refetch advances the displayed refresh time. |
| ST-F19 | FIXED (Git ignore and init hooks); NOT REPRODUCED (historical disclosure) | Current ignore/history/asset checks above supersede the older ignore finding. Prior archive and distribution evidence unavailable. Lint configuration and signing configuration remain separate open release checks. |

## Executed checks

| Check | Result |
|---|---|
| Frontend npm run typecheck | Passed. |
| Frontend npm test | 31 suites, 228 tests passed. Includes register guard, POS refund/receipt, financial operation, shift recovery and payroll contract tests. Some tests exercise pre-existing retry behavior that the phase findings identify as unsafe. |
| Frontend npm run build | First run compiled and prerendered, then exited 1 on Next’s advisory reminder. Second run exited 0 with warning, generating 30 static pages. |
| Frontend npm run lint | Failed before checking files. ESLint 9.39.5 could not find a flat config. |
| Backend npm test -- --runInBand | 34 suites, 400 tests passed. Includes sync replay mismatch, mixed item outcomes, explicit null shift, old timestamps, price variance and refund service tests using test doubles. |
| Current-module diagnostic | Loaded the actual BFF handlers, business-time, Redux and financial-operation modules. Stubbed fetch and used the in-memory Storage fixture; results recorded under F02/03/07/12/14/16. No remote requests or financial writes. |
| Production Chromium restart | Started next start on loopback with an unavailable loopback backend, using a fresh persistent browser profile. Both protected terminal URLs redirected to login without a session. Zero service workers registered; manifest icon returned 404. Closed Chromium, stopped the server, reopened the same profile with network disabled. Both /pos/terminal and /admin/terminal navigations failed with ERR_INTERNET_DISCONNECTED. |

**Outstanding qualifications.** Backend/QA need a disposable migrated PostgreSQL environment and authorized authenticated staging accounts for real concurrency, crash-after-commit recovery and end-to-end sales/refunds. Authenticated POS behavior on a target till, actual thermal printing and device reboot/endurance were not exercised. Retail operations owns the device, printer, backup and month-long pilot evidence. The anonymous restart result establishes the current PWA baseline only.

## Phase 1 handoff and rollback

First patch: preserve unresolved retry identity and held-draft evidence across session failure and logout. Limit diffs to src/app/providers.tsx, src/lib/auth-storage.ts, src/lib/tenant-preferences.ts, src/features/auth/hooks/use-sign-out.ts and focused tests as needed. Separate clearing visible authentication from preserving immutable evidence. Test transient failure, true 401/403, user/branch switch and explicit logout with pending and unknown fixture records. Old records must be inaccessible to the next operator. Recovery must require authorized reconciliation.

Following online-only patches: fix failed storage writes and pending replacement, submit locks and post-ack receipt exceptions; then the BFF empty-response/Set-Cookie cases, draft persistence, refund error classification and expense retries. Restore trusted ESLint configuration and review deployment security separately. Use the register to prioritize remaining issues. Keep paid offline disabled until the later financial gates.

Rollback for this phase is a Git revert of the documentation-only phase commit. There is no storage or backend rollback to perform. Never reset the dirty working trees to the base SHAs. The [decision register](DECISIONS.md) records owners and downstream gates.

## Intake working-tree inventories

Frontend git status --short

~~~
 M package-lock.json
 M package.json
 M src/app/page.tsx
 M src/app/providers.tsx
 M src/components/landing/capability-cards.tsx
 M src/components/landing/checkout-showcase.tsx
 M src/components/landing/feature-showcase.tsx
 M src/components/landing/final-cta.tsx
 M src/components/landing/hero-section.tsx
 M src/components/landing/operations-preview.tsx
 M src/components/landing/telemetry-strip.tsx
 M src/components/layout/footer.tsx
 M src/components/motion/animated-counter.tsx
 M src/components/motion/motion-reveal.tsx
 M src/features/auth/components/demo-login-modal.tsx
 M src/features/auth/components/login-form.tsx
 M src/features/auth/hooks/use-sign-out.ts
 M src/features/catalog/api/use-catalog.ts
 M src/lib/auth-storage.ts
 M src/lib/tenant-preferences.ts
?? docs/SunTech_POS_PWA_Offline_Codex_Implementation_README.md
?? docs/frontend-issue-validation-2026-11-15.md
?? docs/metadata_and_seo_plan.md
?? src/components/landing/landing-motion.tsx
?? src/components/landing/landing.css
?? src/components/motion/use-reduced-motion-preference.ts
?? src/features/offline/
~~~

Backend git status --short

~~~
 M .env.example
 M docker-compose.yml
 M docs/POS.md
 M package.json
 M prisma/schema/hr.prisma
 M prisma/schema/pos.prisma
 M prisma/schema/user.prisma
 M src/admin/admin-dashboard.service.spec.ts
 M src/admin/admin-dashboard.service.ts
 M src/auth/auth.controller.ts
 M src/auth/auth.service.spec.ts
 M src/auth/auth.service.ts
 M src/auth/strategies/jwt.strategy.spec.ts
 M src/auth/strategies/jwt.strategy.ts
 M src/catalog/variant.service.ts
 M src/common/interceptors/idempotency.interceptor.ts
 M src/common/types/access-token-payload.ts
 M src/common/utils/timezone.util.ts
 M src/config/validate-env.spec.ts
 M src/config/validate-env.ts
 M src/expenses/expense.service.ts
 M src/hr/advance.service.spec.ts
 M src/hr/advance.service.ts
 M src/hr/payroll.service.spec.ts
 M src/hr/payroll.service.ts
 M src/main.ts
 M src/offline/offline.service.spec.ts
 M src/offline/offline.service.ts
 M src/orders/dto/create-catalog-order.dto.ts
 M src/orders/dto/create-custom-order.dto.ts
 M src/orders/dto/create-order.dto.ts
 M src/orders/dto/sync-orders.dto.ts
 M src/orders/order.controller.ts
 M src/orders/order.service.spec.ts
 M src/orders/order.service.ts
 M src/orders/refund.service.spec.ts
 M src/orders/refund.service.ts
 M src/reports/export.service.spec.ts
 M src/reports/export.service.ts
 M src/reports/report.service.spec.ts
 M src/reports/report.service.ts
 M src/shifts/dto/list-shifts.query.ts
 M src/shifts/dto/open-shift.dto.ts
 M src/shifts/shift.controller.ts
 M src/shifts/shift.service.spec.ts
 M src/shifts/shift.service.ts
 M src/users/user.service.ts
 D test/app.e2e-spec.ts
 D test/jest-e2e.json
?? .dockerignore
?? Dockerfile
?? prisma/schema/migrations/20261106140000_cashier_session_and_shift_autoclose/
?? prisma/schema/migrations/20261107120000_order_sync_payload_hash/
?? src/auth/dto/force-logout.dto.ts
?? src/common/utils/timezone.util.spec.ts
?? src/orders/dto/confirm-legacy-sync.dto.ts
?? src/orders/sync-payload-hash.spec.ts
?? src/orders/sync-payload-hash.ts
~~~
