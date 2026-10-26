# SunTech POS — Frontend API Integration Plan (Phases 0–14)

> **EXECUTION DOCUMENT FOR AI CODING AGENTS — v3.0 (2026-10-26)**  
> **Scope:** Integrate the **existing Next.js frontend** into the **completed NestJS POS backend**, phase by phase. No backend feature implementation is authorized by this plan.  
> **Status:** Plan/instructions only; the phases below are **not** claims of completed implementation.  
> **Related required reading:** `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`, backend `docs/POS.md`, backend controllers/DTOs/services and Prisma schema, `docs/frontend-page-api-map.md`, `docs/frontend-backend-gap-register.md`.  
> **Primary UI reference:** user's screenshots and the *current* frontend components. Preserve established layout, styles, navigation, density, and particularly existing POS product-card dimensions.

> **Codex v3 extension:** In addition to each full Phase 0–14 prompt in §5, execute that phase's five smaller `N.A–N.E` implementation tickets in §13, and use the restart/review/handoff scripts in §§12–15.

## START HERE: how the agent must use this document

1. Read **this entire plan** and `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`; read `AGENTS.md` and, for Next.js 16 APIs, the **installed** Next.js documentation appropriate to the project before changing framework code.
2. Verify the frontend and backend checked-out revisions. Source-of-truth order: **backend controller + DTO + service + schema/tests** → backend `docs/POS.md` → existing frontend code → screenshot visual baseline → older plans/README. Record conflicts. Do **not** manufacture backend APIs, fields or guarantees.
3. Execute **one phase at a time**. The phase prompt in that phase is copy-ready. Complete its acceptance criteria and `docs/FRONTEND_INTEGRATION_PROGRESS.md` before advancing. **STOP** after that phase, even if other tasks seem easy.
4. Every integrated screen must have: dependent lookup requests, authorized tenant scope, API DTO mapping, validation, loading/empty/error/offline states, cache keys, mutation invalidation, responsive/UI preservation checks, and real tests. A successful GET alone does **not** make the screen integrated.
5. **Frontend only.** Backend is considered complete for this initiative. If a workflow truly lacks backend support or has an authorization/security discrepancy, record the exact controller/DTO evidence in the gap register; do not silently build fake persistence, modify the backend, or declare the flow finished.
6. Do **not** repeatedly call `/users/me` per page/route. Consume verified login response identity and keep session state, with deliberately scoped refresh/revalidation only when necessary.
7. **Storage contract is mandatory:** authorization credentials and token material in **secure HttpOnly cookies under the Next.js same-origin architecture**, never in localStorage/Redux/persisted query caches/JS cookies; user-selected **businessId and locationId**, sidebar state, filters, and other nonsecret UI preferences in **user-scoped localStorage**; substantial offline catalog, stock snapshots, durable draft tickets, and sync queues in **IndexedDB** when Phase 13 arrives. See §2 for precise architecture and caveats.
8. Backend business ownership, role, and branch authorization remain authoritative. `localStorage` values are preferences, **not permissions**; re-check selection against authorized GET results, especially after login, account switch and reconnect.
9. All numeric prices/totals are integer **BDT taka**. Do not reinterpret as cents, use floating currency calculations, or invent unsupported payment methods.
10. Current mock/demo hooks should be replaced **screen-by-screen**, not deleted wholesale in Phase 0. Never label a static action or a mock success as a real API feature.

### Existing source paths reviewed

- `src/app/(auth)/login/page.tsx`, `src/features/auth/components/login-form.tsx`, `src/features/auth/api/use-auth.ts`
- `src/proxy.ts`, `src/lib/auth-cookie.ts`, `src/lib/api-client.ts`, `src/app/providers.tsx`, `src/redux/**`, `src/lib/query-keys.ts`
- `src/app/(dashboard)/admin/{select-business,catalog,terminal,custom-sale,dashboard,staff,payroll,reports}/page.tsx`
- `src/app/(dashboard)/pos/{terminal,custom-sale,orders,shifts}/page.tsx`
- `src/components/layout/{sidebar,navbar}.tsx`, `src/features/tenant/components/business-branch-hub.tsx`
- `src/features/{catalog,pos,shifts,hr,reports}/**`, `src/mocks/**`, `src/demo/**`
- Backend `src/{auth,tenant,users,catalog,shifts,orders,offline,reports,hr,expenses,admin,common/audit}/**`, Prisma schemas.

**Confirmed frontend defects to remove in relevant phases:** `src/proxy.ts` has `process.env.NEXT_PUBLIC_ALLOW_DEV_PREVIEW === "true" || true` (always allows unauthenticated preview); `src/lib/auth-cookie.ts` writes `suntech_token` and `suntech_role` through `document.cookie`; `src/lib/api-client.ts` reads a JWT from localStorage and makes a **new** idempotency key for each mutation attempt; auth UI still uses mock login; catalog/terminal and dashboard contain demo data. Existing Axios, TanStack Query, Redux, React Hook Form/Zod and Tailwind should be reused, not replaced without proof.

---

## 1. Phase index and dependency gates

| Phase | Name | Depends on | Result / role-focused UI |
|---|---|---|---|
| **0** | Infrastructure & reference baseline | repos + guide | Cookie-aware transport strategy, cache/query keys, error/DTO mapping, fixture inventory, screenshot baseline |
| **1** | Login, Next cookies, session, RBAC | 0 | Real ADMIN/CASHIER/SUPER_ADMIN login paths, session, role-controlled sidebar, logout |
| **2** | Businesses & branches | 1 | Admin selection/CRUD, Cashier locked location, user-scoped localStorage preferences |
| **3** | Categories, products, variants | 2 | Backend-valid CRUD + product description + mandatory first variant **in UI workflow** |
| **4** | Inventory, variant imagery & stock | 3 | Branch-aware stock, adjustments, correct variant images, catalogue metric data |
| **5** | Staff/cashier accounts | 2 | Admin cashier CRUD/status/assignments, permission-safe roster |
| **6** | Shifts and cash context | 2, 5 for roster UX | Open/close/active/history; shift optional for checkout |
| **7** | Catalog register / direct variant sale | 3, 4, 6 | **Current-size product cards with compact variant selector**, cart, catalog checkout |
| **8** | Quick custom sale | 2, 6 | Free-form lines, custom checkout; does not deduct catalogue stock |
| **9** | Order history, receipts, refunds | 7, 8 | Cashier/Admin history, details from list result, partial/full refund and revalidation |
| **10** | Dashboard, analytics, exports | 9 (can build read-only earlier) | Real KPI/report/transaction screens, server CSV/PDF |
| **11** | Payroll & advances | 5, 6 context | Real payroll/advance actions, no salary leakage |
| **12** | Missing backend-backed screens | 2–11 | Expenses, audit, Super Admin, profile images, UX gaps and unsupported feature handling |
| **13** | Durable offline-first PWA | 1–12 stable | IndexedDB catalog snapshot, offline sale queue, receipts, replay reconciliation, installability |
| **14** | Release hardening | all | Security, tenant isolation, E2E, accessibility, network/performance, offline fault tests |

**Agents:** keep previous phases working. If Phase 7 uncovers a model bug in Phase 3, fix it with regression tests and record it; do not build a competing second catalog data model.

---

## 2. Storage, authentication and offline-ready architecture (MUST FOLLOW)

### 2.1 Where data belongs

| Data | Storage | Why / enforcement |
|---|---|---|
| Access JWT / refresh JWT / secret session material | **Server-issued HttpOnly, `Secure` (production), `SameSite`-appropriate cookies** visible to Next.js server **only under a verified same-origin/BFF arrangement** | Never expose token to JS, localStorage, sessionStorage, persisted Redux, IndexedDB or service worker |
| Role/user ID/name/profile and minimal UI session projection | In-memory authenticated session context; **signed/encrypted HttpOnly Next session cookie** or server-verifiable session metadata for server route gating, if needed | Login response is authoritative initially; a client-editable role cannot grant access |
| Selected ADMIN business UUID | `localStorage` per authenticated user, e.g. `stpos:v1:<userId>:selectedBusinessId` | UI preference only; checked against `GET /tenant/businesses` every login/switch when online |
| Selected ADMIN location UUID | `localStorage` per user + business, e.g. `stpos:v1:<userId>:<businessId>:selectedLocationId` | Must belong to selected, authorized business; resets on business switch if invalid |
| CASHIER business/location | **Derived from authenticated server-returned assignment**, not user-controlled localStorage | Display assigned scope; never provide unauthorized branch switcher |
| Sidebar collapse, preferred view, search/category filters, page size, date ranges | `localStorage` with namespaced/versioned keys | Nonsensitive preferences; always sanitize on read and preserve UI defaults |
| Current online cart / held ticket UI state | In memory; optionally minimal **user+business+branch-scoped localStorage draft** during online phases | Do not persist access tokens or treat local draft as placed order. Clear/confirm on scope switch; don't lose paid orders |
| TanStack Query API results | **Memory cache for online phases**; carefully vetted persisted query state later | Query keys include user/tenant/branch; avoid cross-user private data persisted in shared storage |
| Offline bootstrap catalog, variant records/images metadata, branch stock, pending orders, sync attempts, receipts | **IndexedDB**, transactional and versioned (Phase 13) | localStorage is capacity-limited/synchronous; does not safely support week-long POS datasets/atomic queue |
| Payroll, staff private fields, cost-sensitive results | Short-lived authorized memory cache only unless reviewed for secure offline access | Never persist sensitive payroll/role-guarded data as shared/public offline assets |

**User preference:** keep routine UI/tenant preferences in localStorage. This explicitly does **not** mean storing large offline databases or auth tokens there. IndexedDB is necessary to make a heavy offline POS reliable. Do not store role as an editable authorization source in localStorage.

### 2.2 Precisely how “Next cookies” must work

The actual Nest backend already sets cookies in `src/auth/auth.controller.ts`: `accessToken` = HttpOnly, path `/`, nominal 7 days; `refreshToken` = HttpOnly, path `/api/v1/auth`, nominal 30 days. The login JSON also returns `accessToken` and a `user` projection. **Do not copy that JSON JWT into a readable cookie**. The backend JWT guard accepts cookie auth; verify exact extraction in backend strategy/guard.

**Recommended production-compatible topology:** browser → **same-origin Next.js route handlers/BFF or reverse-proxied `/api/v1/*`** → Nest backend. Ensure `Set-Cookie` from login/refresh/logout is correctly forwarded and scoped to the browser-visible origin. For a Next BFF that independently manages session cookies, only use an audited server-side secret/session design and correctly scope refresh path; do not accidentally strip `Set-Cookie`, forward private tokens to client JS, or use a path that prevents refresh. **Host-only cookies set on `api.example.com` cannot automatically be read by `app.example.com` Next middleware**. Direct cross-origin cookie calls need validated `withCredentials`, CORS, SameSite, CSRF and deployment topology, and may not be usable for Next server route guards. Choose and test one topology; document it in Phase 0/1 before implementation.

**Next.js route guard:** `src/proxy.ts` can make a fast redirect based on server-verified Next session metadata / validated token; a plain `suntech_role` cookie or a localStorage value is only a UI hint and MUST NOT decide authority. Never assume that merely seeing a cookie proves its signature/expiry. In offline mode, Next server guards cannot be reached; offline terminal entitlement is a separate Phase 13 policy. Online Nest role/tenant guards remain final authority.

**Login request (`POST /auth/login`):** ADMIN mode `{loginType:'ADMIN',email,password}`; CASHIER mode `{loginType:'BUSINESS_USER',publicId,password}`; role from returned `user.role` (including SUPER_ADMIN) determines destination, **not login-tab choice**. Backend `/auth/refresh`, `/auth/logout`, registration/password-reset routes exist. Load `/users/me` only for justified exceptional revalidation (new session recovery with no trusted user projection, security-sensitive revalidation, changed profile), NOT every navigation.

**Access-token refresh:** deduplicate concurrent `401`s to one refresh attempt, retry the original safe request once, and rate-limit retries. For orders/payments/refunds, preserve the exact request and **same** idempotency key on uncertain retries. If session cannot be recovered online, stop privileged online requests and clear server session, not blindly rely on localStorage role. Offline availability alone is not logout.

**CSRF/XSS/security:** HttpOnly is necessary but not sufficient. Cookie-authenticated mutations require a deliberate CSRF/origin policy (same-site attributes + CSRF defenses as appropriate); CORS alone does not solve CSRF. Do not log credentials. Avoid localStorage user role deciding server actions. Do not cache secrets or raw API responses into publicly cached service-worker routes.

### 2.3 LocalStorage persistence contract

- Provide one `tenant-preferences.ts` storage adapter with SSR guards, key version, runtime parsing/validation, and storage-event cross-tab synchronization. Never access `window.localStorage` during server rendering.
- Store only UUIDs/selection hints. On Admin login bootstrap, fetch owned businesses/locations and drop stale or unauthorized selections; if none valid, navigate to existing `/admin/select-business` hub.
- On business change, verify branches, remove mismatched location, confirm clearing/rehoming cart drafts and unsynced data, cancel obsolete in-flight requests, switch namespace, then render new scoped data. A pending offline sale must **never** be automatically moved to another branch.
- All key patterns include at least `userId` and `businessId` where relevant; include `locationId` for branch-scoped views. A cashier switching account gets no other cashier's preference cache or sales drafts.
- On logout remove user-scoped sensitive preferences/drafts and query cache; define offline unsynced-ticket retention vs deletion as a **security/accounting decision** in Phase 13. Never silently delete committed queued sales on sign-out.
- Place only modest UI preferences in localStorage. For large catalogs, receipts, images, multi-day sales, background sync metadata, use IndexedDB.

### 2.4 Three distinct states — no false offline success

1. `ONLINE_AUTHENTICATED`: server reachable, valid backend session, live APIs and online checkout permitted.
2. `DISCONNECTED_READ_ONLY` before offline POS is delivered: stale/last-known data may be shown with clear timestamp; **payments/orders must not falsely complete**. Network errors must not erase local input.
3. `OFFLINE_DEVICE_AUTHORIZED` (Phase 13, **only after explicit approved policy**): locally enrolled terminal and permitted cashier can record **queued/unconfirmed** sales in durable IndexedDB. Receipt is a local provisional receipt; backend `orders/sync` later decides `ACCEPTED`, `DUPLICATE` or `REJECTED`. Online suspension, expiry, business reassignment and device loss are nontrivial policy constraints; 7-day cookie expiry is **not** automatic offline entitlement.

### 2.5 Cache policy: validate → revalidate → invalidate

Use **existing TanStack Query v5** for online server-state. Do not put the same API data into a second uncontrolled cache in Redux. Redux may remain for cart/UI state until offline store migration. Suggested **starting** timings (measure and adjust; not backend guarantees):

| Data class | Initial staleTime | Refetch trigger | Invalidation after |
|---|---:|---|---|
| Categories | 10–30 min | tenant switch, explicit refresh | category/product mutation, category-sensitive metrics |
| Products / product lookup | 2–10 min | tenant switch, mutation | create/edit/delete product or first-variant wizard |
| Variants/SKU lookup | 30–120 sec | branch switch, checkout recovery, explicit refresh | variant mutation, stock change, catalog order/refund |
| Branch stock/active shift | 15–60 sec | active register and reconnect, no rapid polling | stock adjustment, order/refund, shift lifecycle |
| Owned businesses / branches | 5–15 min | login/bootstrap, scope switch | business/location CRUD |
| Order history | 30–90 sec | opening history, mutation, reconnect | checkout, sync/refund |
| Staff/payroll | 1–5 min | entering authorized route, mutation | cashier/status/advance/payroll mutations |
| Dashboard/reports | 1–5 min | filter/date change, relevant mutation | orders, refunds, shifts, payroll where relevant |
| Authentication role/assignment | Login event + targeted validate | explicit refresh/recovery/security event | profile/account/assignment change |

Prefer `refetchOnWindowFocus: false` for active POS; `refetchOnReconnect` should be intentional, backoff-aware, and muted while offline. Configure `networkMode` intentionally. Never retry unsafe money mutations with a **new** key after an uncertain timeout. Deduplicate `GET`s and debounced search (250–400ms); use `enabled`/`skip` until prerequisite `businessId`, `locationId`, `categoryId`/`productId` are valid. Cancel stale responses (`AbortSignal`) on business/branch/filter switch. Per-tenant query keys must include `userId` where sensitive and `businessId`, `locationId`, filters, period and role as applicable.

**Lookup example:** opening Catalog loads categories and variants as independent cached GETs *after* authorized tenant scope exists; filter shows `category.name` but sends **`categoryId` UUID**. New Variant modal reuses cached categories and loads eligible products (`categoryId` scoped if user filtered); after adding variant invalidate variant lists, parent product detail, register derived cards, inventory metrics and category analytics. **Do not send category display name as `categoryId`; the earlier phrasing about sending names is incorrect for this backend.**

**Cart correctness:** selected product variant is the sellable unit; online checkout must recheck backend prices/stock and display backend-authoritative order amount. Locally cached prices are previews. Request dedupe **must not** deduplicate distinct legitimate orders; use one logical operation's stable key for exactly that operation.

### 2.6 UI invariants from screenshots

- Retain navy sidebar, selected bright-blue menu, small top shift/location chips, white panels, outlined light-gray tables, modal form density, BDT typography, selected category pills, compact four-column POS register cards at desktop widths (current `xl:grid-cols-4`).
- **PRODUCT CARD MUST NOT GET BIGGER** in desktop register. Keep same grid columns, width, existing `aspect-[4/3]` image, approximate overall height, and current text/price/stock positions. Add **one slim variant `<select>`/dropdown** inside existing card content by trimming vertical gaps and using a single-line/truncated selector. **Do not wrap entire card in a `<button>` if it contains a selector**; use a card container with separate clickable add target/button. Do not add a large modal or a second full-width row per card.
- Cards are **grouped by Product**, showing the selected sellable variant. Display variant-specific name/SKU/image/price/location stock as selection changes. Products with one variant can show a compact static label or same-size selector to preserve a consistent grid; disabled/unavailable variants must never be added. Cart lines must use `variantId` and separate quantities per variant, even if from same product.
- Product create/edit must include **description** (backend `CreateProductDto.description`, max 500 chars), category, and a **required first variant in the frontend workflow**; variant fields include name, SKU/barcode, selling price, optional cost price (Admin only) and opening branch stock where appropriate. Product and variant are separate REST mutations, **not one server transaction**. If product creation succeeds but variant fails, retain newly created product ID in resumable wizard and provide Retry Variant / View Draft Product; do not claim rollback or discard the orphan silently. Enforce “at least one variant before product is ready for register” in frontend flow; do not assert database-level constraint not present in backend.
- If backend product has no `image` field, source card imagery from selected variant's `profileImageUrl` / variant images with a consistent fallback. Keep current product image crop/ratio and do not repeat one unrelated fixture image across production catalog.

