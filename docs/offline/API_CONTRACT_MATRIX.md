# Live API contract matrix

Reviewed 21 November 2026 against the backend working tree at cdcde71 plus local changes. Paths below use the Nest /api/v1 prefix except the root health probe at /. The frontend forwards requests through its same-origin /api/v1 proxy. Rows come from controller decorators and parameter types. Source references are relative to the backend repository.

## Scope and response conventions

- Login, refresh and recovery have credential-specific validation. JWT-protected methods receive the authenticated actor. RolesGuard uses method roles before class roles. Throttling is global.
- Platform administration acts on the target account. Tenant administration resolves owner and selected business. Cashier catalog, register and shift operations use the assigned tenant and branch. Admin checkout and offline bootstrap/sync require an owned business and matching branch. Order listing and reporting use route-specific authorized filters. Apply DTO and service checks before interpreting optional query scope. Admin payroll, expense and advance operations also validate the target employee or business. Super Admin context depends on the route.
- Normal JSON routes use the backend transform/error envelope. Exports and uploaded media have specific binary/multipart contracts. An HTTP key denotes @Idempotent. The 24-hour interceptor reserves a PostgreSQL record, checks request hash and stores a success after handler completion. A lost acknowledgment requires reconciliation. A dash indicates no such decorator.
- Next GET /api/session reads the seven-day signed projection. DELETE /api/session expires local cookies. GET/HEAD /api/warmup returns 204 even on upstream failure. The BFF forwards cookies, conditional headers and idempotency keys and sets no-store. See src/app/api and src/proxy.ts in the frontend.

## Financial and offline contracts

| Endpoint | Request and response details |
|---|---|
| GET /offline/bootstrap | OfflineContextQueryDto. The service checks Admin ownership and location membership or uses Cashier assignments. RepeatableRead returns nested active categories, products, variants, branch stock, image URLs, actor, tender enum, timezone, clock skew and snapshot time. No signed, device-bound offline grant, order history, or deletion cursor in this DTO. |
| POST /orders/catalog and /orders/custom | CreateCatalogOrderDto and CreateCustomOrderDto. Catalog uses real variant IDs, server pricing and stock updates. Custom lines carry names and whole-BDT prices. Shift association is optional. COD, BKASH, NAGAD and BANK are manual tenders. Confirmed responses carry order/invoice details. |
| POST /orders/sync | SyncOrdersDto requires deviceId and 1–100 orders. Each SyncOrderItemDto has a v4 clientOrderId, offset-aware occurredAt, orderType, tenderedAmount and lines with quantity/unitPrice. shiftId can be null. The result has serverTime and ordered ACCEPTED, DUPLICATE or REJECTED outcomes with optional official IDs, warnings and error details. Check each item even on HTTP 200. |
| Replay | Order.clientOrderId is globally unique. Service checks existing scope and actor/device metadata, compares the canonical SHA-256 fingerprint, and resolves a concurrent insert collision by reading the winner. Legacy unhashed rows have a separate administrative confirmation path. The hash migration is present only in the dirty working tree. No migration deployment or PostgreSQL crash/race guarantee verified here. |
| POST /orders/:id/refunds | CreateRefundDto carries items with orderItemId and quantity, optional reason, businessId and payoutShiftId. The live refund uses HTTP-key replay and cumulative line validation. The order batch has no refund item type. No 30-day durable refund replay/status contract was found. |
| Other writes | No generic offline Admin, shift or payroll command ledger was located. The online idempotency interceptor records the response separately from the domain transaction. Preserve original paid evidence when a response or replay record is uncertain. |

## Controller inventory

97 handlers inspected.

