# SunTech POS — Simplify and Automate the Entire PWA & Offline System

## 1. Objective

Review the existing frontend, backend, AGENTS.md, offline master SDD and implementation reports before making changes.

The current offline implementation is unnecessarily complicated for end users. SunTech POS is primarily a private business application used by trusted Admin and Cashier operators.

I want a seamless, automatic, local-first POS system. Neither Admin nor Cashier should need technical knowledge about offline functionality.

**Offline functionality must be an invisible infrastructure layer, not a separate workflow.**

## 2. Remove unnecessary user-facing complexity

Remove the following from the normal Admin and Cashier experience:

- Manual register preparation.
- Refresh setup button.
- Mandatory offline passphrase creation.
- Separate offline register login.
- Manual operator and branch selection for offline recovery.
- Mandatory manual synchronization.
- Device IDs, branch UUIDs and internal identifiers.
- Technical storage information.
- Large offline setup dialogs.
- Unnecessary security explanations and warnings.
- Backup and restore controls from the normal checkout experience.

Keep backup, recovery and diagnostic functionality in an appropriate maintenance area, accessible only when necessary. Do not destroy existing recovery capabilities or saved financial records.

Do not introduce another complicated settings page.

## 3. Required automatic workflow

### When Admin or Cashier logs in online

Normal login
→ Existing business and branch selection
→ Automatically initialize IndexedDB
→ Automatically prepare the current operator and device
→ Automatically obtain offline permission
→ Automatically download and store the required branch data
→ Automatically prepare the PWA application files
→ User continues normal POS operations.

No extra password, setup button, confirmation dialog or manual action should be required.

Both Admin and Cashier must follow this behavior.

When Admin switches business or branch, automatically prepare and load the correct scoped data.

### When the internet or backend becomes unavailable

Connection unavailable
→ Automatically detect the failure
→ Use locally saved data
→ Continue displaying the existing POS interface
→ Continue checkout
→ Save completed sales in IndexedDB.

Do not redirect an already authorized operator to a separate offline login or register selection screen just because connectivity was lost.

Do not rely exclusively on navigator.onLine. Wi-Fi may be connected while the backend is unavailable.

Distinguish temporary connection failures from genuine authentication or permission rejection.

### When the connection returns

Backend becomes reachable
→ Automatically verify or renew the existing server session
→ Automatically resume synchronization
→ Upload pending sales in batches
→ Confirm successful sales
→ Refresh local catalog and affected online data.

No Sync Now button should be necessary for normal operation.

A retry button may appear only when automatic recovery genuinely requires assistance.

### When the application is reopened offline

Automatically restore the previously authorized operator, selected business and branch on that trusted browser/device.

Load the existing POS page with saved catalog data, unfinished carts and pending sales.

Do not require a separate offline passphrase.

This automatic continuation must only apply to a previously authorized operator with valid offline permission. Explicit logout, account switching, confirmed suspension, permission rejection and expired offline authority must remain effective.

Never silently log a different operator into the previous operator's workspace.

## 4. Checkout architecture — non-negotiable

Every new catalog sale and custom sale must follow the same flow:

Checkout
→ Validate existing business rules
→ Save sale, receipt, outbox and stock changes atomically in IndexedDB
→ Complete the local checkout
→ Synchronize automatically when the backend is reachable.

IndexedDB must be used first, whether the application is online or offline.

Do not create separate checkout implementations for online and offline users.

Do not introduce any artificial limit on the number of completed offline sales.

The backend's batch limit is only an upload-request limit, not a checkout limit.

Retain stable sale IDs, idempotency, duplicate prevention and safe retry behavior.

Never report checkout success if the local database save fails.

Never silently discard an unresolved financial record.

## 5. Simplify security without removing essential protection

Remove user-facing security steps that are unnecessary for trusted business devices.

However, preserve:

- Existing authentication and role permissions.
- Business and branch data isolation.
- Server-issued offline authority, automatically obtained and renewed.
- Existing signed permission verification.
- Thirty-day offline capability under the configured permission policy.
- Explicit logout and account switching.
- Protection against duplicate sales.
- Safe financial transactions and recovery records.

Do not store plaintext passwords, expose refresh tokens to JavaScript, fabricate offline permission, or bypass backend authorization.

Security should operate automatically behind the scenes rather than becoming an additional cashier workflow.

## 6. Minimal UI requirement

Replace the current large offline setup modal with a small, clean, non-intrusive connection indicator using the existing website's design system.

Normal states:

- Online — green indicator.
- Offline — amber indicator.
- Syncing — subtle loading indicator.
- Offline · 3 pending — only when pending sales exist.
- Needs attention — only when a genuine issue requires intervention.

Do not show technical terminology or long explanations.

Do not interrupt checkout with unnecessary notifications.

Fix horizontal overflow, broken modal responsiveness, visible UUIDs, unnecessary scrolling and browser autofill appearing in unrelated fields.