---

## 3. Verified backend API dependency map (relative to `/api/v1`)

**Never use this table without reading the current controller+DTO for exact fields/status/role.** This summarizes routes verified in the supplied backend archive and intentionally separates unsupported UI affordances.

| Domain/UI | Required API calls and related dependencies | Notes |
|---|---|---|
| Session/login | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`; optional `GET /users/me`; public register/forgot/verify/reset | Access/refresh HttpOnly cookies; Admin email vs cashier publicId; role from login response |
| Super Admin | `GET /admin/users`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/status` | SUPER_ADMIN only; do not drop into Admin-only business screens |
| Business chooser | `GET /tenant/businesses`, `POST /tenant/business`, `PATCH /tenant/businesses/:id`, `DELETE /tenant/businesses/:id`, `GET /tenant/business` | Backend `POST /tenant/business` takes **name**; don't send invented frontend company form fields |
| Branch chooser | `GET /tenant/locations?businessId=`, `POST /tenant/locations`, `PATCH /tenant/locations/:id`, `DELETE /tenant/locations/:id` | Scope branches to owner business; fields from `CreateLocationDto`, not demo `plan` |
| Category pills/dropdown | `GET /catalog/categories?businessId=&locationId=&search=`, GET detail; Admin POST/PATCH/DELETE | Display `name`; send `categoryId` UUID to catalog filters |
| Products | `GET /catalog/products?businessId=&categoryId=&search=&locationId=`, GET detail; Admin POST/PATCH/DELETE | Product has description; `categoryId` optional; no product price/SKU in parent |
| Variants | `GET /catalog/variants?businessId=&categoryId=&productId=&search=&locationId=&lowStockOnly=`, GET detail; Admin POST/PATCH/DELETE | Variant requires `productId`; price/SKU/stock live here; **no `page`/`limit` defined for these catalog list DTOs** |
| Stock | `PATCH /catalog/variants/:id/stock` (also `/catalog/variants/stock`, `POST /catalog/variants/:id/stock`) | Use `UpdateVariantStockDto` `operation`/`quantity`/`stock`/`locationId`; query business where needed |
| Images | `POST/DELETE /variants/:variantId/profile-image`, `GET/POST /variants/:variantId/images`, `DELETE /variants/:variantId/images/:imageId` | Admin management; multipart upload, inspect backend file field/limits; terminal image comes from variant |
| Staff | `GET/POST /users/cashiers`, `PATCH/DELETE /users/cashiers/:id`, `PATCH /users/:id/status`, profile image endpoints | ADMIN only; role/status/salary fields respect server masking |
| Shifts | `GET /shifts/active`, `GET /shifts`, `POST /shifts/open`, `POST /shifts/close`, `POST /shifts/:id/close` | `startingAmount`, `closingAmount`; optional `shiftId` at checkout |
| POS catalog checkout | `POST /orders/catalog` + categories/products/variants/branch/optional shift | Lines `{variantId,quantity,unitPrice}`; tender/payment; stable `Idempotency-Key` |
| POS custom checkout | `POST /orders/custom` + branch/optional shift | Lines `{productName,variantName?,quantity,unitPrice}`; **no variantId required**; no stock deduction |
| Orders and refunds | `GET /orders` filters, `POST /orders/:id/refunds` | **No `GET /orders/:id` in inspected order controller**; derive details from sufficiently detailed list response or record a backend gap |
| Dashboard/reports | `GET /reports/dashboard`, `GET /reports/analytics`, `GET /reports/transactions`; `GET /reports/export?type=&format=&month=&year=` | Report export is raw file blob; `type` sales/payroll, format CSV/PDF; role restrictions differ |
| HR | `GET /payroll`, `GET /payroll/summary`, `GET /payroll/history`, `POST /payroll/process`, `POST /payroll/disburse`; `GET /advances`, `GET /advances/summary`, `POST/DELETE /advances` | Advance creation CASHIER; admin can read/delete. Follow exact DTOs and permissions |
| Expenses & audit | `GET/POST/DELETE /expenses`, `GET /expenses/summary`, `GET /audit-logs`, `GET /audit-logs/:id` | Add missing Admin screens in Phase 12 if supported |
| Offline foundation | `GET /offline/bootstrap`, `POST /orders/sync` | Authenticated bootstrap, batched sync up to 100, stable `clientOrderId`; not a generic CRUD sync protocol |

**Critical limits:** categories/products/variants are array GETs without declared backend `page`/`limit`; keep present UI pagination by applying **client-side paging** to cached, correctly scoped lists or explicitly document scale blockers. `GET /orders` has its own pagination/filter DTO. The current product price is NOT on `Product` and checkout is by `Variant`. A shift is **not mandatory** for checkout. Some Admin functions cannot be accessed by `SUPER_ADMIN` simply because it is a higher role; use exact backend guards.

## 4. Universal integration checklist for every screen and mutation

For **each visible list, form, chart, selector and action**, the implementing agent MUST complete and record:

1. [ ] Enumerate route, screenshot, component, existing hook/mock, backend controller/DTO/service, authorized roles and business/location dependency.
2. [ ] Read lookup APIs first (e.g. category list, parent-product list, branch list) and reuse their cached results; show real display labels; send actual IDs in filters/mutations.
3. [ ] Build typed request/response adapter; unwrap backend `{success,message,data,timestamp}` once; handle file exports separately.
4. [ ] Use scope-complete query key (`userId`, business, location, filters, period, role as relevant); conditional `enabled`, `AbortSignal`, reasonable `staleTime` and bounded retries.
5. [ ] Validate with backend DTO constraints; map 400/401/403/404/409/422 and network/timeouts to field/page UX. Never claim success before response.
6. [ ] Mutations require pending state, double-submit prevention, actual idempotency only on decorated routes, stable retry key for uncertain financial writes, and explicit invalidation matrix.
7. [ ] Implement loading skeleton, empty state, error+retry, permission denied, disconnected/stale state and correct no-results behavior.
8. [ ] Verify exact authorized tenant and branch; changing user/business/branch must not show last scope's data or checkout against stale branch.
9. [ ] Keep pixels/layout close to screenshots on desktop and sensible on mobile. Avoid unnecessary visual redesign; snapshot before/after.
10. [ ] Test success, validation failure, unauthorized, forbidden, cross-tenant, empty, cache reuse, stale value, mutation retry, and disconnect/reconnect.
11. [ ] Remove applicable static fixtures from **production code path** only after real integration passes; mock fixtures remain for tests/story demos only.
12. [ ] Update `docs/FRONTEND_INTEGRATION_PROGRESS.md`, gap register, API coverage table and exact validation results. Stop after phase.

### Mutation cache dependency examples (minimum)

| Mutation | Required query invalidation / refresh |
|---|---|
| Business create/update/delete | owned businesses, business detail, branch chooser; validate/rehome active scope |
| Branch create/update/delete | locations, selected location, scoped stock/variant/register if branch changed |
| Category CRUD | categories, dependent product/variant filters and display category names, category KPIs |
| Product CRUD | products, product detail, variants/product card groups when needed, catalog KPIs |
| Variant CRUD | variants, parent product detail, grouped register cards, branch stock/valuation, catalog KPIs |
| Variant stock adjustment | branch variant inventory, register cards, category/stock KPI; other branches not falsely modified |
| Checkout (`/orders/catalog`) | orders, register stock/variants, dashboard/report KPIs, active shift figures, receipt status |
| Custom checkout | orders, dashboard/report KPIs, active shift; **not** catalog stock |
| Refund | matching order/history, branch stock if catalog refund, dashboard/reports and shift cash measures |
| Shift open/close | active shift, shift history, top-bar status and relevant dashboard telemetry |
| Cashier change/status | staff, branch assignment display, payroll summaries; cancel invalid current user session if relevant |
| Advances/payroll | advance list+summary, payroll list+summary+history, relevant salary dashboard; sensitive role isolation |
| Expense | expense list/summary, relevant financial/report aggregates only when backend includes them |

---
## 5. PHASE-BY-PHASE COPY-READY IMPLEMENTATION PROMPTS

**Using these prompts:** Open the current frontend repository with the backend repository available read-only for API reference. Give the agent ONE numbered prompt below. The guide and this plan are already in frontend `docs/`. Each prompt inherits all nonnegotiables in §§1–4, 6–9. Unless the phase explicitly states otherwise: do not alter backend code; implement no future phases; preserve screenshots; show the final phase audit and STOP.

### PHASE 0 — Shared API foundation, storage boundaries, baseline

**Prompt to paste to coding agent:**

> **TASK: SunTech POS frontend Phase 0 ONLY.** Read `docs/frontend-api-integration-plan.md`, `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`, `AGENTS.md`, and backend controllers/DTOs. Inspect actual frontend providers/hooks/redux APIs, `src/lib/api-client.ts`, `src/lib/auth-cookie.ts`, `src/proxy.ts`, existing `/admin` and `/pos` routes. Capture current screenshots and component proportions as a baseline. Prepare infrastructure for progressive online integration and future IndexedDB PWA; do not activate business feature endpoints, rewrite UI or implement Phase 1.
>
> 1. Inventory ALL production mock imports by screen and form. Mark `REAL`, `MOCK`, `NOT_SUPPORTED`, and `BLOCKED` in `docs/FRONTEND_INTEGRATION_PROGRESS.md`. Map each current visible UI button to backend endpoint plus dependencies and confirm absence of unsupported endpoints.
> 2. Consolidate the HTTP transport. Design one authenticated same-origin browser → Next BFF/reverse-proxy → backend strategy so Next can safely use session cookies. Check real backend `Set-Cookie` names/path/SameSite/CORS and JWT cookie extraction before implementing proxy handlers. Do NOT expose tokens to client storage, `document.cookie`, Next public env vars or service-worker cache. Put base URL in server env; do not hardcode ports. Implement envelope unwrap for JSON and raw blob response for exports, normalized error mapping, abort signals, retries safe-by-default, request diagnostics only without secrets.
> 3. Write a **cookie topology decision record** showing dev and production browser/frontend/backend origins, how login/refresh/logout cookies are set/forwarded, how `src/proxy.ts` will recognize a verified session and how CSRF is mitigated. If topology cannot be verified, record a Phase 1 blocker rather than silently falling back to a readable role cookie.
> 4. Audit TanStack Query v5 configuration and custom Redux API wrapper. Choose **one** server-state owner; retain Redux for UI/cart if useful. Implement/query-key factory with user + business + location + filter dimensions; define enabled prerequisites, default stale/gc times, focus/reconnect policy, dedupe/abort, scoped invalidation helpers and error mapping. Do not fetch unrelated resources at root layout.
> 5. Create a typed `tenant-preferences` adapter for **nonsensitive localStorage** values (`selectedBusinessId`, `selectedLocationId`, sidebar/filter/page size) with versioned user-scoped keys, SSR safety and cross-tab events. Do not store auth tokens/refresh tokens in localStorage. No IndexedDB implementation yet; define separate durable offline store interface contract for Phase 13.
> 6. Identify and document the insecure `|| true` preview bypass, JS-readable `suntech_token` cookies, localStorage JWT, blanket idempotency injection, bad frontend endpoint declarations, and any duplicate token/session sources. Changes that affect logged-in routing may be deferred to Phase 1 so current mock pages stay testable in development ONLY; production must never silently allow preview.
> 7. Define data-source boundary `ApiDTO → mapper → ViewModel → existing UI` and a consistent feature-hook API. Preserve existing snapshots/cards, dialogs/tables, role-aware layouts and static examples until their phase. Add unit tests for scope keys, storage parser and API envelope/error handling.
>
> **EXIT GATE:** Typecheck, lint, build (actual commands/output), UI baseline documented, code/contract discrepancies recorded, session/cookie topology specified, no unintended business-screen redesign. Deliver a Phase 0 report with files changed, mocks remaining and Phase 1 prerequisites. **STOP.**

**Do not call `GET /users/me` as a universal page bootstrap in Phase 0.** It is only one potential authenticated identity recovery endpoint. Tokens must remain HttpOnly as set by backend or safely reissued by the selected same-origin architecture.

### PHASE 1 — Real authentication, cookies, session, RBAC and sidebar

**Prompt to paste to coding agent:**

> **TASK: Phase 1 ONLY — authenticate real users and eliminate static role switching.** Read docs, Phase 0 handoff and actual backend `auth.controller.ts`, `auth.service.ts`, `login.dto.ts`, cookie paths, JWT guard, user public profile and roles. Keep existing login UI styling and Admin/Cashier sidebar appearance.
>
> **Flow A, Admin login:** Existing login form sends `POST /auth/login` with `{loginType:'ADMIN',email,password}`. Read returned `user.role`; route `ADMIN` to existing Admin business selector or authorized dashboard, `SUPER_ADMIN` to a role-appropriate platform landing (create minimal role-safe page if current UI lacks it; do not grant Admin-only APIs by assumption). No role is chosen by dummy sidebar toggle.
>
> **Flow B, Cashier login:** Form sends `{loginType:'BUSINESS_USER',publicId,password}`. Route a successful `CASHIER` to Cashier workspace (existing `/pos/custom-sale` or designated register entry), showing backend-returned assigned business/branch. Reject wrong/disabled login through real backend error messages.
>
> **Cookies:** use Phase 0 verified same-origin Next session/BFF setup. Backend already issues HttpOnly access/refresh cookies. Do NOT write JWT into `suntech_token` JS cookie, Redux persistence, localStorage, IndexedDB or logs. Carry login `user` into in-memory identity state; if server route gating needs a role, use tamper-resistant server-validated data, never an editable `suntech_role` cookie. Evaluate `Secure`, `SameSite`, CSRF and exact cookie `Path` on refresh/logout. Ensure server-side verification on protected routes; simply cookie presence is not proof.
>
> **Flow C, session restoration:** on browser reload rehydrate trusted user/session via the least chatty **server-verifiable** method supported by the topology (signed session / refresh / targeted `/users/me` ONLY when necessary), with a loading shell to prevent protected-content flash. Do not call `/users/me` per route, sidebar render or API request. Implement deduplicated `POST /auth/refresh` after an appropriate 401, one safe original-request retry, no infinite refresh loops, and correct handling of long disconnection. Token expiry while offline is NOT successful server auth.
>
> **Flow D, RBAC:** remove `|| true` bypass in `src/proxy.ts` and remove all static role-selection test UI from authenticated sidebar. Implement server and client route gates for `/admin/*`, `/pos/*`, any SUPER_ADMIN screens and login redirect. Render menu items by actual `user.role`; never let CASHIER see cost, margin, payroll or admin controls. Respect real backend role guards, including SUPER_ADMIN restrictions. Anonymous route → login; wrong role → authorized home/403; no redirect loops.
>
> **Flow E, logout:** invoke `POST /auth/logout`; clear both server cookies using appropriate path; purge React Query private caches, auth state, short-lived cart/tenant UI hints as policy permits; redirect login. If disconnected, do not falsely assert server-side revocation; mark locally signed out and retry revocation when feasible. Prevent old identity data leaking to next login.
>
> **Related UI/API:** public register, forgot password, OTP verify and reset endpoints may be wired to their existing auth screens if necessary for complete authentication UX, but do not add unrelated modules. Use actual DTO requirements. Profile image/display name use server-provided user fields; `GET /users/me` is fallback/recovery only.
>
> **TEST:** Admin valid/invalid, Cashier publicId valid/invalid, Super Admin special routing, pending/suspended user, refresh/reopen browser, expired cookie, three concurrent 401s → one refresh, offline/reconnect, cookie origin/path in DevTools, anonymous deep link, tampered role/tenant preference, logout/account switch, no repeated `/users/me`, 403 protections. Typecheck/lint/build and auth E2E. Report verified calls, request counts, remaining gaps, and STOP.

**Critical security gate:** if Next cannot read cookies because backend and app are separate hosts, **implement/verify a same-origin BFF/proxy first**; do not invent a JS-accessible role/token workaround.

### PHASE 2 — Tenant/business/branch flows + localStorage preferences

**Prompt to paste to coding agent:**

> **TASK: Phase 2 ONLY — implement real business and location selection/management.** Read backend `tenant.controller.ts`, `CreateBusinessDto`, `CreateLocationDto`, update DTOs and ownership rules. Read `src/features/tenant/components/business-branch-hub.tsx`, tenant hooks, Redux/context, sidebar/header, `/admin/select-business` and user screenshots. Preserve existing business cards, two-step Businesses → Branches chooser, creation panel, blue sidebar context and branch switching UX.
>
> **ADMIN flow:** After Phase 1 login, call **once/cached** `GET /tenant/businesses`; map actual businesses to current cards. Selecting one writes a **user-scoped** `selectedBusinessId` to localStorage. Then `GET /tenant/locations?businessId=<selected>`; map branches, select validated `locationId`, persist under user+business namespace. Restoring selections requires verifying membership in fetched owned business/branch list, not blindly trusting localStorage. If business has zero branches, show creation/empty state; do not fabricate a branch. If no business, show create state.
>
> **CRUD:** create business with `POST /tenant/business` actual body (`name`); edit/delete via `/tenant/businesses/:id`; use `GET /tenant/business` when detailed profile is needed. Branch create/edit/delete via `/tenant/locations`; inspect DTO fields, including whether screen's manager, code, online/offline toggle, initial float, city, plan, etc. are truly accepted. Keep backend-supported fields; label or defer unsupported mock controls rather than persist fake values. Get business/branch profile images only through actual upload endpoints if screen needs them.
>
> **Switching scope:** on business switch, invalidate/rehome affected queries, validate next branch, cancel stale requests, reset unrelated filters, clear or explicitly preserve cart drafts within their **original scope only**, and update top bar/sidebar. On branch switch, all inventory/variant prices/stock/search, shift, orders, reports and register checkout must use new branch. Never contaminate caches. Show a switch warning for nonempty cart or pending offline queue.
>
> **CASHIER flow:** derive assigned business/location from login-returned identity and backend `GET /tenant/business` / `GET /tenant/locations` only when details are missing or needed. No editable branch/business selector. Verify `user.role`/assignment consistency; server handles authorization.
>
> **Cache:** businesses 5–15min, locations 5–15min (initial values), user-scoped hierarchical keys; invalidate lists/details on mutations; revalidate on reconnect/switch. Use `enabled` for `businessId`. LocalStorage for IDs and harmless UI preferences only, not credentials or sensitive catalog datasets.
>
> **TEST:** multiple businesses with overlapping branch names, zero branches, wrong/removed business ID in localStorage, cashier unable to alter assignment, create/update/delete, refresh/restoration, branch switch with open cart, stale response race, account switch, throttled/failed network. Keep mock-free tenant flow; run checks and STOP.

