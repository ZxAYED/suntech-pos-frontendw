<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


## SunTech POS — required PWA + offline architecture

Read `docs/offline/SUNTECH_POS_PWA_OFFLINE_MASTER_SDD.md` (v2.1 local-first)
before editing checkout, PWA, offline storage, sync, auth recovery, refunds,
shifts, Admin financial actions, local catalog, or financial reports.

### Main rule
EVERY NEW catalog or custom checkout saves to IndexedDB FIRST,
regardless of internet status. Only after the atomic local commit may
its saved immutable sale be sent to NestJS through the approved sync adapter.
There must be NO direct-online checkout bypass for new local-first sales.
Old endpoints may remain for explicitly versioned legacy clients and old
unresolved operations; never duplicate a purchase across paths.

### No arbitrary offline sales-count limit
Do not implement a cap such as 100, 500, 1,000 or 10,000 queued sales.
The present `/orders/sync` limit of 100 is PER HTTP REQUEST, not a total.
Drain the queue in repeated bounded batches and use indexed pagination.
Keep pending/unknown/review evidence. Real storage exhaustion must fail
without falsely claiming that a sale was locally saved.

### Non-negotiable business rules
- Preserve existing Next.js pages, cards, within-card variant selection, routes.
- Catalog checkout uses a real variant ID; new products need at least one variant.
- Negative stock is allowed; shifts are optional; explicit `shiftId: null` if absent.
- Manual payment types: COD, BKASH, NAGAD, BANK. Whole-number BDT.
- Scope all financial records to original operator, business, branch, and device.
- Keep original occurrence time in Asia/Dhaka context; distinguish posting time.
- Do not delete pending sale evidence on logout, quota failure, migration, or rollback.
- Use one immutable clientOrderId per purchase, not per retry.
- The local pending receipt is different from the official server invoice.
- Do not enable unqualified offline refunds/stock edits/payroll writes.

### Work order
1. Read the master guide and inspect the CURRENT frontend/backend source.
2. Record current implementation and exact phase. Never assume a plan is code.
3. Identify frontend owner, backend owner, DTO, Prisma model and migration.
4. List old behavior to preserve, edge cases and applicable test IDs.
5. Implement the smallest complete vertical slice in existing screens.
6. Add tests for online + offline, retry, outage, two tabs, restart, scope, and storage.
7. Verify with actual builds and integration tests; report what was NOT tested.
8. Do not silently change an unresolved business policy or delete old data.

### Completion report for every task
- Phase and requirement/bug/test IDs:
- Existing code inspected:
- Frontend changes:
- Backend/DB/migration changes:
- Expected algorithm:
- What bug was fixed and its root cause:
- Tests run and results:
- Remaining gaps or business approvals:
- Rollback/recovery behavior:

### Safety when stuck
STOP new intake if data cannot be saved or permission is unknown.
NEVER erase queued sales to fix a build or login issue.
Preserve the same sale ID and escalate unresolved financial conflicts.

## Current implementation: phases 1–7

Read `docs/offline/IMPLEMENTATION_PHASES_1_7.md` and
`docs/offline/VERIFICATION_REPORT.md` with the master SDD. The earlier
`IMPLEMENTATION_CHECKPOINT_01.md` is historical, not the present code state.
The current source implements local-first catalog/custom checkout, PWA,
scoped storage/provisioning, replay, review and encrypted recovery. Preserve
its `LOCAL_FIRST_V2` versus `LEGACY_HTTP` distinction.

Code implementation is not store-device qualification. Actual browser cold
start, update, physical printing, approved offline policy and independent
backup/recovery must be verified before a paid rollout. The supplied tests
record their real coverage and environment limitations; do not mark blocked
checks passed or erase financial evidence to work around a failed test.

## Current continuation: advanced staging checkpoint

Read section 30 of the current master SDD and the combined root `PHASES_8_12_STAGING_REPORT.md` before changing refunds, advanced commands, accounting, backups or rollout. Phase 8–12 are NOT complete. New advanced capabilities default off; do not enable real payouts or silently choose accounting/recovery policy. Preserve all original IDs, scopes, v3 IndexedDB data, v2 backups and command receipts. The focused test adapter is not live database or browser qualification. Regenerate the PWA assets and pass the complete release gates before enabling advanced intake.


## Latest flow-preserving hardening checkpoint

Read `docs/offline-implementation-plan.md`, `docs/offline.md`, and `../FLOW_PRESERVING_HARDENING_REPORT.md` (if present). Keep normal online refund atomic receipt behavior on the same legacy HTTP endpoint and key. Do not re-open an old pending receipt, delete financial evidence, or transfer a sale/refund to a different protocol after timeout. Do not enable the remaining Phase 8–12 financial/Admin features by inventing temporary identities or accounting/recovery policy. All 25 pages and existing route contracts are preserved.

## Automatic trusted-device offline checkout

- **Zero-passphrase automatic provisioning & restoration:** Online authentication and branch selection (Cashier on login; Admin after selecting business & branch) automatically install a signed ES256 grant (`grantToken` + complete catalog/history snapshot) and activate `TRUSTED_WORKSPACE_KEY` (`active-workspace`) in Dexie `metadata`. On reloads or cold restarts while the server is unreachable (or when `suntech_session` exceeds 7 days but remains within the 30-day offline grant and fails refresh due to an outage with `ROUTING_COOKIE_EXPIRED`), the exact trusted workspace restores automatically without passphrases or separate offline login.
- **Explicit boundary preservation:** Explicit Sign Out (`logged_out`), account switch (`account_switched`), confirmed server `401`/`403` rejection (`rejectedAt`), or tampered/expired tokens immediately revoke trusted auto-restore (`LOCAL_UNLOCK_REQUIRED` / `OFFLINE_AUTHORITY_REJECTED`) across tabs while preserving all saved sales driver records (`localSales`, `outbox`, `receipts`) for authenticated recovery or encrypted export.
- **UI & diagnostics:** Daily POS screens show only a minimal status pill in `Navbar` (`Online`, `Offline`, `Syncing`, `Offline · N pending`, `Needs attention`). Diagnostics, encrypted backup/restore, and pending/review inspection live in `OfflineMaintenancePanel` inside `/admin/help` and `/pos/help`.
- **Error surfacing:** `OfflineProvider` coalesces provisioning requests, discards stale branch/operator completions, auto-retries once on `SESSION_RENEWED_RETRY_REQUIRED`, and preserves real provisioning/config errors (`OFFLINE_SIGNING_INVALID`, HTTP `4xx`/`500`) instead of masking them behind local storage lookups.
