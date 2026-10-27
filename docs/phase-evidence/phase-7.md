# PHASE 7 HANDOFF — PARTIAL

## Source and contract proof

- Backend catalog order controller, DTO, service, variant presentation, and `@Idempotent()` decoration were reviewed at backend commit `34b6a2f9a583cc601fb5bbbf1d5789117e682a29`.
- The integration guide and Phase 7 long prompt plus 7.A–7.E packet were read before implementation.

## What is implemented

- Admin and Cashier terminals use real categories/products/branch variants. One compact card is rendered per parent product in the existing `xl:grid-cols-4` grid with unchanged `aspect-[4/3]` image area.
- Multi-variant products have a single-line accessible selector inside the card; Add is separate. Selection updates image, SKU/name, price, and branch stock without a request.
- Cart identity is `variantId`; variants from the same product coexist. Quantity is capped to last known branch stock.
- Variants are refetched before checkout. Price, activation, or stock drift updates/preserves the ticket and requires explicit review.
- `POST /orders/catalog` sends exact lines, integer tender, payment method, optional active shift, and Admin scope only. It uses one stable key per logical attempt.
- Cart clearing and receipt rendering happen only after a backend order response. Unknown network outcome locks editing and offers same-key retry.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint -- --quiet`: PASS.
- Browser screenshot/card measurement: NOT RUN; no browser automation script is installed.
- Authenticated paid checkout/stock delta/idempotent replay: NOT RUN; no disposable credentials and sale dataset were supplied.

## Exit verdict

`PARTIAL`: code and static gates pass. Financial completion remains unclaimed until a disposable backend proves V1/V2 selection, backend totals, stock result, scope rejection, and timeout replay.

## Next permitted work

Phase 8 custom sale is explicitly authorized and implemented next.