### PHASE 3 — Category → Product → Variant real CRUD (description + first variant)

**Prompt to paste to coding agent:**

> **TASK: Phase 3 ONLY — replace Catalog & Inventory mock catalog relationships with actual backend hierarchy.** Read `category/product/variant` controllers, query DTOs, create/update DTOs and Prisma. Preserve current `/admin/catalog` table, its metric-card footprint, category filter, search control, Category/Product/Add variant buttons, dialog treatment, table rows, BDT formatting and sidebar.
>
> **Listing dependency graph:** authorized business scope → `GET /catalog/categories` + `GET /catalog/products` + `GET /catalog/variants` (parallel where independent; with `locationId` when branch stock needed). Display names from cached categories; category dropdown/pills use `name` but send **`categoryId`**. Product filters may use `categoryId`; variants may use `categoryId`,`productId`,`search`,`locationId`,`businessId`,`lowStockOnly`. Products and variants GETs currently lack server page/limit DTOs; paginate the in-memory scoped array for the existing table. Use debounce search, one cache entry per scope/filter, no unnecessary per-row detail fetch.
>
> **Category CRUD:** current modal → `POST /catalog/categories` with actual DTO; edit `PATCH /catalog/categories/:id`; delete `DELETE /catalog/categories/:id` after warning on children/business consequences. Invalidate category/product/variant display names and category KPIs; validate uniqueness/409.
>
> **New Product workflow (NONNEGOTIABLE):** replace simple Product modal with an appropriately compact **two-step Product Details → First Variant** wizard; add `description` text area (max 500), name, optional category and supported custom attributes. User cannot click final **Complete Product** until ≥1 valid variant exists. Step 1 `POST /catalog/products` creates a parent with `{name,description,categoryId?,businessId?,customAttributes?}`. Step 2 `POST /catalog/variants` creates first variant with `{productId,name,sku?,barcode?,sellingPrice,costPrice?,stock?,locationId?,businessId?}`. Backend provides two separate calls, NOT an atomic transaction: retain created parent ID and draft progress after Step 1, disable duplicates, retry only Step 2 on failure, show `Finish variant setup` state; never issue the first POST again on retry. After success show parent + variant correctly in list/register. If user closes wizard after parent created, offer resume/reopen and label it incomplete for POS UX. Don't invent `POST /catalog/products/with-variant`.
>
> **Edit Product:** include name, description, category, attributes from backend; changing category updates cached labels/filter membership. **Edit Variant:** choose real parent product; variant belongs to `productId`, not directly to category; support SKU, barcode, selling price, cost price (ADMIN), activation per update DTO. Add variant for existing product should first use cached categories/products, allow product selection, then POST variant. Do not accidentally duplicate products. Delete semantics must match backend soft-delete/deactivation and referential rules.
>
> **View-model:** separate `Product`, `Variant` DTOs and UI rows; table can keep one row per variant, grouped-card register is implemented in Phase 7. Never assign product parent a fake single price or stock. CategoryId belongs to Product, variant price/SKU to Variant, branch stock to location context. Variant image belongs to variant (Phase 4). Handle uncategorized products safely.
>
> **Cache:** category mutation invalidates categories and affected product/variant views; product mutation invalidates products, associated variants/register groups and KPIs; variant mutation invalidates variants, parent products, register derived groups/branch stock and valuation widgets. Prevent stale responses for old business/branch. Keep offline persistence out of this phase but define reusable DTO/view-model serialization.
>
> **TEST:** create category → product with description → first variant → filter by category → edit/delete/retire; failed first variant creation then resume without duplicate parent; two variants under same product; variant linked to selected product ID; category names loaded from GET and sent as `categoryId`; validation/409; branch-specific stock from correct scope; Cashier cannot CRUD; no preview mock success. Preserve screenshots and run typecheck/lint/build plus E2E. STOP.

**Design gate:** “minimum one variant” is a **frontend creation-flow requirement**, not a backend database invariant. Ensure partial success is recoverable; do not describe it as atomic unless server later supplies a combined transactional endpoint.

### PHASE 4 — Inventory adjustments, variant images, stock-sensitive UI

**Prompt to paste to coding agent:**

> **TASK: Phase 4 ONLY — complete real branch inventory and variant media.** Read backend `UpdateVariantStockDto`, `variant.controller.ts`, `variant-image.controller.ts` and services. Preserve the existing **Stock adjustment** and Variant Edit dialogs and catalog metric cards. Use selected authorized ADMIN business and branch from Phase 2; if scope is absent, show existing tenant-required state.
>
> **Reads:** cached `GET /catalog/variants?businessId=&locationId=` with products/categories lookups for labels; obtain `GET /catalog/variants/:id?businessId=&locationId=` only when a detail/edit panel needs fresh item information. Display **branch stock** for active location, not company-wide stock unless label explicitly says total; adapt summary `Units on hand`/inventory valuation using server-provided aggregates if exposed, otherwise compute from authorized scoped data with proper attribution. Correct `lowStockOnly` semantics against backend implementation.
>
> **Stock action:** current UI's “New quantity” is an absolute set operation; map it to `PATCH /catalog/variants/:id/stock` with `operation:SET` and actual `stock`/`locationId` DTO semantics. For add/deduct UX use backend-supported `operation`, `quantity` or `delta` correctly; show note/reason where supported. Validate integer >=0 unless backend explicitly supports authorized negative stock. Confirm response, then invalidate the correct branch variant/stock, register, category/valuation metrics. Never show fake save-success toast.
>
> **Images:** use variant profile image upload/remove and image-gallery list/add/remove endpoints `/variants/:variantId/profile-image` and `/variants/:variantId/images`; inspect multipart file field and allowed file constraints. Update variant image URL view-model and current product/register cards without changing image crop or sizes. Use placeholder only when server has no image; avoid shipping repeated demo stock photo for live products.
>
> **Scope & concurrency:** price/stock data may become stale after cashier checkout or another admin adjustment. Do not pretend local totals are authoritative for sale. Refetch/invalidate on transaction outcomes and ensure branch A adjustment never overwrites branch B. If backend returns conflict/stock validation, preserve form input and show server message.
>
> **TEST:** set/add/deduct across 2 branches, low-stock variants, invalid negative qty, image upload/remove, empty images, failed upload retry, unauthorized CASHIER, variant disabled, metrics invalidate, subsequent register sees changed stock. Typecheck/lint/build/E2E and STOP.

---
### PHASE 5 — Staff, cashier account management and assignment

**Prompt to paste to coding agent:**

> **TASK: Phase 5 ONLY — real Admin staff/cashier screens.** Inspect `src/features/hr/components/staff-manager.tsx`, real `src/users/user.controller.ts` and cashier DTOs/queries, plus relevant tenant/branch lookups. Keep the existing **Staff & Cashier Accounts** table, search, status badges, action ellipsis, Create Cashier button and typography.
>
> **Dependency:** authenticated ADMIN + selected authorized business → branch list `GET /tenant/locations?businessId=` for assignment selectors → `GET /users/cashiers` with actual business/search/status filters from `ListCashiersQueryDto`. Display real `publicId`, name, email/phone if returned, assigned branch name by ID→branch lookup, salary only where ADMIN API and DTO authorize it, status. Do not invent persisted manager/commission fields from dummy records.
>
> **Create:** Form maps exact `CreateCashierDto` → `POST /users/cashiers` (name, credentials/assignment/salary only as allowed). Branch selector sourced from real locations. Show generated publicId/credentials safely as backend supports; never expose or cache plaintext passwords after flow. Update staff list and relevant roster counts.
>
> **Edit/activate/suspend/delete:** use `PATCH /users/cashiers/:id`, `PATCH /users/:id/status`, `DELETE /users/cashiers/:id`; verify status enums and role rules. Account suspension must not be represented by merely hiding UI; backend remains final enforcer. Delete needs confirmation, correct severed assignment UX, query invalidation and accurate status response. User/avatar image operations only if supported and needed.
>
> **Cache:** branch lookups reused; staff query keys include business/filter; invalidate staff and dependent branch-roster/payroll displays on mutation; user account changes require revalidating matching active cashier session when online as policy permits. No sensitive salary/identity persistence in localStorage/IndexedDB, do not expose Admin details to CASHIER. Infinite retries or `GET /users/me` on every staff interaction prohibited.
>
> **TEST:** create cashier in branch A, switch assignment branch B, search by publicId/name, activate/suspend/delete, invalid field/409, multi-business isolation, Cashier 403 on staff APIs, payroll data not leaked, offline read-only banner, unchanged table visuals, refresh cache, typecheck/lint/build. STOP.

### PHASE 6 — Shifts, active shift chip and cash behavior boundaries

**Prompt to paste to coding agent:**

> **TASK: Phase 6 ONLY — integrate shift management and status.** Read actual `shifts/shift.controller.ts`, `OpenShiftDto`, `CloseShiftDto`, `ListShiftsQueryDto`, and service behavior, plus existing `src/features/shifts/**`, `/pos/shifts`, Admin/Cashier header. Preserve the screenshot's Shift Operations sections, metrics, open/close buttons and compact top-bar shift status.
>
> **Reads:** scoped `GET /shifts/active` and `GET /shifts` only once per relevant screen/branch/cache freshness. Derive `OPEN`, opening float and displayed telemetry from backend values; don't show mock Alex Rivera shift or false Admin shift. A Cashier uses assigned branch; ADMIN uses authorized selected branch per controller DTO/query support.
>
> **Open:** `POST /shifts/open` with `startingAmount` (not mock `openingFloat`) and optional backend-permitted `locationId`, `autoClosePrevious` only when intended. Use `Idempotency-Key` because endpoint is decorated; reuse same key for retry of the SAME opening attempt. Invalidate active+history/dashboard telemetry and refresh top bar. Support backend auto-close rules and conflicts.
>
> **Close:** `POST /shifts/close` or `POST /shifts/:id/close` (choose based on actual flow) with `closingAmount` and optional notes. Show backend expected cash/variance if provided; no invented drawer accounting. Invalidate shift list, active, and relevant dashboard. Handle auto-closed/expired shifts gracefully.
>
> **Cash actions boundary:** the screenshot includes **Record cash-out** / advances, while backend has cashier advance and expense concepts **not necessarily a generic drawer cash-out route**. Inspect semantics carefully; connect supported feature to correct API only if equivalent, otherwise display an honest disabled/labelled pending control and add a gap. Never create a fake local ledger and imply server bookkeeping. `shiftId` is **optional** in catalog/custom checkout; do not block sales just because no shift is open.
>
> **Offline prep:** a live shift cannot be opened/closed on backend while disconnected; mark operations blocked/queued only if a future approved sync contract exists. Do not enqueue unsupported shift mutations as `orders/sync`.
>
> **TEST:** open→active→close→history, real starting/closing amount, optional shiftless checkout works later, multiple branches, repeat-click/idempotency, auto-close edge case, conditional cash-action mismatch, 401/403, stale status, UI screenshot parity, typecheck/lint/build. STOP.

### PHASE 7 — Catalog Register: compact product cards, VARIANT selector, real checkout

**Prompt to paste to coding agent:**

> **TASK: Phase 7 ONLY — real Catalog Register for ADMIN and CASHIER; utmost UI preservation required.** Inspect `src/features/pos/components/terminal-workspace.tsx`, `src/features/pos/api/use-pos.ts`, `src/features/pos/view-models.ts`, both `/admin/terminal` and `/pos/terminal`, screenshots, and backend `catalog` + `orders/catalog` DTO/service. The backend sells **variant IDs**, not product IDs. Preserve the **current screenshot’s four-column desktop card grid**, card width, `aspect-[4/3]` image, near-current overall card height, price/stock line, right-side fixed Current Ticket panel, category pills, search, header chips, payment options and blue checkout button.
>
> **Fetch graph:** Auth + correct business/branch → `GET /catalog/categories` (pills; name displayed, `categoryId` passed) and `GET /catalog/products` + `GET /catalog/variants` with selected business/location; no need for one detail request per card. Filter by category UUID (backend), name/SKU/barcode and availability; debounced searches. Fetch `GET /shifts/active` only if absent/stale in cached shift scope; shift is optional. CASHIER scope comes exclusively from authenticated assignment; ADMIN from validated localStorage selection.
>
> **Group product cards:** Convert flat variant results to **one card per productId**. Preserve original item image position and card size. Inside existing card detail space add a **small single-line variant Select** (or compact dropdown) that doesn't expand card height/width; reduce vertical padding/gaps very slightly as needed, not image size. Keep `xl:grid-cols-4`, previous card min-width and right ticket width. Card names map to Product; selector options map to Variant name (and SKU if compact). When user switches option update variant-specific display image, price, stock, SKU and availability immediately from cached variants. In product with exactly one variant, show a compact fixed variant line or consistent selector; in product with no ACTIVE variants, disable Add to Cart with meaningful tooltip/state. If variant count is large, dropdown remains accessible without altering card grid.
>
> **Interaction safety:** do not nest a clickable `<select>` within a `<button>` wrapping the whole card. Use `<article>`/`div` card with separate Add button/image hit target; keyboard/screen reader label for variant selector. Selector change must NOT add to cart unintentionally. Clicking Add uses the **currently selected** variant's `{variantId,sku,unitPrice,stock,image}`. Same product can appear multiple times in cart if variants differ. Cart key = `variantId`; quantity increments capped/warned by branch stock and revalidated at checkout. Switching variant does not mutate an existing cart line's ID. Barcode search/keyboard hook resolves unique variant SKU/barcode; when multiple matches, ask for selection rather than picking wrong ID.
>
> **Cart/held tickets:** keep sidebar as pictured. Quantity +/- uses variant ID, subtotal preview integer BDT, currency and payment labels exact. Hold ticket currently exists only in memory; optionally persist **draft** per user+business+location in localStorage online, explicitly `DRAFT NOT ORDER`, restore safely and warn on tenant change. Phase 13 upgrades durable unsynced sales to IndexedDB. Do not send `orders/sync` here.
>
> **Checkout:** `POST /orders/catalog` with backend DTO: `lines:[{variantId,quantity,unitPrice}]`, `tenderedAmount`, `paymentMethod` one of `COD,BKASH,NAGAD,BANK`, optional `customerName/Phone/notes`, ADMIN `businessId/locationId`, optional `shiftId` ONLY when available. Require tender field if DTO demands it; UI checkout may need a **compact tendered-amount input** in existing sidebar/dialog (not a wholesale redesign). Use server-reported invoice, totals/change; warn if cached price differs or stock validation changes. Never use `/orders/custom` to sell an existing variant, nor `/orders` compatibility route. Prevent duplicate clicks, persist one idempotency key for each logical attempt and reuse for ambiguous network retries. No optimistic 'Paid' before backend confirmation.
>
> **Invalidate:** successful sale → scoped variants/stock, product cards, orders, reports/dashboard, active shift metrics as applicable. Cart clears only after confirmed sale, not after failed/unknown outcome; uncertain request shows `VERIFYING`/recovery rather than firing new order automatically. Offline before Phase 13: show blocked or draft-only checkout, **never fake success**. Receipt from backend response; label any print-only browser output correctly, do not pretend printer bridge works if it doesn't.
>
> **TEST:** product P has 3 variants with 3 prices/stock levels and 3 SKUs; select one then add correct `variantId`; change selector updates image/price/stock within SAME SIZE CARD; multiple variants of same product can coexist; zero-stock disabled; cashier role can't see costs; business/branch switch clears incompatible cart; category filters use real IDs; barcode returns right variant; payment enum/tender right; shiftless checkout accepted; duplicate click/timed-out retry one order; price conflict; order success invalidates stock and dashboard. Screenshot/viewport comparison mandatory. Typecheck/lint/build/E2E, STOP.

**Specific measured visual acceptance:** show before/after screenshots of 1366–1720px desktop width; confirm four card columns at `xl`, unchanged `aspect-[4/3]`, near-original total card height, right ticket stays aligned, no card overflow or grid shift. A selector that makes cards substantially taller **fails** Phase 7.

### PHASE 8 — Quick Custom Sale: free-form lines, no catalog stock deduction

**Prompt to paste to coding agent:**

> **TASK: Phase 8 ONLY — fully wire existing Admin and Cashier Quick Custom Sale flows.** Inspect `/admin/custom-sale`, `/pos/custom-sale`, `custom-sale-view.tsx`, `custom-item-dialog.tsx`, `checkout-dialog.tsx`, backend `orders/custom` DTO/service. Preserve compact current UI and distinguish from Catalog Register.
>
> **Scope dependency:** authenticated role, correct business/location and optionally cached active shift. This flow **does not** need category/product/variant lookups unless the existing UI explicitly offers optional price references; custom lines are typed independent of catalog. Do not invent a `variantId` for a custom item or deduct catalog stock.
>
> **Form:** add/edit/remove custom line with `productName`, optional `variantName`, `quantity` positive integer and `unitPrice` nonnegative integer BDT. Validate customer name/phone/notes, payment method enum, `tenderedAmount`, totals and change preview with backend-correct rules. Use `POST /orders/custom`; ADMIN scope in body only as DTO permits, CASHIER assignment server-locked, `shiftId` optional.
>
> **Mutation:** one stable `Idempotency-Key` per logical sale, disable double-submit, handle timeout/unknown final state and server authoritative totals; never show 'Mock checkout' on success. Invalidate orders, dashboard/reports, active shift metrics; do **not** invalidate variant inventory unnecessarily. Render backend invoice/receipt in existing modal; print fallback labelled honestly.
>
> **Offline:** before Phase 13 no fake offline sale; retain draft safely. Later custom sale joins same durable offline queue with type `CUSTOM` and cached price/name snapshot using backend sync DTO.
>
> **TEST:** multiple custom lines, 0/negative invalid, cash tender/change, Cashier/Admin tenant scope, no variant stock changed, optional shift, duplicate prevention, timeout recovery, real receipt and order history presence; visual parity, typecheck/lint/build/E2E. STOP.

