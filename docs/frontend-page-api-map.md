# Frontend Page-to-API Map

All endpoints below are future integration seams; Phase 0 pages use mock feature hooks. `businessId` and `locationId` are explicit query/payload fields where required—there is no blanket Axios tenant injection.

| Route | Role | Read dependencies / future endpoints | Mutations / payload outline | Tenant and states | Sensitive or unsupported |
| --- | --- | --- | --- | --- | --- |
| `/login` | Public | None | `POST /auth/login`; Admin `{loginType:"ADMIN",email,password}`, Cashier `{loginType:"BUSINESS_USER",publicId,password}` | No tenant; validation, pending, field/general error | Password never persisted in page state beyond form lifecycle |
| `/admin/select-business` | Admin | `GET /tenant/businesses`, `GET /tenant/locations?businessId&search` | `POST /tenant/businesses`, `PATCH/DELETE /tenant/businesses/:id`, location CRUD | Admin explicitly selects business/location; loading, empty, error, retry | Plan badges/lane counts are visual-only |
| `/admin/dashboard` | Admin | `GET /reports/dashboard?businessId&locationId&from&to`, `GET /orders?...&limit&page`, `GET /shifts?...` | None in summary cards | Requires Admin tenant; independent loading/error/empty sections | Shift telemetry is operationally sensitive |
| `/admin/catalog` | Admin | `GET /catalog/categories`, `/catalog/products`, `/catalog/variants?businessId&locationId&categoryId&search&page&limit` | Category/product create; variant create/patch and future stock mutation | Requires Admin tenant; debounced search, filters, pagination, loading/empty/error | Cost price is Admin-only; warranty/brand unsupported |
| `/admin/staff` | Admin | `GET /users/cashiers?businessId&search&status`; one cached `GET /tenant/locations?businessId` | `POST /users/cashiers`; `PATCH /users/cashiers/:id`; `PATCH /users/:id/status`; `DELETE /users/cashiers/:id` | Requires selected Admin business/branch; user+business+filters in query key; mutations invalidate staff, shift, and payroll selections | Password never enters cache/storage; salary is Admin-only; active shifts block reassignment/delete |
| `/admin/payroll` | Admin | `GET /payroll/summary`, `GET /payroll/history`, `GET /advances`, `GET /advances/summary` with tenant/period filters | `POST /payroll/process`, `/payroll/disburse`, `POST /advances`, `DELETE /advances/:id` | Requires Admin tenant; payroll/advance tabs each expose loading/empty/error | Salary is sensitive; overtime/allowances unsupported |
| `/admin/reports` | Admin | `GET /reports/dashboard`, `GET /reports/transactions` with tenant/date/range/page/limit | Future `GET /reports/export?...` download | Requires Admin tenant; range controls and section-level loading/empty/error | Bank statement and audit PDF unsupported |
| `/admin/terminal` | Admin | Cached `GET /catalog/categories`, `/products`, `/variants?businessId&locationId`; `GET /shifts/active` | Idempotent `POST /orders/catalog` with exact variant lines, integer tender, payment, optional shift, selected Admin B/L | Requires selected authorized scope; price/stock refetch before submit; confirmed order invalidates catalog/orders/reports/shift | Held tickets are tab-local; uncertain result locks draft/key; printing unavailable |
| `/admin/custom-sale` | Admin | Optional cached `GET /shifts/active`; deliberately no catalog request | Idempotent `POST /orders/custom` with free-form lines, integer tender, payment, optional shift, selected Admin B/L | Requires selected authorized scope; draft retained on errors and locked on unknown result | No stock invalidation; no unsupported category/warranty fields; printing unavailable |
| `/pos/terminal` | Cashier | Cached assigned-scope catalog reads; `GET /shifts/active` | Same catalog endpoint but no client-supplied B/L | Session assignment only; one card/product, local variant select, variant-keyed cart, stock cap and revalidation | No arbitrary scope IDs; held tickets tab-local; printing unavailable |
| `/pos/custom-sale` | Cashier | Optional cached `GET /shifts/active`; deliberately no catalog request | Same custom endpoint but no client-supplied B/L | Session assignment only; exact line validation; shift optional | Custom sale never claims inventory deduction |
| `/pos/shifts` | Cashier | `GET /shifts/active`, `GET /shifts?page&limit` | `POST /shifts/open {startingAmount,autoClosePrevious?}`; `POST /shifts/close {closingAmount,notes?}` with stable logical-operation keys | Cashier scope comes only from session token; active 404 is distinct from network failure; server pagination | Drawer cash-out is visibly disabled because no route exists; X-report unsupported |
| `/pos/orders` | Cashier | `GET /orders?businessId&locationId&search&status&paymentMethod&from&to&page&limit`, `GET /orders/:id` | `POST /orders/:id/refunds {reason,lines:[{orderLineId,quantity}]}` | Session tenant; debounced filters, pagination, list/detail/refund states | Refund permission and maximum quantities must be server-validated |

## Query and mutation conventions

- Pagination uses `page` and `limit`.
- Monetary values are integer BDT.
- Payment method storage uses `COD`, `BKASH`, `NAGAD`, or `BANK`.
- Query keys include the resource, explicit tenant scope, and all effective filters.
- Monetary or create/update mutations receive an `Idempotency-Key` when the real Axios adapter is enabled.
- Backend errors normalize to a general message plus optional field errors; accessible error panels offer retry where a read can be repeated.
