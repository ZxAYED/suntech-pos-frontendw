# Automatic Offline Checkout Implementation Plan for SunTech POS

## Goal

Eliminate manual register setup, separate offline passphrases, manual synchronization dialogs, and hidden provisioning errors so **Admin** and **Cashier** operators experience automatic, zero-touch local-first POS operation across online and offline states while preserving all existing UI workflows, financial invariants, and authorization boundaries.

## Findings from the Current Codebase

1. **Backend signing-key blocker (`OFFLINE_SIGNING_INVALID`)**: `D:/Project/SuntechPOS-backend/src/offline/offline-capability.service.ts` fails EC P-256 private key parsing when `OFFLINE_SIGNING_PRIVATE_KEY_BASE64` is misformatted in `.env`.
2. **Frontend hides provisioning failures & lacks renewal retry**: `src/features/offline/ui/offline-provider.tsx` masks provisioning errors by falling back to `verifySavedPermission` (producing `"Sign in online and prepare this register before taking sales"` on fresh devices) and leaves `SESSION_RENEWED_RETRY_REQUIRED` requiring manual intervention.
3. **Passphrase & setup barriers**: `grant.ts`, `offline-access.tsx`, `offline-status.tsx`, and `providers.tsx` enforce manual passphrase creation/unlock instead of automatic trusted-device workspace restoration bounded by signed grants, explicit logout, and account switching.
4. **Checkout & sync engine already exist**: `src/features/offline/services/checkout.ts` and `src/features/offline/core/sync.ts` provide atomic Dexie checkout, stable UUIDs, pending receipts, and bounded cross-tab leased synchronization.

## Implementation Sequence

### Phase 1: Repair & Verify Provisioning (Backend Config + Provider Error & Renewal Handling)
- Inspect and repair `OFFLINE_SIGNING_PRIVATE_KEY_BASE64` in backend `.env` using valid PKCS#8 EC P-256 PEM (base64-encoded), retaining any prior public verification keys in `OFFLINE_VERIFICATION_KEYS_JSON` if outstanding grants exist.
- Verify live `/api/v1/offline/provision` via Next.js BFF for both **Admin** (with business/branch scope) and **Cashier** (derived from JWT scope).
- Coalesce concurrent provisioning/renewal calls, discard stale responses from switched operator/branch scopes, automatically retry provisioning once after `SESSION_RENEWED_RETRY_REQUIRED`, distinguish expired routing cookies from confirmed backend denials (`401`/`403` vs `0`/`502`/`503`/`504`), and surface actionable errors without overwriting them with fallback lookups.

### Phase 2: Automatic Workspace Preparation & Trusted Offline Restoration
- On verified online login and branch selection, automatically save the active operator, business, branch, and device scope in Dexie `metadata` alongside atomic grant + complete catalog snapshot installation (`installProvisioning`).
- Require valid signed `ES256` grant, matching scope, clock-rollback validation, and complete catalog snapshot (no separate offline passphrase for trusted online-prepared registers; retain backward compatibility / recovery unlock without deleting saved records or breaking upgrades).
- On offline cold/warm restart (`/`, `/login`, or protected POS routes when `/api/session` is unreachable / 5xx / expired 7-day `suntech_session` inside a valid 30-day grant), automatically verify saved permission and catalog and restore the existing POS workspace + held drafts.
- Persist explicit logout, account switches, and confirmed authorization rejection (`rejectedAt`) across tabs and browser restarts so an explicitly logged-out or rejected operator is never silently restored offline.

### Phase 3: Outages, Reconnection & Automatic Synchronization
- Determine server reachability using actual HTTP/BFF outcomes rather than `navigator.onLine` alone.
- On reconnect, verify/renew server session, drain eligible outbox queues using the existing cross-tab lease and 100-item request cap (`/orders/sync-v2`), then invalidate/refresh scoped TanStack Query caches (`catalog`, `orders`, `shifts`, `admin-dashboard`, `reports`).
- Keep recovery of previously saved sales (viewing receipts, encrypted backup export, retry/reconcile) accessible even when new offline intake is expired or paused.

### Phase 4: Minimal UI & Help-Area Maintenance Controls
- Replace the intrusive setup dialog / `"Offline setup"` badge / separate offline login prompt with a minimal, responsive, non-intrusive status indicator using the existing design system (`#0052FF` / `#F8FAFC`):
  - **Online** (green)
  - **Offline** (amber)
  - **Syncing** (subtle spinner/loading)
  - **Offline · N pending** (only when `pending > 0`)
  - **Needs attention** (only when genuine review/block/error requires operator action)
- Move scoped diagnostics, encrypted backup/restore, manual sync retry, and review/recovery queue controls cleanly into the existing Admin and Cashier Help pages (`/admin/help`, `/pos/help`), keeping all UUIDs and technical storage details out of the normal checkout view.
- Audit and fix horizontal overflow, modal responsiveness, and browser autofill issues on desktop, tablet, and mobile viewports.
- Verify production service worker (`suntech-sw.js`) registration and neutral shell availability.

### Phase 5: Financial Invariants, Full Verification & Documentation
- Preserve existing UI, routes, real variant cards, optional shifts (`shiftId: null`), negative stock, whole-BDT `COD`/`BKASH`/`NAGAD`/`BANK` payments, 5-held-drafts rule, legacy HTTP reconciliation (`ST-F01`–`ST-F13`), and zero artificial completed-sale caps.
- Execute all 20 scenarios from `docs/offline.md` for Admin and Cashier independently against a production Next.js build (`npm run build`), real NestJS backend, and PostgreSQL, including 101+ offline sales replay, cold restarts, two-tab race tests, lost responses, failed storage writes, and viewport checks.
- Perform full bug audit, update `AGENTS.md` and `docs/offline/SUNTECH_POS_PWA_OFFLINE_MASTER_SDD.md`, and report verified vs unverified results honestly.