### PHASE 9 — Orders, filtering, details, refunds, print/receipt

**Prompt to paste to coding agent:**

> **TASK: Phase 9 ONLY — real Register Tickets/Order History for Cashier and relevant Admin views, including refund actions.** Inspect `/pos/orders`, `GET /orders` query DTO, order selects, refund controller/DTO and existing ellipsis menu. Preserve current search/filter row, list density, status badges, payment columns, pagination and View details / Refund action menu.
>
> **Load:** `GET /orders` with backend-supported search, status, payment, type, date, business/location and page/limit parameters EXACTLY as defined in `GetOrdersQueryDto`. Search/debounce; use server paging when provided. Keep branch/business scope: CASHIER only assigned scope; ADMIN only validated owned business/branch. Map invoice, customer, lines, payment, status, amount, timestamps and type from actual response. Do not infer unreturned fields from a dummy order. Reuse returned nested line/order data for detail drawer when present.
>
> **Important endpoint limit:** inspected `order.controller.ts` has **NO** `GET /orders/:id`; frontend declaration `getOrderById` must not be called as if it exists. For **View details**, read matching order object from cached paginated list and any nested detail data the list actually includes; if missing essential fields, document **BACKEND GAP: order detail endpoint** and show only real available fields rather than fabricate. If order no longer in cache and no supported detail API, offer list search/refetch recovery, not an invented call.
>
> **Refund:** `POST /orders/:id/refunds` with exact `CreateRefundDto`, actual order item IDs, permitted quantities and amount constraints; support partial/full as backend allows, confirmation, reasons/notes per DTO, stable idempotency key per attempt. Role check uses real refund guard (ADMIN and CASHIER in inspected controller), not old README. Mark refunded after backend confirmation, invalidate order list/item, dashboard/transactions, stock for catalog returned goods and shift numbers if affected. Report double refund/conflict/error honestly.
>
> **Receipts:** display original backend invoice and line items, refunded state, tender/payment information. Browser print can be done with accurate print markup, but don't claim cash-drawer printer support without actual bridge. Preserve UI and add a compact detail overlay if needed.
>
> **Cache/offline:** query key includes user/role/business/location/filter/page. On reconnect invalidate pages affected by synced orders; provisional offline receipts must be distinguished from confirmed invoices. Do not store other users' order history in localStorage. Avoid polling.
>
> **TEST:** catalog/custom history, cash/bKash/Nagad/Bank, date/status filters, server pagination, view details from real list, absent detail endpoint behavior, partial/full refund, already refunded/too-large invalid, Cashier authorized vs cross-business forbidden, retry idempotency, stock/report revalidation, 404/401/403, skeleton and screenshot parity, typecheck/lint/build/E2E. STOP.

---
### PHASE 10 — Dashboard analytics, transaction reports and real exports

**Prompt to paste to coding agent:**

> **TASK: Phase 10 ONLY — replace dashboard/reports mock values with backend metrics and real exports.** Inspect Admin `/admin/dashboard`, `/admin/reports`, report hooks/view-models and controller/query DTOs `reports/dashboard`, `reports/analytics`, `reports/transactions`, `reports/export`. Preserve screenshot's four KPI cards, recent terminal tickets, active shift telemetry, category progress bars, Daily/Weekly/Monthly/Quarterly segmented control, payment breakdown, transaction table and Export CSV/PDF buttons.
>
> **Dependency:** verified admin + selected owned business/branch; reuse cached business/branch labels. Load `GET /reports/dashboard` for supported time/scope; Admin-only `GET /reports/analytics` and `GET /reports/transactions` with respective backend-supported filters. If role CASHIER has only `dashboard` access, show only permitted metrics rather than calling forbidden report endpoints. Do not expose gross-margin/wholesale cost to unauthorized CASHIER.
>
> **Metrics:** map backend values exactly, with labels matching the statistic; e.g. gross sales vs net sales vs refunded amounts should not be interchangeable. Use correct BDT integer display and date boundaries (backend uses Asia/Dhaka for shift rules). Build category performance/payment breakdown only from actual aggregates. Do not invent daily/weekly/monthly/quarterly query parameters: inspect DTO; if unsupported, translate UI range into valid query fields or clearly label unsupported intervals. If no aggregate exists, note gap rather than reuse random fixtures.
>
> **Transactions:** `GET /reports/transactions` with exact search/date/status/location/page/limit DTO, no static rows, working pagination and error states. Ensure report data and order list not double-requested unnecessarily when their data can legitimately be reused; do not misuse one endpoint to fabricate fields the other does not return. Active shift card may reuse `GET /shifts/active` cache without extra duplicate fetch.
>
> **Exports:** `GET /reports/export?type=sales|payroll&format=csv|pdf&month=1..12&year=YYYY[&locationId][&businessId][&search]` per backend enum casing. Export response is blob/attachment, **not** `{success,data}` JSON. Parse `Content-Disposition` safely, choose correct MIME/extension; download via user click, show pending/error. Current `Daily` or arbitrary date-range selector may not map directly to required **month/year** export; either offer supported month selection or clearly explain the limit, not fake a date-specific export.
>
> **Cache:** query keys include scope/period/filters, stale 1–5m as initial guideline, invalidate on checkout/refund/shift/payroll as relevant. Cached metrics shown with last-updated stamp when disconnected; never present stale as live. TanStack dedupe and parallel widgets. No confidential reports in localStorage/service-worker caches.
>
> **TEST:** totals match seeded backend orders, category data names from backend, payment proportions, period mapping, Admin vs Cashier restrictions, two-branch switching, refund updates KPI, XLS? no — only CSV/PDF supported; export file signature/content length/name, offline export disabled, table search/page, negative/error/empty states, screenshot parity, typecheck/lint/build/E2E. STOP.

### PHASE 11 — Payroll, salary advances, disbursement and HR visibility

**Prompt to paste to coding agent:**

> **TASK: Phase 11 ONLY — real HR/payroll/advances.** Inspect backend payroll, advance controllers, DTOs/services including dates/timezone, permissions and idempotency. Inspect existing `/admin/payroll`, `src/features/hr/components/payroll-manager.tsx`, Staff roster and Cashier screens to locate advances requests. Preserve Payroll & Advances segmented tabs, KPI cards, employee table, status pills, Process Payroll action and typography.
>
> **Dependencies:** verified ADMIN + selected owned business and staff/cache; `GET /users/cashiers` for employee labels/IDs if payroll DTO omits them; `GET /payroll/summary`, `GET /payroll`, `GET /payroll/history` with valid period/query fields; `GET /advances` and `GET /advances/summary` for advances and deductions. Do not infer salary total from mocked employee rows. Use employee `id` vs `publicId` correctly; backend ownership of salaries and payroll period authoritative.
>
> **Advance:** backend `POST /advances` is **CASHIER-only** for requesting an advance, while `GET /advances`/summary serve ADMIN/CASHIER under scope and `DELETE /advances/:id` is ADMIN. Offer a small Cashier advance-request view if missing; Admin can view/review or delete only as the actual backend supports. Do not invent an approval endpoint or draw-cash action. Wire request body to `CreateAdvanceDto` and unique idempotency key per logical request.
>
> **Payroll process/disburse:** `POST /payroll/process`, `POST /payroll/disburse` with exact `ProcessPayrollDto` / `DisbursePayrollDto`; preserve distinct actions/period and statuses, respect double-pay constraints. Use persisted stable idempotency key per operation; no new key on uncertain retry. Dashboard salary metrics, balances and advance deductions must come from backend responses. Handle pending vs processed vs disbursed states honestly; update paid/unpaid action enabled state.
>
> **Security/cache:** ADMIN-only routes and salaries; CASHIER sees only fields expressly returned for their own advances. Query keys user/business/period; avoid sensitive HR persistence in localStorage, query persist plugin or service worker. Invalidate payroll list+summary+history, advances list+summary and Staff salary badges when corresponding mutations succeed. Skip unauthorized calls entirely; no client-only masking as security.
>
> **TEST:** advance request by CASHIER, Admin visibility and authorized delete, month/year boundaries, advance deductions, process/disburse and repeated-click idempotency, suspension/role restrictions, two businesses, payroll export uses `/reports/export` with type payroll, network failure, sensitive data cache isolation, screenshot parity and checks. STOP.

### PHASE 12 — Missing backend-supported UI, platform admin and audit

**Prompt to paste to coding agent:**

> **TASK: Phase 12 ONLY — close verified frontend-vs-backend feature gaps without breaking the existing UI.** Read `docs/frontend-backend-gap-register.md`, progress reports from 0–11, backend controllers/DTOs and screenshots. For each backend-supported feature missing a screen, add the smallest appropriate authorized route/panel/dialog using the existing SunTech design system. Do not rewrite existing screens for aesthetic reasons.
>
> **Expenses:** ADMIN scoped `GET /expenses`, `GET /expenses/summary`, `POST /expenses`, `DELETE /expenses/:id`. Build compact Admin Expenses screen/section with list, filters, create form/validation, totals and delete confirmation; reuse current table/metric card patterns. Do not place Cashier-controlled drawer cash-outs here without backend business-rule equivalence.
>
> **Audit:** ADMIN `GET /audit-logs` and `GET /audit-logs/:id`; build read-only audit list/detail in Admin controls with business/location filters, search/pagination only if actual query supports. No fake audit edits. Sensitive events should not persist to localStorage.
>
> **SUPER_ADMIN:** create a role-specific minimal platform workspace for `GET /admin/users`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/status`; include registration approval/status, fields backend actually returns, and correct role guards. SUPER_ADMIN is not entitled to ADMIN-only tenant/catalog routes by default. Keep a coherent navy sidebar/white card layout and avoid showing Admin's business chooser for unowned shops.
>
> **Profiles/media:** use authenticated user's supported profile image endpoints and business/variant uploads only in screens needing them. Create/update images with correct multipart form-data and error handling; avoid mock upload success.
>
> **Other gaps:** category hierarchy, uncategorized Product representation, soft delete flows, custom attributes, receipts, refund detail, business/location form fields and drawer cash-out mismatches should be checked against backend implementation. For every UI button: wire a supported API or replace with truthful `Unavailable / backend contract missing` explanation, recording controller evidence. Do not invent invoice-detail GET, cash-advance approval or register cash-out route.
>
> **Cache/role:** each new module has query keys including user+scope/filters and targeted invalidation, permission-gated sidebar visibility and error states. Reuse typography/buttons/modals/cards. No auth tokens or confidential audit/HR data stored in localStorage.
>
> **TEST:** entire sidebar to supported screen mapping for all three roles, create/delete expenses and summary updates, audit read/detail/filter, Super Admin approval/status, no privilege crossover, wrong-tenant IDs, upload errors, screenshot/design consistency, typecheck/lint/build/E2E and updated gap register. STOP.

### PHASE 13 — HEAVY offline-first POS / PWA / IndexedDB / sync

**Prompt to paste to coding agent:**

> **TASK: Phase 13 ONLY — implement durable, testable offline-first PWA for SunTech POS.** Read all prior docs/progress, current backend `offline/bootstrap` and `orders/sync` controllers/DTO/services/test cases, JWT/cookie lifetimes, PWA dependencies already in package, Next 16 local/offline rendering behavior. Do NOT change backend implementation. Do not claim seven-day offline authentication can be guaranteed by existing JWT cookies without a separate offline terminal policy. Deliver a **formal offline-threat-and-entitlement decision** before enabling disconnected money collection.
>
> **Prerequisites/security gate:** create explicit device-enrollment and offline operator authorization policy (authorized server-side at last enrollment/refresh; local unlock/PIN if approved; expiry/maximum offline duration; role/branch lock; shared terminal account switching; account suspension/reassignment uncertainty; device loss; local data clearing/backups). If policy or backend support cannot ensure the requested risk level, make offline sell mode opt-in/limited and document unresolved controls; do NOT bypass route guards using localStorage `role`. Online cookie auth remains HttpOnly; service worker **cannot read tokens** and should never cache authenticated responses indiscriminately.
>
> **Durable data model:** introduce versioned IndexedDB stores with schema migrations and atomic transaction boundaries: `device`, `offlineEntitlements` (non-token metadata only), `tenantCatalogSnapshots` (businessId, locationId, generatedAt, categories/products/variants/images references, stock/prices), `carts`, `heldTickets`, `pendingOrders`, `syncAttempts`, `syncOutcomes`, `localReceipts`, `reconciliationIssues`. Partition by `userId`/`businessId`/`locationId`/`deviceId` so multiple business/branch datasets never mix. localStorage remains for harmless UI preferences/selected IDs only. Measure quota, migrations, storage persistence via `navigator.storage.persist()` where available, and private/incognito limitations.
>
> **Bootstrap:** online first login/enrollment → validated branch → `GET /offline/bootstrap` with actual Admin business+location query / Cashier fixed assignment → validate DTO/data freshness → atomically store snapshot in IndexedDB. Include category/product/variant relationships, variant images metadata, branch stock/prices/payment methods and snapshot version/time. Check possible omission of **uncategorized** products in backend's category-rooted bootstrap; if true, record a blocker/mitigation instead of silently losing variants. Refresh changed snapshot when online with atomic replacement; never erase pending orders during catalog refresh.
>
> **App shell:** use installed PWA stack/Next-supported service worker generation, manifest, icons and resilient offline routes. Cache only versioned static JS/CSS/app-shell assets with correct update flow. Private API requests should use network-only or intentionally encrypted/partitioned data access via IndexedDB; never service-worker-cache Set-Cookie, JWTs, payroll, private credentials or unrelated users' responses. Next dynamic SSR pages may fail offline: offer a deliberately offline-capable client terminal shell; test a cold navigate after install without network. Provide offline indicator, snapshot timestamp, pending count, local receipt status, reconnect status and Sync Now.
>
> **Offline catalog register:** reuse SAME compact product card+variant selector created in Phase 7; use chosen location's persisted snapshot if `OFFLINE_DEVICE_AUTHORIZED`. Show stale price/stock warning and last sync time; do not claim real-time stock. Customer cart, held tickets and provisional sale must commit **atomically** to IndexedDB before displaying `Queued locally` confirmation. No network request should be necessary to preserve the sale once approved local entitlement is active. Generate UUIDv4 `clientOrderId` ONCE and stable local receipt number; original occurredAt timestamp and money/line snapshots are immutable after checkout. Avoid storing tickets only in localStorage.
>
> **Sync protocol:** when connected AND server session valid/reestablished via cookie refresh, send up to 100 eligible local orders per `POST /orders/sync` batch with durable `deviceId`, contextual scope, each `{clientOrderId,clientReceiptNumber?,occurredAt,orderType,lines,paymentMethod,tenderedAmount,customer...}` matching exact `SyncOrdersDto`. Preserve immutable UUID and payload on retry; backend deduplicates by `clientOrderId`. `ACCEPTED` / `DUPLICATE` are reconciled to backend order/invoice; `REJECTED` remains a **visible exception requiring manual attention**, never silently dropped. Save each batch/outcome transactionally; handle partial batch, timeout after server commit, browser crash, backoff, authentication expiry and account disablement. Use foreground onReconnect/Sync Now; background sync if supported as enhancement, not sole delivery guarantee.
>
> **Concurrency:** prohibit two tabs/workers syncing same queue concurrently using Web Locks API where supported or an IndexedDB transactional lease with fencing, expiration and crash recovery. Keep per-order state `DRAFT → LOCAL_COMMITTED → SYNCING → CONFIRMED / DUPLICATE / REJECTED`, plus retry/backoff metadata. Failed attempt must preserve original sale. Do not sync unsupported offline mutations (stock adjustments, category CRUD, payroll, shifts, refunds) through `orders/sync`; show those features online-only unless a verified backend sync contract exists.
>
> **Money and accounting:** online transaction can use server live price; offline order stores actual charged snapshot and local provisional receipt. Reconnect may reveal price mismatch, insufficient stock, suspended user or invalid branch; do not rewrite historic charged amount or discard failures. Design a visible Reconciliation screen for Admin with reason, local ID, backend ID if any, remediation state and manual escalation. Sales queued offline are *not yet* backend-confirmed. Never promise zero-loss in private browsing/unmanaged device without testing storage persistence. Make repeat-click confirmation idempotent **locally** as well.
>
> **Security & data retention:** encrypt sensitive local records only with an explicit key-management/device policy (otherwise describe exposure and restrict offline fields), separate users/tenants, handle logout when unsynced orders remain, secure reset/wipe process, emergency export/recovery design, PII minimization. Don't persist payroll or personal credentials. Offline entitlement cannot magically know backend account revocation during disconnection — set approved limits and disclose risk.
>
> **TEST E2E FAULT MATRIX:** enroll + bootstrap; kill network then reload standalone app; offline with 100+ catalog variants; select variant price/stock; create 10 offline catalog and custom sales; kill tab mid-checkout/write; crash during sync; reconnect; replay batch twice → no duplicate order; server per-order REJECTED and DUPLICATE; JWT expired during downtime; account suspended while offline; branch reassigned; two tabs both syncing; browser refresh before submit; storage quota denied; new SW version during pending orders; rollback migration; offline seven calendar days **only if approved entitlement permits**; correct pending counts and all local receipts remain recoverable. Run typecheck/lint/build, installability, e2e & documented security review. **STOP.**

**Phase 13 minimum exit gate:** Demonstrate offline sale survives refresh/browser restart and replays exactly once on reconnect using backend `clientOrderId` dedupe. A PWA manifest alone is NOT heavy offline implementation. If entitlement remains unresolved, **report Phase 13 blocked for offline paid transactions** rather than bypass security.

### PHASE 14 — Release hardening, regression, full API audit

**Prompt to paste to coding agent:**

> **TASK: Phase 14 ONLY — production-hardening all integrated frontend functionality.** Inspect backend contract + all phases' progress logs, run complete automated/manual E2E, compare UI screenshots, audit every clickable control, query key and data-retention path. No new feature scope unless needed to correct a verified gap.
>
> **API contract audit:** enumerate all used methods/paths/roles/DTOs. Confirm backend response envelopes, auth cookies, `@Idempotent` decorated endpoints, business/branch params, arrays vs page objects, file blob exports, status enums, money integer units. Delete dead/incorrect API declarations (`GET /orders/:id` etc.). Confirm real data instead of fixture imports for every integrated screen.
>
> **RBAC/security:** anonymous, ADMIN, CASHIER, SUPER_ADMIN; wrong role deep links; edit localStorage selected business IDs to another tenant; manipulate category/variant/stock/request body IDs; observe server 403; verify private caches cleared on user switch; HttpOnly token not present in localStorage or DevTools JS-accessible cookie; refresh and logout correctly scoping cookies; CSRF controls; no console tokens. **Escalate backend security findings**: possible ownership validation in Admin `getOrders()` and possible `unitCost` leak to Cashier must be tested/fixed by backend team before release. Frontend hiding data is insufficient.
>
> **Financial integrity:** stable same-key retries for catalog/custom orders/refunds/payroll/shifts; no duplicate charges under bad network; correct quantities and branch stock; backend authoritative totals, refunds update inventory where supported; no false success on timeout; backlog and rejected sync visible; never erase queued sale on logout/redeploy.
>
> **Performance:** measure request count and payload sizes for login → business selection → catalog → filter → register checkout → order history → reports; no `/users/me` loop, no category GET per product, no request waterfall for independent GETs, no repeated refresh storm, no heavy catalog refetch on every selector click. Profile React re-render and memory use with thousands of products and variants. Verify UI card size and modal density under tablet/desktop breakpoints.
>
> **Resilience/accessibility:** throttled/failed network, stale cache/tenant switch, 401 refresh, 403/404/409 errors, offline bootstrap/outdated stock, two-tab state coordination, keyboard variant select, form labels, dropdown dialogs, focus trap, visible loading and retry, skeleton/empty states, WAI/semantic controls, printable receipt. Snapshot Admin/Cashier key screens vs provided originals; document justified visual deltas.
>
> **Testing:** run `npm run typecheck`, `npm run lint`, `npm run build`, relevant test suites and end-to-end role/scoped sales journeys. Add deterministic contract fixtures based on actual DTOs; if no test command exists, state that and add tests in project-conventional way. No silent `any`/ts-ignore to pass builds. Inspect PWA installability/IndexedDB migration/replay logs. Review security headers, CSRF and service-worker cache rules before production.
>
> **Deliver:** `docs/FRONTEND_INTEGRATION_FINAL_AUDIT.md` with API coverage matrix, actual tests/commands/results, unresolved backend gates, visuals changed, performance request counts, tenant/RBAC checks, offline policy limitations, deployment/env checklist and release go/no-go rationale. Update progress document, consolidate outdated frontend documents, keep existing design. **STOP.**

---
## 6. End-to-end dependency walkthroughs the agent must test

The phased prompts above are mandatory, but they are not substitutes for these **multi-API flow tests**. Each action below must work using real backend data and must preserve its existing frontend presentation.

### 6.1 Admin first login → catalog creation → sale → dashboard

```text
POST /auth/login (email, ADMIN)
  → set verified HttpOnly server cookies; receive user.role
  → GET /tenant/businesses (cache)
  → validate stored businessId, select business
  → GET /tenant/locations?businessId=B (cache)
  → validate stored locationId, select branch L
  → GET /catalog/categories?businessId=B&locationId=L (cache; names for dropdown)
  → POST /catalog/categories (only if new category)
  → POST /catalog/products {name,description,categoryId,businessId:B}
  → capture returned product.id as P
  → POST /catalog/variants {productId:P,name,sku,sellingPrice,stock,locationId:L,...}
  → invalidate category/products/variants + register and inventory aggregates
  → GET /catalog/products and /catalog/variants (reuse cache/refetch once as needed)
  → group cards by productId, selected variant = V
  → POST /orders/catalog {businessId:B,locationId:L,lines:[{variantId:V,quantity,unitPrice}],tenderedAmount,paymentMethod}
       header: Idempotency-Key = K, reused for uncertainty retries
  → backend returns real invoice/total
  → invalidate stock, orders, shift telemetry, dashboard and report queries
  → GET /reports/dashboard?businessId=B&locationId=L... when screen opens
