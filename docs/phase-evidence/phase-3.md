# PHASE 3 HANDOFF — PARTIAL

## Implemented APIs

- Categories: `GET/POST /catalog/categories`, `PATCH/DELETE /catalog/categories/:id`.
- Products: `GET/POST /catalog/products`, `PATCH/DELETE /catalog/products/:id`.
- Variants: `GET/POST /catalog/variants`, `PATCH/DELETE /catalog/variants/:id`.

## Relationship and workflow behavior

- The live model keeps `Product.categoryId → Category.id` and `Variant.productId → Product.id`; price, SKU, barcode, and stock remain variant fields.
- Categories, products, and variants load in parallel under user/business/location-scoped TanStack Query keys.
- Search is debounced; category filters use category UUIDs. Pagination is client-side because the inspected backend list DTOs expose no page/limit fields.
- Product creation is a two-step flow. The parent is posted exactly once, then its returned ID is retained in a versioned business-scoped incomplete draft until a first variant succeeds.
- Closing or failing step 2 leaves an explicit Resume action; retries post only the variant and cannot duplicate the product.
- Existing products can receive additional variants from the cached parent list.
- Product and variant edits/deletes and category CRUD display backend error messages and invalidate the shared catalog prefix.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS on the required security-warning retry; 24 routes generated.
- Authenticated category→product→two-variant browser/API proof is pending authorized credentials and a listening backend.

## Status

`PARTIAL`: code and static checks pass; authenticated CRUD, conflict, and cross-tenant evidence remain pending.
