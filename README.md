# SunTech POS Frontend

Next.js App Router client for the SunTech multi-tenant POS. Phase 0 is intentionally API-free at runtime: backend-shaped fixtures flow through mock query/service hooks, view-model mappers, and then page components. The real endpoint declarations remain compile-safe integration seams for later phases.

## Architecture

| Concern | Owner |
| --- | --- |
| Mock server state and mutation seams | TanStack Query-compatible hooks in `src/mocks/` and `src/features/*/api/` |
| Cart, auth session, active shift, Admin tenant selection | Vanilla Redux (`src/redux/`) |
| Domain contracts and enums | `src/types/domain.ts` |
| Backend-to-UI shaping | `src/features/*/view-models.ts` |
| Future HTTP envelope, Bearer token, idempotency | Axios (`src/lib/api-client.ts`) |
| Future endpoint definitions | `src/redux/api/baseApi.ts` plus injected modules |

The UI never imports fixture arrays directly. Feature hooks own mock access, and pages render mapped view models. Amounts are integer Bangladesh taka (BDT), not cents. Payment values are the canonical `COD`, `BKASH`, `NAGAD`, and `BANK` enums.

## Environment

Copy `.env.example` to `.env.local` for the same-origin Next gateway:

```env
SUNTECH_BACKEND_URL=http://localhost:3000/api/v1
SUNTECH_SESSION_SECRET=replace-with-at-least-32-random-characters
NEXT_PUBLIC_APP_NAME=SunTech POS
NEXT_PUBLIC_ALLOW_DEV_PREVIEW=false
```

The browser talks to `/api/v1` on the frontend origin; the server-only gateway forwards to Nest. The frontend can run separately on port 3001:

```bash
npm run dev:frontend
```

Expected backend envelopes:

```ts
{ success: true, message, data, timestamp }
{ success: false, message, fieldErrors?, timestamp }
```

## Scripts

```bash
npm run dev
npm run dev:frontend
npm run typecheck
npm run lint
npm run build
```

## Auth and tenant rules

- Admin / Super Admin login contract: `{ loginType: "ADMIN", email, password }`, then `/admin/dashboard`.
- Cashier login contract: `{ loginType: "BUSINESS_USER", publicId, password }`, then `/pos/terminal`.
- The authenticated session role is authoritative. Route-derived roles exist only for unauthenticated static preview.
- Admins explicitly choose a business and branch. Cashiers use the tenant already assigned by the authenticated session and never inherit an Admin selection.
- Checkout is permitted without an active shift. In that case the future order payload omits `shiftId`.

## Phase 0 references

- [Backend gap register](docs/frontend-backend-gap-register.md)
- [API integration plan](docs/frontend-api-integration-plan.md)
- [Page-to-API map](docs/frontend-page-api-map.md)
- [Graphify architecture](docs/frontend-architecture.html)

Brand tokens use Electric Blue `#0052FF`, Deep Navy `#070B28`, and canvas `#F8FAFC` in `src/app/globals.css`.