```

**No:** setting `categoryId` equal to `category.name`, skipping `POST /catalog/variants`, fake variantID, direct sale by parent product ID, new idempotency key on timeout retry, displaying `PAID` before response.

### 6.2 Admin selects one branch, then switches to another

```text
Get owned businesses → validate persisted B
Get branches(B) → validate persisted L1
Read catalog / variants(B,L1) → display stock for L1
User selects L2 → save scoped selection B/L2 in localStorage
Warn about active cart/drafts; keep old drafts in B/L1 namespace
Cancel pending L1 queries / redirect data source to B/L2
Read variants(B,L2), shift(B,L2) as needed
Cart checkout MUST send L2; the old L1 rows must not flash in place.
```

### 6.3 Cashier login and cashier register

```text
POST /auth/login {loginType:'BUSINESS_USER',publicId,password}
  → backend user assignment fixes B and L; role CASHIER
  → Show POS sidebar only; no editable business/branch selector
  → Load cached categories/variants scoped via token assignment
  → group product cards and select variant ID
  → optionally GET /shifts/active (if shift chip/screen needs it)
  → POST /orders/catalog (NO arbitrary client-selected B/L)
  → GET /orders for own authorized scope when history opens
  → POST /orders/:id/refunds if backend role+order ownership allow it
```

### 6.4 Product has multiple variants — exact UI mechanics

Given Product `P` with variants `V1 = Black / 8GB`, `V2 = Blue / 8GB`, `V3 = Black / 12GB`:

- Render **one card**, not three separate “products”, in the POS Register, preserving the current card size/image ratio.
- Its variant picker contains V1, V2, V3; select V2 → show V2 image, V2 price, V2 SKU, V2 branch stock; do not update Product's name/description incorrectly.
- Click Add → cart line `variantId=V2`. Select V3 → click Add → **second distinct cart line** `variantId=V3`; no overwrite of V2 quantity.
- If backend deactivates V2, remove/disable it from sellable options after revalidation. If V2 price changes while cart is open, show a price reconciliation dialog before finalizing; backend total wins.
- Card should remain visual-equivalent to current screenshot: four columns desktop, cropped image, two-line product title, compact variant dropdown, price+stock bottom row. Fit within current proportions; no large extra button row.

### 6.5 Category filter: required parent lookups

```text
GET /catalog/categories        → [{id, name, ...}] for pills/select UI
Pill click category C.id       → queryKey includes C.id
GET /catalog/variants?categoryId=C.id&locationId=L&businessId=B
  + /catalog/products?categoryId=C.id when product groups/details need it
Render variants/product labels with cached category.name
```

If filtering can be done entirely over fresh cached scoped arrays, prefer client filtering until stale or explicit refresh; **do not fetch categories on every category click**. Uncategorised products must show an “Uncategorised” filter/label when present.

### 6.6 Refund → stock → reports

```text
GET /orders (authorized scope, filters)
  → user opens a real order from list
  → select order item ID and permitted refund quantity
  → POST /orders/:id/refunds with backend DTO + stable idempotency key
  → invalidate order(s), relevant catalog/branch stock, shift cash, dashboard, analytics, transactions
  → on success, show real refund status / remaining refundable amount
```

Do not run a nonexistent `GET /orders/:id`; document limitations when the list response doesn't contain full detail.

### 6.7 Offline recovery → multi-day pending → exact-once backend replay

```text
ONLINE login with valid server session and approved terminal enrollment
  → GET /offline/bootstrap for validated B/L
  → IndexedDB atomic snapshot(categories → products → variants → stock/images)
NETWORK LOST
  → offline client shell loads, terminal locally authorized by approved policy
  → select V, make sale, persist {clientOrderId UUID, full immutable snapshot, occurredAt, tenant, deviceId}
  → local provisional receipt + QUEUED badge; no backend success claim
NETWORK RESTORED
  → refresh/restore server cookie auth as needed
  → POST /orders/sync batches <=100; unchanged clientOrderId/payload
  → results ACCEPTED / DUPLICATE / REJECTED
  → atomically update local outcomes, confirmed invoices, unresolved queue
  → revalidate GET /catalog/... and /reports/... scoped data as needed
```

**Never** sync generic CRUD/stock/shift/payroll writes with `orders/sync`. Device entitlement/account revocation policy must be explicit; a week offline with expired credentials cannot be treated as live online authentication.

---

## 7. Request/query-key and mutation patterns (reference pseudocode)

These are **patterns**, not drop-in code; adapt to actual TS DTOs. Keep frontend UI only minimally modified.

```ts
// Query keys: preserve user + tenant + branch boundaries.
export const posKeys = {
  categories: (userId: string, businessId: string, locationId: string) =>
    ["catalog", "categories", userId, businessId, locationId] as const,
  products: (userId: string, businessId: string, locationId: string, filters: object) =>
    ["catalog", "products", userId, businessId, locationId, filters] as const,
  variants: (userId: string, businessId: string, locationId: string, filters: object) =>
    ["catalog", "variants", userId, businessId, locationId, filters] as const,
  orders: (userId: string, businessId: string, locationId: string, filters: object) =>
    ["orders", userId, businessId, locationId, filters] as const,
};

// Parent lookup controls display; query filter uses UUID, not label.
const selectedCategoryId = selectedCategory?.id; // name is for display ONLY
// GET /catalog/variants?businessId=...&locationId=...&categoryId=selectedCategoryId

// Current card: card is a product; selected variant is the sellable SKU.
type RegisterCard = {
  productId: string;
  productName: string;
  description?: string;
  categoryId?: string;
  variantOptions: {
    variantId: string;
    label: string;
    sku?: string;
    barcode?: string;
    sellingPrice: number;
    branchStock: number;
    imageUrl?: string;
    isActive: boolean;
  }[];
};

// Persist only harmless Admin preferences to localStorage, with SSR guard.
// User-scoped keys must be constructed/validated by one storage adapter.
// Do NOT use these preferences as auth/ownership proof.
```

**Query invalidation:** use `queryClient.invalidateQueries({ queryKey: ... })` with precise prefix/scope; avoid `queryClient.clear()` except logout/account switch. If a product's variant changes category membership, invalidate **both old and new** filter scopes or a safe parent prefix. If an offline sale is pending, do not optimistic-decrement the server's authoritative inventory cache without clearly separating an estimated local stock projection.

**Idempotency:** only automatically set header on endpoints the real backend declares `@Idempotent()`. For payments/checkout use a stable key across attempted submission, retries and after-refresh recovery. A new intentional sale receives a new key. `POST /orders/sync` uses immutable `clientOrderId` per order; inspect whether it also requires a header (current backend does not decorate it as idempotent).

**Session continuity:** when offline, browser cookie is not decodable by JS (by design). Session UI context may be held in memory and minimal nonsecret user projection may be available in a trusted local offline entitlement record **only when Phase 13 policy approves it**. Rendering a name/role from a cache is UI convenience, not online authority. Do not use `localStorage.getItem('role')` as a permission guard.

---

## 8. UI-to-API coverage checklist (track per screen)

The agent must annotate each row with `NOT_STARTED`, `IN_PROGRESS`, `REAL_VERIFIED`, `BLOCKED_BACKEND`, or `OFFLINE_DEFERRED` in the progress document.

| Current screen / visible control | Phase | Required real integration | Visual boundary |
|---|---:|---|---|
| Login Admin/Cashier | 1 | Auth login/refresh/logout, conditional me fallback, RBAC | Preserve login form/brand |
| Authenticated role label and sidebar | 1 | Verified login role, session, real logout | Remove static role switcher; retain navy structure |
| Select Business / business cards | 2 | Businesses list/create/update/delete, detail | Preserve cards, status, two-step chooser |
| Branch selection/new branch form | 2 | Locations list/create/update/delete | Preserve split-pane branch form; hide fake unsupported fields |
| Top bar active branch | 2 | Selected authorized scope / locked Cashier assignment | Same chip and spacing |
| Catalog category action + filter | 3 | Categories GET/POST/PATCH/DELETE | Same pills/select/table; names from GET |
| Catalog Product modal | 3 | Products GET/POST/PATCH/DELETE; **description** and first-variant wizard | Same modal family, minimal two-step extension |
| Catalog Add Variant modal | 3 | Parent products GET + variants GET/POST/PATCH/DELETE | Add parent Product picker; same form density |
| Catalog stock adjustment | 4 | Variant stock PATCH, scoped refresh | Same small centered modal |
| Catalog profile/multiple images | 4 | Variant image upload/list/remove | Same card ratio; compact image controls |
| Staff & Cashier Accounts | 5 | Users cashiers/status CRUD + tenant branch lookups | Same table/actions/search |
| Shifts/active shift top chip | 6 | Shift active/open/close/history | Same sidebar and metrics structure |
| Admin Catalog Register | 7 | Categories + products + variants + catalog order | **Same card dimensions**, add slim variant selector |
| Cashier Catalog Register | 7 | Cashier scoped categories/products/variants + catalog order | Same product selector/cart layout |
| Quick Custom Sale (both roles) | 8 | Custom order mutation, optional shift and validated scope | Same custom item/modal |
| Register Ticket / Order History | 9 | Orders list with real filters, refund | Same table/action dropdown |
| Receipt/details | 9 | Backend order response / available list details | Same receipt; detail endpoint gap if absent |
| Operations Dashboard | 10 | Dashboard + shift/order dependencies | Same 4 KPI boxes/tiles |
| Sales Analytics & Reports | 10 | Analytics + transactions + export CSV/PDF | Same chart/breakdown/filter grid |
| Payroll & Advances | 11 | Payroll list/summary/history/process/disburse; advances list/summary | Same payroll/advances tabs |
| Cashier advances request UI (if absent) | 11 | POST advances + own list | Small within Cashier UX |
| Expenses (if absent) | 12 | Expenses CRUD/summary | Use existing table/modal/metric components |
| Audit (if absent) | 12 | Audit logs list/detail | Read-only Admin section |
| Platform Admin user approvals | 12 | Admin users list/approve/status | Separate role-safe workspace |
| Offline status + pending sales + sync | 13 | Offline bootstrap/sync, IndexedDB, local entitlement | Extend current register, not redesign cards |
| All routes/actions | 14 | Smoke/E2E/API security/performance audit | Screenshot comparison required |

---

## 9. Required ongoing progress, gap and testing artifacts

The agent MUST maintain `docs/FRONTEND_INTEGRATION_PROGRESS.md` after every phase. If not present, create it in Phase 0 with this schema (do NOT mark unverified integrations complete):

```markdown
# SunTech POS Frontend Integration Progress

## Repository fingerprints
- Frontend commit/archive: ...
- Backend commit/archive: ...
- Date: ...
- Integration plan version: 3.0

## Phase status
| Phase | Status | Commit/files | Real APIs | Tests passed | Known blocks |
| 0 | NOT_STARTED | | | | |
| 1 | NOT_STARTED | | | | |
...
| 14 | NOT_STARTED | | | | |

## Active authenticated storage design
- Cookie origin/topology, HttpOnly paths, CSRF approach: ...
- localStorage key schema for business/location/preferences: ...
- IndexedDB schema/version (once Phase 13): ...

## Screen-by-screen API coverage
| Route/UI action | Endpoint(s) | Related lookup(s) | Cache keys | Invalidation | Actual status | Tests |

## Last completed phase
- Features implemented:
- Files changed and reason:
- User-visible changes vs screenshots:
- Source contracts checked:
- Exact tests run / failures:
- Network request count for key flows:
- Mocks remaining:
- Backend gaps/security escalations:
- Unresolved questions/decisions:
- Next phase prerequisites:
```

Also append to `docs/frontend-backend-gap-register.md` where a screen affordance does not map to a backend contract. Do not mask missing backend features with fake local persistence (except explicitly labelled cart *drafts*).

**At every phase boundary, output this exact report structure:**

1. `PHASE N STATUS — COMPLETE / PARTIAL / BLOCKED`; do not call partial complete.
2. `IMPLEMENTED UI FLOWS`, split by ADMIN/CASHIER/SUPER_ADMIN as applicable, including dependent lookups.
3. `API COVERAGE`: method/path, exact request payload, role and query dependencies actually tested.
4. `FILES CHANGED` and major architectural decisions, especially cookie/localStorage/IndexedDB boundaries.
5. `CACHE`: query key scope, timings, invalidation/revalidation and request-count evidence.
6. `UI FIDELITY`: screenshots/measurements, product-card height and columns if applicable, any justified adjustments.
7. `VALIDATION`: typecheck/lint/build/test commands actually run and outputs; no guessed passes.
8. `KNOWN GAPS & RISKS`: backend DTO conflicts, unsupported UI actions, security issues, offline constraints.
9. `NEXT PHASE HANDOFF`: one paragraph with exact starting point.
10. **STOP.** Never launch Phase N+1 without explicit user instruction.

### Suggested new-chat prompt (for large-project ChatGPT responsiveness)

> Read `docs/frontend-api-integration-plan.md`, `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`, `docs/FRONTEND_INTEGRATION_PROGRESS.md` and the real current source. Backend is complete and reference-only. Implement **Phase N only**, not future phases. Keep Next HttpOnly auth cookies, user-scoped localStorage business/branch selections, and future IndexedDB offline model. Preserve the screenshot UI; cards must remain same size with inline compact variant selector. Observe lookup API dependencies, DTOs, TanStack Query invalidation and integration tests. Stop after completion with a verified phase report.

---

## 10. Known release blockers to surface rather than bypass

1. Backend `/orders` Admin business-scope ownership assertion must be independently security-tested; code review previously flagged a **possible** missing check. A frontend dropdown does not prevent illicit business IDs.
2. Backend Cashier order-line `unitCost` masking must be verified; hiding the column is not sufficient if response exposes it.
3. Backend `GET /orders/:id` is absent from supplied controller. Existing UI detail functionality must use actual list response or be explicitly marked limited.
4. Backend `GET /catalog/products`/`variants` have no declared page/limit. Very large retail catalogs need a measured performance/scaling decision; UI client pagination is a temporary correct mapping, not proof of server pagination.
5. Backend cookie deployment origin/path, CSRF strategy and Next server route verification must be proven for the intended frontend/backend hosts before production.
6. Backend offline bootstrap may omit uncategorised products due to category-rooted snapshot composition. Verify from actual `offline.service.ts`/test before offline launch.
7. Existing POS UI has “Record cash-out”; generic drawer cash-out may not correspond to payroll advance or expense endpoint. Do not commit false ledger mutations.
8. Multi-day disconnected payment capture requires terminal enrollment, offline entitlement duration, account revocation risk policy, device loss protections, durable queue and recovery strategy; cookie lifetimes alone **do not** solve it.
9. A parent product with 0 variants is possible at backend API level. The new UI requires a first variant **as an onboarding workflow**; failed child creation must be resumable to avoid orphaned/hard-to-find products.
10. `SUPER_ADMIN` has distinct permissions; a role of SUPER_ADMIN must not be used to bypass Admin-only tenant guards. Always test actual controller authorization.

---

## 11. Final definition of done

Integration is genuinely finished only when:

- **Every supported action visible in production UI** reads/writes the actual backend or is clearly identified as unsupported; no mock-success buttons remain.
- Admin, Cashier and Super Admin cannot access unauthorized screens or tenant data; cookie/session integration is production-safe; role/cookies are not faked with localStorage.
- Admin selected business/location preferences survive normal refresh in localStorage but are verified online and safely partitioned by user; cashier assignment is backend-derived.
- Category/Product/Variant relationships are correct everywhere: filters send `categoryId`; variant creation sends `productId`; Product includes description; UI product creation completes only when first variant exists; register adds a `variantId`.
- Register desktop product **card size, grid and visual design are preserved**, with a compact accessible variant selector, dynamic price/SKU/stock/image and correct cart line IDs.
- All required lookup, create/update, checkout, receipt, refund, report, payroll and status APIs are implemented in the appropriate flows, with dependent invalidation and no repeated `/users/me` calls or category fetch storms.
- Online checkout and order sync cannot duplicate a single logical sale on retry; all server-trust boundaries, statuses and failure states are honest.
- Offline-first PWA has **durable IndexedDB** snapshot/cart/order queues, approved device authorization, exact `clientOrderId` dedupe, reconciliation UI, and browser/network/restart recovery tests; localStorage alone is never treated as a database.
- Tests, screenshot comparisons, role/tenant isolation, contract mismatches, deployment cookie settings and remaining risks are documented in the final audit.

**Phase 0–14 baseline specification ends here; continue with the expanded Codex operator prompts in §§12–15 below.**

---

## 12. CODEX OPERATOR MANUAL — deterministic, one-phase-at-a-time execution (v3 supplement)

> This section converts the full contract and Phase 0–14 prompts above into **smaller sequential implementation tickets**. It is additive, not a replacement. Codex must read both the long phase prompt in §5 and the matching tickets in §13. Use one phase per coding session; each ticket is a distinct, verifiable sub-task. No phase is complete simply because its UI looks functional.

### 12.1 Canonical agent entrypoint — paste once at the beginning of a coding session

```text
You are the frontend implementation agent for SunTech POS. Work in the EXISTING Next.js frontend checkout; backend source is reference-only unless I expressly change scope.

