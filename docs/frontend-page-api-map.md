# Frontend Page-to-API Map

All endpoints below are future integration seams; Phase 0 pages use mock feature hooks. `businessId` and `locationId` are explicit query/payload fields where required—there is no blanket Axios tenant injection.

| Route | Role | Read dependencies / future endpoints | Mutations / payload outline | Tenant and states | Sensitive or unsupported |
| --- | --- | --- | --- | --- | --- |
| `/login` | Public | None | `POST /auth/login`; Admin `{loginType:"ADMIN",email,password}`, Cashier `{loginType:"BUSINESS_USER",publicId,password}` | No tenant; validation, pending, field/general error | Password never persisted in page state beyond form lifecycle |
| `/admin/select-business` | Admin | `GET /tenant/businesses`, `GET /tenant/locations?businessId&search` | `POST /tenant/businesses`, `PATCH/DELETE /tenant/businesses/:id`, location CRUD | Admin explicitly selects business/location; loading, empty, error, retry | Plan badges/lane counts are visual-only |
| `/admin/dashboard` | Admin | `GET /reports/dashboard?businessId&locationId&from&to`, `GET /orders?...&limit&page`, `GET /shifts?...` | None in summary cards | Requires Admin tenant; independent loading/error/empty sections | Shift telemetry is operationally sensitive |
| `/admin/catalog` | Admin | `GET /catalog/categories`, `/catalog/products`, `/catalog/variants?businessId&locationId&categoryId&search&page&limit` | Category/product create; variant create/patch and future stock mutation | Requires Admin tenant; debounced search, filters, pagination, loading/empty/error | Cost price is Admin-only; warranty/brand unsupported |
| `/admin/staff` | Admin | `GET /users/cashiers?businessId&locationId&search&page&limit` | `POST /users/cashiers`; `PATCH /users/:id/status`; future profile edit/delete only after contract confirmation | Requires Admin tenant; loading/empty/error, pagination | Credentials and account status are sensitive; attendance/on-duty unsupported |
| `/admin/payroll` | Admin | `GET /payroll/summary`, `GET /payroll/history`, `GET /advances`, `GET /advances/summary` with tenant/period filters | `POST /payroll/process`, `/payroll/disburse`, `POST /advances`, `DELETE /advances/:id` | Requires Admin tenant; payroll/advance tabs each expose loading/empty/error | Salary is sensitive; overtime/allowances unsupported |
| `/admin/reports` | Admin | `GET /reports/dashboard`, `GET /reports/transactions` with tenant/date/range/page/limit | Future `GET /reports/export?...` download | Requires Admin tenant; range controls and section-level loading/empty/error | Bank statement and audit PDF unsupported |
| `/admin/terminal` | Admin preview | Catalog reads plus active shift and local cart | `POST /orders` `{businessId,locationId,lines,paymentMethod,customer?,shiftId?}` | Requires Admin tenant; search/category filters, catalog states; shift optional | Held tickets local-only; printing partial |
| `/admin/custom-sale` | Admin preview | Category lookup for optional classification | `POST /orders` with mapped custom lines, canonical payment, optional customer/shift | Requires Admin tenant; form validation, submit error, receipt result | Category never replaces a product/variant identity; printing partial |
| `/pos/terminal` | Cashier | `GET /catalog/categories`, `/catalog/variants?...`, `GET /shifts/active?businessId&locationId` | `POST /orders` as above | Session-assigned tenant only; catalog loading/empty/error; shift optional | No Admin tenant selector; held tickets local-only |
| `/pos/custom-sale` | Cashier | Category lookup | `POST /orders` with custom line payload | Session-assigned tenant only; validation and mutation states; shift optional | No Admin-only cost data; printing partial |
| `/pos/shifts` | Cashier | `GET /shifts/active`, `GET /shifts?businessId&locationId&page&limit` | `POST /shifts/open {businessId,locationId,openingFloat}`, `POST /shifts/close {shiftId,closingCash}` | Session tenant; active/history loading, empty, error | Drawer cash-out meaning unresolved; X-report unsupported |
| `/pos/orders` | Cashier | `GET /orders?businessId&locationId&search&status&paymentMethod&from&to&page&limit`, `GET /orders/:id` | `POST /orders/:id/refunds {reason,lines:[{orderLineId,quantity}]}` | Session tenant; debounced filters, pagination, list/detail/refund states | Refund permission and maximum quantities must be server-validated |

## Query and mutation conventions

- Pagination uses `page` and `limit`.
- Monetary values are integer BDT.
- Payment method storage uses `COD`, `BKASH`, `NAGAD`, or `BANK`.
- Query keys include the resource, explicit tenant scope, and all effective filters.
- Monetary or create/update mutations receive an `Idempotency-Key` when the real Axios adapter is enabled.
- Backend errors normalize to a general message plus optional field errors; accessible error panels offer retry where a read can be repeated.
