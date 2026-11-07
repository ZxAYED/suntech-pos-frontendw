# SunTech POS — Frontend Timestamp and Event-Time Implementation Plan

Audit date: 2026-11-07, Asia/Dhaka. Frontend root: D:/Project/SuntechPos-frontend/suntech-pos-frontend.

**Planning only. Not approved for implementation.** This document replaces the generic outline. No application code, dependencies, schemas, migrations, or backend files were changed to produce it.

## 1. Scope, evidence, and architecture

Requirements are recorded in [time.md](time.md), with IDs R1–R7. This plan covers the current online frontend and timestamp readiness for reading delayed orders. Full offline operation remains deferred.

### Consolidation decisions (7 November 2026)

This is the canonical combined plan. [time.md](time.md) is the canonical requirements document. The two versions of each document have been consolidated into these two files; duplicate versions were removed after review, as requested.

- The two requirements inputs contain identical text after line-ending normalization. Retain their scope and repair formatting and source attribution.
- Keep version 1's source inventory, API ledger, phase structure, test matrix and correct `__tests__` paths. Version 2's malformed test paths, flattened tables and truncated API-1 entry are not retained.
- Merge version 2's dashboard history/detail modal/manual refresh, stored-cash caveat, explicit-shift-ID guard, BFF response-envelope clarification, Phase 0 and implementation handoff gates. These extend the existing route and queries; they do not authorize a new management page or financial action.
- Keep A4/80 mm/Unicode/PDF regression checks. Prior review references to print defects are not confirmed current bugs without reproduction.
- Correct aged source claims: the legacy-confirmation controller route now exists locally. Remaining replay/audit concerns are still present. No deployed behavior was verified.

Evidence labels: **requirement** means behavior supplied in this task/documents; **source-present** means found locally; **proposed** means not implemented; **deployment-unverified** means no live target check; **historical baseline** means an earlier executed check, not validation of the proposed implementation.

### Evidence and limits

- Frontend HEAD inspected: 8fa7b46, plus its current working tree. Backend HEAD inspected: cdcde71, plus its current working tree at D:/Project/SuntechPOS-backend. Both contain uncommitted changes; HEAD alone does not describe the audited code.
- Read the frontend root AGENTS.md. No additional AGENTS.md appeared in the inspected frontend or backend file inventory. Its installed Next.js documentation rule applies.
- Installed Next.js is 16.4.3. Read node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md, 15-route-handlers.md in the same directory, and node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md.
- Relevant Next.js consequences: Client Components also participate in initial server rendering; explicitly specify timezone and avoid inconsistent render-time clocks. Browser API access belongs in existing client event/effect boundaries. Preserve the BFF's awaited route params, HttpOnly cookie handling, and no-store fetches. Vitest is suitable for pure helpers and synchronous code; the current suite does not establish browser behavior or async Server Component correctness.
- Read backend docs/time.md and the November 7 Timestamp and Offline Event-Time Implementation Roadmap, including its frontend handoff. No separate SUNTECH_POS_COMPLETE_CHAT_CONTEXT_HANDOFF_2026-11-07.md was found in the current frontend/backend inventory. The supplied version-2 document reports that handoff as its source for dashboard history/details/manual refresh. This merge carries that scope from the requirements files supplied for comparison; it does not claim independent access to the handoff. The deliverable is for the frontend.
- Read docs/Frontend_Doc.md's online-only boundary and relevant help-document exclusions. Those documents are secondary to the user's scope and current code.
- Queried the existing graphify graph with its vocabulary: auth, date, order, receipt, reports, shift. It contains stale Redux API and demo references. Used current files rather than treating that old graph as authoritative.
- API verification below is **source-contract verification** against current controllers, DTOs, services, selectors, and schema. No authenticated live API requests, database queries, migration checks, or deployed-version verification were executed. A local field or migration file is not proof of deployment.
- The original full source audit ended at 14:56 Asia/Dhaka on November 7. During consolidation, a targeted source recheck at **15:23 Asia/Dhaka on November 7** inspected changed order service/controller code, offline policy, dashboard summaries, shift routes, and frontend dashboard/shift/logout adapters. That recheck supersedes the old route claim and refreshes the hashes below. Other findings retain their original audit provenance. Both repositories have the same HEADs and dirty worktrees; implementation must recheck the actual target revision and deployment.

### Existing architecture to reuse

- App Router pages under src/app/(dashboard) are thin route wrappers or client pages. Catalog/custom checkout and history are shared between admin and cashier routes through feature components.
- TanStack React Query owns API queries/mutations. Axios in src/lib/api-client.ts targets the same-origin /api/v1 BFF and unwraps the backend success envelope's data. Blob exports deliberately bypass unwrapping.
- src/app/api/v1/[...path]/route.ts proxies upstream requests, forwards cookies/idempotency and tenant headers, strips access tokens, maintains routing-session cookies, and uses no-store.
- Redux holds auth, tenant, cart, shift, and saved drafts. Tenant hooks and query keys control current scope. Existing financialOperations and registerGuard preserve online uncertain-outcome recovery. Reuse these; do not introduce another state store.
- Receipt rendering is local: ReceiptDialog, generateReceiptText, generateReceiptHtml, and generateReceiptPdfBytes. Server sales/payroll reports download through /reports/export.
- Intl is available; date-fns is already installed but plain date-fns formatting does not supply a business timezone. One small pure time utility is sufficient. No timezone library, global clock store, or backend-for-time service is required.
- Vitest 3.2.7 uses the node environment and @ alias from vitest.config.ts. No browser DOM test stack is configured. Existing suites include pure helpers, API adapter tests, and simulated/source-level UI invariants. Those are useful regressions but not proof of actual rendered interactions.

### Working-tree protection

Before this task, docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md was deleted and src/redux/actions/draftsActions.ts, src/redux/reducers/draftsReducer.ts, and src/redux/storage.ts were modified. docs/time.md and docs/time_plan.md were untracked. Preserve all of these unrelated states. The deleted integration guide was not restored or used as a current contract. Backend changes belong to its existing work and must not be modified by this frontend plan.

## 2. Confirmed requirements mapped to outcomes

| Requirement | Frontend outcome | Planned phases |
| --- | --- | --- |
| R1 — timestamp ownership | Separate raw event/persistence values, consistent Dhaka presentation, safe missing-data behavior; no client timestamps added to online financial/auth writes | A, B, C, E, F |
| R2 — business calendar | Supported filters preserve Dhaka day/month boundaries and endpoint-specific semantics; report selection matches request meaning | A, D, E |
| R3 — checkout/history/receipts/reports | Every display/reprint preserves original sale time; financial values and product visuals remain unchanged | B, C, D |
| R4 — shifts/authentication | Accurate today/older/closed shift and latest-session status; same-dashboard history filters/details; manual refresh with truthful partial-error/stale state; truthful local logout. Latest values are not a full auth-event history | E, F1, F2, F3 |
| R5 — other financial dates | Expenses use spentAt, advances use takenAt, payroll periods/payment times remain separate | E |
| R6 — timestamp readiness | Read delayed orders correctly and document future contracts; no new offline checkout, outbox, or sync worker | B, C, G |
| R7 — delivery/verification | Small changes, actual-function tests, manual workflow checks, explicit backend release dependencies | All |

Requirements do not authorize a product redesign, full offline POS, a new admin shift-management page, or a fabricated login-history endpoint.

## 3. Current findings: implemented, missing, bugs, dependencies

“Present” means observed in source; “baseline passed” below refers only to the existing test suite.

### Already implemented and reusable

| Area | Evidence | Preserve/reuse |
| --- | --- | --- |
| Online checkout | useCheckoutMutation, useCatalogCheckout, useCreateCustomOrder in src/features/pos/api/use-pos.ts | Existing catalog/custom routes, payloads, idempotency keys, invalidations; no required occurredAt |
| Event-time preference | mapOrderToReceipt and mapOrderToOrderRow in src/features/pos/view-models.ts; terminal completeSale | Prefer sale time for customer-facing dates, but repair loss of persistence time |
| Server-backed history | useOrders validates financial identity and maps actual API results | Keep pagination, filters, role scope, invoice/item data, refund limits |
| Receipt output | src/features/pos/utils/print-receipt.ts; src/features/pos/components/receipt-dialog.tsx | Existing text/HTML/native PDF/Bengali print fallback, styles and amounts |
| Shift operations/history | useActiveShift, useShifts, useOpenShift, useCloseShift; ShiftsPage | 404 active shift becomes null; other errors remain errors; retain uncertain-operation recovery |
| Latest cashier session data | Backend AdminDashboardService.getOverview returns cashierLoginStatuses | Frontend can consume these optional fields through its existing dashboard query |
| Auth/security | useLoginMutation, useMeQuery, useSignOut, apiClient, BFF, Providers | Existing credentials/cookies, session cleanup, no automatic financial POST replay |
| Audit date filtering | AuditLogsView converts day inputs using +06:00, inclusive end of day | Correct timezone intent; centralize/validate without changing audit endpoint semantics |
| Financial dates | ExpenseRecord has spentAt and createdAt; advances carry takenAt; payroll has paidAt/history createdAt | Preserve true field meanings and all arithmetic |
| Online retry protection | src/lib/financial-operation.ts and src/lib/register-guard.ts | Existing scoped keys, immutable retry snapshots, no duplicate completion after ambiguous responses |
| Backend date improvements | Current orders/reports/dashboard use half-open bounds; ExportService.salesTable uses formatDhakaDateString; final recheck found operation-time capture, strict event parsing, expense date-only handling and sync result additions | Present local changes are not deployment evidence; do not reimplement these backend responsibilities in the frontend |

### Confirmed frontend bugs and limitations

