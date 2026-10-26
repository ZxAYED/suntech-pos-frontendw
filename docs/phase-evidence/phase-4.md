# PHASE 4 HANDOFF — PARTIAL

## Implemented APIs

- `PATCH /catalog/variants/:id/stock` with `{operation:"set",stock,businessId,locationId}` for absolute branch quantity.
- `POST/DELETE /variants/:variantId/profile-image` using multipart field `file`.
- `GET/POST /variants/:variantId/images` using multipart field `images` for gallery uploads.
- `DELETE /variants/:variantId/images/:imageId` for gallery removal.

## Inventory and media behavior

- Reads include the verified business/location scope; branch stock comes from the backend's scoped variant projection.
- Stock input rejects negative/non-integer values in the UI and remains separate from ordinary variant metadata edits.
- Successful stock/image changes invalidate the user-scoped catalog cache; the gallery is immediately refetched after upload/removal.
- Catalog totals are computed only over the complete scoped array returned by the backend and are labeled as branch units/value.
- Profile and gallery uploads accept JPEG, PNG, and WebP controls and preserve compact `aspect-video`/`aspect-square` crops.
- No optimistic phantom stock is shown; mutation errors retain the form and display the backend message.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS on the required security-warning retry; 24 routes generated.
- Live Cloudinary upload, file-limit, concurrent branch adjustment, and role-denial proof remain pending authorized credentials/environment access.

## Status

`PARTIAL`: implementation and static validation are complete; authenticated stock/media evidence is required for `COMPLETE_VERIFIED`.
