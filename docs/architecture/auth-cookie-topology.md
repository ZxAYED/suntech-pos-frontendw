# Authentication Cookie Topology Decision

## Decision

The browser calls the Next application on its own origin. Next route handlers under `/api/v1/*` proxy to the Nest server identified by server-only `SUNTECH_BACKEND_URL`. Nest remains the authentication authority and issues `accessToken` and `refreshToken` as HttpOnly cookies. The gateway forwards every `Set-Cookie` header to the browser without exposing token values to JavaScript.

```text
Browser (http://localhost:3001)
  → /api/v1/auth/* on Next (same origin)
  → SUNTECH_BACKEND_URL (http://localhost:3000/api/v1 in local development)
  → Set-Cookie forwarded to browser-visible Next origin
```

Production uses the same topology behind HTTPS. `SUNTECH_BACKEND_URL` is never public. `SUNTECH_SESSION_SECRET` must be at least 32 characters and supplied through server secret management.

## Cookie roles

| Cookie | Issuer | Scope | Purpose |
| --- | --- | --- | --- |
| `accessToken` | Nest | HttpOnly; `/`; Secure in production; backend SameSite policy | Backend authorization. |
| `refreshToken` | Nest | HttpOnly; `/api/v1/auth`; Secure in production; backend SameSite policy | Refresh only. The Next public path intentionally matches the backend path. |
| `suntech_session` | Next | HttpOnly; `/`; signed; 7 days; Secure in production; SameSite Lax | Fast route and UI identity projection. Contains no token and cannot grant backend access. |

Next Proxy verifies the HMAC signature before optimistic role routing. Nest JWT/role/tenant guards remain final authority on every API request and re-check current account status in the database.

## CSRF and XSS boundaries

- Browser mutations must be same-origin. The gateway rejects a mismatched `Origin` and `Sec-Fetch-Site: cross-site`.
- SameSite cookies add defense in depth; production must use HTTPS.
- No token is stored in JavaScript-readable persistence or returned by the gateway’s login/refresh JSON.
- A strict Content Security Policy is still recommended before production release; it is outside this phase.

## Restore, refresh, and logout

- Login response creates the signed UI session from the backend-returned safe user projection.
- Reload calls local `GET /api/session` once; it does not call `/users/me` per route.
- Concurrent safe-read 401s share one refresh promise and retry once. Mutations are not automatically replayed.
- Logout calls Nest, clears all three cookies on their issuing paths, clears private memory state, and reports when server revocation cannot be confirmed.