| ID | Finding and exact source | Consequence / correction |
| --- | --- | --- |
| B1 | Date rendering across orders, shifts, receipts, reports, payroll, expenses, dashboard, audit, and super-admin uses toLocale* without timeZone | Locale does not force Dhaka; introduce explicit-zone formatting at all affected production displays |
| B2 | validateAndMapOrder in src/features/pos/api/use-pos.ts assigns occurredAt into createdAt and drops occurredAt; domain Order lacks it | Original backend persistence time disappears; preserve both fields before mapping views |
| B3 | mapOrderToOrderRow, mapOrderToReceipt and terminal completeSale store sale time under a property named createdAt | Ambiguous semantics across raw order, row, and receipt objects; migrate consumers together |
| B4 | Many renderers call new Date directly; guards check truthiness only | Invalid dates leak into UI/receipts; null can be misinterpreted if passed to Date; shared safe formatting |
| B5 | useAdvances in src/features/hr/api/use-hr.ts falls back to new Date().toISOString(); mapAdvanceToAdvanceRow overloads createdAt with takenAt | Fabricated current event time and lost persistence meaning; preserve raw fields and show unavailable instead |
| B6 | ReportsDashboard initializes year to the device year and sends it with rolling ranges. Backend resolveDhakaDateRange gives explicit year precedence except today/yesterday | Daily/weekly/monthly/quarterly can become a calendar-year query; normalize one effective period |
| B7 | ReportsDashboard.handleExport/useExportReport send range/week, drop month='current', and can omit month. ExportReportQueryDto requires numeric month/year and has no range/week | Rejected export or a different report period; fix frontend compatibility and document unsupported ranges |
| B8 | ReportsDashboard omits locationId for “All Branches”; buildReportQueryParams then falls back to tenant.locationId. Export independently omits branch | Screen and export can target different branches; retain explicit all sentinel internally and omit it only at transport |
| B9 | usePayrollSummary, useExpenseSummary, ReportsDashboard, ExpensesManager, PayrollManager and export defaults use host getMonth/getFullYear | Incorrect defaults around Dhaka month/year change; use Dhaka calendar parts, preserve explicit selected periods |
| B10 | mapShiftToViewModel drops autoCloseReason, isOverdue, closingCashNotProvided and auto-close IDs; ShiftFilters lacks fromDate/toDate/cashierId | Available server information/filtering is inaccessible; extend the existing adapter narrowly |
| B11 | BFF proxyRequest catches upstream logout transport failure and returns HTTP 200 “Logged out locally”; useSignOut considers any fulfilled request revoked | The existing disconnected-revocation warning is skipped; expose a BFF-local confirmation flag, preserving cleanup |
| B12 | AuditLogsView.formatAuditTimestamp treats future dates as “just now”; invalid input conversion can fall back to unvalidated strings | Keep absolute time accurate; handle future relative labels and invalid ranges without sending invented instants |
| B13 | DashboardOverviewResponse in the frontend only types legacy kpis/drawer; AdminDashboardPage omits current server shift/session extensions | Add read-only, compatible latest-session/shift information using existing components, not new endpoints |
| B14 | usePayrollSummary returns request-derived month/year despite response month/year | Server default period cannot become authoritative in the UI; use returned period when no explicit period was selected |
| B15 | AdminDashboardPage has no useShifts history, selected-row detail dialog, or explicit refresh control | Missing requirements-file scope: implement on the existing dashboard using supported list data and actual query refetches; Phase F2 |
| B16 | Backend src/admin/admin-dashboard.service.ts getOverview maps todayShifts expectedAmount/cashSales/advancesOut from stored rows, while drawer totals have separate aggregate queries | Stored OPEN shift figures cannot be advertised as live drawer totals; use snapshot labels or status/time only. Backend calculation changes are outside this frontend task |

### Missing or conditional functionality

- No shared timestamp/business-date utility or dedicated timezone-boundary suite.
- No full login/logout event-history API or auth-event writer was found. AuthService updates latest cashier session fields, but does not append authentication events to AuditLog. Latest-value fields cannot reconstruct multiple sessions.
- No frontend /offline/bootstrap or /orders/sync consumer, IndexedDB queue, sync worker, offline PIN flow, or offline-shift engine was found. next.config.ts disables PWA; Providers unregisters service workers.
- SavedDraft.createdAt is an unpaid-cart save time. Saved drafts are capped at five, and storage failures are swallowed. financialOperations records are online retries in sessionStorage. Neither is suitable for multi-day paid offline sales.
- No production caller of src/components/common/date-range-picker.tsx was found. Its local-time presets are a future integration concern; do not rewrite an unused component as part of this rollout.
- Create/update expense APIs already accept spentAt, but ExpensesManager has no incurred-date editor. Preserve the API capability and historical reads; adding a new editor is not necessary to complete timestamp normalization and is deferred absent explicit scope.
- Full session history and arbitrary-period server exports are backend-gated; do not mark those complete with mock data or frontend-only approximations.

## 4. Verified API contract and compatibility ledger

All paths below are relative to /api/v1. The browser uses apiClient; it must not directly contact the backend or add a token store. Backend successful JSON responses use an outer success/message/data/timestamp envelope; apiClient returns the inner data. The outer timestamp is response metadata, not sale/authentication time.

### Current source contracts

| Route / source | Observed request/response behavior | Frontend decision |
| --- | --- | --- |
| POST /orders/catalog, POST /orders/custom — backend src/orders/order.controller.ts, dto/create-catalog-order.dto.ts, dto/create-custom-order.dto.ts, OrdersService writers | Existing checkout fields and optional nullable shiftId; no writable online occurredAt/createdAt required. Unified order select returns occurredAt, createdAt, updatedAt. Final recheck: catalog/custom entry methods capture operationTime and pass it to their writers | Keep current payloads timestamp-free. Add missing read types; do not send createdAt/updatedAt. Verify deployed behavior rather than assuming the local edits have shipped |
| GET /orders and GET /orders/:id — dto/get-orders.query.ts, getOrders/getOrderById, unifiedOrderSelect/presentOrder | Date selection by occurredAt; supports range, month, week, year, scope/ownOrders/cashierId and tenant/branch/pagination. No from/to or dateBasis in this DTO | Existing UI range controls remain. Do not add arbitrary date-range or received-date query parameters |
| GET /reports/dashboard, /analytics, /transactions — report.controller.ts, report.service.ts and DTOs | Uses calendar/rolling period inputs; transactions return event and creation times and order-like items | Reuse existing queries/mapping. Preserve raw timestamps; correct parameter precedence rather than locally refiltering paginated rows |
| GET /reports/export — dto/export-report.query.ts, ExportService.export/salesTable/payrollTable | Required month integer 1–12 and year 2000–2100; type sales/payroll, format csv/pdf; optional search, locationId, businessId. No range/week; month-based server table | Valid monthly export only until backend contract expands. Do not silently claim an export matches a rolling/week view |
| GET /shifts — dto/list-shifts.query.ts, ShiftService.list | fromDate/toDate are YYYY-MM-DD Dhaka days; end day inclusive via next-day exclusive backend bound. status, cashierId, businessId/locationId, page/limit. Returns data/meta, openedAt/closedAt, autoCloseReason, isOverdue, closingCashNotProvided | Extend existing ShiftFilters and mapping; maintain user/tenant-scoped query keys. Cashier can view only their own shifts |
| GET /shifts/active; POST /shifts/open; POST /shifts/:id/close and /shifts/close | Current online server times, nullable close data, optional auto-close result IDs. 404 means no active shift. Same-day duplicate protection and previous-day auto-close already in source | No client time payload, local shift closure, or historical replay. Preserve opening/closing amounts and existing retry snapshots |
| GET /admin/dashboard/overview — AdminDashboardService.getOverview | date business-date string; legacy kpis/drawer plus optional todayShifts, todayShiftCounts, olderOpenShifts, olderOpenShiftCount, lastClosedShift, cashierLoginStatuses. Status rows: cashierId, fullName, publicId, isLoggedIn, nullable lastLoginAt/lastLogoutAt | Extend existing response type and read-only UI. Missing optional field means unsupported/unavailable, not no staff or everyone logged out |
| GET /admin/dashboard/recent-activity | tickets include occurredAt; current response does not promise order.createdAt | Display event time only; no invented received time or fabricated delay |
| POST /auth/login, /auth/logout, /auth/refresh, /auth/force-logout — AuthService/AuthController | Cashier login/session state server-owned; logout returns loggedOut:true, force-logout returns loggedOut:true/cashierId. No per-event history. Online logout does not close shifts | Preserve auth. HTTP success is not proof of a new logout timestamp. Force-logout route existence does not require a new frontend button |
| GET /users/me, /users/cashiers — userProfileSelect/userPublicSelect and UserService.listCashiers | Public/profile selectors omit lastLoginAt/lastLogoutAt/isLoggedIn. Staff list adds createdAt/updatedAt/location, not session history | Do not attach imaginary fields to User or Cashier or expect useStaff to supply session data. Use dashboard status source |
| GET /audit-logs, /audit-logs/:id — AuditController/AuditReadService | Admin-only owned-business reads; filters actorId/action/entity and inclusive from/to instants against audit.createdAt. No auth events are currently generated by AuthService | Use explicit Dhaka day bounds adapted to inclusive to. Do not label current audit rows a login/logout history |
| /expenses create/update/list/summary — ExpenseService and DTOs | Optional spentAt; final recheck: create/update use parseStrictEventInstant, falling back to parseDhakaDateString for date-only input. List/summary use spentAt and Dhaka month bounds. Payroll-derived rows retain restrictions | Explicit-offset instants remain safe across older deployments; the new local date-only support means Dhaka midnight, but still needs deployment/DTO-path verification before relying on it |
| /advances and /payroll — HR services | Advance takenAt; payroll summary month/year and employee paidAt, history createdAt as payment processing time; month/year salary periods | Preserve period semantics and accounting. Unknown timestamps remain unknown |
| GET /offline/bootstrap — OfflineController/OfflineService.bootstrap | ADMIN/CASHIER scoped snapshot with serverTime, snapshotGeneratedAt, user/business/location/catalog/paymentMethods. Final recheck adds businessTimezone='Asia/Dhaka' and maxFutureSkewSeconds | Newly present local fields, deployment unverified. Do not fetch the entire catalog just to format time; a future consumer must tolerate older responses without policy fields |
| POST /orders/sync — SyncOrdersDto/SyncOrderItemDto, OrdersService.syncOrders | Envelope: deviceId, orders (1–100), optional admin businessId/locationId. Item: UUID-v4 clientOrderId, occurredAt, orderType, lines, tenderedAmount, optional nullable shiftId/payment/customer/notes/clientReceiptNumber. Final recheck returns data.serverTime/results; results include statuses, warnings, success/duplicate timestamps and optional errorCode/reconciliationId | No frontend runtime consumer. These additions now exist in local source; they are not merely roadmap fields, but are not yet a proven stable/deployed sync guarantee. See integrity limitations below |
| POST /orders/:id/confirm-legacy-sync — ConfirmLegacySyncDto, OrdersController.confirmLegacySync, OrdersService.confirmLegacySync | Registered locally for ADMIN/SUPER_ADMIN; body deviceId/reason/order, returns DUPLICATE, warnings, clientOrderId/orderId/invoiceNumber, occurredAt/createdAt/reconciliationId | Deferred recovery contract; do not call it from timestamp-readiness UI. See API-4 for unresolved evidence guarantees |

