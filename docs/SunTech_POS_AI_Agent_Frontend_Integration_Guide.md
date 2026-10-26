# SunTech POS — AI Agent Frontend ↔ Backend Integration Playbook

**Version:** 2026-10-26 · **Status:** implementation instructions and source-backed gap review; **not** a claim that frontend integration is complete.  
**Inputs inspected:** `backend.zip` (NestJS/Prisma code, `docs/POS.md`, controller/DTO/service files); `ftoend.zip` (Next.js 16.4/React 19.3 source, Phase 0 documentation, demo hooks, API declarations); 17 desktop UI screenshots provided October 26.  
**Primary goals:** backend-correct functional workflows; preserve current SunTech visuals; call *all necessary related APIs* intelligently; reduce network calls; reliable cache, validation, revalidation, invalidation; future offline-first POS readiness.

> **Instruction to implementing agents:** READ THIS ENTIRE FILE AND THE CURRENT BACKEND CONTROLLERS/DTOs BEFORE CODING. Make small, testable vertical slices. Never infer API contracts from a screenshot or a TypeScript declaration if the real NestJS handler disagrees. The current source, not old README text, is authoritative. Do not fabricate backend endpoints or mark a feature complete when it still uses mock data. Every API integration must cover required lookup dependencies, mutations, follow-up reads, loading/error/empty UX, scope enforcement, cache invalidation, and acceptance tests. Preserve existing layouts, spacing, colors, typography and product/variant appearance as nearly as feasible.

---

## 1. Repositories, evidence and source-of-truth order

**Backend:** `backend.zip`: `src/**`, `prisma/schema/**`, `docs/POS.md`. REST prefix `/api/v1` (health route excepted). Example backend environment specifies **PORT=3001** and FRONTEND_URL `http://localhost:3000`; `src/main.ts` may default to 3000 without env. **Do not hardcode assumptions**: configure both origins, ports and CORS/cookie settings for the actual deployment.  
**Frontend:** `ftoend.zip`: `src/app/**`, `src/features/**`, `src/redux/**`, `src/lib/**`, `src/mocks/**`, `src/demo/**`, `docs/frontend-api-integration-plan.md`, `docs/frontend-page-api-map.md`, `docs/frontend-backend-gap-register.md`. `package.json` has Next.js 16.4.0, TanStack Query 5.104.1, Axios 1.20, Redux (plain Redux, **NOT RTK Query**), Zod, React Hook Form, Framer Motion, Tailwind. `src/redux/api/createApi.ts` is a **custom TanStack Query wrapper with RTK-like naming**, not real RTK Query.  
**Screenshots:** Admin business/branch selection and creation, dashboard, catalog table, category/product/variant/stock modals, staff, payroll, reports; Cashier shifts and order history. Other route components exist in source, even if screenshots were not supplied (e.g. Admin/Cashier register and quick custom sale). Do not assert visual parity on unseen screens without testing.

**Evidence ranking:** (1) Controller+DTO+service+Prisma and tests; (2) `docs/POS.md` current intent; (3) frontend code and UI components; (4) screenshot visual intent; (5) older frontend plans/README only as context. Check source conflicts explicitly.

**Do not modify backend behavior merely to make a mock UI easier.** If backend capabilities genuinely missing, create a documented gap; implement a compatible backend endpoint only if the task/phase authorizes backend changes, with access control, tests, and API documentation. Otherwise keep UI honest and do not fabricate server persistence.

## 2. Non-negotiable implementation rules

1. **Visual preservation:** retain Navy `#070B28`, Electric Blue `#0052FF`, light canvas, existing sidebar/top bar, card sizing, table density, dialogs, typography, modal layouts, feedback style and responsive behaviors. Prefer changing *data mapping* over changing UI structure. In particular preserve the recognizable two-line product/variant cells, SKU/barcode columns, selling price and stock badges, search/category dropdown, product/catalog register cards, and checkout interaction. Add small inputs, selectors, dialogs, tabs, warnings or screens only where backend workflows require them.
2. **Backend-driven model:** Category → Product → Variant → LocationStock (branch scope) and optional variant images. **A variant belongs to a Product (`productId`), not directly to a Category.** Products optionally belong to a Category (`categoryId`). Use actual IDs throughout. Inventory is branch-scoped when `locationId` selected. Never fake all variants as separate products in storage just because the existing row renders one variant per line.
3. **Complete dependency graphs:** never integrate a page's primary GET or mutation and omit its support APIs. Example: catalog category dropdown requires `GET /catalog/categories`, creating a variant requires existing products to choose `productId`, stock operations need branch scope; checkout requires variants, valid branch, payment methods and optionally active shift. Described in §7–§10.
4. **Role from verified login response:** no mock role switcher in an authenticated sidebar. Admin email and Cashier `publicId` login are separate UI forms but the **destination derives from returned `user.role`**, not clicked tab. Account for `SUPER_ADMIN` without silently treating as `ADMIN` where endpoints forbid it.
5. **Low-API usage:** reuse login-returned user; don't call `/users/me` per route or every render. Cache tenant/catalog lookups. Deduplicate in-flight GETs. Explicitly refresh identity only when justified; do not mistake a local cookie for revocation-proof authorization.
6. **Session security:** backend already sets HttpOnly `accessToken` (path `/`) and HttpOnly `refreshToken` (path `/api/v1/auth`) cookies. Prefer using those browser credentials with `withCredentials: true` and backend's cookie JWT extraction rather than copying JWT to readable `suntech_token`, localStorage or JS cookies. Use role/profile from server-confirmed login in app state plus a *tamper-resistant or server-verified* routing mechanism for Next proxy; **a plain editable role cookie is not authorization**. All backend endpoints must still enforce auth/tenant membership.
7. **Tenant isolation:** ADMIN explicitly chooses owned business then permitted branch; CASHIER uses assigned business/location from backend identity and must not be able to switch. `SUPER_ADMIN` is a distinct platform role (backend `/admin/users` operations) needing a deliberate route/UX; don't assume it can use ADMIN-only business APIs.
8. **Do not blindly GET all data:** only fetch dependencies for visible screen/step, conditionally enabled once prerequisites exist. Reuse cached lookup results; avoid reference-request waterfalls when independent reads can run concurrently.
9. **Server-enforced money:** BDT integer amounts; payment enum `COD`, `BKASH`, `NAGAD`, `BANK`; backend is authority for current pricing, order totals, refund limits, stock and shift reconciliation. Server validation errors must map back to form controls.
10. **No deceptive UI:** remove "Save mock change" success, static exports, mock success toasts, fake active shifts or synthetic metrics once their flow is activated. Show actual completed/pending/error status; disable unsupported actions with clear explanation, not fake persistence.
11. **Tests with two tenants and two roles:** every integration must check cross-tenant leakage, role gates, tenant switch cache flushing and logout purge. Never cache payroll, staff details or cost prices into cashier-visible caches.
12. **Offline-first future:** keep data-source interfaces behind feature hooks so Phase PWA can add IndexedDB and sync. TanStack Query cache alone is in-memory and **not** a durable one-week offline store. Do not make promises of full offline mode during the online API phases.

