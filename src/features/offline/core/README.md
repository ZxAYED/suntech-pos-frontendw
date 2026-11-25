# Offline core: source map and failure rules

These modules run behind the existing POS screens. They do not add a second checkout page.

| File | Job | Failure rule |
| --- | --- | --- |
| `../db/offline-db.ts` | Additive Dexie v1 → v2 migration; all local business records share one database | Never delete the database to fix login or an upgrade |
| `scope.ts` | Operator/business/branch/device keys, stable JSON, SHA-256 fingerprints | Empty/broad scope is refused |
| `grant.ts` | Verify ES256 signed permission; trusted workspace auto-authorization & legacy PBKDF2 unlock; persistent known denial | An outage is different from a confirmed denial; logout, switch, or denial disables auto-restore until fresh online verification |
| `bootstrap.ts` | Verify complete shop download, publish atomically, read local catalog/history | Incomplete download leaves the last complete snapshot intact |
| `cart.ts` | Active/held cart compare-and-swap and legacy copy migration | A stale tab cannot overwrite the latest revision; five held carts is the old UI rule |
| `checkout.ts` | Commit immutable sale, original receipt, outbox, stock change and cart finalization together | A failed local transaction means no completed sale; keep the cart |
| `sync.ts` | Scoped lease, fencing number, bounded batches, retries and per-sale acknowledgments | Unknown responses keep original IDs; real conflicts enter review |
| `backup.ts` | Password-encrypted export and same-operator restore | Restore never issues fresh permission or new sale IDs |
| `../services/checkout.ts` | Connect old screens to this writer; preserve online price preflight | New sales never call legacy `/orders/catalog` or `/orders/custom` |

## Names to learn

- **Atomic transaction:** All related database writes succeed together or none succeed.
- **Compare-and-swap:** Save only if the cart revision still equals the revision the screen read.
- **Outbox:** A durable list of local events that still need server processing.
- **Idempotency:** Repeating the same sale ID must not repeat its financial effect.
- **Lease:** Temporary permission for one tab to upload a batch.
- **Fencing number:** A newer lease has a higher number. An old tab cannot overwrite the newer result.
- **Canonical JSON + SHA-256:** Sort object keys consistently, then fingerprint the immutable saved upload content.
- **Snapshot rebase:** Replace the stock base and remove only local changes explicitly included in that same server snapshot.
- **Authenticated encryption:** AES-GCM both hides backup contents and detects changes made without the password-derived key.
- **PBKDF2:** Slows password guessing by doing repeated work when deriving a key/hash.

## Behavior that matters

Every new sale saves locally before its financial upload. An online-only read-only preflight may check the current price first. Offline captured prices require an explicitly enabled server policy. No code here limits how many completed sales may wait in the queue; 100 is a per-request upload limit.

A local receipt has a `LOCAL-<original UUID>` number and `PENDING` status. A server invoice is stored separately only after a verified per-sale acknowledgment. A response with the right amount but the wrong variant is a review case, not successful synchronization. Stock overlays stay after acknowledgment until a complete server snapshot proves they are included in its stock base.

The grant authenticates a particular operator, business, branch and original device. Verified online sessions activate trusted workspace auto-restore (`active-workspace` metadata) so cashiers and branch-selected admins continue operating across reloads and outages without a second offline passphrase. Legacy PBKDF2 unlock remains supported for existing encrypted/locked unit recovery tests. Neither mechanism encrypts the entire IndexedDB database or defends an OS whose browser/system account is compromised; explicit Sign Out, account switching, or server rejection immediately blocks offline auto-restore while keeping pending sales intact.

If the server explicitly rejects authorization, the stored grant is marked rejected and auto-restore is deactivated. Switching off Wi-Fi cannot remove that marker. A later online provisioning request can clear it; an older request that began before the denial cannot. Recovery-only tools in Help can inspect or export saved evidence without granting new-sale permission.

An exported file must actually be copied away from the till. Merely generating the file is not proof that an independent backup exists. Restore preserves original IDs, seller and device; the original operator must authenticate before upload. Manager recovery of another operator is a separate protocol. Restored active/held cart snapshots are kept as recovery evidence rather than silently becoming new checkout work. Otherwise an old backup could bring back an already paid cart.

## Automated evidence and limits

Run `npx vitest run src/features/offline/core/__tests__`. These tests use the actual production Dexie repository with fake-indexeddb, actual WebCrypto signatures/encryption, and actual checkout/sync functions. They include transaction rollback, database reopen, two database connections, 101 local sales, 1,257 sales uploaded in 13 bounded batches, dropped responses, partial acknowledgment, signature/tamper checks, authorization denial, and encrypted restore.

These are integration tests of the storage and service code, not proof of a particular physical till/printer hardware pilot. Playwright Chromium E2E tests under `e2e/` run against the production offline shell (`public/offline-assets/*`) and `e2e/test-server.mjs` (covering online/offline catalog & custom checkout, cold restarts, dropped sync recovery, two-tab draft locks, explicit logout lock, Admin branch provisioning + Help panel, and desktop/tablet/mobile zero overflow). Live Next.js + NestJS + PostgreSQL HTTP integration is separately exercised by `SuntechPOS-backend/scripts/test-full-stack-http.cjs`. Physical thermal printer output and multi-day store pilot remain manual field verifications.

## Operational limits retained for the next phases

- Cached server history is an explicitly partial window. Local records are paginated/countable; neither is the whole business report.
- Foreground synchronization resumes while the application is open; the service worker is not a guaranteed background process.
- Same-operator recovery is implemented. Cross-operator manager upload needs an approved audited authorization model.
- Export encrypts one whole scope in memory. A measured streaming/chunked backup design belongs to long-outage capacity hardening.
- Local clock rollback detection is useful evidence, not a trusted hardware clock.
- Historical shift/refund/payroll changes require their own business protocols. They are not silently queued as sales.
