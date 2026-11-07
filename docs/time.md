# SunTech POS — Confirmed Frontend Timestamp Requirements

Reviewed: 7 November 2026 (Asia/Dhaka)
Owner: SunTech POS frontend

**Document stage:** Confirmed requirements and acceptance criteria. This document does not itself authorize implementation. A separate implementation instruction can authorize the phases in docs/time_plan.md.

**Release scope:** Correct online frontend timestamp handling and previously approved dashboard shift/session visibility; prepare for delayed-sale data without enabling a full offline POS.

## Sources and authority

1. The user's frontend planning instructions in this task: inspect the real frontend, verify APIs, preserve operational flows and visuals, and produce a plan without application changes.
2. D:/Project/SuntechPOS-backend/docs/time.md, titled SUNTECH POS — BACKEND TIMESTAMP & OFFLINE EVENT-TIME IMPLEMENTATION PROMPT. Its timestamp ownership, calendar, shift, session, reporting, and future offline rules apply to frontend compatibility. Its instructions to implement backend code do not authorize frontend or backend implementation in this task.
3. D:/Project/SuntechPOS-backend/docs/time_plan.md, titled Timestamp and Offline Event-Time Implementation Roadmap, dated November 7. Its frontend handoff distinguishes intended API additions from existing contracts and explicitly defers full offline shifts/device activity.
4. Current frontend and sibling backend source, inspected on November 7, establish implementation facts, not additional product requirements. Those facts and discrepancies are in [time_plan.md](time_plan.md).
5. docs/Frontend_Doc.md establishes the existing online-only release boundary. Current next.config.ts disables PWA registration and src/app/providers.tsx unregisters service workers.
6. The two requirements versions supplied for comparison contain identical text after line-ending normalization. The version-2 reviewer reports reading SUNTECH_POS_COMPLETE_CHAT_CONTEXT_HANDOFF_2026-11-07.md and attributes dashboard history/details/manual refresh to it. That separate handoff was not found in the current frontend/backend inventory, so this consolidation retains those requirements from the supplied documents without claiming independent access to the original handoff.

**Authority and conflict rule:** explicit, most-recent owner decisions take precedence for product behavior; actual current code and current backend controllers/DTOs determine which capabilities exist; an older plan is not proof of implementation. If requirements and a reachable API contract differ, document the gap and keep the UI compatible—never invent an endpoint, field, or timestamp. For this phase, plan frontend changes only; any backend gaps are dependencies to resolve in the backend workstream.

## R1. Timestamp ownership and meaning

- Keep UTC instants in application data and use ISO 8601 strings with explicit Z or numeric timezone offsets at API boundaries.
- Display operational timestamps and interpret business calendar dates in Asia/Dhaka, independently of browser/server host timezone. A locale such as en-BD alone does not specify a timezone.
- Server/database timestamps remain server-owned: createdAt, updatedAt, online authentication events, online shift opening/closing, audit creation, and server persistence/synchronization times.
- Online checkout must continue without a frontend timestamp. Use the authoritative order timestamps returned by the backend.
- Order occurredAt means the sale event time. Order createdAt means persistence time. Preserve them separately; do not overwrite one with the other.
- Do not invent historical events, substitute the current time for an unknown event, or rewrite stored timestamps to make reports appear correct.
- Handle null, missing, malformed, and legacy timestamps safely. The exact display fallback and formatting helpers are implementation proposals in the plan, not new API guarantees.
- A client-side time used solely to label when the dashboard was refreshed is allowed as UI diagnostics, but must never be stored or displayed as a login/logout, shift, sale, refund, expense, or server-persistence event.
- Prefer a valid occurredAt when showing a sale. An absent occurredAt may use a visibly identified historical createdAt fallback; a present but invalid event timestamp must not silently be replaced with createdAt or the current clock.

## R2. Dhaka business dates and filtering

- 2026-11-07T00:10:00+06:00 and 2026-11-06T18:10:00.000Z represent the same instant and belong to November 7 in Bangladesh.
- Never derive a Dhaka business date by slicing a UTC ISO date or using the host's local calendar.
- Keep date-only business inputs distinct from instants. Do not send ambiguous timezone-free datetimes.
- Prefer half-open calendar ranges: start inclusive, next-day/month start exclusive. Preserve an existing endpoint's inclusive instant-end contract where required for compatibility; do not silently change its meaning.
- Preserve the distinction between rolling periods and calendar week/month/year periods and the actual supported query parameters.
- Sales reporting uses Order.occurredAt; persistence inspection uses Order.createdAt; shifts use openedAt; audits use audit createdAt; expenses use spentAt; refunds use refund processing time; payroll uses its stored salary period and payment time.
- Do not advertise an unimplemented received-date filter or assume the roadmap's conditional dateBasis parameter exists.
- Do not send unsupported from/to, dateBasis, range, week, or month parameters to endpoints with different DTO contracts. A current export endpoint supporting only numeric month/year must not silently export a different period than the on-screen report.