FIRST READ:
  1. AGENTS.md and any repository-level coding instructions.
  2. docs/frontend-api-integration-plan.md (ALL sections, including §5 and §13).
  3. docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md.
  4. docs/FRONTEND_INTEGRATION_PROGRESS.md and docs/frontend-backend-gap-register.md, if present.
  5. The current frontend source and the actual NestJS controller, DTO, guard, service, Prisma model and test that govern your target UI.

You must identify the next authorized phase from the explicit user instruction and PROGRESS file. Never infer permission to implement subsequent phases. Compare real source to documents; current source wins. Do not create, assume, or emulate missing backend endpoints.

Contract: preserve existing styling and route identity; keep compact POS product cards unchanged in dimension and layout, adding the accessible narrow variant selector within the existing card content. Auth secrets/tokens belong only in HttpOnly same-origin Next/server-managed cookies; validated user-scoped tenant/business/location UI preferences belong in localStorage; large durable offline catalog and queued sales belong in IndexedDB (Phase 13). A cashier may use only assigned branch. Backend amounts are integer BDT taka. Use stable logical-operation idempotency keys where the backend supports them. Never mark offline-queued orders as server-paid.

For the selected phase, execute every matching §13 sub-prompt in order, perform real calls/tests, update progress and gap/evidence docs, and produce the exact Phase Boundary Report in §9. If current backend behavior disagrees with a historic endpoint table, stop using the historic assumption and document the observed source. Unrelated backend changes and redesigns are forbidden.