### Backend discrepancies and release dependencies

These are findings for coordination, **not backend implementation tasks for this frontend change**.

| ID | Current evidence | Required resolution / frontend guard |
| --- | --- | --- |
| API-1 | Final recheck: parseStrictEventInstant and timestamp-specific errors/skew tolerance are used by syncOrders; validateEnv supplies a 300-second default. Both sync/bootstrap use Number(value) with a truthy fallback to 300, so a configured zero is incorrectly replaced by 300. DTO validation can return VALIDATION_ERROR before the strict timestamp codes; parser accepts extra fractional precision then truncates it | Format/skew policy is partially implemented locally. Future integration needs settled validation order, documented precision, zero-tolerance tests and deployment confirmation; do not independently hardcode policy in frontend |
| API-2 | Final recheck: computeSyncPayloadHash and verifySyncReplay are used in normal and unique-conflict duplicate paths. However skew validation runs before duplicate lookup, absent stored identity fields are treated as matching, and the legacy-confirmation replay branch accepts an existing confirmation audit without comparing its fingerprint to the new payload | Do not call every current DUPLICATE “verified immutable replay.” Require the backend integrity/security fixes and concurrency tests before a paid-sales queue rollout |
| API-3 | Final recheck: nullable syncPayloadHash is written with orders; OFFLINE_ORDER_ACCEPTED audit creation occurs after createCatalogOrder/createCustomOrder return, outside their committed transaction. The successful result can fall back from missing createdAt to serverTime; duplicate timestamps can fall back to now | Hash integration is present but required evidence is not atomic in this snapshot. Audit failure could report rejection after a committed sale. No frontend retry may invent a new ID; require transactional evidence and truthful stored timestamps |
| API-4 | Consolidation recheck: POST /orders/:id/confirm-legacy-sync is now registered in order.controller.ts for ADMIN/SUPER_ADMIN; ConfirmLegacySyncDto requires deviceId, reason (5–500 characters), and nested original order. Service writes confirmation audit in a transaction and returns DUPLICATE with stored timestamps/reconciliationId. Existing-confirmation fingerprint comparison is present in this confirmation method, but normal verifySyncReplay still accepts a confirmation audit without comparing the incoming fingerprint. Material checks still compare total/payment/line count, not exact line evidence; read/check and confirmation are not shown under a row lock | The earlier missing-controller claim is obsolete. Route is source-present, deployment-unverified and not a frontend readiness integration. Full reconciliation UI stays deferred; future rollout still needs exact evidence/identity/replay and concurrency verification |
| API-5 | No full server auth history; latest timestamps are only current cashier state; profile selectors omit them | Latest-state frontend phase can ship independently. Full history needs a verified server event/read contract, preferably existing AuditLog infrastructure, with role/tenant scope and actual event writers |
| API-6 | Export supports calendar month/year only | Exact rolling/week/all-period exports require a backend contract change. Frontend compatibility behavior is specified in Phase D; do not invent from/to/range support |
| API-7 | Final recheck: expense create/update now parse explicit instants or Dhaka dates; shift open uses one operationTime for bounds/new opening/automatic closure and explicit close captures operationTime; catalog/custom checkout capture it too. General checkout captures time inside checkoutWithin | Newly present backend ownership improvements remain untested here; retry/midnight coverage, accepted parser precision and deployment are backend checks. Do not backdate server fields from frontend |
| API-8 | Local source is ahead of roadmap baseline in half-open ranges/export date labels but deployment is unverified | Verify actual read responses in a safe environment before exposing optional sections. Keep older-server optional-field handling |
| API-9 | Roadmap requires transactional offline evidence and real PostgreSQL duplicate/concurrency/rollback tests; the final snapshot still has specific evidence/replay gaps in API-2/API-3 | These are future backend offline release gates. Frontend baseline tests cannot satisfy them |
| API-10 | getOverview maps todayShifts money from stored rows; legacy drawer separately aggregates cash activity | Do not call OPEN-row financial snapshots live. Refreshing transport does not recompute backend stored totals. No frontend financial reconstruction |
| API-11 | ShiftController exposes both POST /shifts/close and /shifts/:id/close; ShiftService.close uses the current actor when no ID is supplied | Any already-authorized selected-cashier close must pass its exact ID. No new admin close action is added by this plan |

For reproducibility, the **15:23 consolidation recheck** recorded SHA-256 snapshots (backend-relative paths): src/orders/order.service.ts = 913C7F9335920D74EAC0C7DE859BFA1C768189D921F2BCFD0EFABE77EA8BB0E1; src/orders/order.controller.ts = 79B593A2FD4D4860A8DAE52A56E4435F0A842636F0CB408B1477E1AE6071A801; src/offline/offline.service.ts = 44BDD062E50AD7D9979D7E73BF3727BF9A00638B7CDED28564265E3A52586CD4. These supersede the original 14:56 hashes from version 1. Later edits can resolve findings; compare actual source rather than carrying old missing-feature classifications forward.

### Contract examples for implementation tests

These are schematic **current-contract fixtures**, not captured live responses:

- An order may contain occurredAt = 2026-11-01T18:10:00.000Z and createdAt = 2026-11-07T04:00:00.000Z. Sale display: November 2, 00:10 Dhaka; recorded display: November 7, 10:00 Dhaka.
- GET /shifts?fromDate=2026-11-07&toDate=2026-11-07 means openedAt >= 2026-11-06T18:00:00.000Z and < 2026-11-07T18:00:00.000Z.
- For the current audit API, the same visible day becomes from=2026-11-06T18:00:00.000Z and to=2026-11-07T17:59:59.999Z.
- A valid calendar-month export uses type=sales, format=csv, month=11, year=2026 and the selected business/optional branch/search. It does not include range/week.
- An older sync result can be { clientOrderId, status: "ACCEPTED", orderId, invoiceNumber, warnings: [] }. The final local service adds occurredAt/createdAt and data.serverTime, with errorCode on some rejected paths. A future adapter must handle optional/unknown fields without treating the outer envelope timestamp as order.createdAt; no adapter is introduced by this plan.

## 5. Exact frontend change inventory

Paths are relative to the frontend root. “New” denotes proposed files, not files created by this planning task.

### Production files to change

