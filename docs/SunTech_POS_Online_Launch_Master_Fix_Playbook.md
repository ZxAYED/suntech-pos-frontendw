# SunTech POS — ONLINE-ONLY FRONTEND LAUNCH: MASTER FIX & VERIFICATION PLAYBOOK

> **Codex / agentic coding execution document — 2026-10-28**  
> **Intent:** Resolve every substantiated Phase 0–12 integration defect identified in the uploaded frontend review and Gemini's audit; verify backend-dependent findings; implement Phase 14's **online-only** security, regression and E2E tests; prepare an evidence-based localhost sign-off and online-only client handoff.  
> **This document is a remediation plan, not a claim that any fix or test has passed.**  
> **Out of scope:** Phase 13 offline-first sale execution, IndexedDB queues, service-worker caching, durable offline receipts, PWA install/release engineering. Design online foundations so Phase 13 can be added later without changing confirmed orders.

## 0. How to use this document — READ BEFORE RUNNING CODEX

Place this file in `docs/SunTech_POS_Online_Launch_Master_Fix_Playbook.md` inside the **frontend** repository. Keep all existing docs, especially:

1. `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md` — backend contracts and workflows.
2. `docs/frontend-api-integration-plan.md` — Phase 0–14 original plan and prior 75 micro-prompts.
3. `docs/FRONTEND_INTEGRATION_PROGRESS.md` — existing implementation ledger (its COMPLETE labels are *not* runtime proof).
4. `docs/frontend-page-api-map.md`, `docs/frontend-backend-gap-register.md`.
5. `docs/phase-evidence/phase-1.md` through `phase-12.md` and `docs/architecture/auth-cookie-topology.md`.
6. Root `AGENTS.md`, `README.md`, `.env.example`, `package.json`, `next.config.ts`, `src/proxy.ts`.
7. Where accessible, **backend read-only**: NestJS controllers, guards, DTOs, services, Prisma schema and existing tests; backend `docs/POS.md`. Frontend notes alone are not proof of backend behavior.

**Execute exactly ONE numbered Fix Pack at a time.** Each pack below contains a complete prompt to give Codex. After each pack, run its prescribed tests, update the progress and gap documentation, report evidence, and **STOP**. Do not jump into a later pack because it looks easy. If one pack reveals a deeper cross-cutting regression, fix within scope and add a regression test. Every task must have a tested exit gate. The agent must not claim `COMPLETE_VERIFIED` without real evidence.

### Source snapshot and trust levels

This plan is tailored to the uploaded `frontend(2).zip` source snapshot (about 160 `src` files), accompanying `docs/`, previous analysis, and the user-provided Gemini audit (`Pasted text(4).txt`). Paths and line positions refer to that snapshot; use symbol search instead of trusting line numbers after modifications. Backend source was **not independently available as a live checked-out repository during this final document construction**; frontend integration guides contain claims about it. Treat backend endpoint specifics as **VERIFY AGAINST BACKEND BEFORE EDITING** when the contract matters.

- **CONFIRMED CODE EVIDENCE** = directly visible in provided frontend source; runtime impact still needs tests.
- **LIKELY / CONTRACT DEPENDENT** = supported by code or guide but exact backend DTO/response/authorization requires read-only backend inspection or live API proof.
- **USER BUSINESS REQUIREMENT** = explicit owner decision; supersedes mistaken Gemini advice and older plan assumptions where not contradicted by actual backend restrictions.
- **UNSUPPORTED** = no proven backend endpoint; never fabricate APIs, fake data persistence or non-existent success to satisfy UI.

### Non-negotiable product and engineering contract

- **Online only now.** Finish Phases 0–12, then implement **Phase 14 online test scripts now** and run localhost testing. After live user acceptance, deliver the online product. Only later, after client feedback, start Phase 13 offline/PWA.
- **Backend is accounting and authorization authority.** Frontend may preview amounts, but backend confirms order totals, discounts/tax *if supported*, tender, payment, refund and payroll. No frontend-only financial completion.
- **Money is integer BDT taka**, not paisa/cents. Strict integer parsing, `Number.isSafeInteger` when JavaScript numbers are used; reject NaN, Infinity, fractions, negative values where invalid, unsafe totals, malformed strings and overflow. Do not assume discounts, tax, service charges, split payments or other features exist unless DTO proves them.
- **No silent defaults for financial or required API fields.** A VISIBLE, selected UI default such as COD is allowed *only when intentional and validated*. If the control/field is absent, blank, invalid, or the backend omitted required data, show a helpful validation toast/error and block the action. Do not convert missing values to `COD`, `PAID`, quantity 1, price 0, now, or a fictitious tenant. Send `null` only for explicitly backend-nullable fields; omit optional fields only if DTO permits. No invented `businessId`, `locationId`, `cashierId`, `shiftId` or payment method.
- **Admin owns/selects business and location** and must be constrained to authorized owned resources. **Cashier never selects tenant**; NestJS derives cashier business/location from authenticated token/principal/assignment. The browser does not decode HttpOnly JWT for trusted tenant scope. Cashier UI never attaches guessed or stale Admin-scoped IDs.
- **Advance ≠ business expense ≠ drawer withdrawal.** Only Cashier requests his/her own HR salary advance. Admin views, audits and may **soft-delete/void** permitted advances. Admin does NOT create salary advances. Only non-deleted eligible advances deduct from salary. Deleted records remain in authorized history with a Deleted badge and zero effective deduction. A restore/undelete action is **not** authorized unless backend supports and product owner approves it. Business expenses are independently recorded by Admin. Drawer cash-out is a separate feature and must remain unsupported if there is no backend contract. If money is physically taken from a drawer as an advance, flag whether the backend ledger/reconciliation supports linking the withdrawal; do not fake this link.
- **One order = one immutable business event** with its own backend ID, receipt/invoice number, time, branch, cashier, payment, lines, refund state and print action. Order A/B/C remain separate, including in history, reports, and future offline replay. Do not combine orders into a batch invoice/receipt or overwrite the preceding confirmed order. Online printing uses an independently printable receipt preview for a selected order, including reprint from history; print action never creates another order.
- **Secure cookie-based session:** Next same-origin BFF + HttpOnly credentials; no JWT in JS-readable cookies, `localStorage`, Redux persistence, IndexedDB, service-worker caches, request logs or URLs. Refresh low-frequency and **single-flight**, ideally proactive around day five of an actually verified seven-day access expiry; renew Next's signed routing-session as appropriate. Refresh safely on foreground/reconnect and upon qualifying 401. No frequent per-page `/users/me`, no infinite auth loops and no financial POST auto-replay after an uncertain outcome. A month disconnected is **not** covered by online-only cookie lifetime and is a deferred Phase 13 offline-device policy.
- **Never force global `Content-Type: application/json`.** JSON requests can explicitly/automatically send JSON; `FormData` must not inherit a JSON header or hard-coded boundaryless multipart header. Test with the BFF and the backend, both profile image and multi-image gallery. Preserve multipart boundaries, filenames, body content and cookies.
- **Idempotency is operation-specific and stable.** Use a UUIDv4 or exact backend-supported key only for routes requiring it. Generate the key ONCE for the user's logical money-changing operation, not inside `mutationFn` on every attempt. Preserve exact payload and key across uncertain retries/reloads when recovery is supported. Do not inject new keys indiscriminately into every mutating route. Do not assume idempotency decorator exists on all CRUD routes.
- **Preserve current UI visual baseline:** navy sidebar, selected blue menu, white panels, dialogs/tables, responsive layout and especially compact existing POS product cards (`xl:grid-cols-4`, current image aspect). Keep one small variant selector per grouped product card; no card-height inflation or complete redesign. Preserve usable Admin/Cashier routes and user navigation.
- Reuse existing TanStack Query, Axios, Redux where purposeful, React Hook Form/Zod, Tailwind and Sonner. Keep one source of truth per domain; centralize repeated mappers/types/dialogs; follow DRY/KISS/SOLID in moderation, **not** large unrequested rewrites. Queries are user/business/branch/filters scoped and invalidated after affected mutations.
- Remove or quarantine demo/mock imports from **all production routes**, but do not delete fixtures needed by tests/storybook until replacements exist. Do not substitute hardcoded sample rows for failed API calls.
- **Never hide backend contract gaps.** If backend cannot fetch/mutate because an API requires businessId/locationId, missing enum, permission or expected field, write the exact backend escalation report described below and STOP that feature as `BACKEND_BLOCKED` while continuing safe unrelated work.let me know if backend has any issues . i will fix it .
- For unexpected output/error, preserve user input and show clear loading/success/failure state. Toast success only after backend success; financial uncertainty is explicitly **pending verification**, not success.