---

## 3. Current implementation review — what actually exists

| Frontend file(s) | Current behavior confirmed in code | Required work |
|---|---|---|
| `src/features/auth/components/login-form.tsx` | Validates inputs but invokes `useMockMutation` and `router.push` to static destination. | Real login; map Admin/Cashier payload; role-driven redirect, user state, server cookies, logout/error/refresh. Preserve existing form design. |
| `src/proxy.ts` | Reads client-defined `suntech_token`/`suntech_role`; `NEXT_PUBLIC_ALLOW_DEV_PREVIEW === "true" || true` **always enables preview**, bypassing anon protection; only blocks a Cashier entering Admin. | Remove unconditional bypass and dev preview in production; real server-validated session gating; correct SUPER_ADMIN behavior; no redirect loops. |
| `src/lib/auth-cookie.ts` | Writes access token and role via `document.cookie`; values are JS-readable, separate from backend-issued HttpOnly cookies. | Eliminate duplicated/token-exposing cookie strategy. If routing needs role hint, use signed/server-verifiable session metadata or server validation, not a plain cookie. |
| `src/lib/api-client.ts` | Axios unwraps successful response envelope, reads JWT from localStorage/Redux, blanket auto-generates fresh `Idempotency-Key` per mutation, lacks cookie credentials by default. | Cookie-aware transport, controlled refresh-once, abort/cancel, clear errors, stable idempotency for retries, no automatic key on irrelevant mutations. |
| `src/app/providers.tsx`, Redux `authReducer.ts` | Auth held in Redux; provider binds token reader; no complete real session bootstrap. | Hydrate from trusted login/refresh flow, avoid unnecessary `/users/me`, purge private caches on logout; guard protected content until session resolved. |
| `src/app/(dashboard)/layout.tsx`, `src/components/layout/sidebar.tsx` | Navbar falls back to mock profiles; sidebar has prebuilt Admin/Cashier lists and sign-out is a Link to `/login` (not an actual logout). | Real user/role/branch/shift, authorized menus only, correct logout, visible shift status sourced from backend. |
| `src/features/tenant/components/business-branch-hub.tsx` | Large 1,264-line business/branch flow using `src/mocks/tenant/hooks.ts`; mapped demo fields include `plan` and lane counts. | Replace underlying hooks; keep cards, stepper, branch form visually similar; send backend-supported fields only; validate selected business/branch and clear removed selections. |
| `src/features/catalog/api/use-catalog.ts`, `catalog-manager.tsx` | Maps `mockCategories`, `mockProducts`, `mockVariants`; search and pagination are local. Modals toast "saved locally" without persistence. | Real lookup/read/mutation adapters, proper product↔variant relationship, branch stock, image workflows, dependency-driven cache invalidation. |
| `src/features/pos/api/use-pos.ts`, terminal/custom-sale/checkout components | Mock register catalog, mock orders and checkout; receipt IDs invented. | Real category/variant read, scan/cart validation, separate catalog/custom APIs, stable idempotency, receipt/result, optional shift. |
| `src/features/shifts/api/use-shifts.ts`, Cashier shift UI | Demo shifts via `useMockShifts`; `src/redux/api/shiftsApi.ts` has backend-inaccurate DTO field names. | Real active/history/open/close, backend `startingAmount`/`closingAmount`, optional checkout shift, cash-action gap handling. |
| `src/features/hr/api/use-hr.ts`, staff/payroll managers | Mock staff, advances, payroll. | Real staff status/creation/edit, salary permissions, advances, payroll summary/process/disburse/history. |
| `src/features/reports/api/use-reports.ts`, dashboard and reports | Mock summaries, transactions and visual exports. | Correct `dashboard` vs `analytics` vs `transactions` APIs, server-produced CSV/PDF, metrics and privacy. |
| `src/redux/api/*.ts` | Dormant real endpoint declarations exist but several URL/body/response shapes are wrong. | Reconcile every declaration against backend; do not simply replace mock imports and hope it works. |
| `src/redux/api/createApi.ts` | Custom cache wrapper computes `providesTags` with undefined query result, and matches tag strings through query-key suffix; not actual RTK Query. | Prefer typed TanStack Query key factories and explicit scoped invalidation. If retaining wrapper, fix dynamic tag computation/invalidation consistency. |
| `src/lib/get-query-client.ts` | 60s default staleTime; no persistent IndexedDB cache. | Per-resource freshness, scope-aware keys, focus/reconnect policies, purge logic and mutation invalidation; later add durable PWA storage. |
| Pages/screens missing in current App Router inventory | No dedicated `/super-admin`, `/admin/expenses`, `/admin/audit-logs` route files. | Add screens where authorized by rollout; follow current shell/card/table style. Do not accidentally grant these to Cashier. |

**Existing app route inventory:** `/login`, `/register`, `/forgot-password`, `/reset-password`; `/admin/select-business`, `/admin/dashboard`, `/admin/catalog`, `/admin/staff`, `/admin/payroll`, `/admin/reports`, `/admin/terminal`, `/admin/custom-sale`; `/pos/terminal`, `/pos/custom-sale`, `/pos/shifts`, `/pos/orders`. Preserve these paths where possible; add others only when needed.

