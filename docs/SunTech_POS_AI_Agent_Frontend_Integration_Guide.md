# SunTech POS Frontend — Source-Grounded Pre-Deployment Verification & Audit Resolution Guide

**Reviewed Snapshot**: `suntech-pos-frontend` (Branch: `codex/phase-0-1-auth-integration`)  
**Backend Reference**: `SuntechPOS-backend` (`backend(20261102-073321).zip` / live service contracts)  
**Scope**: ONLINE MVP, Multi-Tenant Retail Point-of-Sale (Admin + Cashier)  
**Status**: **P0 / P1 FINDINGS RESOLVED & CODEBASE VERIFIED**

---

## 1. Executive Summary & Verification Verdict

All critical P0 and P1 discrepancies identified in the pre-deployment audit have been remediated, verified against the backend API contracts, and validated with zero regressions across the frontend suite.

### Verification Gate Results
- **Vitest Unit & Contract Suite**: `16/16` test files passed, `114/114` tests passed (`npx vitest run`).
- **TypeScript Static Verification**: Clean compilation with 0 errors (`npm run typecheck`).
- **ESLint Code Quality**: Clean execution with 0 warnings/errors (`npm run lint`).
- **Next.js Production Build**: Turbopack production build succeeded for all 27 static and dynamic routes (`npm run build`).

---

## 2. Audit Resolution Matrix