### Required backend escalation paragraph — COPY VERBATIM into each implementation task's instructions

> **BACKEND CONTRACT ESCALATION:** If any API, especially a Cashier API, unexpectedly requires `businessId`, `locationId`, `cashierId` or another field that the authenticated backend should derive; fails to expose correct soft-delete, refund or payroll calculations; rejects a genuine frontend payload; or lacks authorization for a necessary flow, DO NOT invent IDs, modify the role, send fake defaults, or silently bypass validation. Log a `BACKEND_BLOCKED` issue identifying exact URL/method, role, verified user/business/branch context (redacted), DTO expected vs actual request, status/response, controller/service/Prisma location if accessible, reproducible steps, expected behavior, proposed backend change and business risk. Tell the owner what backend change is needed. Continue only with independently safe tasks; do not mark this flow integrated until backend fix is retested.

### Deliverables required after EACH Fix Pack

Update/add:

- `docs/ONLINE_RELEASE_FIX_PROGRESS.md`: pack/issue IDs, confirmed changes, files, test commands/results, branch, dates, screenshots, blockers, next step.
- `docs/ONLINE_RELEASE_BACKEND_BLOCKERS.md`: backend-only issues using escalation template; never bury contract mismatches in TODO comments.
- `docs/ONLINE_RELEASE_API_COVERAGE.md`: route/action → actual controller/DTO → service hook/mapper → caller role/scope → states/errors → test ID → `PASS|FAIL|BACKEND_BLOCKED|NOT_APPLICABLE`.
- `docs/ONLINE_RELEASE_FINANCIAL_INVARIANTS.md`: truth tables and checked examples for money, stock, refunds, payroll, shift reconciliation, reports and payment methods.
- Existing `docs/FRONTEND_INTEGRATION_PROGRESS.md`, phase evidence and gap register when findings change. Correct inaccurate `COMPLETE` claims.

Pack report format: `Implemented / Verified / Regressions checked / Tests passed and exact commands / Browser/network or backend proof / Remaining blockers / Files changed / Screenshots/UI preservation / Next pack`. Do not call an endpoint integrated just because its hook exists.

---

# A. Consolidated issues and ownership decisions

| ID | Severity | Finding / required outcome | Source area / evidence | Gate |
| --- | --- | --- | --- | --- |
| FIN-01 | **P0** | Admin advance-create UI violates Cashier-self-service business rule; move creation to Cashier, keep Admin view/void only | `features/hr/components/payroll-manager.tsx` create button/handler; `features/hr/api/use-hr.ts` | F08 |
| FIN-02 | **P0** | Soft-deleted advances must remain visible but excluded from salary, advance summary and relevant expense/accounting totals; backend must prove behavior | `use-hr.ts` advance mapper only includes `status`; payroll guide | F08, F09 |
| FIN-03 | **P0** | Monthly payroll payable currently sums already-processed employees; distinguish outstanding vs total, guard re-disbursement | `payroll-manager.tsx` `totals.payable` | F08 |
| FIN-04 | **P0** | Payroll/disbursement/advance keys built with `Date.now()` inside `mutationFn`, unsafe under retry | `use-hr.ts` `useProcessPayroll`, `useDisbursePayroll`, `useCreateAdvance` | F05, F08 |
| FIN-05 | **P0** | Missing-order fields silently become `PAID`, `COD`, quantity 1, unitPrice 0, current timestamp | `features/pos/api/use-pos.ts` `useOrders` mapper | F05 |
| FIN-06 | **P0** | Refund history loses per-line refunded quantities and refunded amount; prevent over-refund UX and double requests | `use-pos.ts` order mapping, `useRefundOrder` | F06 |
| FIN-07 | **P0** | Refund idempotency key is optional and uncertain retry can create fresh key; distinguish replay vs new refund | `use-pos.ts` `useRefundOrder`, orders UI | F05, F06 |
| FIN-08 | **P0** | Money previews/tender on noncash method silently assume full amount, not a real provided payment value | `terminal-workspace.tsx`, `custom-sale-view.tsx` | F05 |
| FIN-09 | **P1** | Dashboard Cashier unit count presented as order count; average ticket calculated per unit | `features/reports/api/use-reports.ts` `mapDashboardPayload` | F09 |
| FIN-10 | **P1** | Payment breakdown uses fake `CASH` vs actual `COD`; partial breakdown/percentage drift | `use-reports.ts` payment mapper | F09 |
| FIN-11 | **P1** | Inventory valuation substitutes retail selling price for unknown cost; metrics mix scoped and filtered counts; low-stock threshold guessed | `features/catalog/components/catalog-manager.tsx` `metrics` | F04, F09 |
| FIN-12 | **P0** | Validate all sale totals, refunds, shift opening/closing, stock, amounts, payroll and export values for integer BDT and backend agreement | checkout/order/payroll/report/shift hooks & views | F04–F09, F13 |
| API-01 | **P0** | Variants not joined through existing `mapVariantToCatalogRow`; names/category filter may break | `catalog-manager.tsx`, `catalog/view-models.ts` | F04 |
| API-02 | **P0** | Edit Variant shows stock but save path ignores stock; false success | `catalog-manager.tsx` `VariantFields`, `saveVariant` | F04 |
| API-03 | **P1** | Multipart upload inherits blanket JSON content-type and manually forces multipart | `lib/api-client.ts`; `catalog/api/use-catalog.ts` | F01, F04 |
| API-04 | **P0** | No printable receipt for Catalog/Custom/History; terminal button disabled | `terminal-workspace.tsx`, `custom-sale-view.tsx`, orders route | F10 |
| API-05 | **P1** | No barcode scanner hook connected to register search; check required scanner UX | `hooks/use-barcode-scanner.ts`, `terminal-workspace.tsx` | F07 |
| API-06 | **P1** | Catalog checkout misses customer name/phone controls although custom sale supports them | `terminal-workspace.tsx` | F07 |
| API-07 | **P1** | Admin order visibility/refund access needs dedicated authorized Admin UX; don't give Admin Cashier role | `proxy.ts`, `sidebar.tsx`, `reports-dashboard.tsx` | F03, F06 |
| API-08 | **P1 / backend-dependent** | Staff create/edit/status/delete selected business may not map to backend mutation scope | `features/hr/api/use-hr.ts`, gap register | F03, F11 |
| API-09 | **P1 / verify** | `GET /shifts/active` has user-only cache key and no explicit Admin business/branch scope | `features/shifts/api/use-shifts.ts` | F03, F07 |
| API-10 | **P1 / verify** | Stock operation `"set"` case may or may not match backend enum; no guessing | `features/catalog/api/use-catalog.ts` | F04 |
| API-11 | **P1** | .env sample/backend/Next ports need real tested mapping | `.env.example`, `package.json` | F00, F01 |
| API-12 | **P1** | Source maps only chosen endpoints; ensure all visible actions truly call correct backend, no mock success | all route/page components | F00, F11, F13 |
| SEC-01 | **P0** | Seven-day signed Next routing session does not renew with access refresh; 5-day low-frequency renewal needed | `lib/session-cookie.ts`, `app/api/v1/[...path]/route.ts` | F02 |
| SEC-02 | **P0** | Guard against auth/session divergence, stale roles and backend reassignment; strict cookie/CSRF handling | `proxy.ts`, BFF, auth hooks | F01–F03 |
| SEC-03 | **P1** | Vulnerable dependency possibility; run audit and upgrade to reviewed patched compatible versions | `package.json`, lockfile | F12 |
| PERF-01 | **P1** | Duplicate legacy Redux API layer, old mock imports and multiple UI primitives; remove only after verifying zero production consumers | `redux/api/*`, `src/mocks/*`, `src/demo/*`, common/layout UI | F12 |
| PERF-02 | **P1** | Query cache/invalidation and tenant-switch correctness, E2E request volume, stale results | feature `api` hooks, query keys | F03, F12 |
| QA-01 | **P0** | No official test script / Phase 14 online financial and role E2E regression suite | `package.json` | F13 |
| QA-02 | **P0** | No verified localhost authenticated end-to-end sign-off for Phases 0–12 | progress/evidence docs | F14 |