STOP after the authorized phase. Show work completed, real tested routes, screenshots/visual differences, test output, blockers, and a one-paragraph next-phase handoff. Do not begin Phase N+1.
```

### 12.2 Short command to start any specific phase

```text
Execute SunTech POS PHASE <N> ONLY, where N is my explicit chosen number from 0 through 14. Read docs/frontend-api-integration-plan.md including §5 and §13, docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md, and the previous phase handoff. Implement subprompts <N>.A through <N>.E sequentially; test and report at each boundary; then STOP. Keep every established design/storage/security/API rule. If a backend contract is missing or contradictory, record the exact file, route, DTO and blocker instead of inventing an endpoint or faking success.
```

### 12.3 Restart / context-compaction prompt

```text
Resume the IN-PROGRESS SunTech frontend Phase <N>; do not start a new phase. Re-read docs/frontend-api-integration-plan.md, docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md, docs/FRONTEND_INTEGRATION_PROGRESS.md and docs/frontend-backend-gap-register.md, then inspect git diff, changed files and tests. Determine precisely which subprompt <N>.A–<N>.E was last verified, not merely edited. Finish the remaining tickets and their acceptance gates. Do not repeat completed mutations, bootstrap records, sales, refunds, or first-product-creation requests on resume. STOP after Phase <N> report.
```

### 12.4 Review-only quality gate prompt

```text
REVIEW ONLY the implemented SunTech POS Phase <N>. Do not opportunistically implement other phases. Check each sentence of the Phase <N> §5 prompt and §13.A–E against code, current NestJS DTO/controllers, the existing screenshots, role and tenant constraints, cache invalidation, 400/401/403/409/network failures and test evidence. Report each unmet criterion as PASS / FAIL / BLOCKED / NOT TESTED with file references. Correct defects within this phase and rerun targeted tests; update the progress ledger. Never declare done if critical checks remain FAIL or NOT TESTED. STOP.
```

### 12.5 Evidence-first development algorithm (repeat for every tab, dialog, and action)

1. **Locate UI**: write exact frontend route, component path, control label, view-model, old mock import, and baseline screenshot measurement. Trace click → event handler → hook → transport → response mapper → state → UI. A visible button without a real result must be recorded.
2. **Prove API**: inspect controller route+method, auth decorators/guards, DTO validation, service behavior and response envelope. Verify whether the route supports the requested `businessId`, `locationId`, pagination and idempotency. If not, do **not** attach guessed query params.
3. **List dependencies**: classify lookups as prerequisites or independent parallel calls. E.g., choose business → list locations; category lookup and variant list can be parallel only after business/branch is known; parent product must exist before creating first variant.
4. **Trace permissions**: ADMIN versus CASHIER versus SUPER_ADMIN and ownership on both frontend visibility and backend authorization. A selected localStorage UUID does not authorize an API call.
5. **Model DTO separately**: type backend request, backend response, mapped view-model and form state. Handle optional fields, enum values, nulls and server validation. Do not set `any` simply to suppress mismatch.
6. **Plan query keys**: user, business, location and meaningful filters/date cursor in stable key. Gate requests with `enabled`, abort obsolete requests, use finite retries and targeted invalidation; do not fetch the same lookup separately in multiple children.
7. **Implement smallest vertical slice**: one live read, then dependent lookup, then supported create/update/delete, then all error and stale states. Preserve existing UI geometry throughout.
8. **Financial operations**: generate a logical transaction ID once, reuse supported idempotency keys on retry, distinguish unknown result from failure, and fetch the authoritative order/refund status before inviting a retry if necessary.
9. **Verify states**: initial loading, real empty dataset, no search matches, validation error, 401 refresh, forbidden role/tenant, disconnected data, mutation failure, success and invalidation. No silent return to mock records.
10. **Prove behavior**: fixture-driven unit tests, integration tests with real response shapes, role/scope E2E where environment permits, and screenshot comparison. Report missing test infrastructure truthfully, do not fabricate pass results.
11. **Record implementation**: update API coverage, changed screens, surviving mocks, query cache, permissions, visual deltas and commands/output. Note the backend SHA when available.
12. **Advance within phase only**: subprompt B begins only after A has demonstrable acceptance evidence; move to the next numbered phase only upon the user's separate instruction.

### 12.6 Mandatory artifact locations inside the frontend repository

| Artifact | Writer | Content and updating rule |
|---|---|---|
| `docs/frontend-api-integration-plan.md` | User/team | This file; implementation source of task ordering, not proof of API contracts |
| `docs/SunTech_POS_AI_Agent_Frontend_Integration_Guide.md` | Existing project guide | Readable backend/frontend context; cross-check with code and do not silently overwrite |
| `docs/FRONTEND_INTEGRATION_PROGRESS.md` | Codex each phase | One line per phase, verified screen/action coverage, date, commit, tests, role and branch evidence |
| `docs/frontend-page-api-map.md` | Codex Phase 0 onward | UI route → component → role → prerequisite GET → mutation → DTO → query key → invalidation → verification |
| `docs/frontend-backend-gap-register.md` | Codex every phase | Exact missing endpoint/DTO/permission/feature mismatch; severity, evidence path and remediation owner |
| `docs/integration-contract-evidence.md` | Codex Phase 0 onward | Backend SHA, route declaration paths, DTO files, cookie shape, idempotency decorations and response evidence; redact secrets/PII |
| `docs/phase-evidence/phase-N.md` | Codex on Phase N | Commands and raw result summaries, role+tenant tests, screenshot references, remaining risks and phase exit verdict |
| `docs/FRONTEND_INTEGRATION_FINAL_AUDIT.md` | Codex Phase 14 | Release audit, no fake statuses, final gap list and deployment checklist |

**Recommended per-action row format** (repeat for *each* visible UI control):

```markdown
| Route | Component / control | Roles | Business/branch prerequisite | Lookup request(s) | Read/write request + DTO source | Query key / invalidation | Mock removed? | Error/offline behavior | Test evidence | Status |
```

**Phase completion classification**: `COMPLETE_VERIFIED` only when supported production flows and required tests pass; `PARTIAL` when implemented but unverified; `BLOCKED_BACKEND` when current backend lacks contract/authorization; `BLOCKED_ENV` for reproducible environment inability; `NOT_STARTED` otherwise. Never use "complete" for a subset without stating which screen/actions are unfinished.

### 12.7 Security and offline invariants that cannot be waived to pass tests

- Next's HttpOnly cookies are server-managed; neither React nor a service worker reads the JWT. Use a verified same-origin BFF/reverse-proxy, cookie forwarding, server route verification, deliberate CSRF policy, and single-flight refresh. A readable `role` cookie is *not* an authority.
- For same-origin cookie-authenticated requests, confirm origin, methods, SameSite rules, refresh cookie path and deployed host topology. Avoid blindly forwarding `Set-Cookie` attributes incompatible with the browser-visible origin.
- LocalStorage can hold `selectedBusinessId`, `selectedLocationId`, sidebar state and modest nonsecret preferences. It is untrusted, namespaced by authenticated principal and validated online. Never use it as proof of tenant membership.
- IndexedDB is intended for versioned catalog snapshots, local draft receipts, immutable queued orders and durable retry records. Do not persist payroll/auth secrets or use localStorage as the long-term sales database.
- Offline PWA only grants **provisional local sale recording** after an explicitly approved terminal enrollment/entitlement policy, and shows pending/rejected sync states. Network reconnection alone does not guarantee session validity or successful accounting.
- Only backend-confirmed sale/payment/refund can be presented as server-complete. Use actual backend authoritative integer BDT totals and returned identifiers.
- User/tenant/branch changes must not leak previous tenant query cache, indexed offline records, local drafts or mutations in flight. On branch switch, do not silently move an unpaid ticket or unsynced sale to the new branch.

---

## 13. EXTENDED PHASE WORK PACKETS — A → E micro-prompts for Codex

Each packet below is actionable alongside its matching comprehensive §5 phase prompt. The five **copy-ready internal prompts** are deliberately sequential: `.A` inventory/prove contracts, `.B` implement read data and dependencies, `.C` mutations/role workflows, `.D` consistency/failure/caching/offline boundaries, `.E` tests/evidence/STOP. A phase may legitimately have fewer write endpoints; in that case `.C` means interactions, not invented persistence.

### PHASE 0 — Infrastructure and reference baseline

**0.A — Codebase forensics, API audit and UI inventory**

> Inspect the checked-out frontend structure and actual backend source. Read `AGENTS.md`, frontend guide, backend POS docs and this plan. Produce an initial `frontend-page-api-map.md` with every existing admin/cashier/platform route and all actions/filters/dialogs, mapping old demo hooks and exact real controllers/DTOs. Inventory `src/mocks/**`, `src/demo/**`, localStorage JWT references, `document.cookie`, `src/proxy.ts` preview bypass, duplicate API clients and idempotency handling. Capture screenshots or test snapshots of login, sidebar, business chooser, catalog dialogs, four-column register cards, cart and reporting panels. Record source SHAs and routes; change no domain UI yet.

**0.B — Single transport, typed errors and DTO shape**

> Implement a conservative transport layer compatible with installed Axios/TanStack Query and existing routes: server-configured backend URL, same-origin browser entrypoint, cookie-aware request/response forwarding, normalized `{success,message,data,timestamp}` envelope (when verified), file/blob response branch, AbortSignal, typed HTTP/network failure, safe timeouts and explicit request IDs. Audit all callers so none injects a new idempotency key on each retry. Do not implement a login screen in this subprompt. Add tests for unwrap, error/headers/blob handling and abort propagation. Document secure credential handling and unknown hosting configuration.

**0.C — Query, session, scoped preference foundations**

> Define typed query key builders for auth user, business, location and filters. Establish single server-state ownership in TanStack Query and keep Redux for UI/cart where appropriate. Add an SSR-safe localStorage preference adapter with validation/versioning/cross-tab notifications; business and location choices are hints only. Draft the Next cookie topology decision record and secure server route authentication approach after reading the backend cookie paths, JWT extraction and refresh behavior. Introduce an offline store interface/schema proposal only; do not activate an offline checkout or service worker in Phase 0.

**0.D — Regression, documented risks and development boundaries**

> Verify development previews are explicitly gated and cannot be accidentally enabled in production; identify/remove unsafe unconditional auth bypass without breaking intentional preview test infrastructure. Freeze screenshot/layout measurements (including product card height, columns and image crop) and list which production paths still use mock data. No broad deletion of demos, backend edits, app router rewrite or mutation of business features. Create response fixture conventions based on real DTOs and a targeted invalidation plan for catalog, orders and shifts.

**0.E — Phase 0 acceptance and stop**

> Run repo-specific install-independent checks (typecheck, lint, build, tests where scripts exist), review changed file list and test regressions; prove transport/error/tenant-preference unit tests and a documented cookie topology or an explicit blocker. Save `docs/phase-evidence/phase-0.md`, progress ledger, gap register and baseline UI inventory. Mark Phase 0 complete only with evidence. STOP before any real login/business/catalog implementation.

**Phase 0 hard exit:** documented endpoint map; tested infrastructure; no JWT in JS storage introduced; known `|| true` and readable token risks explicitly handled; screen dimensions recorded; secure cookie architecture chosen or flagged as blocking Phase 1.

### PHASE 1 — Authentication, session, Next cookies and role navigation

**1.A — Inspect backend auth contract and protect route boundaries**

> Read current auth controller/service, login/refresh/logout DTOs, JWT guard and access/refresh cookie settings. Inspect `src/proxy.ts`, login hooks/form, role redirects and existing `auth-cookie.ts`. Draw browser → Next origin → Nest origin → browser cookie path for local/dev/prod; prove credential forwarding, `Set-Cookie` paths and CSRF defense. Record which response user fields are safe for client identity projection. Avoid a frontend-invented access token or server-unverifiable role decision.

**1.B — Real login forms for all actual login types**

> Keep existing login visuals. ADMIN email/password sends backend `{loginType:'ADMIN', email, password}`; CASHIER publicId/password sends `{loginType:'BUSINESS_USER',publicId,password}`. Trust returned `user.role` rather than currently selected tab for routing; SUPER_ADMIN gets role-appropriate landing. Show server validation and disabled/pending states without displaying or logging secrets. Login must result in HttpOnly cookies on the browser-visible Next origin. No localStorage/JS-readable JWTs.

**1.C — Restore, refresh, logout, RBAC**

> Make protected routes server-verified and client menus derive from authenticated identity. Eliminate preview `|| true`, static role switchers, editable role cookies and cached fake profiles. Implement deliberate session rehydration on reload with no `/users/me` waterfall per page. Implement a single-flight refresh for concurrent 401 and one safe retry, preventing loops; preserve financial idempotency on replays. Logout revokes when online, clears browser cookies on correct path, purges private memory queries/UI, isolates next user, and does not silently erase any future offline unsynced sale.

**1.D — Failure and permission UX**

> Test anonymous deep links, wrong-role route, modified localStorage role hint, wrong passwords, expired cookies, 3 concurrent 401s, refresh failure and temporary disconnect. Verify a backend 403 is shown without switching roles; Cashier cannot open Admin HR/cost pages and SUPER_ADMIN must not inherit every Admin guard. Ensure no UI flashes protected private content during session resolution. Wire password recovery only for existing visible screens and real verified DTOs.

**1.E — Phase 1 proof and stop**

> Test valid Admin/Cashier/Super Admin flows, logout, browser restart, refresh recovery, HttpOnly/Path/SameSite/Secure in intended environments, route guards and request counts. Save a redacted Network evidence record (no token values), `phase-1.md`, progress and gaps. Run typecheck, lint, build and focused auth E2E; state failures. STOP before creating business/branch APIs.

**Phase 1 hard exit:** no trusted role/local JWT in localStorage; real backend login/logout; validated Next cookie/topology; no repeated `/users/me`; role-appropriate sidebar with no preview bypass.

### PHASE 2 — Businesses, branches, persisted selections

**2.A — Map all business/branch UI and fields against backend DTOs**

> Read actual `tenant` controllers/DTOs and current `/admin/select-business`, `business-branch-hub`, sidebar/header context and branch-create forms. Audit every displayed demo property (manager, code, subscription, float, city, online toggle, plan) for real DTO support. Map `GET /tenant/businesses`, scoped location list and detail/create/update/delete. Establish Admin ownership versus Cashier fixed assignment; list unsupported fields as gaps, not fake persistence.

**2.B — Admin chooser reads, localStorage restoration and scope provider**

> On Admin login load businesses once through scoped TanStack Query, render existing cards and empty states, validate user-scoped persisted businessId against authorized returned IDs. After chosen B load locations for B and validate preferred locationId under user+B. Restore only valid choices after refresh. Update top bar and downstream context only after verification; abort/cancel B1 results when selecting B2. Cashier receives backend assignment, not an unrestricted branch selector.

**2.C — Create, update, delete and navigation**

> Wire existing business and branch modals/actions to POST/PATCH/DELETE with only actual DTO fields. `POST /tenant/business` is singular and its body supports `name` as recorded; recheck source. UI select/create/delete paths must have loading, duplicate guard, 400/403/409 validation, confirm destructive actions and proper query invalidation. Handle no businesses, zero branches, current selected branch deletion and role restrictions. Profile upload features are allowed only when a verified related endpoint exists.

**2.D — User/tenant boundary tests and cart safety**

> Simulate switching Admin business and branch while queries are in flight and while cart has lines. Keep old cart scoped, warn the user, never silently bill to the new location, and clear/rehydrate the correct query namespace. Modify stored UUIDs to unauthorized IDs; UI must revalidate and Nest must enforce access. After account switch, no previous user's business or location appears. Cashier must remain assigned to authorized branch.

**2.E — Phase 2 proof and stop**

> E2E verify Admin 0/1/many businesses, CRUD and location selection, refresh restoration, invalid selection cleanup, Cashier fixed scope and stale-response cancellation. Inspect current screenshot fidelity and exact request counts. Update artifacts, test outputs, gap register and phase report. STOP before catalog CRUD.

**Phase 2 hard exit:** every downstream route can obtain a verified business/location context without trusting localStorage as permission; no cross-branch data flashes.

### PHASE 3 — Category → Product → first Variant → further Variant

**3.A — Catalog graph and modal field contract**

> Read backend categories/products/variants controller, create/update/query DTOs, actual service semantics, Prisma relationships and frontend catalog dialogs. Write relationship graph Product.categoryId → Category.id; Variant.productId → Product.id; price/stock/SKU at Variant level. Inspect which lists accept businessId/locationId/categoryId/productId/search/lowStockOnly and which have NO server pagination. Map empty/category filter/search/table rows and all modal buttons to precise contracts. Preserve layout and existing table/chip proportions.

**3.B — Live cached reads and category CRUD**

> Wire categories, products and variants to cached and authorized requests. Load categories as the label source, send category.id in filters and forms, handle uncategorized parents, debounce search and perform client pagination only if backend DTO has no pagination. Wire Category create/edit/delete to DTOs with validation/child consequences, display server errors, invalidate all affected product/variant labels and metrics. Avoid one request per row, per select opening, or per category click.

**3.C — Two-step Product + required first Variant wizard**

> Extend existing Product dialog without redesign. Step 1 validates supported name, description (max 500 if current DTO confirms), optional category and approved attributes; POST product exactly once and persist returned ID. Step 2 requires at least one sellable Variant with productId, variant name and server-valid price/SKU/barcode/stock/location fields. If step 2 fails or wizard is closed, retain parent ID + resumable draft; retries must only send Variant POST and never duplicate parent. A product with 0 variants is an incomplete frontend onboarding state, not a claim that the backend transaction was atomic. Add new variants to existing products using cached parent lookup.

**3.D — Edit/delete, branch context and permissions**

> Implement Product and Variant edit/delete/soft-disable semantics according to actual DTO/service. Ensure category changes update old and new filters, parent product name does not masquerade as the SKU, unauthorized CASHIER cannot mutate catalogs, and branch stock is never misattributed. Test two variants under one parent, deletion with orders, SKU conflict, missing category, disabled variant, failed step2 resume and independent business contexts.

**3.E — Phase 3 proof and stop**

> Perform full real flow: choose branch → list categories → create category → create product with description → create first variant → create second variant → filter by category name in UI/UUID in API → edit/disable/delete and verify register view-model. Run tests/lint/build, update screenshots, API map and phase report. STOP before stock-image integration.

**Phase 3 hard exit:** a normal new product flow cannot report completion without a first valid variant; resumed failures never double-create parent; list/filter labels reflect actual cached records.

### PHASE 4 — Stock adjustment, branch inventory and images

**4.A — Stock and image contract audit**

> Check exact variant stock adjustment endpoints and `UpdateVariantStockDto` including SET versus increment/decrement semantics, allowed negative stock, location and business scoping. Read variant image controller/multipart fields, profile image and gallery endpoints, delete behavior, allowed file types and response URLs. Identify current inventory widgets/stock dialogs and where images are selected in register cards.

**4.B — Correct real branch reads and KPI derivation**

> Bind catalog inventory to the verified selected branch's variant/stock response, joining cached parent product and category lookups. Resolve real lowStockOnly behavior. If KPI requires aggregate not offered, compute only over correctly scoped complete data and label it; if aggregation would be inaccurate, show unavailable and record backend need. Reuse product/variant caches from Phase 3; do not create new unsynchronized catalog stores.

**4.C — Adjustments, image upload/remove**

> Translate UI "New quantity" into actual absolute SET mutation where backend supports it; use separate delta operations only when exposed, with correct quantity/stock field. Add pending/error/permission handling, prevent negative/invalid stock, invalidate branch-specific stock/register/cards and any dependent metrics. Implement verified variant profile/gallery upload/list/remove with correct multipart key. Preserve image crop, aspect ratio and card height, show placeholder only for missing real images.

**4.D — Concurrent stock changes and scope correctness**

> Revalidate on checkout outcome, stock adjustment or reconnect; offline cached stock is not authoritative. Simulate Admin at branch B1 adjusting V and Cashier at branch B2 selling V; never show B1 as B2's quantity. On error/conflict keep form input and server message. Test disabled SKU, zero stock, image failure, oversized file and wrong-role access.

**4.E — Phase 4 proof and stop**

> Demonstrate SET/add/deduct as actually supported; compare before/after GET; verify upload/delete appears in catalog and terminal; test branch isolation, authorization and stale data refresh. Run quality checks and update phase artifacts and visual baseline. STOP before staff APIs.

**Phase 4 hard exit:** branch stock, variant image and derived metrics are live/accurate within backend contract; no phantom inventory updates.

### PHASE 5 — Staff/cashier account workflows

**5.A — Personnel role/DTO field audit**

> Read cashier GET/POST/PATCH/DELETE, status and profile-image controller routes, assignment DTOs, response masking and role requirements. Inspect existing Staff & Cashier Accounts table, create/edit/status actions and branch selector. Identify publicId generation behavior and salary/financial fields visible only to authorized Admin responses. Do not invent role/commission/manager properties.

**5.B — Scoped roster and branch lookup**

> After authorized business selection, fetch cashiers with backend-supported filters; fetch locations once for assignment labels. Render real publicId, name, status and branch. Use cached locationId→name mapping, not a per-row branch GET. Handle 0 staff, query search/status, suspended and unassigned entries according to API.

**5.C — Create/edit/status/disable/delete and image**

> Bind all visible supported controls, validate password/identifier rules per DTO, never echo a password to table/query cache, and handle server conflict errors. If backend generates cashier publicId, display exactly returned value. Keep salary fields Admin-only and do not store sensitive details offline. Update staff and affected shift/payroll selections upon mutations; status changes may require affected current Cashier session rejection on next server request. Wire image endpoints only when controller proves support.

**5.D — Privilege and assignment regression**

> Test Admin creates Cashier assigned to B/L, Cashier login receives that fixed scope, Admin suspends account and new session is rejected, location reassignment is respected on new session, and another business Admin cannot view/manage that user. Verify React UI hides unauthorized actions without assuming this is sufficient backend enforcement.

**5.E — Phase 5 proof and stop**

> E2E staff list/create/edit/status/delete and forbidden Cashier access; validate real DTO field errors and scoped branch names. Run tests and capture before/after UI comparison, log API calls/invalidation and update progress. STOP before Shift phase.

**Phase 5 hard exit:** real Cashier accounts and assignment lifecycle; no mock-created user appears as valid until backend confirms.

### PHASE 6 — Shifts, cash opening/closing and active shift

**6.A — Define shift semantics**

> Inspect shift controller, DTOs and service: open/active/list/close endpoints, Admin vs Cashier role guards, location scoping and whether active shift is per cashier, device or branch. Inspect toolbar shift chip and existing shift table/modal. Confirm checkout's `shiftId` is optional; do not force all sales through opening shift unless backend and product policy require it. Identify unsupported standalone cash drawer "cash-out" behavior.

**6.B — Read active shift and history efficiently**

> Gate `GET /shifts/active` by authenticated authorized branch, cache it with appropriate short stale time and invalidate on transitions, not every component render. Render accurate opening amount, start timestamp, responsible user, status and history from server fields; distinguish no active shift from network failure or permissions. Keep chip position and sizes unchanged.

**6.C — Open/close flows and cash input**

> Wire form validation and mutations to `POST /shifts/open`, `POST /shifts/close` or verified `POST /shifts/:id/close` as appropriate. Verify `startingAmount`/`closingAmount` integer BDT behavior and any server-derived expected cash. Avoid duplicate opens/closes on rapid clicks or uncertainty retries. Show real server returned status; refresh history/active/top bar/orders where appropriate. Do not call expense/advance endpoint for an unrelated drawer cash-out.

**6.D — Failed/overlapping shift boundaries**

> Test concurrent attempts in two tabs/devices, refresh mid-shift, wrong branch, no shift, history pagination if defined, incorrect/negative amounts and shift close during checkout. Pending cart retains correct branch. Checkout continues shiftless when accepted by real backend, but the UI explains accounting visibility if shift was optional.

**6.E — Phase 6 proof and stop**

> Complete open → active → sale context → close → history and absence/error paths. Record UI evidence and actual backend requests, tests/lint/build and gap register. STOP before real catalog register checkout.

**Phase 6 hard exit:** active shift state is server-derived, not a static chip; no fabricated cash drawer ledger or mandatory shift assumption.

### PHASE 7 — Catalog register, variant picker, cart and catalog order

**7.A — Register visual contract and sellable data source**

> Inspect both Admin and Cashier register/terminal pages and current product-card CSS and baseline screenshot. Confirm grid columns, image aspect, card height and cart placement. Read real product/variant list DTOs and `POST /orders/catalog`, payment/tender fields, idempotency middleware and permission. Build a UI-to-API ledger for search, category pills, product cards, variant selection, quantity +/- buttons, cart, totals, tender, cancel, payment confirm and receipt. Assert that sellable unit is Variant, never Product parent.

**7.B — One compact product card per product; variant options inside it**

> Fetch authorized branch categories/products/variants with cached independent GETs when prerequisites exist. Group by productId into exactly one card per parent; place an accessible single-line narrow variant selector INSIDE existing card text area (no new tall row, no nested `button`). Preserve current `xl:grid-cols-4`, current aspect-[4/3] imagery, type scale, spacing and card width/height. On variant change immediately update image, selling price, SKU/barcode and *selected branch* stock; preserve category pills and search. A single-variant product can use a same-height static label. Deactivated variants cannot be added. The card's add action is distinct from the select control so users can select variants without triggering cart action.

**7.C — Correct variant-scoped cart and real checkout**

> Cart identity is variantId (+ explicit distinguishing modifiers only if supported). Adding V1 twice increments the V1 line; selecting V2 from same Product creates a separate line. Validate positive integer quantity and server-enforced stock policy, show backend-known tender/payment options only. Build `POST /orders/catalog` DTO with variantId, quantity, unitPrice and required location/business IDs per actual ADMIN/CASHIER DTO; optional shiftId from real active shift. Store one stable logical checkout `Idempotency-Key` and reuse it for an uncertain retry; do not mint a new key in Axios middleware. Show paid/completed state only after real server confirmation. Render receipt/invoice from backend response; do not rely on local calculated totals for final amount.

**7.D — Price change, insufficient stock and scope switch resilience**

> While cart is open simulate stock/price changes, variant deactivation, change branch with nonempty cart, backend 400/409, delayed timeout after accepted order, refresh and duplicate tap. Require explicit cart reconciliation before a changed price/variant is billed; preserve draft until outcome is known. Invalidate variants/stock/orders/dashboard/shift metrics after confirmed checkout and prevent refetch storms. Cashier receives backend assignment; attempting arbitrary business/location IDs must fail. Before Phase 13, disconnected checkout is not represented as successful.

**7.E — Phase 7 proof and stop**

> Run desktop screenshot diff/card dimensions, keyboard-accessible select/add/cart tests, multiple variants under one product, two branches, no stock, stock conflict, valid sale and uncertain retry with stable key. Compare backend total/invoice and resulting stock. Run typecheck/lint/build/test E2E and update API ledger and phase evidence. STOP before custom sale integration.

**Phase 7 hard exit:** Admin/Cashier can select a sellable variant inside the **unchanged-size** product card, check out a real catalog order exactly once per logical attempt, and reconcile backend prices/stock.

### PHASE 8 — Quick custom sale / freeform checkout

**8.A — Custom-sale contract and existing UI inventory**

> Inspect `/admin/custom-sale`, `/pos/custom-sale`, cart/amount UI, payment selectors and `POST /orders/custom` DTO/service. Differentiate free-form `productName`, optional `variantName`, quantity and unitPrice from catalog variantId. Verify supported tax/discount/payment/tender fields and role/branch scoping; do not invent a catalog item for each line. Confirm custom sale does NOT decrement catalog variant stock.

**8.B — Freeform line editing with accurate display**

> Preserve existing name/quantity/price entry layout. Each line can be added/edited/removed and uses integer BDT taka with safe total computation/formatting. Support empty validation, negative/zero rules per DTO, duplicate freeform names as independent lines if behavior requires, and field-level errors. Cashier is assigned to a branch; Admin uses selected authorized branch. Optional shift context uses actual active shift when present.

**8.C — Post real custom order with stable operation identity**

> Implement backend `POST /orders/custom` through the existing transport. Disable double submission, use a stable idempotency key only if backend declares this endpoint idempotent, preserve draft on unknown network outcome, and resolve result before sending another logical order. On confirmed result show real order/receipt ID, backend amount/payment state and clear the cart exactly once. Invalidate orders, shift/dashboard/reports but **not** variant stock unless real backend contract proves a relationship.

**8.D — Failures, disconnected behavior and role boundaries**

> Test Cashier/Admin create, wrong branch, empty line, invalid numeric entry, unexpected extra fields, declined/invalid tender if modeled, repeated click, backend timeout and duplicate logical replay. Before Phase 13, network unavailable means keep draft but do not show server-confirmed paid. If a mock "cash-out" button exists next to custom sale and no backend drawer ledger route exists, disable/document it rather than mapping it to payroll or expenses.

**8.E — Phase 8 proof and stop**

> Demonstrate custom sale → orders history → receipt → dashboard update, and assert catalogue stock unchanged. Record mutation payload, idempotency evidence, visible error states and screenshot fidelity. Run checks, progress update and STOP.

**Phase 8 hard exit:** every custom sale is a verified backend order tied to correct authorized scope, with no fictional inventory deduction or fake sale-success toast.

### PHASE 9 — Order history, details, returns/refunds, receipts

**9.A — Order list/detail contract and missing-detail boundary**

> Inspect order controller, query DTO, refund DTO and current history/detail/receipt UIs. Prove supported `GET /orders` filters, pagination, role/branch scope and response line/receipt fields. In the supplied backend there was NO `GET /orders/:id`; confirm against current source and do not invent it. Identify whether list record includes enough detail for the existing view; document exact missing fields if not. Confirm refund roles, partial quantity handling and idempotency annotations.

**9.B — Live role-scoped history, filters and receipts**

> Replace mocked history with `GET /orders` in backend-supported filter/page format; map statuses, identifiers, totals, dates and payment methods without changing table design. Admin sees only authorized business/location, Cashier only permitted orders as backend enforces. Open a detail drawer/receipt from the fully returned list item or from actually available real response; if insufficient, mark that specific section unavailable and record backend gap. Use real confirmed server invoice, distinguish provisional offline receipt reserved for Phase 13.

**9.C — Actual full/partial refunds**

> Bind UI refund modal to `POST /orders/:id/refunds` with actual line order item ID, quantity/amount/reason/payment fields from DTO, no invented generic “refund item” endpoint. Determine refundable remainder and return quantity from server state; prevent duplicate refund submissions with stable idempotency key only on supported backend route. Show backend result and refresh affected order/history and inventory for catalog order, plus dashboard, reports and shift/cash data as relevant. Custom-order refund must not modify catalog stock by assumption.

**9.D — Status and network correctness**

> Test completed, partially refunded, fully refunded, cancelled/failed statuses if backend provides them, invalid refund quantity, wrong-branch order, wrong-role attempt, same refund submitted twice, timeout after commit, and missing detail. Changing history filters must not trigger per-row GETs or reveal another tenant. Receipt print/reprint should reflect backend data, not independently calculated numbers.

**9.E — Phase 9 proof and stop**

> E2E: create catalog order → history → partial refund → repeat invalid same quantity → remaining refund → stock recheck → receipt and reporting invalidations; also custom-order history/refund. Run tests and record unresolved detail endpoint gap verbatim. Stop before dashboard/report phase.

**Phase 9 hard exit:** history and refunds are server-backed and correctly scoped, receipts have supported provenance, and no phantom `GET /orders/:id` call.

### PHASE 10 — Dashboard, analytics, transactions and exports

**10.A — KPI source-to-widget mapping**

> Inspect backend `/reports/dashboard`, `/reports/analytics`, `/reports/transactions`, `/reports/export` controller/DTO and existing dashboard/reports pages, KPI tiles, charts and date filters. For each widget write exact returned source field/aggregation, business/location/period role scope and unavailable conditions. Do not equate gross revenue, net revenue, refunds, profit, cash drawer expected and payroll cost unless formulas are proven by real service. Confirm `type`, `format`, `month`, `year` export constraints and raw blob responses.

**10.B — Efficient filter-driven authorized reads**

> Connect actual report endpoints to existing charts/cards and transaction tables with a date-range state validated against DTO. Reuse cached business/branch filter lists; parallelize independent report requests when their scope exists and no dependent request is needed. Keep query keys sensitive to user, B/L, date and report type. Provide loading/empty/unavailable/403/offline-stale indications while preserving chart dimensions and current visual hierarchy.

**10.C — Exports and drill-down interactions**

> Wire real CSV/PDF export endpoint through blob response mode; validate file type, month/year, response headers and server errors before download. Filename/mime may come from response or safe fallback; never parse PDF bytes as JSON. Report tiles and transaction links must navigate to real filtered order/history context when supported. Cashier must not export ADMIN-only cost/salary metrics. If a current button implies a backend-unavailable report, label disabled and track gap.

**10.D — Invalidation, precision and branch isolation**

> Create an order/refund/custom sale/shift and verify matching financial widget invalidations without permanently polling all reports. Compare backend totals to UI display as integer BDT. Switch branch during in-flight analytics and verify prior chart data cannot masquerade as selected branch. Large date filters must not create unbounded query waterfalls or client-guess unsupported server sorting.

**10.E — Phase 10 proof and stop**

> Run real sales/returns dataset through Dashboard, Analytics, Transactions and a CSV/PDF export; validate binary output and role restrictions. Capture request counts/UI screenshots and results in phase evidence, including any report metric unsupported by DTO. Typecheck/lint/build and STOP.

**Phase 10 hard exit:** no static KPI masquerades as live; export is valid file data; correct role/period/branch are reflected in each widget.

### PHASE 11 — Payroll and salary advances

**11.A — Payroll/advance permission and state machine audit**

> Inspect payroll and advances controllers, DTOs, service behavior, approval/process/disbursement model and guards. Map every Payroll and Advances tab, summary tile, staff selector, processing button and cashier advance-request action. Do not assume Cashier may see other employees' records, salaries, margins or expense data. Confirm whether payroll is per month/year/branch, if salary can be edited, and how shift attendance affects calculation.

**11.B — Authorized lists and summary queries**

> Use `GET /payroll`, `/payroll/summary`, `/payroll/history`, `/advances`, `/advances/summary` as permitted and actual query DTOs. Join staff/location labels from existing cache; do not issue payroll GET from a global/sidebar provider. Display explicit processing and disbursement statuses. If the Cashier has only "own advance" view, use backend-authenticated filtering and verify data isolation; no client-only filtering of private salary collection.

**11.C — Create advances, process and disburse payroll**

> Wire permitted `POST /advances`, Admin `DELETE /advances` and `POST /payroll/process` plus `POST /payroll/disburse` to exact DTO and confirmation UX. Preserve unique financial-operation identity when backend idempotency is present; on unknown outcome requery status rather than blindly generating a second payroll run. Confirm monthly period, employee, amount and paid state with server responses. Invalidate precise HR, advance and report queries; do not mutate client salary totals as source-of-truth.

**11.D — Sensitive-data, duplicate payout and unauthorized handling**

> Test Cashier requesting own advance and forbidden attempt to read all payroll; Admin requesting/seeing staff history; repeat process for same period; double disbursement; invalid amount; deleted cashier; cross-business IDs; cookie/session changed. Ensure no sensitive salary/payslip results enter IndexedDB, service-worker cache or persisted Redux. UI hide is not security: require backend denial for wrong role.

**11.E — Phase 11 proof and stop**

> Verify full supported advance → payroll process → disburse → history cycle, constraints and role isolation with real data. Run tests/lint/build and report backend-only missing capabilities. Update phase docs and STOP before miscellaneous supported screens.

**Phase 11 hard exit:** no mock payroll processing or duplicate payout, and private employee values are protected by backend role/tenant permissions.

### PHASE 12 — Expenses, audit, platform administration and unsupported UI closure

**12.A — Final supported-route inventory and gaps**

> Compare the existing UI inventory against actual backend controllers for expenses, audit logs, platform `admin/users`, profile image endpoints and any remaining authenticated routes. Identify missing screens that backend already supports and existing UI buttons that backend does not support. Preserve the current navigation hierarchy; add minimal screens only where needed to expose verified capabilities. Distinguish SUPER_ADMIN platform approvals from tenant ADMIN business management.

**12.B — Expenses and audit read UIs**

> Implement real expenses `GET /expenses`, `GET /expenses/summary` and audit `GET /audit-logs`, `GET /audit-logs/:id` with supported filters, role guards and authorized business/branch context. Use existing table, filters, cards and modal patterns. Audit is read-only unless backend explicitly offers mutations. Respect personal/sensitive fields and do not persist audit data offline or expose to Cashier.

**12.C — Expense actions and Super Admin approval/status**

> Wire expense `POST /expenses`, `DELETE /expenses` with actual DTO and tenant scope; map to summary, reporting invalidation when backend includes expense. Implement SUPER_ADMIN `GET /admin/users`, `PATCH /admin/users/:id/approve`, `PATCH /admin/users/:id/status` in an appropriate role-safe workspace. Use real backend status names, confirmation and error messages. Profile-image flows only where matching upload endpoints exist; do not create generic proxy mutations for missing methods.

**12.D — Clean unsupported feature affordances honestly**

> Sweep product demo toggles, branch plan controls, cash-out, order detail, unavailable report variants, unsupported discount/tax or other mock actions. For each, either map verified API, make noninteractive with clear reason, or document `BLOCKED_BACKEND` for product decision. No static fixture should remain in production path of a screen already declared integrated. Verify 403 and tenant isolation rather than assuming SUPER_ADMIN sees every Admin screen.

**12.E — Phase 12 proof and stop**

> End-to-end Admin expenses, audit, user profile supported changes and Super Admin approval/status; then run complete clickable-controls coverage audit. Update gap register, API map, screenshot evidence and quality checks. STOP before offline/PWA rollout.

**Phase 12 hard exit:** verified supported business flows are accessible and truthful; no click delivers fake persisted success; remaining unsupported features are visibly and formally declared.

### PHASE 13 — Heavy offline-first PWA, durable device queue and reconciliation

**13.A — Offline entitlement, API and data-safety decision record (BLOCKER GATE)**

> Read actual `GET /offline/bootstrap`, `POST /orders/sync` DTO/service and any device enrollment/authorization functionality. Before enabling offline sales, obtain a documented security/product rule for offline device enrollment, which logged-in user/role may transact, permitted branch, offline duration, cash tender policy, account revocation risk and lost-device behavior. If backend/policy cannot validate these, implement offline read-only shell/snapshot and mark PAID OFFLINE TRANSACTIONS BLOCKED; never pretend that expired HttpOnly cookies prove authorization while disconnected. Verify backend bootstrap includes uncategorized products and branch-scoped variants. Define IndexedDB schema, migration/versioning, quota and retention policies.

**13.B — Installable, reliable offline app shell and catalog snapshot**

> Add manifest, icons, update handling and supported service-worker strategy compatible with checked-out Next version. Static assets/app shell can be cached but authenticated JSON, Set-Cookie and private payroll must not be placed in shared Cache Storage. On successful online enrollment and branch validation fetch `/offline/bootstrap`, validate schema, atomically commit category/product/variant relationships, scoped stock/images and snapshot metadata to versioned IndexedDB. Network-off cold navigation must load a real terminal shell from allowed local assets. UI reuses EXACT compact Phase 7 product card and variant selector, displays last sync/snapshot time and limits.

**13.C — Offline local commit, provisional receipts and immutable order payload**

> Implement transactional IndexedDB draft → local committed sale write for approved offline terminal only. Sale contains immutable `clientOrderId` UUIDv4, `deviceId`, occurredAt, original B/L and user/device context, order type, line item price/quantity/name snapshots, tender/payment method allowed by policy, locally unique provisional receipt and durable status. UI may say 'Queued locally / Not yet server confirmed' **only after IndexedDB commit resolves successfully**. Browser crash/restart must not lose previously committed order, even when network remains absent. Never store the entire queue in localStorage; never reuse a clientOrderId for a distinct sale.

**13.D — Sync with exactly-once intent, partial outcome and manual remediation**

> On valid restored server session run foreground/manual sync in actual DTO batches ≤100 via `POST /orders/sync`, preserving original immutable `clientOrderId` and payload across retries. Handle `ACCEPTED` and `DUPLICATE` as reconciled with returned backend order reference; keep `REJECTED` visible with backend reason, original receipt and non-destructive remediation. A timeout after server commit must replay same IDs, never duplicate. Coordinate two tabs with Web Locks or IndexedDB lease/fencing; transactional outcome updates, exponential backoff, tab crash recovery and explicit Sync Now. Segregate queues by user/business/branch/device; never auto-transfer pending orders on scope switch. Only order types supported by backend sync are eligible; no stock/HR/payroll/shifts/refunds generic sync.

**13.E — Mandatory disconnected fault campaign and stop**

> Test install, first bootstrap, offline cold launch, 100+ variants and searchable catalog, 10 local sales (catalog and custom if DTO supports both), selected variant accuracy, browser reload/restart, crash before/after commit, duplicate clicks, 7-day outage only if entitlement permits, expired/invalid server session, suspended Cashier, changed branch assignment, two tabs concurrent sync, queue retry after timeout, mixed accepted/duplicate/rejected 100-item batch, quota/full storage, failed IndexedDB migration and service-worker update with pending orders. Inspect provisional vs server invoice and offline counts; show Admin remediation for rejects. If acceptance gate or entitlement fails, report PARTIAL/BLOCKED instead of fake successful offline POS. Run E2E/browser storage checks, record screenshots, exact run results, progress and STOP.

**Phase 13 hard exit:** successfully committed offline sale survives refresh/browser restart and reconciles once against backend without losing rejects; app installs/launches offline; enrollment/retention policy is explicit and approved.

### PHASE 14 — Production release hardening and go/no-go

**14.A — Every-route and every-control audit**

> Generate a final production UI route/control list from source and compare against `frontend-page-api-map.md`. For each action prove real GET prerequisites, controller+DTO+service, role, payload, mutation invalidation, error/empty/offline states and direct visual baseline. Search production imports for `src/mocks/**`, `src/demo/**`, fake totals and `setTimeout` success; distinguish tests/stories from shipped feature code. Audit unused requests and nonexistent backend endpoints, especially missing `GET /orders/:id`.

**14.B — Full financial and multi-tenant regression**

> Exercise Admin and Cashier logins, business switch, branch cache split, category/product/first variant workflow, stock and variant images, staff assignment, shift, catalog sale with V1/V2, custom sale, history, partial refund, dashboard/report/export and payroll/advance permissions. Attempt unauthorized B/L/customer/user/order identifiers with edited localStorage and direct requests. Confirm backend rejects wrong tenant/role; escalate suspected Admin getOrders ownership and Cashier unitCost exposure to backend owner. Check stable idempotency and exact totals under repeated-click/timeouts; no frontend masking is proof of backend authorization.

**14.C — PWA, performance and network resiliency**

> Exercise production build with service worker, manifest, IndexedDB migrations, snapshot partition, offline queue, sync replay and user switch. Profile network-request budgets for login → business chooser → category filter → 1 sale → order history → reports; ensure no `/users/me` loop, category GET storm, repeated refresh, excessive list refetch or per-row API calls. Test thousands of variants, stale response cancellation, concurrent mutations, browser tab reload, slow 3G/spotty network and old SW update. Measure product card/grid dimensions against baseline.

**14.D — Security/accessibility/deployment audit**

> Verify HttpOnly cookie flags/path/origin/reverse-proxy forwarding, verified session gating, CSRF design, credential redaction, security headers, no tokens in JS storage, no private Cache Storage leak, proper per-user localStorage/IndexedDB namespaces, logout unsynced queue policy, and no sensitive HR offline persist. Keyboard test variant select, dialogs/focus, form labels, tab order, disabled/feedback announcements and contrast. Validate dev/staging/prod `NEXT_PUBLIC_*` usage and server-only backend URL, never hardcoded secrets or unsafe preview flags.

**14.E — Final evidence, bug fix scope and release decision**

> Fix verified frontend regressions without expanding feature scope; rerun tests, build, E2E, screenshots and high-risk fault matrix. Produce `docs/FRONTEND_INTEGRATION_FINAL_AUDIT.md` containing actual route/API coverage, role/tenant probes, test command+output, screenshots, performance metrics, all unresolved backend/security/offline policy blockers and production environment checklist. State GO only if critical gates pass; otherwise NO-GO with reasons, owner and reproducer. Update Phase 14 ledger and STOP.

**Phase 14 hard exit:** release recommendation is supported by executable evidence; no blocker or untested critical financial/security flow is silently marked complete.

---

## 14. Acceptance test packs — reusable by every phase

### 14.1 Persona and account fixtures (create only in authorized test environments)

| Fixture persona | Example state | Minimum proof |
|---|---|---|
| Platform Super Admin | Privileged platform user | Can access verified approval/status routes; does not inherit unguarded tenant access |
| Admin A | Owns Business A with Location A1 and A2 | Can select owned businesses/locations and manage catalog/users for A; cannot query Business B |
| Admin B | Owns separate Business B | Data from Business A absent after login; backend denies A IDs |
| Cashier A1 | Assigned to A/A1 | Can use allowed register, custom sale, shift and personal advance features; no switch to A2/B |
| Suspended Cashier | Disabled by authorized Admin | Cannot silently keep online privileged access after revalidation |
| Anonymous user | No session | Redirect/403 from protected routes, no private data exposed |

Test data in disposable staging/local seed only. The plan does not authorize writing directly to an unspecified production database.

### 14.2 Required screen-state matrix

For every live screen, mark all eight states with real evidence: **loading**, **fresh populated**, **empty server response**, **filter returns none**, **validation error**, **401/403**, **disconnected**, **successful write and revalidation**. For financial mutation screens add **unknown timeout after server commit** and **repeat-click**. For offline screens add **persist commit failure** and **reconciliation reject**. When backend returns an unexpected shape, report contract drift rather than silently mapping to fake local defaults.

### 14.3 Request-count regression targets (indicative, not false backend guarantees)

- Login should make one successful login mutation and only the required session verification/refresh, **not** `/users/me` on every route and sidebar update.
- Business and location lookup should be **cached by verified tenant scope**, not refetched by each child tab/panel.
- Catalog filter change should reuse cached categories and only refetch affected scoped product/variant data when stale or filter requires backend evaluation.
- Variant selector click should be a **pure local UI update** over cached data, not a GET request for every chosen variant.
- Checkout should not automatically refetch unrelated payroll, audits or platform users; do refresh its stock/orders/shift/report dependents by appropriate invalidation semantics.
- Report navigation must fetch report data based on scope/date and avoid accidental multiple binary downloads.

These are goals to test and tune, not a prohibition against documented security-required revalidation.

### 14.4 Money, time, identity and ID invariants

```text
price.unit = integer BDT taka           (NOT paisa/cents by assumption)
variantId = real persisted Variant.id   (NOT Product.id)
categoryId = real Category.id           (NOT name/slug)
productId  = real Product.id            (NOT categoryId)
businessId = verified authorized scope  (NOT raw unvalidated localStorage)
locationId = verified authorized branch (CASHIER assignment is fixed)
order/receipt totals = backend output   (NOT JS preview treated as final)
idempotency key = stable per logical supported money mutation; not global per request
clientOrderId = immutable per offline sale; must survive retries and restarts
pending offline order != server-confirmed paid order
```

All timestamps use the backend's actual serialization and timezone contract; format UI dates deliberately, never assume a local Date object from an unparsed field. Avoid locale-coupled date parsing and floating-point financial mutation amounts. Validate server-side totals after any discount, refund or rounding logic exposed in DTO.

### 14.5 Cross-phase full-funnel scripts

**Funnel 1 — Admin initial deployment**: auth Admin → no business create → create location → create category → create product description → create first variant → stock SET → image upload → register selected variant → real paid catalog order → receipt/history → refund → reports export. Show failed validations and cache consequences at every step.

**Funnel 2 — Cashier operational day**: Cashier publicId login → assigned branch shown (not selectable) → open shift (if desired) → select catalog product variant V2 → cart update → catalog sale → quick custom sale → history/print → close shift → personal advance if permitted; no payroll/cost/Admin leakage.

**Funnel 3 — Multi-business isolation**: Admin A at A1 → open catalog/receipt → switch A2 → verify changed inventory and cart guard → logout → Admin B login → old cache/preferences absent → maliciously send A1 UUID → backend denies. Repeat with 2 browser tabs to detect in-flight response races.

**Funnel 4 — Offline seven-day case (policy contingent)**: Authorized enrollment → initial bootstrap → disconnect → offline shell cold load → queue catalog and custom sales to IndexedDB → restart after long downtime → check pending receipts → reconnect to valid account/session → sync batches with same clientOrderIds → verify accepted/duplicate/rejected reconciliation → inventory/analytics refresh. If offline entitlement for that duration is unapproved, test only the approved duration and explicitly mark week-long payments blocked.

---

## 15. Definition of a trustworthy phase-to-phase handoff

At the end of every phase, the Codex agent must output one **reusable** handoff record that a *different* Codex context can safely resume from:

```markdown
# PHASE <N> HANDOFF — <COMPLETE_VERIFIED | PARTIAL | BLOCKED_BACKEND | BLOCKED_ENV>

## Source fingerprints
- frontend repository + commit:
- backend repository + commit or archive:
- guide and plan versions:

## What truly works end-to-end
- role / route / action:
- prerequisite lookup method/path:
- mutation method/path and actual DTO file:
- response/view-model mapping and query invalidation:
- E2E scenario that passed:

## What is unfinished or blocked
- exact screen + control:
- source evidence (file + symbol + route):
- reason and likely owning team:
- security / money / offline severity:

## Storage/session decisions verified
- token HttpOnly cookie host/path and refresh design:
- user-scoped localStorage keys:
- IndexedDB schema/queue (Phase 13 onward):

## Performance and visual proof
- frontend screenshots and card dimensions:
- request count for touched flow:
- stale/cross-branch probes:

## Validation run (literal command and result)
- lint:
- typecheck:
- build:
- unit/component tests:
- browser/E2E tests:
- known unrun tests and reason:

## Next permitted work
- Exactly which Phase <N+1> prerequisites are met:
- Do not start it without explicit user authorization.
```

**Final operator note:** If a subsequent coding model cannot access the Nest backend checkout, it must clearly distinguish *historic confirmed endpoints in this document* from *current unverified source*. It can work on isolated presentational changes or noncontroversial test harnesses, but must not claim API contract verification, signed-cookie topology testing or server payments integration without real source and executable evidence.

**END OF CODEX PHASE 0–14 IMPLEMENTATION PLAYBOOK — v3.0**
