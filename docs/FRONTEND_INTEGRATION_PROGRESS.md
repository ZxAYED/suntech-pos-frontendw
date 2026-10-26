# SunTech POS Frontend Integration Progress

Last updated: 2026-10-26

## Repository fingerprints

- Frontend baseline: `c1abaa9a350b5833850589dd9f4cf8a7291ff005` plus the uncommitted Phase 0 preparation supplied in this workspace.
- Backend source reviewed read-only: `34b6a2f9a583cc601fb5bbbf1d5789117e682a29` at `D:\Project\SuntechPOS-backend`.
- Plan: `frontend-api-integration-plan.md`, v3.0 dated 2026-10-26.
- Guide: `SunTech_POS_AI_Agent_Frontend_Integration_Guide.md`.

## Phase status

| Phase | Status | Evidence | Next gate |
| --- | --- | --- | --- |
| 0 | COMPLETE (static preparation) | Backend-shaped mocks, view models, explicit role/tenant boundaries, page/API map and gap register; typecheck/lint/build passed before Phase 1. | Superseded mocks may only be removed screen-by-screen. |
| 1 | PARTIAL — code complete, live credential proof pending | `docs/phase-evidence/phase-1.md` | Valid Admin/Cashier/Super Admin credentials and browser cookie inspection are required before `COMPLETE_VERIFIED`. |
| 2 | PARTIAL — code complete, live credential proof pending | `docs/phase-evidence/phase-2.md` | Validate Admin CRUD and Cashier fixed scope with authorized credentials. |
| 3 | PARTIAL — code complete, live credential proof pending | `docs/phase-evidence/phase-3.md` | Validate hierarchy CRUD, conflicts, and resumable first-variant flow with authorized credentials. |
| 4 | PARTIAL — code complete, live credential proof pending | `docs/phase-evidence/phase-4.md` | Validate branch stock and Cloudinary media flows with authorized credentials. |
| 5 | NOT STARTED | — | Depends on verified Phase 2 tenant scope. |

## API implementation ledger

| API | UI owner | State | Validation/evidence |
| --- | --- | --- | --- |
| `POST /auth/register` | `/register` | REAL | Actual `fullName`, `email`, `password`, optional `phoneNumber`; pending-approval UX; build/typecheck/lint passed. |
| `POST /auth/login` | `/login` | REAL | Admin email and Cashier Public ID DTOs; backend role controls destination; Next gateway strips JSON access token and forwards HttpOnly cookies. Invalid-login live probe is required after production build starts. |
| `POST /auth/refresh` | Axios response recovery | REAL | One shared in-flight refresh; one automatic retry for GET/HEAD/OPTIONS only; auth lifecycle and financial mutations are not looped/replayed. |
| `POST /auth/logout` | Sidebar/navbar | REAL | Backend revocation attempted, signed Next session cleared, Query cache and Redux auth/cart/shift/tenant state purged; disconnected warning is explicit. |
| `GET /users/me` | Recovery only | DECLARED, NOT USED BY ROUTES | No per-page waterfall. Signed HttpOnly session projection restores the login response profile. |
| `POST /auth/forgot-password` | `/forgot-password` | REAL | Admin email with `loginType: ADMIN`; enumeration-safe success copy. |
| `POST /auth/verify-otp` | `/reset-password` | REAL | Six-digit OTP maps to short-lived `resetToken`. |
| `POST /auth/reset-password` | `/reset-password` | REAL | Uses `{resetToken,newPassword}` and backend password complexity. |
| `GET /api/session` | Root provider | REAL NEXT SESSION | Verifies HMAC-signed HttpOnly identity projection; one restore request per browser load, no Nest profile call. |
| `/api/v1/*` | Same-origin gateway | REAL NEXT BFF | Server-only upstream, cookie and `Set-Cookie` forwarding, renewed JSON access tokens promoted to HttpOnly cookie then stripped, origin/Sec-Fetch-Site mutation guard, no-store responses. |
| `GET /tenant/businesses` | Business/branch hub | REAL | Authorized businesses are server truth; saved IDs are restored only after membership validation. |
| `POST /tenant/business` | Business/branch hub | REAL | Correct singular backend route; response JWT is stripped by the gateway. |
| `PATCH/DELETE /tenant/businesses/:id` | Business/branch hub | REAL | Name-only supported edit and guarded delete. |
| `POST/PATCH/DELETE /tenant/locations[/:id]` | Business/branch hub | REAL | Name/address only; mutations invalidate user-scoped tenant cache. |
| `GET/POST/PATCH/DELETE /catalog/categories[/:id]` | Admin catalog | REAL | UUID filters, real names/descriptions, shared catalog invalidation. |
| `GET/POST/PATCH/DELETE /catalog/products[/:id]` | Admin catalog | REAL | Description/category support; parent ID retained until first variant succeeds. |
| `GET/POST/PATCH/DELETE /catalog/variants[/:id]` | Admin catalog | REAL | Product relationship, SKU/barcode/prices, add/edit/delete; no fake parent stock. |
| `PATCH /catalog/variants/:id/stock` | Stock dialog | REAL | Absolute `set` operation scoped to selected business/location. |
| `/variants/:variantId/profile-image` | Variant media dialog | REAL | Multipart `file` upload and delete. |
| `/variants/:variantId/images[/:imageId]` | Variant media dialog | REAL | Multipart `images` gallery list/upload/remove. |

## Active authenticated storage design

- Backend `accessToken` and `refreshToken`: backend-issued HttpOnly cookies forwarded by the same-origin Next gateway. Never copied to localStorage, Redux, IndexedDB, readable cookies, logs, or browser JSON.
- UI identity projection: HMAC-signed HttpOnly `suntech_session`; contains the safe login `user` projection and issue time, no JWT.
- Redux: in-memory `user` only; `hydrated` prevents private shell flashes.
- Phase 2 tenant preferences store only validated, versioned, user-scoped IDs; Phase 13 IndexedDB remains unimplemented.

## Screen-by-screen API coverage

| Screen | Phase 1 state |
| --- | --- |
| Login | Real Admin/Cashier mutation, backend-role redirect, pending and error feedback. |
| Register | Real pending-approval Admin registration. Demo plan/store claims removed. |
| Forgot/reset | Real forgot → OTP verify → reset-token password update sequence. |
| Protected shell | Signed-session restore, role-derived navigation, no role switcher, real logout. |
| Super Admin | Minimal role-safe landing; platform user APIs explicitly deferred. |
| Tenant selection | Real business/location CRUD and validated scope restore; authenticated E2E proof pending. |
| Catalog | Real hierarchy CRUD, resumable product wizard, branch stock, and variant media; authenticated E2E proof pending. |
| POS/HR/reports | Phase 0 adapters remain until their numbered phase; not represented as live. |

## Last completed phase

Phases 2–4 implementation code is complete but remains `PARTIAL` until valid authenticated tenant, catalog, branch-stock, and media evidence is available.

## Repository security blocker

Immediately before push, `git fetch origin` showed `origin/main` had been force-updated from local safe commit `c1abaa9` to divergent commit `40cc31e`. The remote commit reintroduces `api.js`, runs it before `dev`/`build`/`start`, and appends an obfuscated executable payload to `eslint.config.mjs`. This work must not merge that commit. A separate safe review branch is used until the repository owner explicitly authorizes restoring/replacing `main`.