**Important corrections to Gemini:** (1) Do **not** add `cashierId` to let Admin create advances—the Admin must be forbidden from creating them. (2) Do **not** automatically add business/location IDs to Cashier calls. (3) Do **not** automatically inject UUID keys into all mutations; match annotated backend endpoints. (4) `POST /shifts/advances` is **NOT** a proven salary advance endpoint; leave drawer withdrawal separate unless backend contract proves its meaning. (5) Admin refund UX should have its own authorized route or shared *role-safe* screen, not a blanket `/pos` bypass. (6) No default `SET` vs `set` stock enum change without reading the actual DTO. (7) The past Gemini finding that Admin should directly access Cashier shifts is a **product/authorization decision**, not a proven bug. (8) Backend-derived Cashier scoping is correct, not a missing API parameter.

---

# B. Execution order and hard-stop gates

1. **F00** — audit baseline / source-of-truth and API matrix.
2. **F01** — HTTP transport, BFF, multipart, error normalization, idempotency primitives.
3. **F02** — session/cookie/refresh/RBAC lifecycle.
4. **F03** — tenant boundaries, Admin access, Staff/Shift scope.
5. **F04** — Catalog correctness, variants, stock, images, metrics.
6. **F05** — transaction primitives, payment/money validation, order mapping.
7. **F06** — independent order history, refund lifecycle, Admin authorization.
8. **F07** — Catalog/Custom checkout UX, barcode, shifts and order-specific behaviors.
9. **F08** — Cashier advances, Admin payroll governance, soft deletion and recalculation.
10. **F09** — finance dashboards, reports, expenses and exports.
11. **F10** — complete reusable print preview, thermal receipt and reprint.
12. **F11** — finish all remaining Phase 0–12 route/action API flows, Super Admin, audit, user management.
13. **F12** — DRY / performance / accessibility / security dependency hardening.
14. **F13** — Phase 14 ONLINE automated test infrastructure + exhaustive regressions.
15. **F14** — live localhost validation, launch decision, client-delivery handoff.

**Release is blocked by unresolved P0 finance or security issues or unknown money-changing outcomes.** A backend issue that blocks a required Phase 0–12 flow is not waived merely because it is not fixable in the frontend. `F14` cannot declare a client GO without backend validation.

---

# C. CODEx FIX PACKS — COPY ONE PROMPT AT A TIME

## F00 — Establish accurate baseline and full implementation inventory

**Agent prompt:**

> You are implementing **F00 ONLY** of `docs/SunTech_POS_Online_Launch_Master_Fix_Playbook.md`. Read the entire document, `AGENTS.md`, the original guide and ALL docs listed in §0, all production frontend routes, provider/API clients, and the backend controllers/DTOs/services read-only if accessible. Do NOT modify business logic in this pack. Establish the exact frontend commit/hash, runtime Node/npm versions, backend branch/commit and actual API base URL and port; do not guess from `.env.example`. Re-run `npm ci` in a safe environment, `npm run typecheck`, `npm run lint`, `npm run build`, plus relevant existing tests. Document current outputs; failure is evidence, not a reason to skip.
>
> Inventory every route and **every visible control**: URL, role, displayed business/branch, read and write dependencies, actual frontend hook, server endpoint and method, DTO, server owner, missing IDs/fields, API mapper, validation, loading/error/empty/403, mutation invalidation, print/navigation, test. Include login/register/password reset; Admin selection/CRUD; Catalog Category/Product/Variant/stock/images; Staff; Shifts; Catalog and Custom checkout; Orders/refunds/receipts; Dashboard/analytics/reports/exports; Payroll/Advances; Expenses; Audit; Super Admin. Flag any `mock`/`demo` in a production dependency chain and any unbound or fake button. Reconcile old `COMPLETE` evidence with current source. Gather screenshots at normal desktop and mobile widths for critical screens; establish existing compact product-card dimensions. Summarize backend gaps, never invent missing routes.
>
> Build source-backed matrices in `docs/ONLINE_RELEASE_API_COVERAGE.md` and `docs/ONLINE_RELEASE_FINANCIAL_INVARIANTS.md`; create progress and backend-blocker files. Mark issues in Section A as `CONFIRMED`, `CONTRACT_DEPENDENT`, `NO_LONGER_PRESENT`, or `NEW`. Record traceability. **STOP** after reporting baseline and the exact first F01 prerequisites.

**Acceptance:** no source code changes; complete action inventory; developer environment reproducible; backend and port evidence; honest original-plan status corrections; screenshots; no `COMPLETE_VERIFIED` without authenticated tests.

## F01 — Repair shared HTTP/BFF transport and upload content-type boundaries

**Agent prompt:**

> Implement **F01 ONLY**, honoring the global contract and escalation rule. Read `src/lib/api-client.ts`, `src/app/api/v1/[...path]/route.ts`, `src/features/catalog/api/use-catalog.ts`, auth/session docs and backend cookie/CSRF/upload handlers. The present Axios instance sets `headers: {"Content-Type":"application/json"}` globally; remove this body-type hazard. Send JSON content-type only for real JSON payloads; when data is `FormData`, let Axios/browser construct the multipart boundary. Remove manual boundaryless `multipart/form-data` overrides when harmful, keeping correct upload field names `file` and `images` only if backend verifies them. Ensure the Next BFF transparently forwards raw file bytes, original boundary, cookies and allowed headers; downloads retain blob, content disposition and correct MIME. Do not serialize FormData to JSON, force JSON on GET, or leak `Set-Cookie`/JWT into client payloads.
>
> Audit every API call for exact HTTP method, query vs body, nullability, empty strings and tenant context. Normalize backend envelope/error shapes while preserving field error codes, status, retryability and correct blob handling. Prevent server-only backend URL from falling back to an unsafe public URL in production without approved architecture. Check origin/Sec-Fetch-Site/CSRF and cookie forwarding under localhost and deployment proxy, especially upload and authentication endpoints. Explicitly maintain timeout/abort behavior and forbid automatic replay of money-changing POST/PATCH after an unknown result. Implement a **shared logical operation ID/idempotency contract** (not a blanket key injector) that lets callers supply stable UUID keys only to backend-annotated routes. Reject malformed idempotency keys if backend requires UUIDv4; do not build `Date.now()` keys. Do not add a new API abstraction parallel to the existing client.
>
> Add automated JSON vs `FormData` request tests, single/multiple image upload with a real BFF boundary assertion, binary CSV/PDF blob test, error-envelope and 401 forwarding tests, timeout and abort tests. Verify the correct local backend port and update `.env.example` with an explanatory setup; never overwrite developer secrets. Check no secrets appear in logs/console/network response JSON. Preserve all UI and current business behavior. Update reports and STOP.

**Exit:** verified uploads, downloads, JSON and proxy cookie behavior; no global JSON header; financial mutation replay policy preserved; no regression in auth or exports.

## F02 — Secure coherent auth/session/refresh without excessive API requests

**Agent prompt:**

> Implement **F02 ONLY**. Read `src/lib/session-cookie.ts`, `src/proxy.ts`, `src/app/api/session/route.ts`, `src/app/api/v1/[...path]/route.ts`, `src/lib/api-client.ts`, login/logout/register/reset hooks and backend AuthController/Guard/JWT settings. There are currently two nominal seven-day credentials: backend access cookie and Next `suntech_session` HMAC projection, while the refresh flow renews access but does not renew the signed Next routing session. Correct this split-brain behavior with a **server-verifiable, synchronized session lifecycle**. Verify token expiration and backend refresh rotation from actual code; never assume renewal success. Implement one low-frequency proactive refresh when online (target around day five of a proven seven-day access expiry, earlier if real expiry/safety skew requires it), one in-flight refresh across concurrent client calls, and one bounded GET recovery for a qualifying 401. Coordinate multi-tab refresh safely to avoid rotation races. Use visibility/foreground/reconnect restoration without frequent polling; never query `/users/me` every route. If refreshing session, renew Next's role-routing projection securely only when identity is backend-verified; do not extend revoked/suspended sessions using stale client-supplied identity. Re-evaluate session expiration and role/branch reassignment on sensible security transitions.
>
> Ensure Admin/Cashier/Super Admin login routing, pending/suspended accounts, no dev-preview bypass in production, logout/revocation, route guards, browser reload and account switch. Do not trust a client-editable role, stale Redux state or localStorage for authorization. Preserve HttpOnly/Secure/SameSite and explicit CSRF/origin policy. Prevent unauthorized cross-role flashes. In money mutations, authentication refresh MUST NOT blindly generate and execute a second sale/refund; preserve uncertain operation and seek status/reconciliation where backend supports it. Test with artificial 401, concurrent refresh, cookie deletion, 5/7/30-day clock simulations (mocked), rotating refresh token, multi-tab, Admin reassignment/suspension, session restore and offline network failures. Clarify that **one month offline is impossible to promise under online-only sessions** and belongs to deferred Phase 13, not invented persistent login.
>
> Update source-specific evidence and STOP. If an untrusted backend refresh response cannot prove user/role, escalate instead of signing new Next session claims from an unchecked stale cookie.