## R3. Orders, checkout, receipts, and reports

- Cover catalog checkout, custom checkout, order history/detail/reprinting, receipt dialog, thermal/text/PDF output, dashboard tickets, report transactions, and exports.
- Keep historical sale time stable when a receipt is reprinted or an order is synchronized later.
- A November 2 sale received November 7 belongs in November 2 sales-by-event-date reporting. Its actual November 7 persistence time remains separately inspectable when returned by the API.
- Do not confuse the time of the original sale with the time of a later refund or stock/audit mutation.
- Preserve current payment methods, integer-money rules, prices, tender/change, refund quantities, inventory behavior, drawer arithmetic, payroll deductions, and idempotent retry flows.
- Preserve POS product cards, layout, styling, interactions, checkout success/error behavior, customer data, and receipt identity. Timestamp work is not a redesign.
- Receipt dialog, plain-text output, browser/thermal print, and downloaded PDF must use the same original sale instant. A reprint never uses print/download time. Existing A4 and 80 mm alignment, text wrapping, Bengali/Unicode fallback, and item/amount completeness must be checked independently; date formatting changes are not permission to rewrite the receipt engine.
- Preserve business/branch and period intent consistently between report screen and supported CSV/PDF exports. If the backend cannot export the selected rolling/week/year period, explain that limitation instead of silently substituting a calendar month.

## R4. Shift, authentication, and dashboard information

- Preserve one cashier shift per Asia/Dhaka calendar day, including rejection of a second opening even after that day's shift was closed. A next-day opening automatically closes the cashier's previous-day OPEN shift in a backend transaction.
- Preserve autoCloseReason and existing notes; an uncounted automatic close has closingAmount=null and variance=null, not zero. A genuinely counted 0 BDT must remain distinguishable. Expected cash is a different field from physical counted cash.
- Logout does not close a shift. Checkout remains available without a shift; shiftId stays optional. Explicit shiftId:null must not be converted into an active shift; another cashier's or an older OPEN shift must not be attached.
- Online shift/authentication timestamps must come from the backend, not the frontend clock. Never replay historical offline shift events through today's online shift-open endpoint.
- On the existing Admin Dashboard route, show the chosen business/branch's shifts opened today across all cashiers, both OPEN and CLOSED; show older OPEN / carryover shifts separately, and show the last CLOSED shift. Never claim yesterday's OPEN shift proves a cashier logged in today.
- Show each cashier's latest isLoggedIn, lastLoginAt, and lastLogoutAt only when provided by the authorized backend overview. These are server session fields, not proof a particular device is connected. Do not manufacture a historical login-event timeline or session duration from last-value fields.
- On that same Admin Dashboard, provide the previously requested historical shifts table using existing GET /shifts with supported fromDate, toDate, cashier, status, branch, and pagination filters. Dates are Dhaka opening dates. Each row supports View Details in a modal using the data already returned by GET /shifts; do not invent a detail endpoint.
- Provide Refresh latest data on the existing Dashboard. It must refetch live cashier/shift/overview/history data on demand, show last successful refresh time and loading/error/stale status, and never show cached data as confirmed live. Do not use ISR as the sole freshness source for live sessions/shifts or introduce continuous polling solely to keep status alive.
- If an existing, separately authorized Admin action closes a selected cashier shift, it must target POST /shifts/:id/close with the actual selected ID after an appropriate confirmation. Never use a no-ID POST /shifts/close for another cashier. The current dashboard has no such close control; this requirement is a guard for existing authorized flows, not permission to introduce a new financial action. Do not add a new Admin shift page or unrelated management endpoints.
- Show full Dhaka dates and times on session/shift/history information, not just 12:17 AM. For auto-closed shifts use “Shift auto-closed — closing money not provided.”; for other null closing money use “Closing money not provided.”; for counted zero show 0 BDT.
- Preserve JWT/session validation, HttpOnly cookies, refresh behavior, force-logout security, business/branch scope, and existing local sign-out cleanup. A server-acknowledged logout must be distinguishable from local-only sign-out after an upstream failure; acknowledgment is not proof of a newly written server timestamp.
- All new dashboard/history fields are optional compatibility reads until the target backend deployment is verified. Missing data means unavailable, not zero shifts, all cashiers logged out, or a successful server operation. Do not label stored OPEN-shift aggregates as up-to-the-second live drawer totals unless their backend calculation is verified.
- Offline device unlock/activity must not be represented as server authentication. Full login/logout event history remains blocked until server-written event records and a scoped read contract exist. Business/branch switching must not leak cached shift/session rows from another scope.

## R5. Other financial and administrative timestamps