**Known documentation/declaration mismatches confirmed:**
- Backend business creation: `POST /tenant/business` (**singular**), NOT `POST /tenant/businesses` as `src/redux/api/tenantApi.ts` currently declares.
- Backend does **not** declare `GET /orders/:id` in `orders/order.controller.ts`, yet `src/redux/api/ordersApi.ts` declares that read. Use list response or add a real backend route with tests and authorization, if within authorized scope; do not request an endpoint that doesn't exist.
- Backend report export `GET /reports/export` requires `type` (`sales` or `payroll`), `format`, `month`, `year`, and optional scope; current frontend export adapter omits required fields.
- Backend reset flow uses OTP/`resetToken` and `newPassword` (`src/auth/dto/reset-password.dto.ts`); frontend declaration `{token, password}` is wrong. Verify verify-OTP step.
- Backend shift DTO `startingAmount` and `closingAmount`, not frontend API adapter `openingFloat` and `closingCash` (UI display text may still say "Opening float").
- Backend `CreateVariantDto` requires `productId`, `name`, `sellingPrice`; `sku` is optional (server can generate one), `costPrice` and location-scoped `stock` are supported. The frontend variant form incorrectly tries to choose a category instead of a parent product.
- Backend `GET /catalog/products` and `GET /catalog/variants` return **arrays** and their query DTOs do **not** accept `page`/`limit`. `GET /catalog/categories` also returns an array. Existing UI pagination must be client-side for these unless a deliberate, backward-compatible backend pagination addition is implemented. Do not quietly discard records or assume a `{items, meta}` response.
- Backend `GET /catalog/variants` filters by **categoryId UUID**, `productId` UUID, `search`, `lowStockOnly` string, optional tenant/branch IDs. It does **not** accept category name as the category filter. `category.name` is a display label; pass selected `.id` in API queries.
- Backend payment flow distinguishes `POST /orders/catalog`, `POST /orders/custom`; generic `POST /orders` also exists, but agents should choose explicit endpoint/DTO and test before using generic flow. `POST /orders/sync` uses `clientOrderId` dedupe and does not need an `Idempotency-Key` header.
- `GET /reports/analytics` is ADMIN-only; `GET /reports/dashboard` is ADMIN/CASHIER; `GET /reports/transactions` is ADMIN-only. Gross-margin figures must not be shown or leaked to cashier.
- `GET /users/cashiers` and payroll/advances filters, payloads and status endpoints must be checked before wiring. Do not assume all arrays have identical pagination response shapes.

---

## 4. Auth, routing, cookies, RBAC and low-request identity strategy (first implementation phase)

### A. Login

1. Preserve current two-tab login form (Admin email, Cashier Public ID). Submit actual backend `{ loginType: "ADMIN", email, password }` or `{ loginType: "BUSINESS_USER", publicId, password }` to `POST /auth/login`.
2. Backend response success envelope `data: { accessToken, user }`; controller also sets **HttpOnly `accessToken` and `refreshToken` cookies**. Read returned `user` object *once* for the current in-memory authenticated profile, role, account identifiers and assigned cashier tenant. Avoid saving raw token to localStorage, readable role-cookie-as-auth, or JS cookie; do not log it.
3. Configure Axios `withCredentials: true`; if backend/proxy origins differ, verify CORS `credentials` and allowed origin, cookie SameSite/Secure/domain, and Next.js proxy visibility. Prefer same-site reverse proxy if deployed host separation breaks cookies. Backend JWT extraction already accepts the `accessToken` cookie (`src/auth/strategies/jwt.strategy.ts`); no need to manually read it into an `Authorization` header in the browser.
4. Navigate by **returned `user.role`**: ADMIN → existing `/admin/select-business` (or remembered owned context), CASHIER → `/pos/terminal` or explicitly chosen landing `/pos/custom-sale` (use one coherent default), SUPER_ADMIN → dedicated platform-admin destination (create authorized minimum screen if needed). Unrecognized/inactive roles → safe access-denied, never fallback to Admin.
5. Remove mock role selection from authenticated shell. The login **credential-mode tabs may remain** because they select identifier format, not authorization. Remove mock "Authenticated workspace" switching semantics; sidebar is derived exclusively from effective role.
6. Production `src/proxy.ts` must remove `|| true`. Middleware/proxy should gate protected routes with server-verifiable credentials; cookie presence alone is not enough to prove validity, and a user-editable role cookie cannot safely determine access. Backend enforces final authorization. Avoid doing a network `/users/me` request on every route; use appropriately validated/signed session metadata for server routing, short-lived checks at defined boundaries and online refresh when necessary.
7. Refresh: on initial app boot, if valid in-memory user already present, render without repeated `/users/me`. For reload, recover a lightweight verified profile/session using a supported server flow (`POST /auth/refresh` and/or **one** `/users/me` only when needed) and throttle/deduplicate concurrent refresh calls. Backend refresh returns access token; verify what identity fields it actually returns. Do not trust a stale client-readable role as the sole role authority after reload. Account changes/revocation must be enforced by backend on online requests.
8. A single 401 recovery attempt may refresh once then retry an idempotent read. Protect against refresh loops and login/refresh recursion; 403 means forbidden/status/tenant failure and must not be hidden by repeated retries. Logout calls `POST /auth/logout`, clears Redux session, cart, shift/tenant selections and all private React Query caches, then redirects; if offline, mark local signed-in state unusable appropriately and clear browser-sensitive data while explaining server logout could not be confirmed.
9. Do **not** attempt to store HttpOnly cookies with `document.cookie` (impossible). Avoid adding untrusted `role`/`userId` readable cookies for access decisions. If Next proxy needs role, design a server-created signed claim or safe session verification; record trade-off of extra verification calls.
10. Limit profile refetch: initial login response, rare app restore, explicit profile update/account switch, or meaningful revalidation event—not every route, hover, query, dashboard render or tab change. Preserve UX while disconnected; online backend APIs still require valid authentication.

### B. Tenant bootstrap

- ADMIN: `GET /tenant/businesses` once per relevant session/return to business selector. Each business has locations; use those embedded locations before issuing duplicate `GET /tenant/locations?businessId` (fetch separately when explicit search/details/freshness requires it). After selection, validate `businessId`, `locationId` belong to returned owned business; persist only this harmless selection as a user-specific preference. Select business → select branch → open Admin dashboard/register. A missing branch shows selection required; no arbitrary default when multiple options without user approval.
- CASHIER: use assigned `businessId` and `locationId` from authenticated user/context. No Admin "Switch business" UI; eliminate businessId/locationId query parameter overrides except backend-approved cases. If display labels are missing from login, one narrow lookup or persisted verified context can fill them—do not load all businesses every time.
- SUPER_ADMIN: system user administration is separate from store Admin tenant scope; backend Admin platform endpoints may be accessible while store catalog endpoints forbid `SUPER_ADMIN`. Do not mix those menu groups.
- On business/branch change, cancel previous scoped queries, clear previous branch cart and shift context as appropriate, remove or invalidate previous-scoped sensitive data, enable queries for new scope; avoid carrying product availability/price/stock across branches.

### C. RBAC UI matrix