| File / symbols | Existing implementation | Planned modification and reuse |
| --- | --- | --- |
| src/lib/business-time.ts (new) | No shared business-time module | Small pure parser/formatter/calendar helper using Intl and explicit Dhaka timezone; Phase A |
| src/types/domain.ts — Order, Advance | Order only declares createdAt; advance event field not in base type | Add nullable/optional event-time read fields and represent missing timestamps honestly. Keep financial/security fields unchanged |
| src/features/pos/api/use-pos.ts — RawOrderApiPayload, CreatedOrder, validateAndMapOrder | Collapses event into creation time | Preserve occurredAt/createdAt separately; retain strict financial validation and actual response envelopes |
| src/features/pos/view-models.ts — OrderReceiptSource, OrderRowViewModel, ReceiptViewModel, mapOrderToOrderRow, mapOrderToReceipt | View createdAt means effective sale date | Explicit raw fields plus a single derived sale-time selection/provenance helper. Preserve names/identity/line snapshots |
| src/features/pos/components/terminal-workspace.tsx — completeSale, holdDraft, saved-draft display | Builds receipt manually; draft time uses browser locale | Carry both server timestamps into receipt; shared selection; Dhaka draft display only. holdDraft still records draft save time, not sale time |
| src/features/pos/components/custom-sale-view.tsx — checkout receipt handoff | Calls mapOrderToReceipt | Verify updated model flows unchanged; only adjust types/calls if necessary, no checkout behavior rewrite |
| src/features/pos/components/orders-workspace.tsx — OrdersWorkspace, detail Date row, list Date text, reprint callbacks | Lists ambiguous createdAt; details reuse row.order | Use sale time consistently; preserve recorded time in detail using existing Detail primitive; no layout redesign |
| src/features/pos/components/receipt-dialog.tsx — ReceiptDialog | Direct browser-local date rendering | Shared receipt sale-date formatter, preserving markup/styles and all monetary content |
| src/features/pos/utils/print-receipt.ts — generateReceiptText, generateReceiptHtml, generateReceiptPdfBytes | Three independent browser-local date expressions | Same event-time selection/formatting for text, print, native PDF; preserve printThermalReceipt/downloadReceiptPdf Unicode behavior |
| src/features/reports/api/use-reports.ts — buildReportQueryParams, useTransactionsReport, useExportReport, ExportReportParams | Conflicting periods, assumed export filters, host-year fallback | Testable normalized query builders within existing module; correct scoped parameters and actual month export contract; retain blob handling |
| src/features/reports/components/reports-dashboard.tsx — ReportsDashboard, reportParams, handleResetFilters, handleExport | Always sends default year; ambiguous all-branch/default month export behavior | One effective period, explicit all-branch intent, Dhaka display/defaults, truthful export compatibility |
| src/features/shifts/api/use-shifts.ts — ShiftFilters, useShifts, useShiftMutation | Existing generic query forwarding and mutation invalidation | Add supported fromDate/toDate/cashierId fields; keep scope; invalidate existing admin-dashboard query family after successful shift changes if its added session/shift panels need refresh |
| src/features/shifts/view-models.ts — ShiftApiRecord, ShiftViewModel, mapShiftToViewModel | Drops server auto-close/overdue metadata | Preserve metadata and nullable counted-close data without converting null to zero |
| src/app/(dashboard)/pos/shifts/page.tsx — ShiftsPage, history query, submitModal, active/history/advance dates | History pagination only; date formatting local; generic open-success toast | Narrow history date filters, formatted server dates, auto-close reason/uncounted state in existing cells or detail text; preserve all recovery forms |
| src/features/dashboard/api/use-admin-dashboard.ts — DashboardOverviewResponse and related types, useDashboardOverview | Legacy-only response type | Add exact optional server shift/session fields with nullability; reuse overview/recent-activity/inventory query handles for manual refetch and per-panel freshness; no new route |
| src/app/(dashboard)/admin/dashboard/page.tsx — AdminDashboardPage | Uses legacy overview/drawer and recent tickets | Format existing timestamps; add latest-session/today/older/last-closed sections, filtered paginated useShifts history, selected-row Dialog and manual refresh with panel freshness/error states. Retain KPI/card layout and existing Card/Table/Badge/DataState/Dialog components; clear selected rows on scope changes |
| src/features/hr/api/use-hr.ts — usePayrollSummary, usePayrollHistory, useAdvances, AdvanceBackendItem | Host current period, request-derived labels, fabricated advance time | Server-derived default payroll period; safe explicit selected period; preserve advance raw timestamps; reuse existing row mapping |
| src/features/hr/view-models.ts — AdvanceRowViewModel, mapAdvanceToAdvanceRow, mapPayrollToPayrollRow | Overloads createdAt; local Date for month label | Separate advance time fields; format salary period as month/year, not event instant; preserve paidAt/disbursedAt mapping |
| src/features/hr/components/payroll-manager.tsx — PayrollManager | Host defaults, direct paid/advance rendering | Dhaka/default-server period handling, safe payment/event display; preserve process/disburse payload and money logic |
| src/features/expenses/api/use-expenses.ts — useExpenseSummary, timestamp read types | Host current month/year defaults | Explicit Dhaka/default-server calendar handling as supported; no change to normalization sums or CRUD ownership |
| src/features/expenses/components/expenses-manager.tsx — ExpensesManager | Host initial period; direct spentAt display | Dhaka period and incurred-time display; preserve existing forms and intentional historical data |
| src/features/audit/components/audit-logs-view.tsx — formatAuditTimestamp, queryFilters | Local absolute dates, ad hoc UTC bounds, future-as-now relative display | Reuse time helpers; strict date-range validation; inclusive audit adapter; retain relative display with truthful future handling |
| src/features/audit/components/audit-detail-modal.tsx — AuditDetailModal | Independent local timestamp | Same safe explicit-zone absolute display; no invented activity fields |
| src/features/super-admin/components/super-admin-users.tsx — SuperAdminUsers | Local user-created date | Shared Dhaka date-only presentation for existing createdAt field |
| src/app/api/v1/[...path]/route.ts — proxyRequest logout handling | Transport failure synthesizes fulfilled local logout | Add explicit BFF-local serverLogoutConfirmed signal, without changing upstream API or cookie security |
| src/features/auth/hooks/use-sign-out.ts — useSignOut | Treats resolved request as confirmed revocation | Read BFF signal; preserve all cleanup and warn for local-only sign-out; no timestamp generated |

Only update shared domain timestamp nullability as required by these consumers. Do not add arbitrary optional timestamp fields to every model.

### Reuse without planned functional changes

- src/features/auth/api/use-auth.ts, src/features/auth/components/login-form.tsx, src/lib/api-client.ts, src/lib/auth-storage.ts, src/lib/session-cookie.ts, src/app/api/session/route.ts, src/proxy.ts: preserve authentication and read retry policy. Test them where relevant; no auth redesign.
- src/features/tenant/hooks/use-tenant-scope.ts, src/lib/use-tenant-scope.ts, src/features/tenant/api/use-tenant.ts: existing identity/scope source. Preserve scope enforcement; do not derive tenant from a timestamp.
- src/lib/financial-operation.ts, src/lib/idempotency.ts, src/lib/register-guard.ts, src/features/pos/utils/cart-calculator.ts, src/lib/payment-methods.ts, src/lib/validations/index.ts: preserve financial/retry rules. Timestamp work does not require nullable-shift changes to current online forms; omitted shift already works.
- src/redux/store.ts, src/redux/types.ts, src/redux/actions/draftsActions.ts, src/redux/reducers/draftsReducer.ts, src/redux/storage.ts: no rewrite or paid-offline transaction storage.
- src/features/catalog/api/use-catalog.ts, src/features/catalog/view-models.ts, src/components/common/variant-image-carousel.tsx and terminal product-card JSX: no layout, stock, image, barcode, or price behavior changes.
- src/features/hr/components/staff-manager.tsx: do not assume staff-list session fields. Latest-session display belongs to the existing dashboard response.
- src/features/reports/view-models.ts: financial summary mappers stay unchanged.
- src/components/ui/dialog.tsx, src/components/ui/table.tsx, src/components/ui/badge.tsx, src/components/ui/button.tsx: reuse existing dashboard/history/modal primitives without changing their shared styles or behavior. Keep history state and selected-row details in the existing dashboard page; no new component architecture is necessary.
- src/components/common/date-range-picker.tsx and src/components/ui/calendar.tsx: unused for current production time filtering; no changes unless explicitly chosen later, with new timezone-aware integration tests.
- next.config.ts, src/app/providers.tsx, package.json, package-lock.json, vitest.config.ts: retain online-only configuration and existing tooling.
- Existing admin/pos terminal, orders, custom-sale route wrappers and admin report/expense/payroll/audit pages keep their URLs and component wiring.

## 6. Dependency-ordered implementation phases

All steps below are **proposed**, not executed. Each phase should be a small reviewable change with its focused tests. Do not bundle blocked backend functionality into an otherwise shippable frontend patch.

### Phase 0 — Mandatory baseline and API-contract freeze

Dependencies: none. Requirements: R1–R7. Run before A–H, especially because the sibling backend was changing during the initial audit.

1. Run git status --short in frontend and backend, record current HEAD/working-tree changes, and preserve the pre-existing modified Redux draft files and the deleted integration guide. Never use git reset --hard, mass-format, or restore files that predate this task.
1. Re-read the current frontend/actual backend controllers, DTOs, serializers and relevant methods named in §§3–5. Compare with the consolidation source snapshot in §4 and the docs/time.md requirements. If API fields or behavior changed, update the compatibility ledger before implementation. Do not guess from docs/time_plan.md alone.
1. Check the exact target frontend/API deployment when possible. Record which optional dashboard/sync fields are source-present, which are deployed/verified, and which are future-only; an upstream local source edit is not proof Vercel/Render serves it.
1. Capture the current online checkout -> response -> order detail -> reprint path, current report period/export behavior, shift history, dashboard layout, and logout BFF response envelope. Confirm whether previously requested history/modal/refresh features are already present. Write a one-line PRESENT / PARTIAL / MISSING / BLOCKED result per planned change; skip already-correct code.
1. Run the applicable existing fast tests/typecheck as a baseline; record commands and results. If required APIs are unavailable, mark their UI sections blocked and keep the rest compatible. No backend code changes are authorized by this frontend plan.

Exit gate: a source-and-deployment compatibility snapshot, list of actual missing frontend changes, and regression baseline exist. Without this, a phase may format existing timestamps, but it may not assume newly added backend fields, new export ranges, full auth-event history or safe offline replay.

### Phase A — Pure time and calendar primitives

Dependencies: none. Requirements: R1, R2.

Files: new src/lib/business-time.ts and src/lib/__tests__/business-time.test.ts.

Implementation:

1. Define BUSINESS_TIME_ZONE = Asia/Dhaka and reuse Intl.DateTimeFormat with explicit timeZone. Expose formatBusinessDateTime, formatBusinessDate, formatBusinessTime, getBusinessDateParts, and formatBusinessDateKey. Accept null/undefined/empty input safely; supply options for existing short-date/time shapes rather than redesigning typography.
2. Use a small parser for API instants: require explicit Z or ±HH:MM, validate real calendar components, clock and offset before conversion, check finite range, and reject timezone-free timestamps. Do not rely on JavaScript's permissive calendar rollover. Preserve the raw input elsewhere; parsing is for display/validation, not mutation. Support the actual backend millisecond ISO output and documented offset inputs. Use a separate date-only parser, never the instant parser, for YYYY-MM-DD. Specify an hourCycle that renders midnight as 00:00 rather than locale-dependent 24:00 when deriving business-calendar parts.
3. Default missing/invalid displays to the existing em dash. Do not use Date.now as a substitute for a record timestamp, new Date(null), or silent date overflow. A historical record with an offsetless datetime must be treated as ambiguous; obtaining a documented legacy interpretation is a backend/data requirement.
4. Add businessDateRangeToUtc for valid date-only selections, returning startInclusive/endExclusive ISO strings. For the current Dhaka business period use the explicit +06:00 convention already in the app/backend; do not generalize to arbitrary timezone/DST conversion. Add a named adapter for the current inclusive audit end (endExclusive minus 1 ms).
5. Add salary-period formatting from validated integer year/month without depending on host local midnight. Calendar month labels are not event timestamps.
6. Do not add a global live clock or timer. For “today/current” requests, prefer existing backend presets/defaults; use injected now only for UI calendar defaults and deterministic tests. For render-time defaults, initialize after mount or from a stable provided value when needed to avoid hydration mismatch.

Expected/failure behavior: identical API instants display identically on Dhaka, UTC and American devices. Invalid dates render unavailable and invalid filter ranges show a local validation error without issuing a malformed request.

Acceptance tests:

- Equivalent Z/+06:00/negative-offset instants; 2026-11-06T18:10Z displays November 7 00:10.
- 17:59:59.999Z vs 18:00:00Z is the Dhaka day boundary; exact next-day start is excluded.
- Month/year rollover, leap day 2028-02-29, invalid 2026-02-29 and February 30, missing offset, empty/null/undefined and out-of-range input.
- Run the helper suite in separate processes with TZ=UTC, Asia/Dhaka, America/New_York. Assert date parts/timeZone behavior rather than unstable punctuation or nonbreaking spaces.
- Strict date-only validation and reversed bounds; same-day ranges remain valid; period labels do not shift month.

### Phase B — Preserve order event and persistence times end-to-end

Dependencies: A. Requirements: R1, R3, R6.

Files: src/types/domain.ts; src/features/pos/api/use-pos.ts; src/features/pos/view-models.ts; src/features/pos/components/terminal-workspace.tsx; src/features/pos/components/custom-sale-view.tsx if needed for type migration; src/features/reports/api/use-reports.ts; new src/features/pos/__tests__/order-timestamps.test.ts; extend src/features/pos/__tests__/api-contract-handoff.test.ts.

Implementation:

1. Add occurredAt and nullable/missing timestamp compatibility to the relevant order read types. validateAndMapOrder must retain raw createdAt as persistence time and raw occurredAt as event time; do not coerce null into the strings "null"/"undefined". Preserve updatedAt only where already returned/needed; no new writable fields.
2. Define one view helper, selectOrderSaleTime, in the existing POS view-model module. Return a value and source (occurredAt, legacy-createdAt, unavailable). Prefer valid occurredAt. For absent/null/empty occurredAt on legacy records only, allow valid createdAt as a clearly identified legacy fallback. A present but malformed occurredAt is unavailable, not silently converted into persistence time.
3. Keep raw timestamps distinct in OrderRowViewModel and ReceiptViewModel. Add a clearly named derived saleAt/display-source value; createdAt must no longer secretly mean event time. Migrate all constructors/callers and fixtures in this phase and C together before release.
4. Reuse mapOrderToReceipt for timestamp selection in terminal completeSale, preserving its existing customer/business/branch fallback precedence and payment/line values. Either call the mapper with those same fallbacks or keep manual construction and call the shared selector; do not change identity resolution incidentally.
5. CustomSaleView already calls the mapper. Reports transactions already call mapOrderToOrderRow; verify their raw API shape preserves both values without forcing unrelated order validation changes on report data.
6. Do not add an event timestamp to online request schemas, payload hashes, idempotency snapshots, or retries. Missing/invalid response dates must not turn an already-successful sale into an uncertain failure after the backend committed.

Expected/failure behavior: delayed orders retain original event time and later recorded time. Historical records still render with a labeled fallback; missing dates do not hide an order or repeat a sale.

Acceptance tests:

- Invoke actual validateAndMapOrder, mapOrderToOrderRow and mapOrderToReceipt using catalog/custom/report fixtures with different occurredAt and createdAt; assert both raw values survive.
- Test missing occurredAt with valid legacy createdAt, both missing, malformed occurredAt, and null fields.
- A November 2 event received November 7 stays November 2 after map → list → detail → receipt/reprint; no current-time substitution.
- Online checkout payloads remain unchanged and omit timestamp fields. Checkout without shift remains valid. Existing financial validation rejects invalid prices/quantities as before.
- Lost-response retry reuses its original key/payload; adding read timestamps cannot generate a new financial operation.
- Preserve all receipt identity, refund quantity and stock invariant suites.

### Phase C — Consistent displays and receipt outputs

Dependencies: A, B. Requirements: R1, R3.

Files: src/features/pos/components/orders-workspace.tsx; src/features/pos/components/receipt-dialog.tsx; src/features/pos/utils/print-receipt.ts; src/features/pos/components/terminal-workspace.tsx; src/features/reports/components/reports-dashboard.tsx; src/app/(dashboard)/admin/dashboard/page.tsx; src/features/super-admin/components/super-admin-users.tsx; extend src/features/pos/__tests__/receipt-identity.test.ts; new src/features/pos/__tests__/receipt-timestamps.test.ts.

Implementation:

1. Replace production direct timestamp rendering with shared helpers. Keep existing compact date/time shapes, classes, card structure, table widths and receipt print typography.
2. Order list/reprint and transaction rows use saleAt. In the existing order detail grid distinguish “Sale time (Dhaka)” and “Recorded at (Dhaka)” when data is available; mark legacy fallback as record time used for the sale display. Do not infer offline provenance solely because the values differ.
3. All four receipt surfaces use the same sale-time selection. Text, HTML and PDF may retain their existing precision/space conventions, but must agree on day, timezone and event source. Do not substitute generation/print time.
4. Keep terminal held-cart timestamps as draft-save timestamps; format in Dhaka without renaming them transaction time. Do not change holdDraft persistence or cap.
5. Dashboard tickets use their supplied occurredAt; drawer openedAt uses a time formatter. Do not manufacture persistence timestamps for ticket summaries.
6. Super-admin user-created dates are formatted only; no management features added.

Expected/failure behavior: null/malformed timestamps show a neutral placeholder in every format; reprinting a receipt never changes sale time. Formatting failure cannot disable checkout/refund actions or turn financial success into failure.

Acceptance tests and manual verification:

- Generate text, HTML and native PDF with a fixed Dhaka-midnight fixture and assert the same intended date/time; inspect generated output for missing-date behavior and stable amounts.
- Keep Bengali/Unicode print-to-PDF fallback, long names, wrapping, invoice and customer/branch identity checks. Manually inspect A4/Microsoft Print to PDF and custom/actual 80 mm thermal width for alignment, unclipped dates, complete items/amounts and native PDF wrapping. Earlier review references to print defects are not independently reproduced findings; report any reproduced unrelated layout issue separately rather than expanding the timestamp patch.
- Browser manually: catalog/custom sale, order detail/reprint, reports rows, admin recent tickets, saved drafts and user list under a non-Dhaka device timezone.
- Print-preview an 80 mm receipt and download both ASCII PDF and Bengali print-to-PDF; verify no clipped dates and unchanged monetary layout.
- Compare POS product cards and checkout before/after at desktop and narrow viewport; no product JSX/style change is allowed.

### Phase D — Correct report/filter intent and export compatibility

Dependencies: A, B. Requirements: R2, R3.

Files: src/features/reports/api/use-reports.ts; src/features/reports/components/reports-dashboard.tsx; new src/features/reports/api/__tests__/report-date-contract.test.ts. Reuse src/features/pos/api/use-pos.ts OrderFilters and existing order range UI without adding unsupported parameters.

Implementation:

1. Make buildReportQueryParams or a small helper in the same module directly testable. Normalize exactly one effective period using current backend semantics:
   - today/yesterday/daily/weekly/monthly/quarterly preset selection: send the preset without incidental year/month/week.
   - explicit month selection: send month and selected year; clear conflicting week/range intent.
   - explicit week selection: send week and appropriate year; clear month.
   - calendar year selection: send range=year and selected year.
   - Keep rolling monthly (30 days) distinct from calendar month. Selecting a preset must clear stale month/week selections that would override it.
2. Treat existing year control as the companion to calendar month/week/year selection; a default displayed year must not silently broaden a rolling report. Use Dhaka calendar parts for display defaults, while letting backend presets choose authoritative current dates.
3. Pass locationId='all' explicitly from ReportsDashboard into normalized query construction. Remove that sentinel only when emitting requests to endpoints whose DTO supports business-wide reporting; do not fall back to the current branch in this case. Preserve user/business scope in query keys and all-branch authorization. This does not relax required branch scope for checkout or other writes.
4. Ensure transactions, summary and export share the same resolved period/search/tenant/branch intent. Keep server financial aggregations untouched; never sum a paginated client list to imitate a server report.
5. Correct export input to the verified numeric month/year contract. Resolve the UI's “current month” in Dhaka for export and include the selected business, branch and search. Remove range/week from emitted current API requests.
6. For a selected period that is not representable as one calendar month, retain the export controls and explain the limitation before issuing a request; require an explicit calendar-month selection instead of silently exporting another period. This repairs an incompatible flow without pretending arbitrary export support exists. Supporting exact rolling/week/year export remains API-6 and cannot be marked done by this frontend phase.
7. Preserve blob handling, filenames, browser download cleanup and error toast; do not generate a CSV/PDF from only the visible page. Error blobs must not produce a success toast/download.

Expected/failure behavior: “Weekly” actually requests rolling weekly data; “All Branches” is consistent across screen and supported export; unsupported export scope is explicit. 400/403/500 responses remain errors and preserve filter state.

Acceptance tests:

- Assert actual query-builder output for every preset, explicit month/current month, week and year; no accidental year with rolling ranges.
- Test midnight December 31/January 1 and month transition with a UTC-host clock.
- Current-month export sends valid integers; default rolling monthly view cannot masquerade as calendar-month export.
- All-branch requests omit locationId at transport; selected-branch requests retain it. Business A/B queries remain distinct.
- Month/year export and on-screen calendar-month query cover identical business days and scope; search persists.
- Manual fixtures: a sale just before/after Dhaka midnight and a ten-day-delayed sale appear under event date; dashboard/report totals remain backend totals; refunds retain processing-date interpretation.
- Server CSV/PDF date labels are verified in staging; already-present backend formatDhakaDateString is not reimplemented in frontend downloads.

### Phase E — Shift history, financial dates, and audit dates

Dependencies: A. Requirements: R2, R4, R5.

Files:

- src/features/shifts/api/use-shifts.ts and src/features/shifts/view-models.ts.
- src/app/(dashboard)/pos/shifts/page.tsx.
- src/features/hr/api/use-hr.ts, src/features/hr/view-models.ts, src/features/hr/components/payroll-manager.tsx.
- src/features/expenses/api/use-expenses.ts, src/features/expenses/components/expenses-manager.tsx.
- src/features/audit/components/audit-logs-view.tsx and src/features/audit/components/audit-detail-modal.tsx.
- New src/features/shifts/__tests__/shift-time-contract.test.ts; extend src/features/shifts/__tests__/shift-recovery-ui.test.ts.
- Extend src/features/hr/api/__tests__/advances-contract.test.ts and src/features/expenses/api/__tests__/expenses-contract.test.ts; new src/features/hr/api/__tests__/payroll-time-contract.test.ts and src/features/audit/api/__tests__/audit-time-contract.test.ts.

