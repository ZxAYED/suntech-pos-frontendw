# Suntech POS Frontend

Next.js App Router client for the Suntech multi-tenant POS. Server state lives in **TanStack Query v5**. Synchronous register state (session, cart, active shift) lives in **vanilla Redux** (`createStore` / `combineReducers`). There is **no** `@reduxjs/toolkit`.

API modules still follow an RTK-style **`baseApi` + `injectEndpoints`** pattern, implemented in `src/redux/api/` and executed through Axios + TanStack Query.

## Architecture

| Concern | Owner |
| --- | --- |
| Fetching, caching, mutations, SSR-safe QueryClient | TanStack Query (`src/lib/get-query-client.ts`) |
| Cart, auth session, shift float | Vanilla Redux (`src/redux/`) |
| HTTP envelope unwrap, Bearer token, `Idempotency-Key` | Axios (`src/lib/api-client.ts`) |
| Endpoint definitions | `src/redux/api/baseApi.ts` + injected modules |

### Redux + injected APIs

```
src/redux/
  store.ts                 # createAppStore() per-request factory
  actions/  reducers/
  api/
    createApi.ts           # createApi / injectEndpoints factory
    baseApi.ts             # tag types + shared API
    authApi.ts             # injectEndpoints({ login, me, ... })
    catalogApi.ts
    shiftsApi.ts
    ordersApi.ts
    usersApi.ts
    payrollApi.ts
    reportsApi.ts
```

Each `injectEndpoints` module maps to TanStack Query hooks (`useLoginMutation`, `useSearchVariantsQuery`, …). Mutating HTTP methods always receive a UUID v4 `Idempotency-Key`. Monetary fields are **integer cents**.

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Backend envelopes:

```ts
{ success: true, message, data, timestamp }   // 2xx → unwrapped to data
{ success: false, message, timestamp }        // 4xx/5xx → ApiClientError
```

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Auth routing

- Admin / Super Admin: `POST /auth/login` with `{ loginType: "ADMIN", email, password }` → `/admin/dashboard`
- Cashier: `{ loginType: "BUSINESS_USER", publicId, password }` → `/pos/terminal`

Cashiers cannot proceed on the terminal until `POST /shifts/open` succeeds.

## Architecture diagram

Interactive graphify extract (code-only AST, 461 nodes / 1195 edges):

- [docs/frontend-architecture.html](docs/frontend-architecture.html)
- Module overview: [docs/frontend-architecture.svg](docs/frontend-architecture.svg)

```bash
graphify extract . --code-only --no-cluster --out .
graphify export callflow-html graphify-out/graph.json --output docs/frontend-architecture.html --lang en
```

## Brand tokens

Electric Blue `#0052FF`, Deep Navy `#070B28`, canvas `#F8FAFC`. Mapped as HSL CSS variables in `src/app/globals.css`.
