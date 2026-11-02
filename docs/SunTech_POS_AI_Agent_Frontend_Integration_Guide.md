SunTech POS — Frontend 20261102-105724 Final Pre-Deployment Fixes
Source of truth: frontend(20261102-105724).zip, compared by ZIP hash with frontend(10).zip; backend comparison backend(20261102-073321).zip. Scope: online MVP, Admin + Cashier, max ~100 lifetime users. Decision: NOT YET APPROVED for real client payments; bounded fixes and runtime sign-off needed. This file describes fixes to apply to the existing frontend repository; no frontend code was modified by this audit.
What is already present — preserve it

- src/proxy.ts: /admin/_ is ADMIN-only; /pos/_ generally CASHIER-only with a deliberately shared /pos/orders; /super-admin/\* remains SUPER_ADMIN-only. Backend authorization remains authoritative.
- Admin selected business/branch, Cashier JWT-scoped branch: src/features/tenant/hooks/use-tenant-scope.ts and src/app/(dashboard)/layout.tsx/`src/features/tenant/components/business-branch-hub.tsx`. New ZIP no longer auto-selects the first business/branch. Do not add hardcoded IDs, role changes, or JWT business switching.
- Checkout and orders for both roles share reusable components: src/features/pos/components/terminal-workspace.tsx, custom-sale-view.tsx, orders-workspace.tsx, but use role-dependent scopes. Catalog uses variant IDs, backend price-conflict handling, branch-scoped queries and negative stock (allowed).
- Refund frontend body now matches the backend CreateRefundDto (items, reason, payoutShiftId, optional Admin businessId); it no longer sends unsupported payoutMethod. Supported payment methods are COD, BKASH, NAGAD, BANK.
- use-catalog.ts reduces variant stale time to 30s, enables focus refresh; business-branch-hub.tsx cancels/removes more domain caches. HttpOnly cookie BFF and operation-scoped idempotency are already present. Do not rewrite these foundations.
  Release fixes — smallest possible implementation, with exact paths
  F1 — P0: Cashier uncertain advance cannot retry after reload
  Files: src/app/(dashboard)/pos/shifts/page.tsx:47–70,148–203,306–359; src/lib/financial-operation.ts:25–35,138–177; src/lib/**tests**/financial-operation.test.ts; add a component-level test.

Verified reproduction: When an advance is submitted, financialOperations.getOrCreateKey(scope,{amount:2000,reason:'Example'}) stores the key/hash but not the amount/reason. A 503/timeout marks it unknown. After page refresh useState resets amount/reason to empty, disables editing for unknown state, but the UI says Retry exact request. The retry hashes {amount:NaN,reason:undefined} and the helper throws because that differs from the stored request. The actual old request cannot be retried from this UI.

Fix: For advance_create only, store a small, validated immutable request snapshot {amount:number,reason?:string} alongside the existing operation key/hash in sessionStorage. Never store auth tokens. Restore the amount/reason when the actual authenticated userId/businessId/locationId becomes available after hydration, and reuse the exact original payload/key when retrying an unknown operation. Do not initialize a permanent unknown flag under placeholder IDs (cashier/`all`) before auth hydrates. If an old pending record lacks the snapshot, disable the retry button, show Verify advance ledger, then explicitly clear lock instead of promising a safe retry. An ordinary new request still validates positive whole BDT amounts. Add regression tests covering 503-after-commit, reload, same key/payload, ledger verification and changed-amount blocking.

Additional text fix: src/app/(dashboard)/pos/shifts/page.tsx:316 incorrectly says advances do not auto-deduct from payroll. Under current approved backend policy they are deducted from monthly payroll, with partial carryover; they never appear as manual Expenses.
F2 — P1: Unknown payment becomes COD in order history
Files: src/lib/payment-methods.ts:33–42, src/features/pos/api/use-pos.ts:226–234, tests in src/features/pos/**tests**/api-contract-handoff.test.ts and a mapper test.

Verified reproduction: normalizePaymentMethod('INVALID_PAYMENT') === 'COD'. validateAndMapOrder() rejects a missing payment field but accepts any nonblank invalid value and silently turns it into a cash sale. The backend guarantees only COD|BKASH|NAGAD|BANK for modern records.

Code pattern to implement:
export type PaymentMethod = "COD" | "BKASH" | "NAGAD" | "BANK"; // already in types/domain.ts

export function parsePaymentMethod(value: unknown): PaymentMethod {
if (value === "COD" || value === "BKASH" || value === "NAGAD" || value === "BANK") {
return value;
}
throw new Error(`Invalid payment method from backend: ${String(value)}`);
}
Use strict parsePaymentMethod(item.paymentMethod) in order history and financial mappers. Keep optional legacy display labels if real historical records need them, but don't silently turn an unknown payment into cash. Add tests for missing, unknown, each supported value, and historical records only if confirmed by backend data.