Preserve the existing website design, typography, colors, layout and responsiveness.

## 7. Investigate the current setup failure

The current application creates the suntech-pos-offline-v1 IndexedDB database with 13 object stores, but displays:

"Sign in online and prepare this register before taking sales."

"No prepared register was found."

The operator is already signed in online.

Investigate the actual root cause instead of simply hiding these messages.

Inspect:

- features/offline/ui/offline-provider.tsx
- features/offline/ui/offline-status.tsx
- features/offline/ui/offline-access.tsx
- features/offline/core/grant.ts
- features/offline/core/bootstrap.ts
- features/offline/pwa/entry.tsx
- Authentication hydration and tenant selection.
- The existing POST /offline/provision endpoint.
- Backend configuration and signing-key availability.
- Frontend environment flags.
- Request failures, token refresh and stale responses.

Automatic provisioning already exists in the provider, so determine why it is not completing successfully.

Do not confuse an initialized IndexedDB schema with a successfully downloaded catalog and valid offline permission.

Fix the underlying failure and implement automatic recovery.

If provisioning genuinely cannot succeed, provide a short, actionable error rather than pretending offline selling is available.

## 8. Preserve everything else

Do not redesign or unnecessarily modify any existing feature.

Preserve:

- All existing routes and pages.
- Admin and Cashier dashboards.
- Normal login and logout.
- Business and branch management.
- Product cards.
- Variant selection.
- Barcode and product search.
- Catalog and custom checkout.
- Payment methods.
- Hold and resume cart.
- Receipts and printing.
- Refunds.
- Optional shifts.
- Negative-stock behavior.
- Expenses, advances, payroll and reporting.
- Existing API contracts and database compatibility.

Use the already patched backend APIs.

Avoid further backend changes unless a genuine blocker makes one necessary. If required, explain the exact reason and keep the change minimal.

Do not add more dependencies, database models, APIs or architectural layers merely to implement automatic behavior.

Prefer simplifying existing code over adding another abstraction.

Do not enable unfinished offline financial features without their required correctness checks. Existing online functionality must remain available.

## 9. Bug audit

After implementation, inspect the entire affected system for:

- Race conditions.
- Stale asynchronous responses.
- Infinite request loops.
- Unnecessary API calls.
- Duplicate synchronization workers.
- Incorrect React effect dependencies.
- Memory leaks.
- Stale catalog and inventory.
- Cross-business or cross-operator data leakage.
- Lost carts.
- Duplicate checkout.
- Duplicate refunds.
- Incorrect receipt amounts.
- Authentication and token-refresh problems.
- Service Worker caching problems.
- IndexedDB migration and storage failures.
- Multi-tab conflicts.
- Reconnection and synchronization failures.

Fix confirmed issues without introducing unrelated feature changes.

## 10. Mandatory testing

Test both Admin and Cashier independently.

Run existing regression tests, new tests, TypeScript checks, lint checks and production builds.

Test the actual application in a browser.

Required scenarios:

1. Normal online login automatically prepares offline functionality.
2. No separate setup or passphrase is required.
3. Products and variants are automatically stored locally.
4. Internet disconnects during normal use.
5. Backend stops while the frontend remains available.
6. Both servers stop and the prepared PWA reopens offline.
7. Checkout works offline.
8. Custom sale works offline.
9. Pending sales survive browser restart.
10. More than 100 offline sales can be recorded and uploaded across batches.
11. Reconnection automatically synchronizes all pending sales.
12. Repeated synchronization creates no duplicate orders.
13. Two tabs cannot complete the same cart twice.
14. A lost server response does not create a second sale.
15. Branch switching preserves correct data isolation.
16. Explicit logout prevents automatic unauthorized reopening.
17. Expired or revoked offline authority is handled safely.
18. Existing online features continue working.
19. Existing pending sales survive the upgrade.
20. No horizontal overflow or broken UI on desktop, tablet or mobile.

Test PWA using a production build, not only Next.js development mode.

Do not clear IndexedDB to hide migration or recovery problems.

If a test cannot be executed, report it as unverified rather than passed.

## 11. Update documentation

Update the master SDD and AGENTS.md to establish automatic offline behavior as the canonical architecture.

Remove outdated requirements for mandatory manual register setup, separate offline passphrases and normal-user synchronization controls.

Document the simplified flow, necessary internal safeguards, confirmed bug fixes, test evidence and remaining limitations.

## Final instruction

The Admin and Cashier should simply use SunTech POS.

They log in normally, select their branch if required, sell products and manage their business.

The application automatically handles online/offline transitions, local storage, authorization preparation, data caching, synchronization and recovery.

Keep the existing user experience intact.

If a proposed implementation substantially changes an existing business workflow or introduces unnecessary complexity, do not retain that change. Explain the issue and preserve the original workflow.

Implement, test, audit and fix the system. Provide an exact report of what changed and what was verified.