Implementation, in small subchanges:

1. Shift adapter: add fromDate/toDate/cashierId types for supported filters. Preserve autoCloseReason, isOverdue, closingCashNotProvided, autoClosedPreviousShiftId/Ids and nullable close data. Keep 404-only null handling; 401/403/5xx must not masquerade as “no shift.”
2. Shift page: add two small date inputs and reset behavior to the existing history header, labeled Dhaka business dates. Validate real dates and order, reset page to 1 on filter changes, and pass strings unchanged to useShifts. Use the existing tenant builder; never offer a foreign cashier filter in cashier mode.
3. Format active/open/closed and advance timestamps; distinguish absent close time, auto-close with uncounted cash, and actual counted zero. Reuse existing table cells/detail text and Badge styling. Preserve all cash amounts, notes and the financialOperations recovery behavior. Use returned auto-close metadata for feedback, not a client prediction of a server mutation.
4. Payroll: preserve explicit salary month/year selections. For initial authoritative current period, allow the existing summary endpoint to default when no period is selected and initialize from its returned month/year; use that returned period for labels and subsequent payment actions. Remove device-time authority from payroll processing defaults. Do not submit a payment while its period is unresolved.
5. Where expense/report UI needs a current month/year default, use Dhaka calendar parts; accept server-returned periods where supported. Do not replace an explicit historical user selection on refetch. Render salary periods via period formatter and paid/disbursed instants via date/time formatter.
6. Advances: remove the new-Date fallback from useAdvances and stop aliasing takenAt into raw createdAt. Share the actual mapAdvanceToAdvanceRow timestamp logic rather than maintaining a second algorithm in a test. Display takenAt, then a clearly legacy fallback if applicable, otherwise unavailable. Preserve deduction and amount calculations.
7. Expenses: display historical spentAt independently of createdAt; blank date remains unavailable. Existing form omission keeps backend default behavior. Updating unrelated title/note/amount must not overwrite spentAt. A historical date editor is outside this phase.
8. Audit: extract date-filter construction into a small exported pure helper within the existing view/module if needed for tests. Use strict business-date parsing and the current inclusive-end adapter. Reject invalid/reversed dates locally; remove the catch fallback that sends arbitrary strings. Format list/detail consistently; a future audit instant uses a future relative label or absolute time, never “just now” by default.

Expected/failure behavior: backend decides shift/day rules; frontend presents them accurately. No synthetic session/shift events, zero close-cash substitution, invented advance date, or implicit payroll month. Failed requests leave forms/filters and retry state intact.

Acceptance tests:

- Shift query exact strings; same-day inclusive selection; reversed/invalid date rejection; tenant/user-separated keys.
- Shift mapping OPEN+null closedAt, CLOSED+actual zero amounts, auto-closed+null amounts, old rows with missing metadata.
- Manual: open yesterday's shift then open next Dhaka day, verify previous close reason and null counted values; reject same-day second open even after close; logout never closes shift; checkout without shift still works.
- Existing uncertain shift open/close retries retain original key, amount and shiftId when active-query results change.
- Advance null timestamps stay null/unavailable and never equal test clock; historical takenAt remains historical.
- Payroll current-period response wins over host clock; explicitly selected historical period survives refetch; paidAt null remains unpaid/unknown rather than epoch date; payroll calculation suite unchanged.
- Expense historical spentAt with later createdAt, month boundary, payroll-derived expense restrictions, API failure.
- Audit November 7 range emits exact UTC boundaries from section 4; null/malformed/future timestamp and 400/403/500 behavior; actual endpoint remains server-created-time based.

### Phase F — Admin Dashboard shift/session visibility, refresh, and truthful logout

Dependencies: A and E (shared shift filters, mapping, and date functions); backend-dependent optional overview fields must be reverified in Phase 0. Requirements: R4. The backend does not provide full auth-event history.

Files: src/features/dashboard/api/use-admin-dashboard.ts; src/app/(dashboard)/admin/dashboard/page.tsx; reuse src/features/shifts/api/use-shifts.ts and src/features/shifts/view-models.ts from E; src/app/api/v1/[...path]/route.ts; src/features/auth/hooks/use-sign-out.ts. Tests: new src/features/dashboard/api/__tests__/dashboard-time-contract.test.ts, extend shift query/mapper tests from E, new src/app/api/v1/[...path]/__tests__/logout-route.test.ts and src/features/auth/__tests__/sign-out-contract.test.ts. Reuse existing auth/API tests. UI browser behavior is a manual acceptance gate because the installed Vitest suite is node-only.

Implementation in independently reviewable subchanges:

#### F1 — Accurate status on the existing Dashboard

1. Type the actually returned optional overview extensions (todayShifts, todayShiftCounts, olderOpenShifts, olderOpenShiftCount, lastClosedShift, cashierLoginStatuses) with nullable login/logout dates and nullable closing count/variance. Do not add them to /users/me or staff DTOs.
2. Use the existing Dashboard route, Card/Table/Badge/DataState and scoped query, keeping current KPI, stock, receipts and product UI intact. Show today-opened OPEN and CLOSED across all authorized cashiers, separate older OPEN/carryover, and last CLOSED shift. An older OPEN row is not evidence of a login today. If optional fields are absent, say “Unavailable from this server” rather than displaying empty/zero status.
3. Label cashier status “Latest login/logout”; isLoggedIn reflects a server-managed session claim, not current browser connectivity. Show full Dhaka date and time, including a neutral null label. For automatic uncounted closure show “Shift auto-closed — closing money not provided.”; for other null closing cash show “Closing money not provided.” Actual counted zero remains 0 BDT. Never derive a full event timeline or duration from only latest values.
4. Cash accuracy gate (API-10): Current backend overview maps OPEN shift cash fields directly from stored shift rows, separately from the drawer aggregation. Display them only as qualified snapshots unless live aggregation has been verified. Never call uncounted closing cash zero or show an invented shortage/variance. An actual counted 0 BDT stays zero.

#### F2 — Admin shift history, details and manual refresh (same Dashboard route)

5. Reuse existing useShifts / GET /shifts for the Admin Dashboard history, not a new /shift-management route or detail API. Show a paginated table with supported fromDate, toDate, cashierId, status, selected branch, and page/limit. Reuse useStaff from src/features/hr/api/use-hr.ts with businessId/locationId and tenant.isTenantReady for cashier selector labels/IDs; that existing staff source supplies identity only, never login status. Do not limit cashier choices to the currently paginated history rows. The frontend may translate month/year picker selection to Dhaka date-only bounds if that control already exists. Display openedAt/closedAt fully and keep today/older shift summaries separate from historical filtering.
6. Each history row includes View Details using the already returned shift record in an accessible existing modal/dialog. Display cashier, branch, opened/closed, starting/expected/closing cash, variance, notes, auto-close reason and overdue status only to the extent actually returned; missing fields remain unavailable. No new backend detail endpoint or new top-level Admin shift page.
7. Validate Dhaka date inputs and reversed range before querying; keep authorized business/branch/cashier boundaries in query keys, reset pagination on filter/scope changes, and cancel/ignore previous-scope results. Admin-specific cashier filters must never expose another tenant's shifts. Cashiers retain their own separate shift route.
8. If the Dashboard already offers an Admin action to close a selected cashier's shift, require a confirmation showing cashier and exact shift ID and call POST /shifts/:id/close with the selected ID. Never use the no-ID close endpoint when viewing another person's shift. Do not add a new mutation button solely because this timestamp plan exists; verify existing authorization/UI scope first.
9. Add a visible “Refresh latest data” button on this same Dashboard. It must trigger a real refetch of overview/current status, shift-history list and recent activity where those sections are shown, bypassing stale cached results with existing TanStack Query mechanisms. Present loading, last successful refresh, and error/stale states. A partially failed refetch must not mark all panels as fresh. Inspect each returned query result for isError/error (refetch can resolve with an error result); Promise fulfillment alone is not success. Track successful dataUpdatedAt per scope/panel, clear selected detail rows on scope/filter changes, and disable refresh until the authorized scope is ready. The refresh timestamp is a client UI diagnostic, never a session/shift event time. Include inventory alerts if the button claims to refresh the whole dashboard; otherwise label its narrower scope explicitly. No automatic polling and no ISR-only live data.

#### F3 — Distinguish server logout acknowledgment from local-only cleanup

10. Repair proxyRequest for logout without changing upstream NestJS auth semantics. Introduce a BFF-local serverLogoutConfirmed Boolean placed at the actual level consumed after apiClient unwraps the proxy response: data.serverLogoutConfirmed inside the successful BFF envelope, observed as response.data.serverLogoutConfirmed by the hook. true means a real upstream success acknowledgment; false means the BFF synthesized local-only sign-out after upstream transport failure. Preserve cookie-clearing and the existing envelope; do not leak tokens or claim this proves a recorded lastLogoutAt.
11. useSignOut consumes that flag and the existing rejection path. Always clear local auth/cart/active-shift/tenant/query state and navigate to login. If acknowledgment is absent/false, surface the existing local-only revocation warning; do not claim server logout or set a client event timestamp. Revalidate actual 200/4xx/5xx/transport outcomes in the BFF; do not mistake a locally returned HTTP 200 for upstream success. Ensure a warning remains visible after navigation using existing UI behavior.
12. Full login/logout history is still blocked (API-5). A future backend must record events and expose an authorized, tenant-scoped contract. When it exists, reuse existing Audit UI, but do not invent event action values, event rows, or a new frontend endpoint now.

Expected/failure behavior: older backend deployments still render legacy Dashboard; old tenant's cached shifts/session data never flash after scope change; every section honestly represents unavailable/stale/current data. Logout during backend outage still performs safe local cleanup while describing revocation as unconfirmed. No shift closes merely because a cashier logs out.

Acceptance tests and manual verification:

- Overview with all optional fields, fields missing, empty arrays, null latest timestamps, today's OPEN/CLOSED, older OPEN, last CLOSED and counted zero; test actual Dhaka presentation.
- Admin history query emits supported date/cashier/status/branch/page fields, resets pagination when filters change, uses scoped cache keys, rejects invalid date ranges, and never requests foreign cashier history.
- Modal renders existing shift record and auto-close null count without inventing a GET /shifts/:id endpoint. Any existing Admin close uses explicit selected ID; no implicit other-cashier closure.
- Manual Refresh latest data calls actual query refetches (not only invalidation), records last successful time, preserves stale/error status on partial failures and stays on the same Dashboard route.
- Cross-business/branch switch cancels old UI results and never displays previous scope's cashier/shift rows.
- Test the actual BFF route for upstream 2xx, upstream 4xx/5xx, transport failure, cookie deletion, response-envelope shape and true/false/absent acknowledgment; then test useSignOut with current mocked hook patterns. No server timestamp generated by the frontend.
- Browser: successful login/logout, duplicate cashier login rejection, admin force logout, expiration/refresh, disconnected sign-out, same-day shift conflict, prior-day auto-close, old OPEN separation, history details, manual refresh and last-updated, and checkout without a shift. A shift remains OPEN after logout.
- Full login-history acceptance is not passed until a real server event/read contract exists; the currently shippable feature is latest status only.

### Phase G — Timestamp readiness handoff, no offline runtime

Dependencies: B, C, D; backend gates API-1 through API-4 and API-9 apply only to future sync functionality. Requirements: R6.

Files: docs/time.md, docs/time_plan.md, docs/Frontend_Doc.md when implementation documentation is updated. No new src/features/offline directory, queue, API hook, device registry, service worker or database.

Implementation:

1. Document read readiness: order and receipt models preserve delayed occurredAt independently of createdAt; all display/filter semantics are explicit. Historical fixtures demonstrate delayed arrival correctly.
2. Document the final locally observed bootstrap/sync shapes from section 4, older response compatibility, and source-present but deployment-unverified additions separately. Never put a planned or deployment-unverified field into a required current API type.
3. Retain the future original-event contract: stable clientOrderId/device/actor/tenant/branch, immutable complete paid payload and occurredAt, explicit null shift, delayed sync without arbitrary age rejection, original warning/evidence retention, and server-owned persistence times.
4. Document failure-state requirements for a future outbox: network/timeout/401/403/rejected/malformed/missing-item results remain unresolved; no drop or new ID; accepted/duplicate acknowledgment must match the specific local identity under the strengthened backend contract. The final source's hash/replay work improves on the earlier total-only implementation, but the remaining API-2/API-3 defects still prevent treating it as a complete guarantee.
5. Describe future compatibility tests without wiring a speculative adapter into checkout. Clock-difference diagnostics may eventually use bootstrap serverTime/policy; receipt delay is not a measured device-clock offset.
6. State that full offline authorization/reconciliation is not implemented in this frontend. The consolidation snapshot now registers the legacy confirmation route; deployment and the unresolved evidence/replay guarantees in API-4 remain dependencies. Do not add a recovery UI or call this route during timestamp readiness. Existing local saved carts cannot be upgraded into paid records simply by adding occurredAt.

Acceptance:

- Delayed-order fixtures pass through current production mapping/receipt/report functions.
- Online request payload snapshots contain no new occurredAt/createdAt or device ID.
- Source diff adds no /orders/sync calls, IndexedDB, service-worker registration or offline completion path.
- Future sync test matrix is recorded, explicitly not executed: 10+ day delay; small/large future skew; missing timezone/impossible date; same-ID identical and conflicting replays; lost response; partial batch failure; old closed shift; null shift; changed actor/tenant/device; revoked session; legacy review.
- No claim of multi-day offline operation or independent clock verification is made.

### Phase H — Integrated regression review and release evidence

Dependencies: completed eligible phases; blocked features remain explicitly blocked. Requirements: R7.

Files: the modified files above, the named focused tests, existing regression suites, and implementation-result sections in docs/time_plan.md. No new end-to-end framework is required solely for this task.

1. Run focused suites after each phase, then existing full tests, TypeScript, lint and production build once the integrated changes are ready.
2. Review the diff for product-card/style changes, monetary calculation changes, request timestamp injection, optional-shift regressions, tenant scope removal, auth relaxation, new persistence layers and dependencies.
3. Manually verify the real browser flows listed below against a known backend revision. Record server build/migration identity, role, business/branch fixture, device timezone and actual results without credentials.
4. Verify optional dashboard fields and month export behavior in the actual target environment. A passing frontend mock does not prove backend deployment.
5. Document missing backend releases/full auth history/arbitrary export support as remaining limitations, not completed features.
6. Only the user can authorize implementation; this plan does not grant it.

## 7. Focused test and manual acceptance matrix

All new tests here are proposed. Prefer imports of production helpers/mappers/query builders and mocked actual apiClient/BFF calls. Do not repeat calculations in test-only facsimiles. Keep browser assertions manual where the existing node runner cannot exercise the behavior.

| Workflow | Automated coverage / exact suite | Manual acceptance |
| --- | --- | --- |
| Shared time policy | New src/lib/__tests__/business-time.test.ts | Same fixed API instant on UTC/Dhaka/American device shows same Dhaka calendar result; no hydration warning |
| Catalog/custom checkout | Existing src/features/pos/__tests__/api-contract-handoff.test.ts and new order-timestamps.test.ts | Both roles; all supported payment methods; with and without shift; success only after server response; PRICE_CHANGED recovery preserved |
| Order history/detail | New src/features/pos/__tests__/order-timestamps.test.ts | Historical and delayed orders retain event/recorded separation; status/search/page/scope filters unchanged; error/retry visible |
| Receipts/reprints | Existing receipt-identity.test.ts plus new receipt-timestamps.test.ts | Dialog/text/thermal/native PDF/Bengali print fallback, long dates/names, unchanged totals and layout |
| Report filtering/export | New src/features/reports/api/__tests__/report-date-contract.test.ts | Presets vs calendar month/year; all branches vs selected branch; server CSV/PDF; missing month/unsupported period/error behavior |
| Dashboard and admin shift history | New src/features/dashboard/api/__tests__/dashboard-time-contract.test.ts; shift-time-contract.test.ts from Phase E | Today OPEN/CLOSED versus older OPEN; last CLOSED/latest session; authorized history filters/pagination/detail modal; actual manual refetch and partial-error/stale state; scope switch; missing optional fields; unchanged KPIs |
| Shift history/lifecycle | New shift-time-contract.test.ts plus existing shift-recovery-ui.test.ts | Midnight auto-close, preserved note/reason, counted zero vs uncounted, same-day rejection, 404 vs network failure |
| Login/logout | New logout-route.test.ts and sign-out-contract.test.ts; existing src/lib/__tests__/api-client.test.ts | Server acknowledgment vs disconnected local sign-out; refresh/force revocation; no shift closure or fake history |
| Advances/payroll | Existing advances-contract.test.ts, src/features/hr/__tests__/payroll-calculator.test.ts; new payroll-time-contract.test.ts | Null takenAt/paidAt, historical periods, authoritative current salary period, deduction/payment unchanged |
| Expenses | Existing src/features/expenses/api/__tests__/expenses-contract.test.ts | Historical spentAt with current creation, display/filter month, edits preserve date, derived payroll rows remain protected |
| Audit | Existing audit-contract.test.ts plus new audit-time-contract.test.ts | Day input maps to inclusive UTC bounds; absolute/relative times agree; future/null/invalid data; tenant authorization |
| Financial/tenant resilience | Existing src/lib/__tests__/financial-operation.test.ts, idempotency.test.ts, register-guard.test.ts, tenant-preferences.test.ts; src/features/pos/__tests__/refund-invariants.test.ts, register-stock-invariants.test.ts, cart-calculations.test.ts; src/redux/__tests__/drafts.test.ts | Uncertain sale/refund/shift retries retain original context/key and never duplicate; cross-user/business drafts and requests stay scoped |

### Fixed boundary dataset

Use these exact fixtures in focused tests and staging seed data:

| Case | Input | Expected |
| --- | --- | --- |
| Last millisecond of November 6 Dhaka | 2026-11-06T17:59:59.999Z | November 6, 23:59:59.999 |
| First instant of November 7 Dhaka | 2026-11-06T18:00:00.000Z | November 7, 00:00; included in November 7 |
| End boundary of November 7 | 2026-11-07T18:00:00.000Z | November 8, 00:00; excluded from November 7 |
| Same instant, alternate offset | 2026-11-07T00:10:00+06:00 | Same as 2026-11-06T18:10:00.000Z |
| Month rollover | 2026-10-31T18:00:00.000Z | November 1 Dhaka |
| Year rollover | 2026-12-31T18:00:00.000Z | January 1, 2027 Dhaka |
| Delayed record | occurredAt 2026-11-01T18:10:00.000Z; createdAt 2026-11-07T04:00:00.000Z | Sale November 2 00:10; recorded November 7 10:00 |
| Ten-day delay | Same event; createdAt 2026-11-11T18:10:00.000Z | Original sale stays November 2; no frontend age cutoff |
| Legacy order | occurredAt absent; valid historical createdAt | Explicit legacy fallback; no invented occurredAt persisted |
| Invalid/unknown | null, undefined, empty, invalid calendar date, offsetless datetime | Unavailable; no epoch/current-time fiction, no crash |
| Automatic shift closure | closedAt supplied; closingAmount=null, variance=null | Closed time visible; counted cash/variance not zero |
| Actual zero close | closingAmount=0, variance=0 | Actual zero values displayed, not missing |
| Old shift versus current session | Older OPEN shift; isLoggedIn=false; lastLoginAt yesterday | Carryover OPEN separately; no invented login today |
| Partial dashboard refresh | Overview succeeds; shift history fails or resolves with an error query result | Only successful panel is marked updated; history remains stale with a visible error and retry |
| Local-only logout | BFF HTTP 200 with data.serverLogoutConfirmed=false | Local cleanup/navigation succeeds; server revocation remains unconfirmed; no fabricated server logout time |
| Session latest-state | lastLoginAt supplied, lastLogoutAt null | Latest login shown, logout not recorded; no fabricated timeline |
| Historical refund/expense | Sale date differs from refund.createdAt or expense.spentAt/createdAt | Each view retains its own documented time dimension |

