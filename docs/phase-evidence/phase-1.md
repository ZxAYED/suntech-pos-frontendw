# PHASE 1 HANDOFF — PARTIAL

## Source fingerprints

- Frontend baseline: `c1abaa9a350b5833850589dd9f4cf8a7291ff005` plus Phase 0 workspace changes.
- Backend read-only source: `34b6a2f9a583cc601fb5bbbf1d5789117e682a29`.
- Guide/plan: 2026-10-26 integration guide and v3.0 phases 0–14 plan.

## What truly works in code

- Admin/Cashier credential forms map to current `LoginDto`; destination uses returned `user.role`.
- Same-origin Next gateway forwards Nest HttpOnly cookies, strips access JWTs from browser JSON, and rejects cross-site mutations.
- Signed HttpOnly identity projection supports one local restore request and Proxy role routing without a readable role cookie.
- Safe GET 401 recovery is single-flight and one-shot; mutations are not automatically replayed.
- Logout attempts backend revocation and always purges local private query/Redux state.
- Register and Admin forgot → verify OTP → reset flows map to current backend DTOs.
- Super Admin has a role-safe landing and does not inherit store Admin navigation.

## What is unfinished or blocked

- Valid Admin, Cashier, and Super Admin end-to-end login cannot be claimed without authorized local test credentials. Backend source intentionally stores no plaintext seeded credentials.
- Browser DevTools proof of HttpOnly/Path/SameSite/Secure needs a valid login in the target environment.
- No frontend E2E framework/script exists in `package.json`; focused browser automation is therefore unrun.
- Backend availability at port 3000 was observed, but `/health` is not a declared route and returned 404.
- Phase 2 tenant integration and all later APIs remain deliberately untouched by the Phase 1 hard stop.
- `origin/main` is security-compromised at fetched commit `40cc31e` (obfuscated ESLint payload, `api.js`, and lifecycle-script execution). It was not merged. Main-branch restoration requires repository-owner authorization.

## Storage/session decisions verified

- JWTs: Nest HttpOnly cookies only through same-origin `/api/v1` gateway.
- UI identity: signed HttpOnly `suntech_session`; no JWT.
- Redux: in-memory user projection only.
- localStorage/IndexedDB: no credential or role authority.

## Performance and visual proof

- Login retains the two credential-format tabs and compact card design.
- Restore count is one local `/api/session` request per browser load; no `/users/me` route waterfall.
- Static role-switch UI is absent. Admin, Cashier, and Super Admin menus are disjoint.
- Screenshot automation is unavailable in the current repository and remains unrun.

## Validation run

- `npm run typecheck`: PASS after Phase 1 implementation.
- `npm run lint`: PASS after Phase 1 implementation.
- `npm run build`: PASS; 24 routes generated, including dynamic session/BFF handlers. Next 16.4.0 emitted a known-security-vulnerability upgrade warning.
- Unit/component tests: no frontend test script exists.
- HTTP integration probes against built Next on `localhost:3001` and live Nest on `localhost:3000`: PASS for public auth pages (200), all protected routes redirecting anonymous requests to login (307), missing session (401), invalid Admin credentials relayed from Nest (401 without auth cookie), and cross-site mutation rejection (403).
- Browser/E2E valid-role flows: pending authorized credentials; no token values were captured.

## Next permitted work

- Supply authorized disposable credentials and complete the Phase 1 live/browser hard exit.
- Only then begin Phase 2 business/location integration. Phases 3–5 retain their dependency gates.
