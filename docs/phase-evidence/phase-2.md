# PHASE 2 HANDOFF — PARTIAL

## Implemented APIs

- `GET /tenant/businesses`: server-truth business list with embedded authorized locations.
- `POST /tenant/business`: creates a business using the backend's singular route.
- `PATCH /tenant/businesses/:id` and `DELETE /tenant/businesses/:id`.
- `POST /tenant/locations`, `PATCH /tenant/locations/:id`, and `DELETE /tenant/locations/:id`.
- `GET /tenant/business` and `GET /tenant/locations` are declared for fixed Cashier labels without accepting arbitrary Cashier scope.

## Scope and storage behavior

- Redux contains only the current in-memory server projection; seeded tenant mocks and whole-object localStorage persistence were removed.
- Preferences store versioned, user-scoped IDs only: `stpos:v1:<userId>:selectedBusinessId` and `stpos:v1:<userId>:<businessId>:selectedLocationId`.
- Saved IDs are restored only after membership validation against the freshly authorized business/location response.
- Admins with multiple businesses receive no arbitrary default.
- Changing business/branch confirms and clears a non-empty cart, cancels scoped catalog queries, and removes stale catalog cache entries.
- Unsupported entity-code, plan, offline, cash-float, city, phone, email, and lane-count fields were removed from the live forms.
- The BFF strips `accessToken` from every JSON response and promotes renewed create/select-business tokens directly into the same HttpOnly cookie, enabling immediate access to a newly owned business without exposing the token to JavaScript.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS on the required security-warning retry; 24 routes generated.
- Anonymous protected-page probes redirect with 307 and the cross-site mutation probe returns 403. Backend API probes returned 503 because the local backend was not listening on port 3000.
- Valid authenticated CRUD/browser proof remains pending because no authorized credentials are available and the local backend did not restart for final probes.

## Status

`PARTIAL`: implementation and static validation are complete; authenticated backend/browser evidence is still required for `COMPLETE_VERIFIED`.