**Exit:** synchronized cookie lifetime, safe least-chatty refresh, protected routes, real role verification, no cross-role exposure, reliable re-login behavior, no token in JS storage.

## F03 — Admin/Cashier tenant and authorization scopes, business/location/staff mutation proof

**Agent prompt:**

> Implement **F03 ONLY**. Audit `src/features/tenant/hooks/use-tenant-scope.ts`, `src/lib/use-tenant-scope.ts`, `src/lib/tenant-preferences.ts`, `features/tenant/api/use-tenant.ts`, `features/tenant/components/business-branch-hub.tsx`, `features/hr/api/use-hr.ts`, `features/shifts/api/use-shifts.ts`, `src/lib/query-keys.ts`, `src/proxy.ts`, sidebar and all related screens. Enforce the owner's rule: ADMIN selects only authorized owned business and location and stores only namespaced **preferences** in localStorage; Cashier business/location is derived by backend from authenticated identity and is NOT selected or sent as arbitrary frontend scope. Validate saved Admin choices against fresh authorized business/branch lists after login, reload, scope change and reconnect. On switch: prevent stale inflight data, isolate query keys, clear or confirm in-memory cart/drafts, and do not move an order from one branch to another. Never use localStorage for permissions.
>
> Validate backend DTO for Admin-owned business/branch CRUD and Staff CRUD. The gap register says multi-business staff **writes** may always target a token/default business; if Admin chose a different owned business, verify which business the backend will mutate. Never silently call against wrong tenant; report a blocking backend issue with exact request/route and stop those writes. For Cashier, do not add `businessId`/`locationId` to `GET /shifts/active` or salary-advance endpoints merely to appease an audit, but ensure the backend really resolves their assignment. For Admin, prove scope in active shift read and include selected branch only where backend accepts it; use tenant-aware query keys rather than user-only active-shift cache if response changes with branch. Verify Staff, payroll, reports and orders obey selected business boundaries. Resolve Admin access to management/order/refund views with role-safe routes/components and legitimate backend authorization, **not** by changing Admin role to CASHIER or opening all `/pos/*` paths. Keep Cashier nav fixed and cost/payroll/admin UI hidden.
>
> Add tenant-switch and two-business/two-branch tests (including same-name branches), cross-user query cache tests, cashier cannot choose business, unauthorized localStorage ID tampering, selected-business staff mutation audit, and denial on 403. Preserve existing business chooser UI, compact cards and sidebar. Report any backend context failure with escalation format. STOP.

**Exit:** correct owner/branch scoping for Admin, backend-owned Cashier scoping, no cross-tenant write/read leak, no wrong-business mutation, role-safe Admin order access decision.

## F04 — Catalog, variant joins, stock mutation correctness, valuation semantics and images

**Agent prompt:**

> Implement **F04 ONLY**. Read `src/features/catalog/components/catalog-manager.tsx`, `src/features/catalog/api/use-catalog.ts`, `src/features/catalog/view-models.ts`, types, Product/Variant/Category backend DTOs and stock/image services. Repair the confirmed defect: `CatalogManager` currently uses raw variants instead of the available `mapVariantToCatalogRow`, leading to missing product/category labels and broken category filtering. Build the correct Product → Category → Variant join without per-row N+1 requests; ensure UUID category filters use product `categoryId`, not category display name. Preserve business and location scope, uncategorized products, product description, first-variant resumable wizard and compact Admin catalog/table visuals.
>
> **Fix Edit Variant stock ambiguity:** the modal renders Stock but the edit branch does not save it. Make stock change an explicit branch-aware `PATCH /catalog/variants/:id/stock` operation with correct DTO, separate from variant metadata update. Either connect the field to a clear two-step save with correct success/error handling or make it read-only with a prominent 'Adjust stock' action; never show 'Variant saved' for a stock change that never happened. Stock `operation` casing (`set` vs `SET`) MUST match actual backend DTO/enum: read it, do not guess. Distinguish absolute set from add/deduct; validate integer and current branch. Handle concurrent admin changes and sale stock updates; do not treat cached stock as authority.
>
> Fix inventory metrics so labels define their dataset (all scoped vs currently filtered) consistently; do not mix product total from all rows with stock from filtered rows without explicit labels. Inventory **cost valuation** must never substitute sellingPrice when cost is absent. Show unknown/incomplete valuation or approved subtotal plus excluded count as appropriate; never publish an inflated 'asset value'. Respect real minimum stock threshold if provided; if backend has no threshold, do not invent a magic 5 without clearly agreed UI-only rule. Separate gross inventory retail potential from inventory cost basis if both are desired; label truthfully. BDT integer multiplication must be safe from overflow.
>
> Validate variant profile/gallery upload/remove with FormData fix from F01, field names, authorization, MIME/size and response mapping; invalidate register images/stock and other metrics after mutation. Test category join/search, selected category, 0/1/multiple variants, first variant failed/retry without duplicate parent, branch A/B stock, image upload/boundary, metadata update, stock edits and conflict, unknown cost and low-stock logic. Keep existing POS card footprint unchanged. Update evidence and STOP.

**Exit:** accurate Catalog table/category filter; no false stock success; correct per-branch inventory; truthful valuation and verified uploads.

## F05 — Shared money/transaction rules, payment validation, order mapping and idempotency

**Agent prompt:**

> Implement **F05 ONLY**, with P0 financial correctness first. Audit `src/features/pos/api/use-pos.ts`, `src/features/pos/components/{terminal-workspace,custom-sale-view}.tsx`, `src/features/pos/view-models.ts`, `src/types/domain.ts`, `src/lib/payment-methods.ts`, `src/lib/utils.ts`, `src/features/hr/api/use-hr.ts` money mutations, related backend order/refund DTOs/services. Remove silent coercion of missing backend order data into `PAID`, `COD`, 'Item', quantity 1, price 0, current timestamp, arbitrary type/tenant or fabricated totals. Missing mandatory fields are data-integrity errors shown clearly (or isolated as malformed rows with diagnostics); never count corrupted records as paid. Map all real status/payment/line/refund/time fields accurately, preserving nullable/optional semantics. Do not rewrite validated backend amounts with client approximations.
>
> Define a small shared **BDT integer** validation/money utility for displaying/checking safe integer amounts/quantities/multiplication with overflow handling; don't convert to cents or floating currency; do not infer unsupported tax/discount/split-payments. Validate required payment method explicit control selection, allowed backend enum (`COD`, `BKASH`, `NAGAD`, `BANK` only if backend confirms), tender/received amount vs method rules, and empty inputs. Owner allows a visible selected COD option, but **forbids a fallback in API mapper**. For noncash payments do not silently set tender to subtotal; if backend DTO requires tender, show/require an explicitly visible amount and any required reference, otherwise only omit if backend permits. Provide beautiful consistent Sonner toasts and inline field errors; prevent sending `undefined`/`null` contrary to DTO. For zero price, negative quantity, decimals, unsafe integer, and insufficient cash, determine backend permitted semantics and block invalid values before posting. Client preview never overrides server-confirmed receipt.
>
> Audit all money mutations requiring `@Idempotent()` and move generation to one logical operation in caller (UUIDv4 where required); no `Date.now()` generated in mutation functions; no accidental regenerated key on refresh/timeout/retry; distinguish never-sent vs uncertain-sent. Use stable payload/key for retry and freeze draft in unknown-result state. On guaranteed validation failure allow edits and a fresh logical key; on timeout/5xx show 'Outcome unknown—verify before another sale'. Do not send idempotency keys to endpoints that have no contract. Run 1000+ systematic arithmetic/property tests for integer prices/quantities, empty amount, overflow and state transitions; include real DTO examples. Add integration tests proving submitted payment/tender exactly matches UI, preserved cart and correct backend total vs preview handling. STOP.