| Method and route | Role | Guards | Inputs | Replay | Result or effect | Source |
|---|---|---|---|---|---|---|
| GET `/admin/dashboard/overview` | ADMIN, SUPER_ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query AdminDashboardScopeQueryDto | — | Dashboard overview loaded | `src/admin/admin-dashboard.controller.ts:52` |
| GET `/admin/dashboard/inventory-alerts` | ADMIN, SUPER_ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query AdminDashboardScopeQueryDto | — | Inventory alerts loaded | `src/admin/admin-dashboard.controller.ts:70` |
| GET `/admin/dashboard/recent-activity` | ADMIN, SUPER_ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query AdminDashboardRecentActivityQueryDto | — | Recent activity loaded | `src/admin/admin-dashboard.controller.ts:88` |
| GET `/admin/users` | SUPER_ADMIN | JwtAuthGuard, RolesGuard | Query ListAdminUsersQueryDto | — | Admin accounts loaded | `src/admin/admin.controller.ts:50` |
| PATCH `/admin/users/:id/approve` | SUPER_ADMIN | JwtAuthGuard, RolesGuard | Param id string | — | Admin account approved | `src/admin/admin.controller.ts:75` |
| PATCH `/admin/users/:id/status` | SUPER_ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateUserStatusDto | — | Admin status updated | `src/admin/admin.controller.ts:97` |
| GET `/` | Public | — | — | — | Service is running | `src/app.controller.ts:19` |
| POST `/auth/register` | Public | — | Body RegisterDto | — | Registration submitted for approval | `src/auth/auth.controller.ts:56` |
| POST `/auth/login` | Public | — | Body LoginDto; Res { passthrough: true } Response | — | Login successful | `src/auth/auth.controller.ts:77` |
| POST `/auth/refresh` | Public | — | Body RefreshTokenDto; Req Request; Res { passthrough: true } Response | — | Access token refreshed | `src/auth/auth.controller.ts:103` |
| POST `/auth/logout` | Public | — | Req Request; Res { passthrough: true } Response | — | Logged out successfully | `src/auth/auth.controller.ts:128` |
| POST `/auth/force-logout` | ADMIN | JwtAuthGuard, RolesGuard | Body ForceLogoutDto | — | Cashier force-logged out | `src/auth/auth.controller.ts:172` |
| POST `/auth/forgot-password` | Public | — | Body ForgotPasswordDto | — | Password reset code sent | `src/auth/auth.controller.ts:223` |
| POST `/auth/verify-otp` | Public | — | Body VerifyOtpDto | — | Reset code verified | `src/auth/auth.controller.ts:238` |
| POST `/auth/reset-password` | Public | — | Body ResetPasswordDto | — | Password updated | `src/auth/auth.controller.ts:253` |
| POST `/catalog/categories` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateCategoryDto | — | Category created | `src/catalog/category.controller.ts:60` |
| GET `/catalog/categories` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query ListCategoriesQueryDto | — | Categories loaded | `src/catalog/category.controller.ts:99` |
| GET `/catalog/categories/:id` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Category loaded | `src/catalog/category.controller.ts:132` |
| PATCH `/catalog/categories/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateCategoryDto; Query businessId string | — | Category updated | `src/catalog/category.controller.ts:161` |
| DELETE `/catalog/categories/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Category removed | `src/catalog/category.controller.ts:191` |
| POST `/catalog/products` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateProductDto | — | Product created | `src/catalog/product.controller.ts:60` |
| GET `/catalog/products` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query ListProductsQueryDto | — | Products loaded | `src/catalog/product.controller.ts:108` |
| GET `/catalog/products/summary` | ADMIN, CASHIER, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Query businessId string; Query locationId string | — | Products summary loaded | `src/catalog/product.controller.ts:137` |
| GET `/catalog/products/metrics` | ADMIN, CASHIER, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Query businessId string; Query locationId string | — | Products summary loaded | `src/catalog/product.controller.ts:152` |
| GET `/catalog/products/stats` | ADMIN, CASHIER, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Query businessId string; Query locationId string | — | Products summary loaded | `src/catalog/product.controller.ts:167` |
| GET `/catalog/products/:id` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Param id string; Query businessId string; Query locationId string | — | Product loaded | `src/catalog/product.controller.ts:203` |
| PATCH `/catalog/products/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateProductDto; Query businessId string | — | Product updated | `src/catalog/product.controller.ts:238` |
| DELETE `/catalog/products/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Product removed | `src/catalog/product.controller.ts:269` |
| POST `/variants/:variantId/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | Param variantId string; UploadedFile UploadedImage; Query businessId string | — | Variant image updated | `src/catalog/variant-image.controller.ts:82` |
| DELETE `/variants/:variantId/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | Param variantId string; Query businessId string | — | Variant image removed | `src/catalog/variant-image.controller.ts:118` |
| GET `/variants/:variantId/images` | ADMIN | JwtAuthGuard, RolesGuard | Param variantId string; Query businessId string | — | Variant images loaded | `src/catalog/variant-image.controller.ts:147` |
| POST `/variants/:variantId/images` | ADMIN | JwtAuthGuard, RolesGuard | Param variantId string; Query businessId string | — | Variant images uploaded | `src/catalog/variant-image.controller.ts:191` |
| DELETE `/variants/:variantId/images/:imageId` | ADMIN | JwtAuthGuard, RolesGuard | Param variantId string; Param imageId string; Query businessId string | — | Variant image removed | `src/catalog/variant-image.controller.ts:226` |
| POST `/catalog/variants` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateVariantDto | — | Variant created | `src/catalog/variant.controller.ts:63` |
| GET `/catalog/variants` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query ListVariantsQueryDto | — | Variants loaded | `src/catalog/variant.controller.ts:132` |
| GET `/catalog/variants/:id` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Param id string; Query businessId string; Query locationId string | — | Variant loaded | `src/catalog/variant.controller.ts:166` |
| PATCH `/catalog/variants/stock` | ADMIN | JwtAuthGuard, RolesGuard | Body UpdateVariantStockDto; Query businessId string | HTTP key | Variant stock updated | `src/catalog/variant.controller.ts:201` |
| PATCH `/catalog/variants/:id/stock` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateVariantStockDto; Query businessId string | HTTP key | Variant stock updated | `src/catalog/variant.controller.ts:246` |
| POST `/catalog/variants/:id/stock` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateVariantStockDto; Query businessId string | HTTP key | Variant stock updated | `src/catalog/variant.controller.ts:287` |
| PATCH `/catalog/variants/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateVariantDto; Query businessId string | — | Variant updated | `src/catalog/variant.controller.ts:325` |
| DELETE `/catalog/variants/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Variant removed | `src/catalog/variant.controller.ts:356` |
| GET `/audit-logs` | ADMIN | JwtAuthGuard, RolesGuard | Query ListAuditLogsQueryDto | — | Audit logs loaded | `src/common/audit/audit.controller.ts:23` |
| GET `/audit-logs/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Audit log loaded | `src/common/audit/audit.controller.ts:32` |
| POST `/expenses` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateExpenseDto | HTTP key | Expense recorded successfully | `src/expenses/expense.controller.ts:56` |
| GET `/expenses` | ADMIN | JwtAuthGuard, RolesGuard | Query ListExpensesQueryDto | — | Expenses retrieved successfully | `src/expenses/expense.controller.ts:106` |
| GET `/expenses/summary` | ADMIN | JwtAuthGuard, RolesGuard | Query ExpenseSummaryQueryDto | — | Expense summary retrieved successfully | `src/expenses/expense.controller.ts:154` |
| PATCH `/expenses/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateExpenseDto | — | Expense updated successfully | `src/expenses/expense.controller.ts:173` |
| DELETE `/expenses/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Expense deleted successfully | `src/expenses/expense.controller.ts:196` |
| POST `/advances` | CASHIER | JwtAuthGuard, RolesGuard | Body CreateAdvanceDto | HTTP key | Advance recorded | `src/hr/advance.controller.ts:65` |
| GET `/advances` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query ListAdvancesQueryDto | — | Advances loaded | `src/hr/advance.controller.ts:119` |
| GET `/advances/summary` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query AdvanceSummaryQueryDto | — | Advance summary loaded | `src/hr/advance.controller.ts:163` |
| DELETE `/advances/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Advance removed | `src/hr/advance.controller.ts:197` |
| GET `/payroll/summary` | ADMIN | JwtAuthGuard, RolesGuard | Query PayrollHistoryQueryDto | — | Payroll summary loaded | `src/hr/payroll.controller.ts:75` |
| POST `/payroll/disburse` | ADMIN | JwtAuthGuard, RolesGuard | Body DisbursePayrollDto | HTTP key | Payroll disbursed | `src/hr/payroll.controller.ts:98` |
| POST `/payroll/process` | ADMIN | JwtAuthGuard, RolesGuard | Body ProcessPayrollDto | HTTP key | Payroll processed | `src/hr/payroll.controller.ts:125` |
| GET `/payroll/history` | ADMIN | JwtAuthGuard, RolesGuard | Query PayrollHistoryQueryDto | — | Payroll history loaded | `src/hr/payroll.controller.ts:168` |
| GET `/payroll` | ADMIN | JwtAuthGuard, RolesGuard | Query PayrollHistoryQueryDto | — | Payroll history loaded | `src/hr/payroll.controller.ts:210` |
| GET `/offline/bootstrap` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query OfflineContextQueryDto | — | Offline checkout snapshot loaded | `src/offline/offline.controller.ts:32` |
| POST `/orders/catalog` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Body CreateCatalogOrderDto | HTTP key | Catalog order created | `src/orders/order.controller.ts:71` |
| POST `/orders/custom` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Body CreateCustomOrderDto | HTTP key | Custom order created | `src/orders/order.controller.ts:105` |
| POST `/orders/sync` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Body SyncOrdersDto | Per order UUID | Offline orders synchronized | `src/orders/order.controller.ts:125` |
| GET `/orders` | ADMIN, CASHIER, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Query GetOrdersQueryDto | — | Orders loaded | `src/orders/order.controller.ts:261` |
| GET `/orders/:id` | ADMIN, CASHIER, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Param id string | — | Order loaded | `src/orders/order.controller.ts:300` |
| POST `/orders/:id/confirm-legacy-sync` | ADMIN, SUPER_ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body ConfirmLegacySyncDto | — | Legacy sync order confirmed | `src/orders/order.controller.ts:330` |
| POST `/orders` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Body CreateOrderDto | HTTP key | Order completed | `src/orders/order.controller.ts:358` |
| POST `/orders/:id/refunds` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Param id string; Body CreateRefundDto | HTTP key | Refund completed | `src/orders/refund.controller.ts:60` |
| GET `/reports/export` | ADMIN | JwtAuthGuard, RolesGuard | Query ExportReportQueryDto | — | exportReport | `src/reports/export.controller.ts:87` |
| GET `/reports/dashboard` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query DashboardQueryDto | — | Dashboard loaded | `src/reports/report.controller.ts:93` |
| GET `/reports/analytics` | ADMIN | JwtAuthGuard, RolesGuard | Query AnalyticsQueryDto | — | Analytics loaded | `src/reports/report.controller.ts:156` |
| GET `/reports/transactions` | ADMIN | JwtAuthGuard, RolesGuard | Query TransactionLogQueryDto | — | Transactions loaded | `src/reports/report.controller.ts:245` |
| POST `/shifts/open` | CASHIER, ADMIN | JwtAuthGuard, RolesGuard | Body OpenShiftDto | HTTP key | Shift opened | `src/shifts/shift.controller.ts:64` |
| GET `/shifts/active` | CASHIER, ADMIN | JwtAuthGuard, RolesGuard | Query locationId string; Query businessId string | — | Active shift loaded | `src/shifts/shift.controller.ts:98` |
| POST `/shifts/close` | CASHIER, ADMIN | JwtAuthGuard, RolesGuard | Body CloseShiftDto | HTTP key | Shift closed | `src/shifts/shift.controller.ts:126` |
| POST `/shifts/:id/close` | CASHIER, ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body CloseShiftDto | HTTP key | Shift closed | `src/shifts/shift.controller.ts:154` |
| GET `/shifts` | CASHIER, ADMIN | JwtAuthGuard, RolesGuard | Query ListShiftsQueryDto | — | Shifts loaded | `src/shifts/shift.controller.ts:230` |
| GET `/tenant/businesses` | ADMIN | JwtAuthGuard, RolesGuard | — | — | Businesses loaded | `src/tenant/tenant.controller.ts:66` |
| POST `/tenant/business` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateBusinessDto | — | Business created | `src/tenant/tenant.controller.ts:92` |
| PATCH `/tenant/businesses/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateBusinessDto | — | Business updated | `src/tenant/tenant.controller.ts:122` |
| DELETE `/tenant/businesses/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string | — | Business deleted | `src/tenant/tenant.controller.ts:154` |
| DELETE `/tenant/business` | ADMIN | JwtAuthGuard, RolesGuard | Query businessId string | — | Business deleted | `src/tenant/tenant.controller.ts:194` |
| GET `/tenant/business` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query businessId string | — | Business profile loaded | `src/tenant/tenant.controller.ts:226` |
| POST `/tenant/locations` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateLocationDto | — | Location created | `src/tenant/tenant.controller.ts:253` |
| GET `/tenant/locations` | ADMIN, CASHIER | JwtAuthGuard, RolesGuard | Query businessId string; Query locationId string; Query search string | — | Locations loaded | `src/tenant/tenant.controller.ts:291` |
| PATCH `/tenant/locations/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateLocationDto | — | Location updated | `src/tenant/tenant.controller.ts:324` |
| DELETE `/tenant/locations/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string | — | Location deleted | `src/tenant/tenant.controller.ts:351` |
| POST `/tenant/business/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | UploadedFile UploadedImage; Query businessId string | — | Business image updated | `src/tenant/tenant.controller.ts:392` |
| DELETE `/tenant/business/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | Query businessId string | — | Business image removed | `src/tenant/tenant.controller.ts:424` |
| GET `/users/me` | Authenticated | JwtAuthGuard, RolesGuard | — | — | Profile loaded | `src/users/user.controller.ts:61` |
| POST `/users/me/profile-image` | Authenticated | JwtAuthGuard, RolesGuard | UploadedFile UploadedImage | — | Profile image updated | `src/users/user.controller.ts:91` |
| DELETE `/users/me/profile-image` | Authenticated | JwtAuthGuard, RolesGuard | — | — | Profile image removed | `src/users/user.controller.ts:110` |
| POST `/users/cashiers` | ADMIN | JwtAuthGuard, RolesGuard | Body CreateCashierDto | — | Cashier created | `src/users/user.controller.ts:132` |
| GET `/users/cashiers` | ADMIN | JwtAuthGuard, RolesGuard | Query ListCashiersQueryDto | — | Cashiers loaded | `src/users/user.controller.ts:153` |
| PATCH `/users/cashiers/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateCashierDto | — | Cashier updated | `src/users/user.controller.ts:176` |
| DELETE `/users/cashiers/:id` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Cashier deleted | `src/users/user.controller.ts:208` |
| PATCH `/users/:id/status` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Body UpdateUserStatusDto; Query businessId string | — | User status updated | `src/users/user.controller.ts:237` |
| POST `/users/:id/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; UploadedFile UploadedImage; Query businessId string | — | Profile image updated | `src/users/user.controller.ts:280` |
| DELETE `/users/:id/profile-image` | ADMIN | JwtAuthGuard, RolesGuard | Param id string; Query businessId string | — | Profile image removed | `src/users/user.controller.ts:309` |