| Workspace | Existing menu / UI | Authority |
|---|---|---|
| ADMIN | Business/branch switch, Catalog Register, Quick Custom Sale, Dashboard, Catalog, Staff, Payroll, Reports, plus approved new Expenses/Audit views | Backend ADMIN roles and verified ownership/branch permissions; cost/margin available only when allowed |
| CASHIER | Quick Custom Sale, Catalog Register, Shifts, Orders; assigned branch display | Backend CASHIER access; no tenant switching or cost/salary/analytics administration |
| SUPER_ADMIN | **Missing screen**: platform users, approval/status workflow | `GET /admin/users`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/status`; no implicit store Admin permissions |

---

## 5. Network and cache architecture: validate, revalidate, invalidate

**Choose one server-state owner:** TanStack Query is installed. Plain Redux should contain **client UI state** (session profile snapshot, selections, cart, modal state, active shift display if coordinated), **not duplicate response-array truth**. React Query owns network records. Keep `src/features/*/api/*` as stable feature facades; `src/features/*/view-models.ts` transforms real backend records into existing component fields. `src/redux/api/*` declarations can be corrected/reused only once their contracts match and cache semantics are sound. Never run both mock and real queries for one screen.

### Query keys and cache boundaries

Use normalized, predictable keys including all security/semantic dimensions. Example:

```ts
const keys = {
  categories: (userId: string, businessId: string, locationId?: string) =>
    ['catalog', 'categories', userId, businessId, locationId ?? 'all'] as const,
  products: (userId: string, businessId: string, filters: object) =>
    ['catalog', 'products', userId, businessId, filters] as const,
  variants: (userId: string, businessId: string, locationId: string, filters: object) =>
    ['catalog', 'variants', userId, businessId, locationId, filters] as const,
  orderList: (userId: string, businessId: string, locationId: string, filters: object) =>
    ['orders', 'list', userId, businessId, locationId, filters] as const,
  reports: (userId: string, businessId: string, locationId: string, period: object) =>
    ['reports', userId, businessId, locationId, period] as const,
};
```

Also scope by role when same resource returns sensitive role-dependent columns, and use only effective filters sent to backend. Build stable serialized objects/values: trim search, normalize ALL to undefined, canonicalize period, avoid injecting `undefined`/unstable objects into request serialization. Do not key Admin and Cashier resources identically. Use `enabled: sessionReady && scopeReady` and abort requests via TanStack's `signal` passed to Axios.

### Proposed online cache policy (tune with UX tests; not backend guarantees)

| Resource | Suggested `staleTime` | When to revalidate | Invalidation triggers |
|---|---:|---|---|
| User/session | Login response; controlled session lifecycle | Explicit boot/refresh, profile/account switch, 401 recovery | logout, status/reassignment, profile edit |
| Owned businesses/locations | 5–15 min | Business selector access after staleness, manual refresh | business/branch create/edit/delete, account change |
| Categories / products metadata | 5–15 min | Entry if stale, manual refresh, catalog refetch on reconnect | relevant category/product/variant mutation |
| Variants SKU/price/images | 1–5 min online | Register access when stale; manual refresh, reconnect | variant edit/create/delete, image edit, price update, stock mutation |
| Branch stock & live register availability | 15–60 sec **when online** | Before final checkout where backend enforces current stock; optional single targeted refetch if stale | checkout, refund/restock, stock adjustment, branch switch |
| Current active shift | 30–60 sec | Shift page open, POS start, opening/closing a shift; optional controlled polling | open/close, branch/user switch, cash updates |
| Order list/history | 30–60 sec | Opening list, explicit refresh, reconnect | create/sync/refund, status changes |
| Dashboard/reports | 1–5 min | Tab/period/scope change or manual refresh | successful orders/refunds/payroll/shift changes (target affected metrics) |
| Payroll/advances/staff | 1–5 min | HR page and manual refresh | staff/advance/payroll mutation, account change |

**On poor connectivity:** disable focus-refetch storms (`refetchOnWindowFocus: false` or selective). Prefer `refetchOnReconnect` after restoring connectivity, dedupe via query keys, add debounce ~250–400ms search, page-reset on filter changes, prefetch only likely next views when connection is good. Set `retry: 0` on mutations by default. Reads: retry 1–2 with exponential backoff **only** for transient/network/5xx; do not retry 4xx except explicit session recovery. Offline query errors must not make cached records vanish; show "Offline — last synced at ..." and data age. Avoid accidental automatic long-running polling during week-long outages.

### Correct invalidation must be dependency-aware, not only same-entity

| Successful mutation | Invalidate/reconcile |
|---|---|
| Category create/edit/delete | scoped categories; products if category labels/links change; variants/register mapping if names or membership change; affected catalog metrics |
| Product create/edit/delete | products; variants/register mappings; categories metric counters; relevant dashboard inventory summaries |
| Variant create/edit/delete or price change | variants; parent product; categories metrics; register catalog/lookup; stock/valuation metrics; image/variant detail if affected |
| Variant image upload/delete | specific variant images + register/product card image data (not entire HR cache) |
| Branch stock add/deduct/set | variant detail/list, branch stock/valuation, categories inventory metrics, register availability; optional dashboard inventory |
| Catalog/custom checkout | orders/history, reports dashboard/analytics, transaction log, variant/branch stock for catalog orders, active shift if relevant, cashier display metrics |
| Refund | order list/details, reports + transactions, impacted stock (if backend restocks), shift cash summary if applicable |
| Shift open/close | active shift/history, related dashboard shift widgets and relevant financial metrics |
| Cashier create/update/status/delete | cashier list/detail, tenant staff counts when computed, payroll lookup if employment/salary changed |
| Advance create/delete | advances list/summary, payroll summary/history if dependent, admin reports if applicable |
| Payroll process/disburse | payroll summary/history, advances when deductions move, export data and dashboard if financially relevant |
| Business/location create/edit/delete | owned businesses/locations, dependent selector and scope; on deletion cancel/purge affected scoped caches, clear invalid selection |

**Optimistic updates:** safe only for reversible, non-financial UI with rollback. Do **not** optimistically commit orders, refunds, payroll disbursement or stock ledger writes as though the server accepted them. Keep pending state and reconcile with authoritative result.

**Mutations/idempotency:** backend `@Idempotent()` routes require a stable `Idempotency-Key`. Generate it **once per business operation**, persist with that attempt until success/final failure; network retry or double submit must reuse the SAME key and SAME payload. A new user action gets a new key. Existing `src/lib/api-client.ts` generates a fresh UUID on every request, which is unsafe for retrying checkout. Do **not** send keys indiscriminately; check backend annotations. `POST /orders/sync` is explicitly deduped by persistent UUIDv4 `clientOrderId` and does not require this header. Disable submit while pending; enforce retry policy carefully and surface unknown outcome after timeout rather than silently duplicating a sale.

**Validation:** backend DTOs → TypeScript DTO definitions and Zod/RHF form schemas (or existing validation conventions). Validate locally for UX, but always handle server `400` field errors, `401` session, `403` RBAC, `404` stale/deleted links, `409` uniqueness/concurrency, `422` when applicable, network failures. No silent mutation success. Validate BDT integer >=0, quantities integer >=0/1 as DTO dictates, optional params omitted rather than empty strings, SKU uniqueness surfaced, identifier UUID format where needed. Scope/query authorization remains backend enforced.

---

## 6. Design-preserving screen mapping (screenshots + actual files)

| Screen / route | Existing visual to preserve | Must be implemented/enhanced |
|---|---|---|
| Admin businesses `/admin/select-business` | Horizontal business cards, "Select & Manage Branches", "Create Business" controls, Navy sidebar | Real owned-business list; create via singular `POST /tenant/business`; edit/delete; owner validation; missing/empty/error; branch step; selection consistency |
| Admin branch step in same page | Left branch cards and right create/edit form, progress breadcrumb, "Switch Business" | Real `GET /tenant/locations` only if needed (business list contains branches); create/update/delete location; persist permitted selection; map real DTO; remove mock plan/lane/allowOffline flags from mutation unless backend supports them |
| Admin dashboard `/admin/dashboard` | Four KPI cards, recent tickets table, shift telemetry card, category sales bars | Dashboard API + orders list + active-shift/history (where supported); reports data for category bars; backend-approved metrics; no fake timestamps/counts |
| Admin catalog `/admin/catalog` | Three metric cards; search and All categories dropdown; variant rows with secondary text, BDT prices, stock badges, Edit/Stock; existing dialogs | Categories, products, variants, proper categoryId filter, parent-product selector, branch stock, upload images, real CRUD; server/current-stock + summary mapping; client pagination until backend supports it |
| Admin staff `/admin/staff` | Search box, staff table, status badges, Create cashier, three-dot row actions | Cashier CRUD/status from backend; fetched branch names; salary permissions; paging/filtering semantics; no fake Activate/Delete |
| Admin payroll `/admin/payroll` | Payroll/Advances tabs, three metric cards, table, Process Payroll | Real payroll summary/process/disburse/history; advance create/list/summary/delete; employee lookup; month/year and business scope; correct salary/advance math |
| Admin reports `/admin/reports` | Daily/Weekly/Monthly/Quarterly controls, KPI cards, category bars, payment breakdown, transactions and Export CSV/PDF | `GET /reports/analytics` for margin/category performance, `GET /reports/dashboard` for dashboard metrics, `GET /reports/transactions` for log; `GET /reports/export?type&format&month&year`; consistent period-to-query mapping |
| Admin register `/admin/terminal` | Current terminal/register product visuals and checkout | Shared real catalog terminal with Admin scope; maintain item cards, image placement, cart, search/scan; checkout via `/orders/catalog` |
| Admin custom sale `/admin/custom-sale` | Existing ad-hoc sale form/dialog | Separate `/orders/custom` DTO; optional category display only, no fake catalog variant or stock deduction |
| Cashier register `/pos/terminal` | Same register interaction, Cashier sidebar/top bar | Assigned branch stock/prices; cashier-safe fields; no cost; real checkout, optional shift; network indicator ready for later offline queue |
| Cashier custom sale `/pos/custom-sale` | Existing fast manual sale UI | Correct custom-sale DTO, tender validation, real status/receipt |
| Cashier orders `/pos/orders` | Search/status/payment/type filters; row list, contextual details/refund menu, pagination | `GET /orders` proper backend query; refund modal POST `/orders/:id/refunds`; no invented GET detail; reconstruct detail from returned rows or implement authorized backend detail route if truly needed |
| Cashier shifts `/pos/shifts` | Active shift card, 4 metric cards, cash-action box, history and Close shift | `GET /shifts/active`, `GET /shifts`, POST open/close; DTO naming; drawer cash-out vs employee advance is unresolved; don't write fake ledger |
| **New** SUPER_ADMIN | No screenshot / route | Add minimal matching shell/list for platform account approval/status, backend permission tests |
| **New** Expenses | No existing route | Add Admin Expenses screen using `GET/POST /expenses`, `GET /expenses/summary`, `DELETE /expenses/:id`, if approved in phase. Keep same cards/tables/dialogs style |
| **New** Audit logs | No existing route | Add role-permitted logs list/detail using `GET /audit-logs` and `GET /audit-logs/:id`, source-backed filters and safe redaction |
| **New** product/variant image management | Existing product appearance but no complete image UX | Add thumbnail selection/upload/gallery/replace/delete within existing product/variant flows; image endpoints below; don't redesign cards |

**Visible screenshots are references for appearance and screen affordances, not proof of real backend persistence.** Where mock fields have no current backend equivalent (branch "Allow Offline Checkout" toggle, arbitrary plan badges, lane counts, drawer cash-out transaction ledger, warranty/brand, salary overtime, receipt printing), either (a) explicitly define/implement backend support in a sanctioned phase or (b) hide/disable with correct explanation. No invented backend fields.

---

## 7. Detailed dependent-API workflows (CRITICAL — do not miss related APIs)

### 7.1 ADMIN Catalog: category → product → variant → location stock (high priority)

**Loading dependencies, minimal request plan:**

```
verified ADMIN session
  └─ owned businesses (GET /tenant/businesses) [usually cached]
       └─ select businessId + authorized locationId
            ├─ GET /catalog/categories?businessId&locationId   (dropdown + category metrics)
            ├─ GET /catalog/variants?businessId&locationId&search&categoryId&productId
            └─ GET /catalog/products?businessId&locationId      (only if product chooser is shown;
                                                               optionally fetch on opening Add Variant)
```

- `categories` maps `{ id, name, ... }` → dropdown `{ value: category.id, label: category.name }`. The category name is for **display**; send `categoryId=<selected.id>` to products/variants. **Do not send `categoryName` as filter; DTO doesn't accept it.** "All categories" must omit `categoryId`.
- Since backend variants already contain `productName`, `categoryId`, `categoryName`, `sellingPrice`, `costPrice`, `stock`, and image fields from `presentVariant`, **render catalog rows directly from variant responses through `mapVariantToCatalogRow`**. Don't perform an N+1 `GET /catalog/products/:id` for every variant. Products query is needed for **parent-product selection and product management**, not for row label if variant API includes those fields.
- Search is server-side after debounce and not every keystroke; backend variant search handles variant name, SKU, barcode, product name. Category + search combine in one request. Client-side paginate filtered arrays (backend lacks page/limit); expose total computed from array and avoid refetch per local page change.
- Category creation `POST /catalog/categories`, category edit/delete `PATCH/DELETE /catalog/categories/:id`. Keep existing compact Category modal; add an understandable list/management entry if editing/deleting categories otherwise impossible.
- Product creation `POST /catalog/products` with required `name`, optional `categoryId`, description/custom attributes; other fields only if DTO supports. **Product creation must not automatically be variant creation.** Preserve Product dialog look, then offer "Add variant" continuation.
- Variant creation: opening "Add variant" (or edit) loads/caches `GET /catalog/products?businessId[&categoryId]` for a **parent Product** picker. Keep current Variant modal arrangement but insert required Product dropdown, show chosen product's category read-only or derived; require `name`, `sellingPrice`, optional SKU/barcode/cost price/stock. Include `businessId`/`locationId` where backend expects. `POST /catalog/variants` creates variant linked to `productId`; then revalidate variants/products/categories/metrics. A source product can have **multiple variants**; don't merge them.
- Editing: `PATCH /catalog/products/:id` and `PATCH /catalog/variants/:id` by editing correct entity; modal "Edit" currently renders a variant row, so route to variant edit; provide separate product edit from product manager/selector. `DELETE` endpoints soft-delete; confirm affected cart/stock and warn before deletion.
- Stock modal: use `PATCH /catalog/variants/:id/stock` with `{ operation: 'set', stock: newQuantity, locationId, businessId, notes? }`, not an edit of global variant `stock`. Add/deduct options if useful; enforce DTO rules for operation, quantity/delta, nonnegative policy. After success invalidate **branch-specific** variants, category inventory metrics, register stock and valuation; avoid showing success until server acknowledges. Stock should not be silently global when a branch is selected.
- Image management: `GET /variants/:variantId/images` and optional profile image; `POST /variants/:variantId/images`, `POST /variants/:variantId/profile-image`, their corresponding deletes. Inspect backend `FileInterceptor`, multipart field names, max file type/size and tenancy. Invalidate variant/card image keys after upload/delete. Preserve existing thumbnail sizes.
- Metrics: current "Active variants", "Units on hand", "Inventory valuation" can derive from **complete** scoped variant list, or category aggregates as appropriate. If API response is incomplete due to server-side filtering, do not sum just the displayed search page as a global KPI; use complete scoped result or a dedicated authoritative summary. Distinguish valuation at cost vs selling price: category backend's `inventoryValue` uses selling price in current service; if UI intends cost valuation, calculate only from authorized cost-price dataset and label honestly, or add a proper backend metric.
- `lowStockOnly`: backend uses string "true"; its current low-stock filter checks variant `stock` rather than branch `locationStock` before mapping. Verify semantics before marketing it as branch-low-stock.
- `isActive`: backend list DTO does **not** define an `isActive` query field; Admin gets permitted non-deleted records, Cashier service filters active products/variants. Do not send unsupported filters; post-filter locally only when consistent with server response and document limitation.

**Catalog scenario acceptance test:** Select branch A; list categories and variants; choose Chargers → query uses Chargers UUID, only Charger variants shown; search `INF` → variants searched once after debounce; open "Add variant" → products for selected business load or reuse cache; select parent Product → POST contains `productId` and optional branch opening stock; success refreshes table, dropdown metrics, totals and register. Switch to branch B → new branch stock displayed without leaking branch A cart or stock.

### 7.2 POS Catalog Register (ADMIN + CASHIER)

Flow: resolved identity/branch → `GET /catalog/categories` (filters/labels) + `GET /catalog/variants` (branch SKU/image/price/stock), optionally `GET /shifts/active` (shift chip, *not* a checkout prerequisite). Product/variant presentational view model retains current cards/search/barcode. Barcode scanning uses locally cached records for exact match; avoid GET per keystroke/scan if cached, use focused lookup when missing. Add to cart by immutable `variantId`, quantity; check local branch stock, show server-authoritative price. Before committing online checkout, confirm totals, tender, payment method and backend current pricing/stock; handle conflicts transparently. Use `POST /orders/catalog` with `businessId`,`locationId` for Admin, backend-assigned scope for Cashier, `lines:[{variantId,quantity,unitPrice}]`, required `tenderedAmount`, optional `paymentMethod`, customer, optional active `shiftId`. **Shift is optional.** Stable idempotency key per checkout attempt. Show returned invoice/receipt, not generated MOCK invoice. Invalidate orders, current branch stock and dashboard/report/shift data after accepted sale.

### 7.3 Quick Custom Sale (ADMIN + CASHIER)

Different entity: custom lines contain `productName`, optional `variantName`, `quantity`, `unitPrice`—**not `variantId`**; `POST /orders/custom`. Does **not** deduct catalog inventory. Category selection may help staff UX but is not a substitute for productId and backend custom DTO may not accept categoryId. Support optional customer, tenders and shift. Respect existing custom item dialog. If a feature claims to deduct catalog stock for custom checkout, reconcile with actual backend rather than calling stock adjustment separately (could double-post).

### 7.4 Cashier Orders / Refunds

`GET /orders` supplies unified catalog/custom list and supported filters. Read actual `GetOrdersQueryDto` / `ListOrdersQueryDto` semantics and returned `meta` before implementing search/status/payment/type/pagination; do not send old mock date filters the backend ignores. UI "View details" must use data included in order list, or a properly added secured detail endpoint; **GET /orders/:id is absent**. Refund: use `POST /orders/:id/refunds` `{reason?, items:[{orderItemId,quantity}]}` exactly; show eligible lines and maximum refundable quantities; server approves/refuses. Invalidate order/refund/report/stocks when relevant; distinguish already refunded, insufficient quantity, branch and role errors. No fake refund modal success.

### 7.5 Shifts, advances and cash actions

`GET /shifts/active`, `GET /shifts` for history; `POST /shifts/open` requires `startingAmount` (UI may display "Opening float"); `POST /shifts/close` or `/shifts/:id/close` requires `closingAmount` (and optional notes). Scope by authenticated branch. Implement open/close confirmations, expected cash/variance from server, and topbar shift chip with same cached key. **Do not treat shift as mandatory for checkout.** Drawer cash-out is NOT automatically an employee advance: backend `/advances` belongs to employee HR. Current UI says shift cash action ledger semantics pending. Until backend route/model is agreed, show honest pending/disabled behavior—not a fake shift cash transaction.

### 7.6 Staff / Payroll / Advances

ADMIN staff page depends on `GET /users/cashiers` plus branch lookup for human-readable location; CRUD/status via `POST /users/cashiers`, `PATCH /users/cashiers/:id`, `PATCH /users/:id/status`, `DELETE /users/cashiers/:id` after verifying DTO and which status endpoint is correct. Payroll tab: `GET /payroll/summary`, `GET /payroll/history`/`GET /payroll`, mutation `POST /payroll/process` needs `{cashierId,month,year,businessId?}`, disburse `POST /payroll/disburse` uses `{month,year,locationId?,businessId?}`—the frontend's `payrollId`-only DTO is incorrect. Advances tab: `GET /advances`, `/advances/summary`, `POST /advances`, `DELETE /advances/:id`. Use server payables/deductions and role-sensitive masking; do not allow Cashier to see Admin salary data merely because it remains in React Query cache.

### 7.7 Dashboard / Reports / Exports

Admin dashboard cards: `GET /reports/dashboard?range&month&week&year&businessId&locationId` for gross/net/order/payment metrics; `GET /orders` for recent tickets (reuse cached order list when possible); `GET /shifts/active` for shift telemetry if applicable; **category sales performance** should use `GET /reports/analytics` and its actual returned fields, not arbitrarily map count of products to revenue. `GET /catalog/categories` offers inventory and historical category sales metrics but validate scope/time before using in period-specific chart. Do not assume every widget is returned by dashboard endpoint. Reports tab: ADMIN `GET /reports/analytics` for margin, category performance and period comparisons; `GET /reports/transactions` for chronological transaction table with query filters. Export actual binary via `GET /reports/export?type=sales|payroll&format=csv|pdf&month=10&year=2026&businessId=...&locationId=...` and real `Blob` response. File should download once, meaningful filename, handle errors, no static success toast. Keep all Daily/Weekly/Monthly/Quarterly controls but convert to backend-supported period names and supported month/week/year. `transactionLog` paging must use backend response type, not fake `Order[]` if enriched rows/pagination metadata exists.

### 7.8 Missing features — fill backend-supported flows in same design system

- **SUPER_ADMIN**: platform account approvals/status and list (`GET /admin/users`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/status`), separate shell/menu, backend-only authorization.
- **Expenses**: `GET /expenses`, `GET /expenses/summary`, `POST /expenses`, `DELETE /expenses/:id` on a new Admin Expenses page, with effective tenant/location, categories/filters only if backend supports, mutations revalidating summary and associated financial reports.
- **Audit**: `GET /audit-logs`, `GET /audit-logs/:id` in an Admin Audit page or relevant settings tab, matching current table styling. Verify exact roles and query fields.
- **Profile images**: backend also exposes user/cashier and business profile image endpoints; use when adding profile editing, do not block catalog/auth on this dependency.
- **Other desired but currently unsupported interactions:** durable held-ticket list, X-report printing, attendance/on-duty, receipt hardware bridge, actual offline checkout permissions, generic cash-out ledger. Log as gaps; never fake a backend result.

---

## 8. Phase sequencing and agent deliverables

### Phase 0 — contract and visual baseline (discovery, then incremental test snapshots)

Prepare an endpoint matrix by reading current backend controller, DTO, service and frontend call site. Verify response examples via backend tests or running API; record backend port, session cookies, `GET` shape, roles, tenant constraints, request idempotency. Capture baseline UI screenshots at matching screen dimensions before each refactor. Map all routes/mock dependencies. This guide's §3 is the starting point, not a substitute for testing.

### Phase 1 — production authentication, RBAC, businesses and branches

Correct cookie transport, login modes, role-based redirects, `src/proxy.ts`, session recovery/refresh, single user identity source, logout, Admin owned businesses/branch switch, Cashier branch lock, SUPER_ADMIN routing handling. Keep catalog/orders mocks isolated at this phase, but remove role-switch demo and protected bypass. Acceptance: Admin/Cashier/Super Admin can't cross unauthorized routes; app refresh restores legitimate session with controlled network usage; zero repeated `/users/me` on every navigation; same visual layout.

### Phase 2 — real catalog and stock foundation

Build categories/products/variants dependency graph, SKU and category filtering, product picker in Variant modal, category/product/variant CRUD, location stock operations, image integration as appropriate, metrics, cache invalidation, client pagination. Preserve product cards/table/modal visuals. Acceptance from §7.1 plus ownership tests and cashier-safe fields.

### Phase 3 — online POS, order/refund and shifts

Register categories and variants, cart/checkout custom vs catalog, tender, stable idempotency, receipts, active shift without shift requirement, order history and refunds, open/close/history; dependent revalidations; role/branch control. Cash action ledger gap remains blocked pending backend contract.

### Phase 4 — Staff, payroll, advances, expenses, analytics, exports, platform admin and audit

Integrate Admin operations; create missing screens where backend provides support and feature belongs to Admin/Super Admin. Keep existing visual system, no Cashier salary/cost exposure. Provide server-authoritative KPI and export tests.

### Phase 5 — offline-first PWA (dedicated design and acceptance, **not automatically complete**)

Backend foundations exist: `GET /offline/bootstrap` snapshot and `POST /orders/sync` batch up to 100, `clientOrderId` dedupe returning per-order `ACCEPTED`/`DUPLICATE`/`REJECTED`. Frontend needs IndexedDB transactionally stored business/branch/variant snapshot, per-device identity and sale queue, locally allocated client receipt number, sync queue with backoff and per-sale outcome, multi-tab coordination, conflict/reconciliation UI, security policy for account revocation/expiry, low-stock stale warnings, network state banner, installation/service worker caching and explicit offline limitations. Do **not** attempt to refresh JWT offline; current 7-day access token and 30-day refresh token are not equivalent to unconditional 7-day server-authenticated checkout. Decide offline device entitlement/session validity with security team. Avoid caching sensitive raw tokens in service worker/IndexedDB; offline transactions must be clearly labelled queued/unconfirmed until sync.

**Per-phase final agent output:**

1. Implemented screen/flow list (real vs remaining mock) with code paths.
2. Exact API method+path+parameters/payload+role+call dependency graph.
3. Changed files and why; visual delta to baseline screenshot.
4. Query keys, staleTime and caching/revalidation/invalidation triggers.
5. Loading/empty/error/offline states.
6. Unit, integration and E2E results (`npm run typecheck`, `npm run lint`, `npm run build`, backend contract/auth tests); never claim passes without executing.
7. Backend issues/gaps (with file references and reproducible behavior); what remains deferred.
8. Next-phase handoff: important decisions, scope, missing features, exact starting point. Keep it concise to avoid giant-chat UI hangs.

---

## 9. Acceptance / test matrix (must run, not just describe)

| Test | Expected |
|---|---|
| Admin login via email and wrong tab/role attempt | Backend role, not clicked tab, determines destination; user cannot manually set role with client cookie |
| Cashier login using publicId, refresh browser | Assigned branch/permissions restored without `/users/me` repeatedly or premature protected flashes |
| Anonymous `/admin/catalog`, `/pos/terminal` | Redirect/login; `|| true` bypass gone in production |
| Cashier enters `/admin/payroll`; ADMIN enters SUPER_ADMIN routes | Forbidden/redirect with no private data leakage |
| Admin switches business A → B and branch A1 → A2 | All queries/cart/shift use new scope; previous scoped data not exposed; no stale price/stock |
| Admin selects category "Chargers" in catalog | Categories API loads; dropdown displays name; variants query uses `categoryId` UUID, not category name; no unnecessary product details GET for rows |
| Add variant under existing product | Product selector is real; POST includes productId, not categoryId as parent; cache invalidation updates rows, register, product and metrics |
| Variant stock set to 15 in branch A | `PATCH .../:id/stock` with operation set and authorized location; refreshed stock 15 in A, branch B unchanged |
| Rename category | Catalog row label and filter cache update; no stale cached categoryName |
| Search rapidly or page through variants | Debounced request; reuse one array response; client pagination; no invented backend page/limit |
| Cashier catalog checkout without shift | Allowed when backend validates; no fake forced shift requirement; backend invoice returned; stock/orders/dashboard invalidated |
| Double click checkout or retry timed-out request | One logical order, SAME idempotency key/payload reused; no duplicate ledger writes |
| Custom sale checkout | Custom lines and `/orders/custom`; does not decrement unrelated variant stock |
| Refund one item | Correct `orderItemId`, server max; order/reports/stock revalidate; show backend failure honestly |
| Open / close shift | `startingAmount`/`closingAmount` used; active+history cache correct; chip updates |
| Process and disburse payroll | Real cashierId/month/year process and correct period disbursement DTO; advances reflected; no fake mock success |
| Reports range & export | Correct dashboard/analytics/transactions; server CSV/PDF with required `type,format,month,year` |
| Logout / account switch | HttpOnly server logout, client auth/cart/tenant caches purged, old user cannot view private rows |
| Online → disconnected → reconnect | Cached UI shows staleness; no false online success; online revalidation deduped; durable offline checkout only in designated PWA phase |

### Observability / performance acceptance

Open browser Network tab with query devtools (non-production only) and verify: one login; no `/users/me` per route; repeat category filter uses cached lookup; duplicate components share in-flight category query; independent report widgets load in parallel; no uncontrolled polling/refetch storms; aborted stale searches; failed mutations do not show success or corrupt cache. Record request counts for login → Admin business → catalog → filter → edit → dashboard and for Cashier login → register → checkout → history.

---

## 10. Source files to inspect first (do not depend on original chat context)

**Backend contracts:**
- `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`, `src/auth/dto/login.dto.ts`, `src/auth/strategies/jwt.strategy.ts`
- `src/catalog/category.controller.ts`, `product.controller.ts`, `variant.controller.ts`, `variant-image.controller.ts`; their `src/catalog/dto/**`, `*.service.ts`
- `src/tenant/tenant.controller.ts`, `src/tenant/tenant.service.ts`; `src/users/user.controller.ts`
- `src/orders/order.controller.ts`, `refund.controller.ts`, `src/orders/dto/**`
- `src/shifts/shift.controller.ts`, `src/shifts/dto/**`
- `src/reports/report.controller.ts`, `export.controller.ts`, `src/reports/dto/**`
- `src/hr/{payroll.controller.ts,advance.controller.ts}`, `src/expenses/expense.controller.ts`, `src/common/audit/audit.controller.ts`, `src/offline/offline.controller.ts`
- `prisma/schema/{pos,tenant,user,hr}.prisma`; `docs/POS.md`; backend `main.ts` and `.env.example`

**Frontend integration owners:**
- `src/proxy.ts`; `src/app/(dashboard)/layout.tsx`; `src/app/providers.tsx`; `src/components/layout/sidebar.tsx`
- `src/lib/{api-client.ts,auth-cookie.ts,get-query-client.ts,query-keys.ts}`; `src/redux/{store.ts,api/createApi.ts,api/*.ts,reducers/*.ts}`
- `src/features/auth/components/login-form.tsx`; `src/features/tenant/components/business-branch-hub.tsx`; `src/features/tenant/hooks/use-tenant-scope.ts`
- `src/features/catalog/{api/use-catalog.ts,components/catalog-manager.tsx,view-models.ts}`
- `src/features/pos/{api/use-pos.ts,components/*,view-models.ts}`; `src/features/shifts/*`; `src/features/hr/*`; `src/features/reports/*`
- `src/types/{api.ts,domain.ts}`; `src/mocks/**`, `src/demo/**` (fixtures for UI parity only, not production APIs).

### Security/backend review flags to hand back to backend team before production

- `src/orders/order.service.ts::getOrders()` possible missing ownership assertion for Admin-selected businessId. Verify with cross-admin test, fix in backend if confirmed.
- `src/orders/order.service.ts` may include `unitCost` in Cashier order-line projection while sensitive field masking interceptor does not clearly mask that key. Verify response and server-filter if confirmed.
- Separate branch stock vs global variant low-stock filtering; review when enabling location-low-stock UI.
- Cookie CSRF posture: JWT accessible via cookies means mutating endpoints should have an explicit CSRF/origin strategy in same-site/cross-site deployment, alongside backend auth and idempotency. CORS is not by itself a complete CSRF defense.
- Client query/data caching is **not** authorization. Always re-check account/tenant access on server at transaction time and design offline device trust separately.

---

## 11. Copy-ready top-level instruction for your coding agent

> Implement SunTech POS against the **current NestJS backend** using the attached `SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`, backend `docs/POS.md` and exact controllers/DTOs, plus existing Next.js source. Work in the phase I specify and do not skip dependent API calls. Preserve existing SunTech UI as closely as possible. For each screen, trace parent lookups → entity reads → mutations → cache invalidation → route/tenant permissions → all UI states. In catalog, **GET categories to populate category labels, then filter variants/products by selected category UUID (`categoryId`)**; ensure variant creation chooses an actual parent `productId`. Do not invent endpoints, DTO fields or persistence. Real login and verified RBAC, secure HttpOnly cookies, low-request session restore, tenant-safe cache, stable checkout idempotency, and phased offline-readiness are mandatory. If a backend-supported feature has no UI, add it to the right authorized workflow using existing design tokens. After implementation run typecheck/lint/build and relevant tests; report actual outcomes, files, request coverage, cache/revalidation behavior and remaining gaps.

**END OF GUIDE — file is self-contained when supplied alongside backend and frontend repositories.**