**Exit:** no implicit money/status defaults; all financial numbers safe; deterministic stable idempotency; no duplicated sale when network is uncertain; UX rejects invalid payload before API.

## F06 — Orders/refunds: separate immutable tickets, partial refund constraints, Admin role-safe access

**Agent prompt:**

> Implement **F06 ONLY**. Inspect `src/features/pos/api/use-pos.ts` `useOrders` and `useRefundOrder`, the order history component (`src/app/(dashboard)/pos/orders/page.tsx` and related view), Admin reports/terminal/nav and exact NestJS order/refund controller, DTO, services. Keep **one row/record per backend order** with independent invoice, ID, timestamp, cashier, branch, payment and lines. Never merge orders, group multiple orders into one printed receipt, reuse an old receipt ID, or silently rewrite recorded order time. Ensure sequential Order A/B/C and concurrent Cashier sales remain distinct. Support server pagination and accurate filters, order details from each correct record, re-fetch where needed.
>
> Map `refundedAmount`, refund status and per-line `refundedQuantity` or equivalent backend fields. Derive each line's remaining refundable quantity only from authoritative persisted refund history. For a line originally quantity 3 with 2 refunded, remaining must be 1; block attempting 2 more and require backend independent validation. Display prior refunds and remaining amount; never infer full paid/refundable total from wrong status or default zero. Use exact backend refund request shape (`items` vs `lines`, `orderItemId` vs `orderLineId`) and case-sensitive enum as verified, not Gemini assumptions. A refund must have a stable operation key throughout retry/reconciliation, and no alternate second key for the same uncertain refund. Validate partial/full refunds, double submission, multi-tab, status and tender behavior. Invalidate order list, registers/stock only as backend semantics require, reports and shift cash only when backend actually updates them.
>
> Provide Admin a **proper authorized Admin order-history/detail/refund UI** reusing role-safe shared order components when permitted by backend. Do not bypass `/pos/*` route guard to expose all cashier functions, and do not invent Admin refund authorization. If only Cashier can refund per backend, record product requirement mismatch and block Admin refund feature pending backend decision; Admin can get safe read-only view if authorized. Preserve Cashier own-scope policies and hide unavailable controls with explanation rather than fake success. Add tests: A/B/C separated, partial then repeated refund, cannot exceed line balance, another branch denial, duplicate key replay, concurrent refund and correct status mapping. STOP.

**Exit:** every order individually traceable; no over-refund; correctly authorized Admin/Cashier actions; reliable refund operation uniqueness; receipts ready for F10.

## F07 — Online register and shifts complete UX, no unauthorized assumptions

**Agent prompt:**

> Implement **F07 ONLY**. Inspect Catalog Terminal and Custom Sale screens, `src/hooks/use-barcode-scanner.ts`, `src/features/shifts/api/use-shifts.ts`, shift page/header, POS view models and Nest orders/shifts DTOs. Preserve existing compact product cards and variant selection; keep variants as distinct SKU lines in cart. Add customer name/phone controls for Catalog checkout **only if backend DTO supports these optional fields**; match Custom Sale validations. Wire barcode scanner to register search if scanner hook works with real hardware keyboard input (do not break typing, focus, inputs or shortcuts), test duplicate barcode and no-match behavior. Verify stock/price preflight, backend order result, current shift optionality, printed receipt data, disabled/submission states and held-tab ticket limitations. Do not introduce offline persistence now.
>
> Shift open/active/history/close must respect Admin selected business/branch where authorized and Cashier backend-assigned context; do not blindly append tenant IDs to Cashier calls. Treat 404 no-active-shift separately from network/backend failures; prove shift optional for checkout from actual backend. Validate starting/closing cash as non-negative safe integer BDT; display reconciliation as backend calculates it; do not predict closing difference from unrelated payroll/expenses. Date/overnight shift timezone must match backend business timezone; previous-day auto-close only with explicit confirmation. Confirm `POST /shifts/open` and `/close` stable operation key lifecycle and multi-click/concurrent behavior. A missing drawer cash-out route is NOT a reason to wire HR advances to a shift ledger: keep it clearly unsupported and escalate if customer requires it.
>
> Test Catalog two variants, barcode match/no-match, branch stock, re-price before commit, customer info, Custom Sale no catalog stock deduction, shift-free checkout, concurrent shift open, overnight close, Admin vs Cashier access, unknown outcome and no duplicate charge. STOP.

**Exit:** complete online sale/shift interactions and careful error handling; no unauthorized scope or fictional cash movement.

## F08 — Cashier self-serve HR advances, Admin soft-delete governance, payroll integrity

**Agent prompt:**

> Implement **F08 ONLY**. THIS PACK OVERRIDES INACCURATE OLDER ADVANCE FLOWS. Read `src/features/hr/components/payroll-manager.tsx`, `src/features/hr/api/use-hr.ts`, `src/features/hr/view-models.ts`, current Cashier navbar/dashboard/layout, backend `advance.controller.ts`, `payroll.controller.ts`, DTOs, services, database soft-delete and aggregate rules. **ADMIN CANNOT CREATE AN ADVANCE.** Delete Admin advance creation button/dialog/handler/dead selection state; keep Admin view of authorized business advances, audit history and soft-delete/void action only. **CASHIER CREATES ONLY HIS/HER OWN SALARY ADVANCE** by posting to proven `POST /advances` self-service DTO (`amount` whole BDT and reason if supported); do not send forged `cashierId`, `businessId` or `locationId`. Add a clear Cashier 'My Advances' accessible UI and list of own records, request form, amount, optional reason, pay-period context if returned, status and visible success/error. Follow confirmed backend monthly salary cap/eligibility and avoid frontend-only salary limits. Payroll remains Admin-only.
>
> On Admin soft delete, use verified `DELETE /advances/:id` with backend role and payroll-state constraints; distinguish `PENDING`, `DEDUCTED`, `VOIDED`/`isDeleted`/`deletedAt` as *actual DTO permits*. A soft-deleted advance **must remain in Admin history** with a visible **Deleted** badge (optionally struck-through amount with explanatory tooltip) rather than vanish silently. Only active eligible advances contribute to pending advance totals/salary deductions; deleted contribute zero. Verify in backend **service/database/query** that soft-delete excludes them from payroll and summaries; if GET currently hides deleted rows or no deletion metadata exists, produce backend escalation and avoid claiming feature complete. Do not invent a restore button. Decide/verify how void after payroll processing is rejected or handled as an audited adjustment, never silently mutate finalized paid ledger. Do not conflate HR advance with business expense or shift cash-out.
>
> Fix payroll `totals.payable` summing processed paid rows; show all-staff monthly payroll **separately** from **outstanding/unpaid payable**; preflight and restrict `Process`/`Batch disburse` based on server statuses, with backend enforcing no duplicate pay. Prevent amount/employee-period mismatch and display accurate deducted advances. Replace `proc-pay-*-${Date.now()}`, `disb-pay-*-${Date.now()}` and `adv-create-${Date.now()}` mutationFn keys with backend-compliant **stable logical UUID operation keys**. Reconcile timeout/unknown result using payroll history/status before another mutation. Update caches for Admin payroll, Cashier own advance, summaries, reports if truly affected and cross-user role boundaries.
>
> Comprehensive tests: Admin no create UI and server rejects forged Admin create; Cashier create ৳200/৳300/৳1000 and only self; Admin void 300; active-deduction sum 1200, deleted 300 retained in history with badge; salary 15000 → payable 13800 absent other adjustments; soft-delete after payroll attempted; Paid employee excluded from outstanding; batch after single settlement does not double-pay; two branches and access denial; unknown timeout same key; no stale summary following deletion. Tests must assert both frontend display and actual backend ledger for accounting. STOP.

**Exit:** exact role workflow, audit-retained deleted advances, exclusion from financial calculations, stable payroll idempotency, no double pay, clear backend escalations where needed.

## F09 — Dashboards/reports/expenses/export accounting truth

**Agent prompt:**