### Proposed validation commands

Run only when implementing the corresponding files; new test paths do not exist yet.

    npx vitest run src/lib/__tests__/business-time.test.ts
    npx vitest run src/features/pos/__tests__/order-timestamps.test.ts src/features/pos/__tests__/receipt-timestamps.test.ts src/features/pos/__tests__/receipt-identity.test.ts src/features/pos/__tests__/api-contract-handoff.test.ts
    npx vitest run src/features/reports/api/__tests__/report-date-contract.test.ts src/features/shifts/__tests__/shift-time-contract.test.ts
    npx vitest run src/features/dashboard/api/__tests__/dashboard-time-contract.test.ts src/features/auth/__tests__/sign-out-contract.test.ts "src/app/api/v1/[...path]/__tests__/logout-route.test.ts"
    npx vitest run src/features/hr/api/__tests__/payroll-time-contract.test.ts src/features/hr/api/__tests__/advances-contract.test.ts src/features/expenses/api/__tests__/expenses-contract.test.ts src/features/audit/api/__tests__/audit-time-contract.test.ts
    npm test
    npm run typecheck
    npm run lint
    npm run build

Run the new business-time suite separately under each TZ value using PowerShell environment assignment and restore the previous value afterward. Do not change the OS timezone or commit environment changes. For browser checks use timezone emulation or a configured test browser; record actual output and any unsupported emulation.

No database migrations or backend test commands are part of this frontend implementation plan. Future offline financial integrity requires the backend roadmap's real PostgreSQL concurrency/rollback gates in its own workstream.

## 8. Explicitly deferred work

- Full IndexedDB paid-order outbox, multi-day offline checkout, offline receipts, catalog snapshot persistence, connectivity state engine, background sync, PWA/service-worker enablement and new device-registration infrastructure.
- Offline shift creation/closing and replay; offline unlock/activity logging; client timestamp override on online auth/shift endpoints.
- Manual device-clock correction, legacy-sync admin confirmation UI, rejected-sale reconciliation and revoked-user recovery until their actual server contracts exist and the offline client is explicitly commissioned.
- Full login/logout event-history display until API-5 is delivered. Latest status can be implemented now; it is a distinct, limited capability.
- Exact non-monthly server exports until API-6 is delivered; no client-generated financial report from paginated data.
- dateBasis/received-date filters, arbitrary order from/to filters, new persisted businessDate/receivedAt fields.
- New expense historical-date editor, new force-logout button or admin shift-management page absent explicit product scope. Existing backend security behavior remains protected.
- Unused date-range-picker redesign, landing marketing text changes, broad helper/component refactors, Redux rewrites, financial formula changes and all new libraries/database tables.

## 9. Risks and regression protections

| Risk | Protection |
| --- | --- |
| Changing createdAt meaning breaks old receipt consumers | Migrate order types, all constructors/mappers and all receipt formats atomically; run repository search for each consumer and the named receipt suites |
| Small time fix triggers a duplicate sale after commit | Presentation functions are total/nonthrowing on missing dates; financial success and retry handling remain outside formatting; no new request clock field |
| Backend working-tree contracts differ from deployed API | Optional-field handling, current-vs-proposed ledger, source revision record and explicit staging verification |
| Device timezone or clock affects salary period | Backend default period/returned month/year is authoritative; Dhaka only for UI calendar derivation; explicit user selection preserved |
| Historical missing data is misrepresented | Raw nullable fields remain; explicit legacy fallback only; no silent “now,” zero close cash, or synthetic logout |
| Report screenshot and export cover different period/branch | Shared resolved intent; exact current export contract; unsupported period is explained before request; scope query tests |
| New dashboard session/history leaks context | Use existing authorized overview and shift queries; scoped cache, role handling, omitted-field distinction, pagination/detail reset and cross-business/branch-switch tests |
| OPEN shift snapshots are mislabeled live money | Qualify stored cash fields or show only status/time; no client financial reconstruction. Refetch alone cannot correct backend aggregate semantics |
| Manual refresh reports stale panels as current | Inspect each actual query result, retain per-panel success timestamps and visible partial failures; no synthetic event timestamps or automatic polling |
| Admin closes an unintended cashier shift | Any existing authorized selected-cashier action must use the explicit selected ID and confirmation; no new close control is introduced |
| Future offline readiness mistaken for working offline POS | No sync/outbox/PWA code; backend integrity/security gates documented; drafts remain unpaid carts |
| Local logout falsely claims server session ended | BFF-local acknowledgment signal and route/hook tests; server-owned timestamps never inferred from device time |
| Date refactor alters amounts/refund/payroll semantics | Preserve all financial helpers/aggregations and run existing invariants; retain refund processing-time versus sale-time definitions |
| UI or print regression | No product-card/style refactor; compare existing layouts and print previews; keep Unicode fallback and receipt identity |
| Node tests overstate coverage | Test actual helpers and transport handlers; manual browser/print/API checks recorded separately; no claim of live integration from mocks |

## 10. Checks actually executed for this planning task

Historical baseline from the original version-1 audit on 2026-11-07, before implementation. The test/typecheck/lint results below were not rerun during this document comparison. They do not validate proposed functionality or deployment. Current consolidation checks are listed separately below.

| Check | Actual result |
| --- | --- |
| Repository/file inventory, AGENTS.md, installed Next.js docs, source/DTO/service/schema/test inspection | Executed; findings recorded above |
| Existing graph query | Executed; stale references found, current source used |
| npm test -- --reporter=dot | Passed: 21 test files, 170 tests, exit 0 |
| npx tsc --noEmit --incremental false | Passed, exit 0; incremental disabled to avoid a build-info write |
| npm run lint | Passed, exit 0; Node emitted MODULE_TYPELESS_PACKAGE_JSON warning for eslint.config.js; no configuration change made |
| Final file-path and working-tree review | Existing production paths in the change inventory verified; business-time.ts is intentionally proposed/new. Only the two requested Markdown files were written during that original audit |
| git diff --check | Reported pre-existing extra EOF blank lines in the three already-modified Redux files; left untouched. This command does not validate the untracked planning documents |
| Production build | Not run |
| New timestamp tests / multi-TZ suite | Not written or run; proposed only |
| Browser/print/hydration/manual workflow checks | Not run |
| Authenticated live backend calls / deployed schema verification | Not run |
| Backend tests, migrations, PostgreSQL concurrency/rollback checks | Not run; outside this frontend planning task |

Completion of this planning task means the requirements and source-grounded plan are written and reviewed. It does **not** mean timestamp implementation, full session history, or offline synchronization is complete or approved.

### Checks executed during this consolidation

- Compared all four frontend time documents. Requirements text is identical after line-ending normalization; the implementation plans differ substantively.
- Rechecked frontend dashboard, shift and logout adapters; current backend order/controller/confirmation, offline policy, dashboard summaries and shift-close contracts. Recorded source hashes above. Rechecked repository status and the installed Next.js server/client guidance.
- Consolidated the four inputs into the two canonical files and removed duplicate versions as requested. Checked document structure, referenced production paths, test-path spelling and obsolete route claims.
- Application tests, TypeScript, lint and build were **not rerun for this documentation-only merge**. No browser, live API, database, deployment, backend test or financial-concurrency verification was performed. Earlier PASS results remain historical baseline only.
- No application code or backend files were modified by this consolidation. Existing unrelated Redux changes and deleted guide remain untouched.

## 11. Implementation handoff and completion gates

When the owner explicitly requests implementation, follow this order: Phase 0 → A → B → C → D → E → F1 → F2 → F3 → G → H. Independent subchanges may be reordered for practical dependency reasons, but do not implement future offline runtime or conceal a backend dependency. Commit/review focused changes rather than an unbounded rewrite.

### Required report after each phase

1. What existed in the current source (paths/functions and behavior) and what was already correct.
2. Exact changed files and the smallest behavior-preserving patch applied; highlight API requests/responses altered and any no-op/deferred tasks.
3. Focused tests actually executed (command, result, failures) and any manual browser verification; mark NOT RUN honestly.
4. Regression checks: online catalog/custom checkout, integer BDT/stock/refund/payroll rules, optional shiftId, one-shift/day and next-day auto-close, session security, BFF/tenant scope, unchanged product cards and receipts.
5. Remaining blockers with API-* dependency and the actual evidence needed; do not claim production ready merely because build/lint passes.

### Stop/contain instead of guessing

- If the current DTO/controller does not expose a field/route, preserve older behavior and report the missing contract. Do not invent dateBasis, /shifts/:id, auth-history, all-period export, or offline recovery APIs. (/shifts/:id/close is an existing, different route.)
- If a timestamp is missing/invalid, render a nonthrowing unknown state. Do not change payment/stock/salary/refund commits, reissue an order, or regenerate an idempotency key to repair display.
- If a financial test fails or tenant/auth scope regresses, stop merging that phase and fix the regression before continuing.
- If backend dashboard OPEN-shift aggregates are not trustworthy, restrict UI to supported status/time/record fields or mark figures as snapshots; do not invent cash totals.
- If backend sync replay/audit issues API-1–API-4/API-9 remain, treat full paid offline checkout/sync as blocked; timestamp read/display work can still pass independently.
- If a build/browser test is blocked by configuration, record the dependency and use isolated mocks only for lower-confidence tests—never call it deployed verification.

### Definition of done for the future frontend implementation

To mark the future implementation complete: two distinct order times preserved; all named displays/receipts use correct Dhaka sale time; supported date/report/export filters honor their meaning; shifts/advances/payroll/expenses/audit times remain truthful; requirements-file Admin dashboard latest status/history/modal/manual refresh work with authorized existing APIs; logout clearly distinguishes server acknowledgment from local cleanup; online checkout and existing financial flows are unchanged; focused/full tests and manual checks have actual recorded outcomes.

Not claimed done: multi-day offline paid sales, IndexedDB/PWA/background sync, full historical auth-event ledger, server verified duplicate financial replay, arbitrary-period backend exports, Hostinger/VPS deployment, or production certification without real target-environment testing.