- Preserve intentional historical expense spentAt independently of creation time and preserve the existing optional API field.
- Preserve advance takenAt, current payroll period/payment rules, and server-owned normal CRUD dates. Eligible undeducted salary advances are deducted exactly once during payroll; the centralized Expenses list records only manual expenses and actual net payroll payouts, not advances.
- Do not change a payroll salary month/year because the browser happens to be in UTC or another timezone. An explicitly selected historical salary period must survive API refetch and UI rerender.
- Do not introduce offline advances, payroll, expenses, refunds, stock adjustments, or unrelated timestamp columns.
- Do not expand frontend historical-date entry, staff-management features, or administrative controls merely because a backend field exists. Any conditional UI additions must be identified as proposals in the plan.

## R6. Confirmed offline timestamp-readiness boundary

This frontend remains online-only in this scope. Timestamp readiness means that its data mapping, formatting, reporting, and receipt handling can correctly consume delayed event timestamps without destroying their original meaning, and that future integration dependencies are accurately documented.

The future offline requirements are real, but do not authorize building the full offline client now:

- A future paid offline sale must durably retain its original clientOrderId, stable device/actor/tenant/branch context, complete paid-sale payload, and actual device-reported occurredAt before it is considered saved.
- Synchronization retries must preserve the original identity, payload, and event instant. Explicit null shift attribution remains null. A later currently open shift must not be substituted.
- Devices may synchronize 4–10 days later or longer; do not introduce a 24/48-hour age cutoff.
- Device timestamps need format validation and a documented backend clock-skew policy. An accepted timestamp is device-reported evidence, not independently verified clock accuracy.
- Rejected, unauthorized, network-failed, and unconfirmed legacy transactions must remain available for recovery. Never silently rewrite their timestamp, generate a new ID to evade a rejection, or discard a paid sale.
- A future queue acknowledges only matching server-confirmed results under the verified contract. The roadmap's strengthened duplicate verification and legacy admin confirmation are backend dependencies, not assumed existing behavior.
- Expired/revoked/reassigned sessions require authorized recovery; do not sync as a different cashier or bypass authentication.
- Saved unpaid carts and temporary online retry records are not a durable offline paid-sales queue.

**Explicitly deferred:** IndexedDB/outbox storage, service-worker/PWA enablement, offline checkout, offline receipt issuance, background synchronization, offline PIN unlock, shift-event synchronization, manual event-time correction/reconciliation UI, and admin recovery on behalf of revoked users. No new offline runtime or network calls are required just to format existing order timestamps correctly.

## R7. Delivery and validation constraints

- Planning/review stage only: update docs/time.md and docs/time_plan.md; do not modify the application during the planning stage. A later explicitly authorized implementation will modify the source files in the plan. This is not a contradiction.
- At implementation start, recheck git status, the current frontend/backend worktrees, API DTO/controllers, and the recorded source snapshot; preserve all unrelated changes. Document changed or undeployed contracts before relying on them.
- The plan must identify exact source files/functions, existing behavior, missing functionality, bugs, backend dependencies, ordered phases, failure handling, and acceptance tests.
- No unnecessary libraries, databases, tables, Redux migration, new accounting architecture, or unrelated refactoring.
- Preserve all unrelated working-tree changes.
- Test Dhaka midnight and month/year boundaries, null/invalid timestamps, historical orders, delayed synchronization evidence, API errors, authorization, optional shifts, receipt consistency, and operational regressions.
- Record actually executed checks separately from proposed future checks. Passing current tests does not verify unimplemented behavior or a deployed API contract.

## Acceptance criteria and scope gates

| Requirement | Observable acceptance (future implementation; not claimed complete here) | Dependency / gate |
| --- | --- | --- |
| R1 | Raw event and persistence times survive mapping; unknown dates do not become epoch/now; formatting cannot repeat or fail a committed sale | Existing order APIs and frontend mappers |
| R2 | Dhaka display is independent of host timezone; midnight/calendar/rolling filters match supported DTOs | Endpoint-specific date contracts |
| R3 | Orders, reports, receipts and reprints agree on sale time; amounts, identity, stock and retries remain unchanged | Browser/print checks and supported server exports |
| R4 | Dashboard separates today OPEN/CLOSED, older OPEN, last CLOSED and latest session state; filtered history/detail modal and real manual refresh report errors/staleness; local-only logout is distinguished | Existing overview/shifts/auth/BFF; optional fields require deployment verification; stored cash is not assumed live |
| R5 | No invented advance date; payroll uses authoritative salary period and existing deductions; expense incurred time stays separate from creation | Existing HR/expense contracts and financial regression tests |
| R6 | Delayed orders preserve event versus recorded time; no offline runtime introduced or claimed working | Separate future offline/security/replay workstream |
| R7 | Exact code paths, phase tests, actual PASS/FAIL/NOT RUN evidence and regression protections are documented | Source recheck, focused tests and manual verification |

**Out of scope / no authorization:** no new login-history backend endpoint, new Admin shift-management route, mandatory shifts, offline paid-sale queue, service worker, offline checkout, offline shifts, new financial schema, new payroll logic, arbitrary-period export endpoint, or new Redis/queue service in this frontend timestamp pass.