> Implement **F09 ONLY**. Inspect `src/features/reports/api/use-reports.ts`, report view models/components, Admin dashboard and Cashier dashboard, `src/features/expenses/*`, `src/features/hr/*`, backend report/expense service queries and export generation. Repair known report defects: Cashier `myDailyUnitsSold` MUST NOT be mapped to orderCount; average ticket = authoritative net/gross order revenue (according to metric definition) divided by **actual order count**, not unit count. If backend doesn't provide order count, do not fake one—show `Not available` and escalate. Payment enum is `COD` (if confirmed), not `CASH`; use actual `cashAmount`/`byMethod.COD` shape per backend and derive percentages from consistent base/period. Do not hide missing payment methods, create percentages that total incorrectly due to per-method rounding, or present unverified Gross as Net. Never build revenue from filtered/partial list pages while labeling it business total.
>
> Reconcile branch/period/time zone, sales vs refunds, voided order impacts, tender vs net revenue, cost vs selling-price valuation, staff payroll vs paid/owed, and business expense vs salary advance. **Deleted advance is not an expense and does not deduct salary.** Real Admin business expenses use their own category and authorized business scope; Cashier personal advance must not enter business-expense list as if an operational expense. Verify whether advances represent cash disbursement and how they affect cashflow or shift drawer; report missing accounting bridge. Validate CSV/PDF exports with real backend and authorized role, content disposition, correct MIME and BDT, dates, missing data and injection-safe CSV where applicable. Ensure reports transactions pagination and Admin per-order drill-down for refund/print if backend permits. All financial dashboard totals must be server-authoritative and tested against seeded transactions and refunds; no hardcoded `0` for absent mandatory data disguised as genuine zero.
>
> Build reconciliation fixtures: one order with 10 units, ৳3500 -> one order and average ticket ৳3500; two orders one refund; split COD/BKASH/NAGAD/BANK according to supported backend shapes; cost absent variant; salary 15000 with active 200+1000 and deleted 300; partially paid payroll. Verify dashboard numbers, period boundaries Asia/Dhaka/business timezone where configured, filtered vs unfiltered aggregates and CSV values. Update metric definitions in docs and STOP.

**Exit:** reports agree with backend truth, no unit/order confusion, truthful valuation, real payment methods, correct advance/expense segregation and exports.

## F10 — Shared online receipt preview, independent printing and history reprint

**Agent prompt:**

> Implement **F10 ONLY**. Inspect the receipt UI in `src/features/pos/components/terminal-workspace.tsx`, `custom-sale-view.tsx`, order-history details, `features/pos/view-models.ts` and server order output. Build ONE reusable typed **ReceiptDialog / PrintableReceipt** for **Catalog**, **Custom Sale**, and **History Reprint**. Each successful order has distinct `orderId`, invoice number, exact occurredAt/createdAt, cashier/business/branch, payment method, individual line details, integer BDT totals and server-provided tenderedAmount/changeDue when available. Show only supported fields, mark genuinely missing noncritical data clearly (never fabricated). If customer name/phone available, include them. If refunded, show refund status and print semantics consistent with backend; do not erase original sale details or print a new receipt number. A click on Print opens the browser's normal print UI for *that order only* (user can cancel); never automatically mark as printed, submit another order, or combine adjacent orders.
>
> Replace Catalog disabled Print button and add print to Custom Sale and authorized Order History details. Provide print-only CSS for 58mm/80mm thermal where configured and ordinary browser print; hide app sidebar/nav/modals/other orders, avoid split line items and giant blank pages; readable black-on-white, accessible preview, browser print fallback, no required external print bridge. Ensure printing repeated Order A, B and C selects exact content and timestamp for each, including after browser reload/history fetch. Preserve main app appearance and compact product cards. Do not implement PWA/offline receipt storage, future queued-order merging or printer hardware integrations.
>
> Test captured print output/DOM with Playwright (mock/spy print dialog where appropriate); screen/print media snapshots; one click = one print invocation and **zero** checkout/refund calls; reprint old order; cancelled dialog; long receipt, absent phone, partial refund, multiple variants, timestamps/business names, 58mm/80mm and normal paper. Cross-browser manual print preview is required at localhost sign-off. STOP.

**Exit:** printable individual receipts from all 3 entry points; real data only, no accidental side effects, print layouts verified.

## F11 — Close residual Phase 0–12 APIs, user/expense/audit/Super Admin, unsupported UX

**Agent prompt:**

> Implement **F11 ONLY**. With corrected `ONLINE_RELEASE_API_COVERAGE.md` from F00–F10, inspect **every** remaining active screen and action. Verify real routes and DTOs for auth register/forgot OTP/reset, owner businesses/locations, Staff create/update/status/delete, profile/avatar if supported, selected Admin branch, variants media, expense list/create/update/delete if supported, audit filters/entries, Super Admin user listing/approvals/status, payroll history, order history pagination and all existing export buttons. Add missing real online integrations in frontend only where backend provides them. Avoid creating unsupported buttons, fake success toasts, or employee advance Admin writes. Confirm permissions and tenant scope with real roles. Every form must use actual DTO validation and show failure/empty/403/race states. Record business/branch image routes if available; do not invent upload.
>
> For Admin multi-business staff writes, Admin orders/refunds, Cashier scope, soft-deleted advance list, audit export, user profile image, X-report, drawer cashout, warranty, product brand, real time attendance, plan/lane metadata and any other gap-register entry, **check backend first**. Unsupported requests remain visibly not available or hidden with explanatory copy, and are explicitly `NOT_SUPPORTED`/`BACKEND_BLOCKED` in matrix. Do NOT quietly implement a fake endpoint to get 100% API coverage. Preserve current UI design and verify navigation/role isolation. Ensure no production component imports a mock data hook. Add role-aware route action smoke tests, all visible mutation flows, status 4xx/5xx toasts and state preservation. STOP.

**Exit:** 100% of **supported and required online UI actions** have verified backend integration or explicit documented blocker; no fake-success feature; all remaining roles covered.

## F12 — DRY/CLEAN/performance/accessibility and dependency security hardening

**Agent prompt:**

> Implement **F12 ONLY**. Start with working regression tests from preceding packs. Inventory `src/redux/api/*` and its actual imports, TanStack Query hooks, `src/demo/*`, `src/mocks/*`, `components/common/page-header.tsx` vs `components/layout/page-header.tsx`, `MetricCard`/`StatCard`, duplicate local `Field` components, `DataPagination`, duplicated receipts and error/toast logic. **Only remove dead code after verifying no production import**; keep test fixtures where useful. Consolidate onto one existing server-state owner (TanStack Query) and one consistent API client; Redux may continue for cart/UI/session projection where appropriate. Extract reusable payment validation, money formatter, field components, pagination, receipt, tenant scope and typed mappers pragmatically; never change request behavior or UX simply to satisfy DRY.
>
> Optimize network requests: one `/api/session` restore, no repeated `/users/me`, cached category/product/variant lookups, request cancellation on branch switch, no N+1 detail fetching, debounced search, correct query `enabled` dependencies, scoped invalidation instead of global cache clears, no duplicate requests from independent panels when cache keys can match. Use the existing query-key convention and avoid accidental Cashier/Admin cross-tenant data cache. Audit loading/empty/error toasts, keyboard, focus, accessible form labels and dialogs, mobile tables, low bandwidth, memory leaks, URL object cleanup for exports and print, file size limits, CSP/image remote source policy. Keep sensitive payroll in memory-only secure query scope; clear on logout/account switch.
>
> Run `npm audit`/advisory check and **verify current security advisories for the exact installed Next/React and related packages**, then upgrade to compatible patched versions with lockfile and tests (do not hard-code a patch from a possibly stale prior audit). Check deployment config, secure cookies, session secret enforcement, source maps, environment handling, headers, CSP/XSS, unauthorized access and BFF open-proxy/SSRF risk. Do not integrate PWA yet; ensure installed PWA dependency is inactive or not changing online cache semantics. Compare screenshots/performance and report each improvement. STOP.

**Exit:** no active duplicate API layer; fewer redundant GETs without stale wrong-scope data; stable styles, tested accessibility, reviewed dependencies and security config.

## F13 — Implement Phase 14 ONLINE automated tests **NOW** (exclude offline/PWA)

**Agent prompt:**