| Priority | Finding ID | Area | Finding Summary | Resolution Summary | Codebase Locations | Automated Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **ADV-01** | Cashier salary advances | A network timeout could trigger a retry with a fresh idempotency key, risking duplicate advance payouts. | Bound cashier advance requests to scoped financial operation idempotency (`operationType: "advance_create"`). Timeouts (HTTP 0, 408, 5xx) mark the outcome as `"unknown"`, persist the key in storage, lock inputs, and force exact-key retry or verified ledger reconciliation. | [src/app/(dashboard)/pos/shifts/page.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/app/(dashboard)/pos/shifts/page.tsx), [src/lib/financial-operation.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/lib/financial-operation.ts) | [src/features/hr/api/__tests__/advances-contract.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/hr/api/__tests__/advances-contract.test.ts) |
| **P0/P1** | **ORD-01** | Financial order fields | Missing order status or payment fields silently defaulted to `PAID` or `COD`, risking display of fictitious transactions. | Implemented and exported `validateAndMapOrder()`. Validates presence and types of order ID, type, status, paymentMethod, and totalAmount, throwing descriptive errors rather than silently inventing financial state. | [src/features/pos/api/use-pos.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/api/use-pos.ts) | [src/features/pos/__tests__/api-contract-handoff.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/__tests__/api-contract-handoff.test.ts) |
| **P1** | **REF-01** | Refunds | Frontend submitted `payoutMethod` and body `orderId`, which are unsupported by backend `CreateRefundDto`. | Stripped `payoutMethod` and body `orderId` from frontend refund schema, mutation hooks, and workspace components. Aligned route payload to `POST /api/v1/orders/:id/refunds` with `{ reason, payoutShiftId, items }`. | [src/lib/validations/index.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/lib/validations/index.ts), [src/features/pos/api/use-pos.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/api/use-pos.ts), [src/features/pos/components/orders-workspace.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/components/orders-workspace.tsx) | [src/features/pos/__tests__/api-contract-handoff.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/__tests__/api-contract-handoff.test.ts) |
| **P1** | **ENUM-01** | Payment validation | Shared types permitted `CASH`, `CARD`, `BANK_TRANSFER`, whereas backend supports only `COD`, `BKASH`, `NAGAD`, `BANK`. | Restricted `PaymentMethod` in domain types and Zod schemas to `"COD" \| "BKASH" \| "NAGAD" \| "BANK"`. Replaced legacy default fallbacks with `"COD"`. Added `normalizePaymentMethod()`. Updated tests to assert rejection of unsupported methods. | [src/types/domain.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/types/domain.ts), [src/lib/validations/index.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/lib/validations/index.ts), [src/lib/payment-methods.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/lib/payment-methods.ts) | [src/features/pos/__tests__/api-contract-handoff.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/__tests__/api-contract-handoff.test.ts) |
| **P1** | **TENANT-01** | Admin selection | Frontend automatically selected first business and branch (`businesses[0]`, `branches[0]`), risking unintended operations. | Removed silent fallback. System preserves previous selection only if still owned; otherwise prompts Admin with an explicit selection requirement prior to performing branch-scoped mutations. | [src/features/tenant/components/business-branch-hub.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/tenant/components/business-branch-hub.tsx), [src/app/(dashboard)/layout.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/app/(dashboard)/layout.tsx) | [src/lib/__tests__/tenant-preferences.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/lib/__tests__/tenant-preferences.test.ts) |
| **P1** | **SCOPE-02** | Cache and stale state | Branch-switch invalidation was selective; cross-terminal catalog changes could remain cached. | On branch switch, comprehensive query cancellation and removal is triggered across all domains (`catalog`, `shifts`, `orders`, `reports`, `dashboard`, `staff`, `payroll`, `advances`, `expenses`, `audit`, `cashiers`). Configured POS catalog variants with `refetchOnWindowFocus: true` and 30-second `staleTime`. | [src/features/tenant/components/business-branch-hub.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/tenant/components/business-branch-hub.tsx), [src/features/catalog/api/use-catalog.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/catalog/api/use-catalog.ts) | Contract and build verification |
| **P1** | **REG-01** | Uncertain checkout | Manual reset could clear an uncertain transaction lock without verifying whether the sale committed on the server. | Upgraded reset flow to require explicit cashier confirmation that Order History was reviewed. Provided direct navigation links to Order History and distinct UI actions: "Retry exact draft" (retaining key) vs "I checked history (Clear lock)". | [src/features/pos/components/terminal-workspace.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/components/terminal-workspace.tsx), [src/features/pos/components/custom-sale-view.tsx](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/components/custom-sale-view.tsx) | [src/features/pos/__tests__/api-contract-handoff.test.ts](file:///d:/Project/SuntechPos-frontend/suntech-pos-frontend/src/features/pos/__tests__/api-contract-handoff.test.ts) |

---

## 3. Detailed Implementation Reference

### 3.1 ADV-01: Cashier Advance Scoped Idempotency
- **Mechanism**: Integrated `financialOperations.getOrCreateKey` with scope `{ operationType: "advance_create", userId, businessId, locationId }`.
- **Failure Classification**: Exceptions with HTTP status `0`, `408`, or `>= 500` flag the operation outcome as `"unknown"`.
- **UI Locking**: Amount and reason inputs are disabled while in uncertain state. Cashiers see an amber alert banner prompting reconciliation or exact-key retry.
- **Reconciliation Reset**: Added `handleClearUncertainAdvance` allowing cashiers to dismiss the lock only after verifying whether the advance appeared in the shift or advance ledger.

### 3.2 ORD-01 & ENUM-01: Strict Domain Enums and Order Validation
- **Domain Payment Methods**: Allowed values are strictly `"COD" | "BKASH" | "NAGAD" | "BANK"`. Legacy values (`"CASH"`, `"CARD"`, `"BANK_TRANSFER"`) are blocked at both validation schema and type levels.
- **Display vs Protocol**: Physical cash payments are transmitted as `"COD"` over the wire.
- **Order Mapper Integrity**: `validateAndMapOrder(raw)` parses required fields (`id`, `orderNumber`, `type`, `status`, `paymentMethod`, `totalAmount`) and throws `Error("Order validation failed: missing essential order fields...")` on malformed server payloads instead of silently concocting `status = "PAID"` or `paymentMethod = "COD"`.

### 3.3 REF-01: Backend Refund DTO Conformance
- **DTO Alignment**: Backend `create-refund.dto.ts` accepts `{ businessId?, payoutShiftId?, reason?, items: [{ orderItemId, quantity }] }`.
- **Eliminated Fields**: `payoutMethod` and body `orderId` have been removed from `createRefundSchema`, `useRefundOrder`, and POS order views.
- **URL Parameter Binding**: The order ID is passed strictly through the route parameter (`POST /api/v1/orders/:id/refunds`).

### 3.4 TENANT-01 & SCOPE-02: Explicit Multi-Tenant Scope & Cache Management
- **Explicit Admin Selection**: Removed automatic selection of index `0` businesses and branches. If no valid selection exists in `sessionStorage` / `localStorage`, the user is prompted to choose explicitly before initiating mutations.
- **Comprehensive Cache Flush**: When switching scopes via `chooseScope`, React Query client invalidates and removes queries for:
  - `catalog`, `categories`, `products`, `variants`
  - `shifts`, `active-shift`, `shift-summary`
  - `orders`, `order-details`
  - `reports`, `dashboard`, `admin-dashboard`
  - `staff`, `payroll`, `advances`, `expenses`, `audit-logs`, `cashiers`
- **Real-Time Freshness**: Variants query sets `refetchOnWindowFocus: true` with a 30-second `staleTime`, preventing stale pricing or inventory without aggressive polling.

### 3.5 REG-01: Two-Phase Reconciliation for Uncertain Checkouts
- **Uncertain State Detection**: When a catalog or custom sale encounters a network timeout, the checkout interface enters the `outcomeUnknown` state.
- **Lock Protection**: Cart items and payment selections are locked to prevent cart mutation.
- **History Link**: Provides a direct link to `/admin/orders` or `/pos/orders` so the operator can inspect whether the transaction registered on the server.
- **Action Separation**: Operators choose between:
  1. *Retry exact sale*: Resubmits the exact same payload and idempotency key.
  2. *I checked history (Clear lock)*: Operator explicitly confirms the order was inspected before releasing the checkout lock.

---

## 4. Release Verification Checklist

Run the following commands sequentially to confirm complete build and contract integrity:

```bash
# 1. Typecheck
npm run typecheck

# 2. Linting
npm run lint

# 3. Unit & Contract Tests
npx vitest run

# 4. Production Build
npm run build
```

**Status**: **ALL PASS (114 tests, 0 lint errors, 0 type errors, clean Next.js 16 build)**.