Also replace Number.isNaN(...)-only checks on monetary order totals/line quantities/prices in validateAndMapOrder() with Number.isSafeInteger(...) and appropriate nonnegative/positive constraints based on the backend contract; require genuine line IDs rather than creating synthetic line-${idx} IDs that could be passed to the refund API. Do not invent missing money values.
F3 — P1: Recoverable refund/custom-sale uncertainty on page refresh
Files: src/features/pos/components/orders-workspace.tsx:107–184; src/features/pos/components/custom-sale-view.tsx:36–165; src/lib/financial-operation.ts.

Observed: the operation key and payload hash are saved, but refund selection and custom-sale draft are local React state. On reload, the original item quantities/custom lines may be lost, making an exact-key retry impossible. The current safety guard avoids blind duplicate requests, but the UI needs a real recovery path.

Fix: Either persist a compact, validated exact-request snapshot for these transaction types, scoped to the authenticated user/business/location/order, and restore it on refresh or show an explicit Uncertain: check order/refund history and clear after verification state without a nonfunctional retry button. Use the same key only with the exact original body. Never auto-retry financial POSTs with fresh keys. Test server-committed-but-response-lost, refresh, retry and changed-payload rejection.
F4 — P1: Do not silently invent cash tendered
Files: src/features/pos/components/terminal-workspace.tsx:190–197,314–325; src/features/pos/components/custom-sale-view.tsx:73–82.

For COD, an empty cash-given input currently becomes the entire subtotal. If the UI is intended to record cash actually received, require a positive whole-BDT entered amount at least the sale total. Do not silently record money that no one entered. Digital methods may send the backend-required amount according to its verified DTO; no split payments. Preserve legitimate quick-checkout UX only if the product owner explicitly approves an Exact cash received action.
F5 — P2: scoped cache and dashboard semantics
Files: src/features/tenant/components/business-branch-hub.tsx:142–178; src/features/dashboard/api/use-admin-dashboard.ts:76–99; src/app/(dashboard)/admin/dashboard/page.tsx:152–153.

domainsToInvalidate includes dashboard but not admin-dashboard; add the latter for consistency, since its query keys start with admin-dashboard. Scope-aware keys already reduce cross-branch leakage; do not claim a demonstrated data leak. Review session logout clear/invalidate behavior and test B1→B2→B1 with delayed HTTP responses. Change Net cashflow labeling if the underlying backend metric includes mixed payment methods; never mislabel digital payments as cash-in-drawer. A backend formula correction is separate from frontend presentation.
F6 — Existing product creation flow — verify before v1 sign-off
Files: src/features/catalog/components/catalog-manager.tsx and backend product/variant DTOs.

Product creation and first variant are still separate operations; abandoning step 2 can leave an unsellable product. Ensure the UI clearly marks needs variant and can resume the workflow, or use an atomic backend product+variant API only if it exists. Do not invent an API or undertake a broad architecture rewrite.
Role acceptance matrix — browser + real backend required
Flow Admin Cashier Check
Login, logout, token refresh yes yes Cookie/session and RBAC consistency
Business/branch selection Explicit selection & ownership JWT-assigned branch only Rapid branch changes, wrong pair rejected
Categories/products/variants/stock CRUD yes no Variant selector, category filter, sold-item delete 409
Catalog & custom checkout yes yes VariantId, negative stock, no shift, 409 price changes, idempotency
Orders & returns/receipts Business/branch scope Own/authorized scope Partial/full refunds, no duplicates, printing
Staff/payroll/expenses/audit yes no Salary advance deduction, net payout expense, tenant isolation
Salary advance request/history Business-wide view/management only Self-service and own history No approval, no shift, carryover after payroll, uncertain retry
Shifts Authorized business/branch Own shift Open/close without blocking checkout
Super Admin Separate role no No role exposure

Tests attempted in this audit

- ZIP hash comparison: 15 files modified, none added/deleted compared to frontend(10).zip.
- All 173 source TS/TSX files passed TypeScript syntax transpilation (TypeScript 5.8.3); this is not typechecking.
- Isolated simulation confirmed F1 (advance unknown retries cannot reproduce original payload after reload) and F2 (unknown payment normalizes to COD).
- npm ci --offline: FAILED (ENOTCACHED) because npm packages are not locally cached. npm run typecheck: NOT VERIFIED due missing dependencies (next, React, Zod etc). Build, lint, Vitest, browser, live backend and PostgreSQL tests NOT RUN. Do not label them passed.
  Minimal release gate / coding agent handoff
  Agent instruction: Work in the existing frontend repo. Inspect each exact source path and apply F1–F4 if still present, then F5/F6 only if necessary. Preserve current UI/cards, Admin/Cashier routes, existing BFF, query clients, backend-authoritative money, and user/business/location scoping. Do not introduce Redis, queues, new architecture, offline/PWA, or unverified API endpoints. Add targeted regression tests. Then run npm ci, npm run typecheck, npm run lint, npm run test, npm run build, and real authenticated browser/E2E on both roles with backend and test PostgreSQL. Report actual PASS/FAIL/NOT RUN and screenshots for key pages. Approve controlled deployment only when critical money/permission flows and the commands above pass.