> Implement **F13 ONLY — the ONLINE parts of Phase 14**. Do not defer testing. Establish production-quality scripts in `package.json` for unit tests, API/contract tests, integration tests and browser E2E, using test tools suited to the existing Next.js 16/TanStack Query stack (e.g., Vitest/React Testing Library/MSW, Playwright), without gratuitous frameworks. Provide isolated fake data and *optional* backend-integration test profile with disposable DB/credentials. Tests must not send real payments or delete live user records. Record test server configuration, seed/cleanup, deterministic clocks and role fixtures, CI workflow (if repo supports it), test retry/timeouts and artifact retention. Never count a mocked contract test as proof against the real backend.
>
> REQUIRED suites: auth/login/logout/refresh/cookie/CSRF/role; Admin selected tenant/Cashier token-derived tenant; category/product-first-variant; variant stock and FormData upload; Staff CRUD and unauthorized business; shift opening/closing; Catalog/Custom sale with zero/one/multiple variants, rapid clicks, network failures, stable idempotency and no duplicated order; payment required values, COD/other method payloads, currency bounds; order history pagination, distinct orders A/B/C, partial/full refunds, double-refund prevention; printable separate receipts and history reprint; Cashier advance self-service, Admin cannot create, Admin soft-delete retained badge, deducted vs deleted salary math, batch payroll already-paid exclusion and no duplicate payroll; dashboard average ticket/payment breakdown/inventory cost valuation; exports/expenses/audit/Super Admin. Include loading/empty/error and responsive/keyboard checks for every role.
>
> Build a **financial truth fixture table** and assertions for: `1 order × 10 units = 1 order not 10`; `3500/1=3500 avg ticket`; `15000 salary - (200+1000 active, 300 deleted) = 13800`; stock per branch cannot leak; refund original quantity 3, refunded 2 → remaining 1; safe 64-bit/backend monetary limits vs JS safe integer; absent cost not valued at retail; integer BDT and overflow/invalid number rejection; checkout `tendered >= total` when backend requires; double submit/timeout same idempotency key. Include period/timezone boundaries, date changes and transport multipart boundary. Assert backend-authoritative totals, not just visual preview. Every test should document mapped issue ID and route. Produce a readable test coverage matrix including runtime contract and not-applicable cases.
>
> Run all tests, lint, typecheck, production build, dependency audit and bundle/performance checks; attach actual outputs. Investigate failures instead of skipping, marking pending, or writing superficial tests. No PWA/offline, no IndexedDB sale queue, no service-worker offline E2E. STOP.

**Exit:** automated repeatable online regression suite with passing tests and documented coverage; real backend integration tests distinguished from mocks.

## F14 — Localhost UAT, release sign-off and online-only delivery readiness

**Agent prompt:**

> Implement **F14 ONLY**, after F00–F13 are complete. Boot the **actual NestJS backend and Next frontend** with verified ports, DB, Cloudinary test credentials, cookie origin and safe disposable tenant/business/branch, using real authorized Admin, Cashier and Super Admin test accounts. Run the online Phase 14 automated test suite plus manual authenticated E2E/UAT, visual regression checks, exports and actual browser print previews. Seed and clean up safely (do not use production payroll/money). Capture request/response status, screenshots, response timing and logs without credentials. Test with network throttling and transient disconnections but DO NOT implement offline checkout/PWA; show appropriate unavailable/unknown warnings and never record offline-confirmed sales.
>
> Walk every row of `ONLINE_RELEASE_API_COVERAGE.md` and all owner business decisions. Verify at least two businesses/branches, different Cashiers, cashier self-advance, Admin view/void and deleted badge, salary recalculation in actual backend DB, partial/refund invariants, 2 paid + 1 unpaid employee payroll batch, payment method selection, refunds, stock branch isolation, unique order A/B/C history and independent printing, session refresh after simulated elapsed days, FormData upload through BFF and negative role tests. Run order/refund/payroll replay safety tests only against disposable backend data. Demonstrate every supported button and backend error state. Verify correct backend 403/404 vs empty and no sensitive role data in browser storage. Review installed dependency vulnerabilities and critical alerts.
>
> Compile `docs/ONLINE_RELEASE_SIGNOFF.md` with row-by-row `PASS / FAIL / BACKEND_BLOCKED / NOT_SUPPORTED`, test command output, exact API payload contract proof, screenshots (including print preview), production env/setup, client-facing limitations, outstanding non-blocking backlog and a definitive **GO/NO-GO**. **GO for client online delivery only** if no P0/P1 blocking defects, all supported required flows pass real E2E, all financial invariants match backend and no unresolved tenant/security or double-payment exposure. Otherwise **NO-GO** with precise next fixes. Do not start Phase 13 PWA/offline; announce that it is intentionally deferred pending client feedback. STOP.

**Exit:** reproducible localhost sign-off and evidence-based online-client handoff; no invented production-readiness claim.

---

# D. Required test and financial invariant catalogue (mandatory for all packs)

| Test ID | Scenario and input | Required result | Priority |
| --- | --- | --- | --- |
| MONEY-01 | Unit price 3500, quantity 10 in a **single** order | Line preview 35000 BDT, order count 1, units sold 10; backend authoritative total | P0 |
| MONEY-02 | One order value 3500 with quantity 10 | Average ticket 3500 BDT, not 350 and not 10 orders | P0 |
| MONEY-03 | BDT input `1.5`, `-1`, `Infinity`, blank, `NaN`, `9007199254740993` | Reject invalid/unsafe values; no network financial mutation | P0 |
| MONEY-04 | Missing payment method/backend record status | Clear validation/data-integrity error, **not** COD/PAID fallback | P0 |
| MONEY-05 | Visibly selected COD and cash tender below total | Block and show useful toast/inline field error | P0 |
| MONEY-06 | Noncash payment with absent tender/reference required by DTO | Explicit validation; no fabricated subtotal tender | P0 |
| MONEY-07 | Checkout POST times out after server succeeds | Same payload/key for verification/replay; no second distinct order | P0 |
| MONEY-08 | Refund quantity 3, first refund 2, next request 2 | Remaining 1; block over-refund client-side AND backend | P0 |
| MONEY-09 | Two duplicate refund POST attempts same logical action | One refund result, no double money movement | P0 |
| MONEY-10 | Branch A variant stock 2; Branch B stock 20 | Display/update/checkout correct branch, no cross-tenant cache | P0 |
| MONEY-11 | Unknown costPrice, sellingPrice 1000 | Cost valuation never uses 1000 as assumed acquisition cost | P0 |
| MONEY-12 | Salary 15000; advances 200/300/1000, 300 soft-deleted | Visible audit 3 records, active advance deduction 1200, net salary 13800 | P0 |
| MONEY-13 | Admin attempts POST `/advances` | No Admin UI; server denies if role restriction is correctly implemented | P0 |
| MONEY-14 | Cashier submits own advance | No Cashier-selected target business or employee, backend binds authenticated identity | P0 |
| MONEY-15 | Paid staff mixed with Due staff | Outstanding payable excludes paid; batch does not pay same person twice | P0 |
| MONEY-16 | Soft-delete advance after payroll finalized | Backend-defined rejection/adjustment, no silent change to finalized payroll | P0 |
| MONEY-17 | Expense vs Advance in dashboard/report | Personal advance not represented as ordinary Admin business expense; deleted excluded from effective advance math | P0 |
| MONEY-18 | Refund + shift close and next-day period boundary | Actual back-office totals consistent with server accounting/timezone policy | P0 |
| HTTP-01 | FormData image/galleries via BFF | Valid multipart boundary and correct file bytes/fields; upload succeeds | P0 |
| AUTH-01 | 5-day proactive refresh and 7-day server route guard | Renewed access **and verifiable Next session**; no needless repeated refresh | P0 |
| AUTH-02 | Concurrent 401 GET requests | One refresh and correctly bounded safe retries | P0 |
| AUTH-03 | Cashier tries Admin branch preference/URL | Denied, no unauthorized selected-branch mutating request | P0 |
| ORD-01 | Three independent orders at different times | Three unique IDs/invoices/timestamps/rows; three individually printable receipts | P0 |
| ORD-02 | Print an old completed order | One print UI, **zero** order POST/refund POST | P0 |
| UI-01 | Catalog `xl:grid-cols-4` with product variant chooser | No unapproved card enlargement, no broken nested button | P1 |
| QA-01 | Production route action smoke | No active mock backend actions, real success/error/loading states | P0 |

**Financial reporting interpretation:** Do not add a made-up universal formula. Confirm what the backend calls `grossSales`, `netSales`, `cashAmount`, `averageTicket`, `inventoryValue`, `grossMargin`, `advancesDeducted`, `netPaid`, `closingVariance` and `refundAmount` and verify their dimensions, period, reversal rules and tenant scope. Missing metric means **unknown**, not automatically zero. For non-atomic operations (product + first variant, optional financial side ledger), explicitly document partial-success recovery rather than claiming a transaction that does not exist.

---

# E. Online API/UX inspection checklist (apply during F00, F11, F14)

| Area | Existing route or entry | Complete online requirements |
| --- | --- | --- |
| Authentication | `/login`, `/register`, `/forgot-password`, `/reset-password` | Login ADMIN email / CASHIER publicId, OTP, sessions, no copied JWT, logout, role gates, single-flight refresh |
| Tenant | `/admin/select-business` | Admin owned businesses and branches CRUD, scoped preferences, no Cashier selector |
| Admin dashboard | `/admin/dashboard` | Real scoped business reports, branch/time filters, server metrics, errors and no fabricated fields |
| Catalog CRUD | `/admin/catalog` | Category/Product/Variant join, description + first variant, stock per branch, media upload, real metrics |
| Admin register | `/admin/terminal`, `/admin/custom-sale` | Full checkout by authorized location, visible payment method, idempotency, distinct receipt and print |
| Cashier register | `/pos/terminal`, `/pos/custom-sale` | Backend-derived assignment, variant card, search/barcode, customer fields when supported, no unauthorized scope |
| Shift | `/pos/shifts` (plus any authorized Admin shift view) | Open/active/close/history, backend cash balance, no fake drawer advances |
| Orders | `/pos/orders` plus role-safe Admin order UI | Paginated list, detail, refund, partial refund, individual print/reprint |
| Staff | `/admin/staff` | Selected business reads and proven mutations, status, reassignment/branch, no wrong default tenant |
| Payroll | `/admin/payroll` | Monthly salary, outstanding vs paid, single/batch, existing advance history, soft deletion only |
| Cashier advance | Cashier-accessible new route/panel | Self-service `POST /advances`, own list, no Cashier control to set employee/business IDs |
| Reports | `/admin/reports` and Cashier summary | Revenue/order count/units/payment breakdown, true backend totals, period, pagination, CSV/PDF |
| Expenses | `/admin/expenses` | Admin-owned business expense actions, separated from salary advances |
| Audit | `/admin/audit-logs` | Authorized and scoped log history/filter/pagination; no fabricated audit actions |
| Super Admin | `/super-admin` | Actual user approvals/status actions under SUPER_ADMIN only; no Admin/Cashier bypass |
| Printing | checkout receipts and order history | Browser print preview, print-only CSS, separate order, no POST when printing |
| Profile and uploads | existing supported profile dialogs | Real field names/content type/permissions, or honest unsupported gap |

**No user-visible UI action is complete merely because its endpoint exists.** Each requires preconditions (e.g. logged-in identity, tenant/scope), input validation, consistent state, actual mutation, definitive success, safe failure, cache invalidation, optimistic updates only where safe, accessibility and a real test.

---

# F. Backend gap report template (mandatory, never suppress)

```text
BACKEND_BLOCKED: <ID / short title>
Severity: P0/P1/P2
Discovered in Fix Pack: Fxx
Role: ADMIN | CASHIER | SUPER_ADMIN
Business context: <authorized scope only, redact production-sensitive values>
Location context: <authorized scope only>
Frontend screen/action: <route, button, preconditions>
Frontend source: <file:symbol/line>
Exact HTTP request: <METHOD /api/v1/path, query field names, JSON/form schema; REDACT passwords/tokens/customer details>
Backend evidence: <controller, guard, DTO, service, Prisma/test path; if unavailable mark NOT INSPECTED>
Actual result: <HTTP status and sanitized JSON/trace; request ID>
Expected behavior: <owner rule and verifiable DTO>
Impact: <financial / security / usability / data integrity>
Proposed backend decision/change: <do not code backend in frontend repo>
Safe frontend behavior meanwhile: <blocked toast / read-only / cannot complete>
Proof needed after backend change: <contract+E2E test case>
Owner acceptance required: YES/NO
Status: OPEN | IN_BACKEND | READY_TO_RETEST | CLOSED_VERIFIED
```

Examples requiring special attention: Cashier `GET /advances` requires unauthorized businessId; GET advances suppresses soft-deleted rows; payroll summary still deducts deleted items; Admin employee writes land in wrong business; backend refund response omits refundedQuantity; GET shift-active cannot target selected Admin location; CSV payment breakdown excludes COD or reversals; `POST /orders/catalog` requires missing customer field; standalone drawer cash-out missing. Escalate with proof; **never** invent a frontend fallback to mask it.

---

# G. Codex starter and resume prompts

### Copy-paste once to start the whole remediation process

> You are the SunTech POS online release stabilization agent. Read `AGENTS.md`, **all** `docs/` files and `docs/SunTech_POS_Online_Launch_Master_Fix_Playbook.md`. The backend controllers/DTOs/services are authoritative, but read backend source read-only and escalate required backend changes; do not invent endpoints. The customer's decisions about Cashier self-service salary advances, Admin soft-delete/payroll, backend-derived Cashier tenant scope, individual printable orders, no silent financial defaults, 5-day-ish low-frequency secure refresh, no global JSON content-type, and online-only Phase 14 testing are mandatory. **Begin F00 only.** Finish and document its acceptance gate. Do not start F01 until I explicitly approve. Do not implement PWA/offline. Preserve the existing UI, especially compact variant cards. Never claim success without evidence.

### Copy-paste to continue one pack

> Continue the SunTech POS online-only remediation. Read `docs/SunTech_POS_Online_Launch_Master_Fix_Playbook.md`, `docs/ONLINE_RELEASE_FIX_PROGRESS.md`, `docs/ONLINE_RELEASE_BACKEND_BLOCKERS.md`, `docs/ONLINE_RELEASE_API_COVERAGE.md`, prior pack handoff and relevant guide/controller/DTO source. Implement **FXX ONLY** exactly as documented, incorporating all cross-cutting contracts. Re-run affected regression tests plus typecheck/lint/build, report verified results, update docs, **STOP**. Do not implement another pack. Escalate backend gaps without guessed IDs/defaults. Online functionality only: Phase 13 deferred.

### Copy-paste for an existing bug recurrence

> A previously passed SunTech POS online requirement has regressed. Identify the failing issue/test ID and source root cause, verify the authoritative backend DTO, repair it in the smallest safe scope, add a regression test, re-run the affected dependent flows, update progress and release gates and STOP. Never solve by hardcoding financial defaults, widening role permissions, bypassing tenant scope or replacing server truth with mocks.

---

# H. Acceptance and ship/no-ship definition

**ONLINE-ONLY SHIP = ALL of the following**:

- All supported, required Phase 0–12 API UI actions verified against the live backend; documented unsupported gaps are acknowledged by owner and do not block a required customer flow.
- Real tests pass for ADMIN/CASHIER/SUPER_ADMIN, at least two businesses/branches, logout and re-login, wrong-role attempts and account switch.
- No silent payment/order/payroll defaults; integer BDT and backend-approved calculations, refunds, advance deletion and payroll match expected ledger.
- No duplicate sale/refund/payroll under double click, uncertain 5xx, timeout or refresh recovery; logical idempotency proven end-to-end.
- Cashier self-advances work, Admin cannot create them, Admin soft-delete is audited and shown as Deleted, deleted advance is excluded from active salary deductions.
- Correct per-branch stock, Catalog product/category join, stock editing and image uploads through multipart BFF.
- Orders remain individually identifiable, searchable and printable; Catalog/Custom/History reprint uses backend-confirmed content and does not mutate orders.
- Low-frequency session refresh and Next role routing remain consistent with backend authorization; no credentials in frontend-accessible storage or logs.
- Correct dashboard order counts, payment enums, inventory cost valuation, report/period definitions and real exports.
- No required online flows show placeholder mocks, disabled fake action, invalid undocumented payload, scope-unsafe cache or unhandled error.
- Reproducible Phase 14 online automated tests **and** localhost authenticated end-to-end validation passed; recorded screenshots and actual command output are in docs.
- Security/dependency review complete, deployment env tested and print browser preview verified; PWA/offline intentionally not part of this release.

**If any item fails, report `NO-GO`, list the exact blocker and source/test evidence, and do not call the frontend launch-ready.** A green build alone is never sufficient. Phase 13 online/offline enhancements may only begin in a future project cycle after feedback and explicit authorization.

---

*End of execution playbook.*
