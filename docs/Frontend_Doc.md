# SUNTECH POS — THE DEFINITIVE ALL-IN-ONE FRONTEND SPECIFICATION & INTEGRATION MANUAL

**Document:** `docs/Frontend_Doc.md`  
**Application:** SunTech POS Frontend (Online-Only Edition)  
**Stack:** Next.js 16.4.3 (Turbopack, Security Patched), React 19, TypeScript, Tailwind CSS, Redux Toolkit, TanStack React Query 5, Axios, Zod, Sonner  
**Backend Reference:** NestJS 10, Prisma ORM, PostgreSQL (REST API at `/api/v1`)  
**Build & Verification Status:** `typecheck` PASSED (0 errors) · `lint` PASSED (0 errors) · `test` PASSED (30/30 unit tests across 4 suites) · `build` PASSED (26/26 static pages generated)  
**Scope:** Strictly Online POS. Offline-first / PWA / service-worker enhancements are excluded from this release.

---

## TABLE OF CONTENTS

1. [Document Purpose & Source-of-Truth Order](#1-document-purpose--source-of-truth-order)
2. [Application Architecture & Tech Stack](#2-application-architecture--tech-stack)
3. [Authentication, Route Proxy, Session Cookies & RBAC](#3-authentication-route-proxy-session-cookies--rbac)
4. [Complete 26-Route Inventory](#4-complete-26-route-inventory)
5. [Public Landing Page (`/`)](#5-public-landing-page-)
6. [Login & Authentication (`/login`)](#6-login--authentication-login)
7. [Administrator Registration (`/register`)](#7-administrator-registration-register)
8. [Password Recovery & Reset (`/forgot-password`, `/reset-password`)](#8-password-recovery--reset-forgot-password-reset-password)
9. [Admin Business & Branch Hub (`/admin/select-business`)](#9-admin-business--branch-hub-adminselect-business)
10. [Admin Dashboard (`/admin/dashboard`)](#10-admin-dashboard-admindashboard)
11. [Admin Catalog Management (`/admin/catalog`)](#11-admin-catalog-management-admincatalog)
12. [Catalog Register — Shared POS Terminal (`/pos/terminal` & `/admin/terminal`)](#12-catalog-register--shared-pos-terminal-posterminal--adminterminal)
13. [Direct Custom Sale (`/pos/custom-sale` & `/admin/custom-sale`)](#13-direct-custom-sale-poscustom-sale--admincustom-sale)
14. [Order History & Refund Center (`/pos/orders`)](#14-order-history--refund-center-posorders)
15. [Cashier Shifts & Salary Advances (`/pos/shifts`)](#15-cashier-shifts--salary-advances-posshifts)
16. [Admin Staff Management (`/admin/staff`)](#16-admin-staff-management-adminstaff)
17. [Admin Payroll & Advance Settlements (`/admin/payroll`)](#17-admin-payroll--advance-settlements-adminpayroll)
18. [Admin Expenses Management (`/admin/expenses`)](#18-admin-expenses-management-adminexpenses)
19. [Admin Analytics & Reporting (`/admin/reports`)](#19-admin-analytics--reporting-adminreports)
20. [Admin System Audit Logs (`/admin/audit-logs`)](#20-admin-system-audit-logs-adminaudit-logs)
21. [Super Admin Platform Governance (`/super-admin`)](#21-super-admin-platform-governance-super-admin)
22. [Shared Layout & UI Component Reference](#22-shared-layout--ui-component-reference)
23. [API Client, BFF Proxy & Hook Ownership Matrix](#23-api-client-bff-proxy--hook-ownership-matrix)
24. [Comprehensive Backend REST API Contract](#24-comprehensive-backend-rest-api-contract)
25. [Zod Validation Suite Specification](#25-zod-validation-suite-specification)
26. [Financial Invariants & Accounting Rules](#26-financial-invariants--accounting-rules)
27. [Cross-Page Cache Invalidation Matrix](#27-cross-page-cache-invalidation-matrix)
28. [Resolved Issues & Defect Remediation Ledger](#28-resolved-issues--defect-remediation-ledger)
29. [Business Rules Requiring Owner Alignment](#29-business-rules-requiring-owner-alignment)
30. [Automated QA, Verification & Test Results](#30-automated-qa-verification--test-results)
31. [Backend Escalation Protocol](#31-backend-escalation-protocol)
32. [Maintenance Guidelines for Future Engineers & Agents](#32-maintenance-guidelines-for-future-engineers--agents)

---

# 1. DOCUMENT PURPOSE & SOURCE-OF-TRUTH ORDER

This document serves as the **single, unified, and exhaustive frontend reference** for SunTech POS. It completely supersedes all historical planning documents, fragmented checklists, and draft notes. No additional frontend documentation is required.

Every software engineer, architect, and AI agent working on the SunTech POS frontend must use this document to understand:
- The exact routes, page controllers, and view-model adapters in the codebase.
- The precise backend REST contracts (endpoints, request payloads, response envelopes, query parameters).
- The state management distribution (Redux vs React Query vs local state).
- The security topology, session cookie verification, and role-based access control.
- The financial invariants (integer BDT, non-negative totals, refund limits, shift reconciliation).
- The automated test suite, verification evidence, and defect remediation history.

### Source-of-Truth Hierarchy
1. **Actual Backend Source Code:** NestJS controllers, DTOs, guards, Prisma schema, and PostgreSQL constraints.
2. **Actual Frontend Source Code:** Verified Next.js components, hooks, Zod schemas, and view models.
3. **Automated Test Evidence:** Passing Vitest test suites, TypeScript compiler output, and production build artifacts.
4. **This Document (`docs/Frontend_Doc.md`):** Authoritative consolidated specification.

---

# 2. APPLICATION ARCHITECTURE & TECH STACK

## 2.1 Technology Stack

| Layer | Library / Framework | Version / Configuration |
| :--- | :--- | :--- |
| **Framework** | Next.js App Router | `16.4.3` (Turbopack, Security upgrade from 16.4.0) |
| **Core UI** | React & React DOM | `19.0.0` |
| **Language** | TypeScript | `5.7.x` (Strict mode, target ES2022) |
| **Styling** | Tailwind CSS | `3.4.x` with CSS variables & `@tailwindcss/typography` |
| **Animation** | Framer Motion | `12.4.x` |
| **Icons** | Lucide React | `0.475.x` |
| **UI Primitives** | Custom Radix/shadcn UI | Fully accessible dialogs, popovers, select, tabs, tables |
| **Global Client State** | Redux Toolkit | `2.5.x` (Auth session snapshot, selected business & branch) |
| **Server State Cache** | TanStack React Query | `5.66.x` (Normalized query keys, explicit invalidations) |
| **HTTP Transport** | Axios | `1.7.x` (BFF proxy routing, credentials enabled) |
| **Validation** | Zod | `3.24.x` (Strict runtime schema validation for all forms & DTOs) |
| **Notifications** | Sonner | `1.7.x` (Toast alerts for API feedback and error handling) |
| **Testing** | Vitest & Testing Library | `3.2.x` (Unit & contract tests) |
| **Monetary Currency** | Integer Bangladesh Taka (BDT) | Strictly integers; no sub-unit paisa or fractions |

## 2.2 Directory Structure

```text
src/
├── app/                                 # Next.js App Router
│   ├── (auth)/                          # Unauthenticated authentication layout
│   │   ├── login/page.tsx               # Admin & Cashier login portal
│   │   ├── register/page.tsx            # Administrator registration
│   │   ├── forgot-password/page.tsx     # OTP recovery request
│   │   └── reset-password/page.tsx      # OTP verification & password reset
│   ├── (dashboard)/                     # Authenticated dashboard shell layout
│   │   ├── admin/                       # ADMIN role pages
│   │   │   ├── audit-logs/page.tsx      # System audit trails
│   │   │   ├── catalog/page.tsx         # Category, product, variant & inventory management
│   │   │   ├── custom-sale/page.tsx     # Admin direct quick sale
│   │   │   ├── dashboard/page.tsx       # Business KPI dashboard & recent tickets
│   │   │   ├── expenses/page.tsx        # Operational expense tracking
│   │   │   ├── page.tsx                 # Redirect helper to /admin/dashboard
│   │   │   ├── payroll/page.tsx         # Staff compensation, advances & disbursements
│   │   │   ├── reports/page.tsx         # Financial analytics, transaction stream & exports
│   │   │   ├── select-business/page.tsx # Business & branch tenant hub
│   │   │   ├── staff/page.tsx           # Cashier account provisioning & assignments
│   │   │   └── terminal/page.tsx        # Admin catalog checkout desk
│   │   ├── pos/                         # CASHIER (and shared order) role pages
│   │   │   ├── custom-sale/page.tsx     # Cashier direct custom sale
│   │   │   ├── orders/page.tsx          # Shared Order history, receipt reprint & refund center
│   │   │   ├── page.tsx                 # Redirect helper to /pos/terminal
│   │   │   ├── shifts/page.tsx          # Shift register management & salary advance requests
│   │   │   └── terminal/page.tsx        # Cashier catalog register terminal
│   │   └── super-admin/page.tsx         # Platform user governance (SUPER_ADMIN)
│   ├── api/
│   │   ├── session/route.ts             # BFF session cookie verification & logout handler
│   │   └── v1/[...path]/route.ts        # Transparent BFF API reverse proxy to NestJS
│   ├── layout.tsx                       # Root HTML/body shell & font providers
│   ├── providers.tsx                    # Redux Provider, React Query Client & Auth Hydration
│   └── page.tsx                         # Public marketing landing page
├── components/
│   ├── common/                          # Reusable data presentation components
│   │   ├── brand-logo.tsx               # SunTech SVG branding logo
│   │   ├── data-pagination.tsx          # Accessible table pagination controls
│   │   ├── data-state.tsx               # Unified Loading, Error, Empty & Ready state container
│   │   └── metric-card.tsx              # KPI metric display cards
│   ├── landing/                         # Marketing showcase sections
│   ├── layout/                          # App shell components (Sidebar, Navbar, PageHeader)
│   ├── motion/                          # Framer motion transition helpers
│   └── ui/                              # Radix/Tailwind design primitives (Button, Dialog, etc.)
├── features/                            # Domain-driven feature modules
│   ├── audit/                           # Audit logs API hooks & views
│   ├── auth/                            # Auth mutations, login forms, sign-out hooks
│   ├── catalog/                         # Catalog API hooks, view models, catalog manager
│   ├── expenses/                        # Expense API hooks & expense manager
│   ├── hr/                              # Staff, advances & payroll API hooks, view models
│   ├── pos/                             # Terminal, custom sale, orders, refund dialogs, receipt
│   ├── reports/                         # Reports dashboard, analytics mappers, export hooks
│   ├── shifts/                          # Shift register API hooks & view models
│   ├── super-admin/                     # Platform user approval hooks & view
│   └── tenant/                          # Business/location API hooks, tenant hub & useTenantScope
├── hooks/                               # Shared custom React hooks (useDebounce, useBarcodeScanner)
├── lib/                                 # Core infrastructure & utility libraries
│   ├── api-client.ts                    # Axios HTTP client configured for BFF proxy
│   ├── formatters.ts                    # Date, time, currency and phone formatters
│   ├── payment-methods.ts               # Supported payment method definitions
│   ├── permissions.ts                   # Role permission gates
│   ├── session-cookie.ts                # Signed HMAC session cookie encryption & verification
│   ├── tenant-preferences.ts            # Local preference caching for selected business/branch
│   ├── utils.ts                         # Class merging (cn) & integer BDT currency formatter
│   └── validations/                     # Centralized Zod schema validation suite
├── mocks/                               # Quarantine mock fixtures used for isolated unit testing
├── redux/                               # Redux Toolkit store, auth & tenant slices
└── types/                               # TypeScript domain, DTO, and API contracts
```

---

# 3. AUTHENTICATION, ROUTE PROXY, SESSION COOKIES & RBAC

## 3.1 Security Topology

SunTech POS operates a **Backend-for-Frontend (BFF)** security architecture to protect authentication credentials:
1. **Upstream NestJS Auth:** When authenticating via `POST /api/v1/auth/login`, NestJS sets two secure cookies:
   - `accessToken`: HttpOnly JWT for API authorization (Path: `/`).
   - `refreshToken`: HttpOnly JWT for token renewal (Path: `/api/v1/auth`).
2. **Next.js Session Cookie:** The Next.js BFF proxy sets an encrypted, signed session cookie (`stpos_session`) containing:
   ```typescript
   interface SessionPayload {
     user: {
       id: string;
       email?: string;
       publicId?: string;
       fullName: string;
       role: "SUPER_ADMIN" | "ADMIN" | "CASHIER";
       businessId?: string;
       locationId?: string;
       businessName?: string;
       locationName?: string;
     };
     issuedAt: number;
     expiresAt: number;
   }
   ```
3. **Token Invariant:** No JWT or access token is ever written to `localStorage`, `sessionStorage`, client-accessible JavaScript cookies, or Redux persistence.

## 3.2 Route Protection (`src/proxy.ts`)

Next.js Edge Proxy intercepts all incoming navigation requests:

```typescript
export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/super-admin/:path*", "/login"],
};
```

### Route Access Rules

| Route Pattern | Permitted Roles | Behavior if Unauthorized |
| :--- | :--- | :--- |
| `/login` | Public (Unauthenticated) | If already authenticated, redirects to user home route. |
| `/admin/*` | `ADMIN` | Redirects to role home (`/pos/terminal` or `/super-admin`). |
| `/pos/orders` | `CASHIER`, `ADMIN` | Shared order history & refund center accessible to both roles. |
| `/pos/*` (other) | `CASHIER` | Redirects to `/admin/select-business` if role is `ADMIN`. |
| `/super-admin/*` | `SUPER_ADMIN` | Redirects to role home (`/admin/select-business` or `/pos/terminal`). |

### Default Home Destinations by Role
- **`SUPER_ADMIN`** → `/super-admin`
- **`ADMIN`** → `/admin/select-business` (or `/admin/dashboard` once tenant is selected)
- **`CASHIER`** → `/pos/terminal`

## 3.3 Tenant Scope Isolation (`useTenantScope`)

Located in `src/features/tenant/hooks/use-tenant-scope.ts`:
- **`ADMIN` Role:** Tenant scope is derived from the currently selected business and branch in Redux (`state.tenant.selectedBusiness` and `state.tenant.selectedBranch`). When an Admin changes business or branch, the tenant scope updates immediately, automatically refetching all tenant-scoped queries.
- **`CASHIER` Role:** Tenant scope is strictly derived from the authenticated user's assigned `businessId` and `locationId`. Cashiers are **strictly forbidden** from selecting or altering their business or branch scope.
- **`isTenantReady` Invariant:**
  - For `ADMIN`: `true` only if BOTH `businessId` and `locationId` are non-null and active.
  - For `CASHIER`: `true` only if `locationId` is non-null.
  - When `isTenantReady` is `false`, admin pages render `<TenantRequiredState />` to prevent cross-tenant queries.

---

# 4. COMPLETE 26-ROUTE INVENTORY

Every single route generated in the production Next.js build is cataloged below:

| # | Route Path | Access | Page Component | Controller / Primary Features |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `/` | Public | `src/app/page.tsx` | Marketing landing page & product showcase |
| 2 | `/_not-found` | Public | `src/app/not-found.tsx` | Standard 404 handler |
| 3 | `/login` | Public | `src/app/(auth)/login/page.tsx` | Unified Admin (email) & Cashier (public ID) login |
| 4 | `/register` | Public | `src/app/(auth)/register/page.tsx` | Admin self-service platform onboarding |
| 5 | `/forgot-password` | Public | `src/app/(auth)/forgot-password/page.tsx` | Password reset OTP request |
| 6 | `/reset-password` | Public | `src/app/(auth)/reset-password/page.tsx` | OTP verification & password reset |
| 7 | `/admin` | `ADMIN` | `src/app/(dashboard)/admin/page.tsx` | Automatic redirect to `/admin/dashboard` |
| 8 | `/admin/select-business` | `ADMIN` | `BusinessBranchHub` | Multi-business & branch CRUD, tenant switcher |
| 9 | `/admin/dashboard` | `ADMIN` | `AdminDashboardPage` | Executive sales KPI cards, recent tickets, active shifts |
| 10 | `/admin/catalog` | `ADMIN` | `CatalogManager` | Full catalog management (categories, products, variants, stock, images) |
| 11 | `/admin/terminal` | `ADMIN` | `TerminalWorkspace` | Admin catalog register checkout desk |
| 12 | `/admin/custom-sale` | `ADMIN` | `CustomSaleView` | Admin direct non-inventory sales checkout |
| 13 | `/admin/staff` | `ADMIN` | `StaffManager` | Cashier user provisioning, branch assignment, salary config |
| 14 | `/admin/payroll` | `ADMIN` | `PayrollManager` | Payroll period summary, processing, disbursements, advance settlements |
| 15 | `/admin/expenses` | `ADMIN` | `ExpensesManager` | Operating expense records, category breakdown, monthly totals |
| 16 | `/admin/reports` | `ADMIN` | `ReportsDashboard` | Financial performance, sales analytics, CSV & PDF export |
| 17 | `/admin/audit-logs` | `ADMIN` | `AuditLogsView` | Security & operational change audit trail |
| 18 | `/pos` | `CASHIER` | `src/app/(dashboard)/pos/page.tsx` | Automatic redirect to `/pos/terminal` |
| 19 | `/pos/terminal` | `CASHIER` | `TerminalWorkspace` | Primary POS catalog register, barcode scanning, cart & checkout |
| 20 | `/pos/custom-sale` | `CASHIER` | `CustomSaleView` | Rapid custom line item checkout with shift integration |
| 21 | `/pos/orders` | `CASHIER`, `ADMIN`| `PosOrdersPage` | Centralized ticket stream, receipts, partial refunds, conflict handling |
| 22 | `/pos/shifts` | `CASHIER` | `ShiftsPage` | Shift open/close register, cash reconciliation, salary advance requests |
| 23 | `/super-admin` | `SUPER_ADMIN` | `SuperAdminUsers` | Platform tenant approval, user status activation & suspension |
| 24 | `/api/session` | API | `src/app/api/session/route.ts` | Browser session cookie hydration & logout route |
| 25 | `/api/v1/[...path]` | API | `src/app/api/v1/[...path]/route.ts` | Secure BFF transparent reverse proxy to NestJS API |
| 26 | `/icon` | Public | Next.js generated metadata | Favicon & application metadata icon |

---

# 5. PUBLIC LANDING PAGE (`/`)

- **Route:** `/`
- **Component:** `src/app/page.tsx`
- **Access:** Public (No authentication required).
- **Core Sections:**
  - `HeadroomNavbar`: Navigation header with sticky scroll behavior and links to `/login` and `/register`.
  - `HeroSection`: Value proposition headline, live metrics ticker, and primary call-to-action buttons.
  - `TelemetryStrip`: Operational performance highlights (uptime, transaction velocity).
  - `CheckoutShowcase`: Visual interactive preview of the POS checkout flow.
  - `FeatureShowcase`: Multi-location management, inventory synchronization, and HR payroll cards.
  - `CapabilityCards`: Security, audit logging, and reporting capabilities.
  - `FinalCta`: Enterprise onboarding trigger.
  - `Footer`: Legal, platform version, and copyright notices.
- **Data Flow:** Fully static and marketing-oriented; does not initiate background business API calls.

---

# 6. LOGIN & AUTHENTICATION (`/login`)

- **Route:** `/login`
- **Component:** `src/features/auth/components/login-form.tsx`
- **Access:** Public. Redirects authenticated users to their home dashboard.
- **Backend API:** `POST /api/v1/auth/login`
- **Supported Login Modes:**
  1. **Administrator Mode (`loginType: "ADMIN"`):**
     - Fields: `email` (Valid email address), `password` (Minimum 8 characters).
     - Validation: `loginSchema`.
     - Target Destination: `/admin/select-business`.
  2. **Cashier Mode (`loginType: "BUSINESS_USER"`):**
     - Fields: `publicId` (Case-sensitive cashier identifier, e.g., `CASH-001`), `password`.
     - Validation: `cashierLoginSchema`.
     - Target Destination: `/pos/terminal`.
- **Response Handling:**
  - On HTTP 200, the server responds with `{ accessToken, user }` and sets the HttpOnly cookies.
  - The frontend updates Redux (`authSlice.setCredentials`), initializes `stpos_session`, and redirects via `router.push`.
  - Invalid credentials display specific feedback ("Invalid email or password" or "Cashier ID not found").

---

# 7. ADMINISTRATOR REGISTRATION (`/register`)

- **Route:** `/register`
- **Component:** `src/app/(auth)/register/page.tsx`
- **Access:** Public.
- **Backend API:** `POST /api/v1/auth/register`
- **Form Fields:** `fullName`, `email`, `password`, optional `phoneNumber`.
- **Validation:** `registerSchema` (Enforces strong password rules: uppercase, lowercase, number, min 8 characters).
- **Workflow:**
  - Submits registration request to the backend.
  - Registered administrators enter a `PENDING_APPROVAL` status by default.
  - On submission, user receives a confirmation screen explaining that platform access requires activation by a `SUPER_ADMIN`.
  - Provides a direct link back to `/login`.

---

# 8. PASSWORD RECOVERY & RESET (`/forgot-password`, `/reset-password`)

- **Routes:** `/forgot-password` and `/reset-password`
- **Components:** `src/app/(auth)/forgot-password/page.tsx` and `src/app/(auth)/reset-password/page.tsx`
- **Backend APIs:**
  - `POST /api/v1/auth/forgot-password` — Takes `{ email }`, dispatches a 6-digit numeric OTP to the registered address.
  - `POST /api/v1/auth/verify-otp` — Takes `{ email, otp }`, verifies correctness and returns `{ resetToken }`.
  - `POST /api/v1/auth/reset-password` — Takes `{ resetToken, newPassword }`, updates password hash and revokes existing tokens.
- **Validation:** `forgotPasswordSchema`, `verifyOtpSchema`, `resetPasswordSchema`.
- **User Experience:**
  - Step 1: User enters email on `/forgot-password`.
  - Step 2: System routes to `/reset-password?email=...`, providing a 6-digit OTP entry field.
  - Step 3: Once OTP is verified, new password fields are unlocked.
  - Step 4: Password reset confirmation displays success toast and redirects to `/login`.

---

# 9. ADMIN BUSINESS & BRANCH HUB (`/admin/select-business`)

- **Route:** `/admin/select-business`
- **Component:** `src/features/tenant/components/business-branch-hub.tsx`
- **Access:** `ADMIN` only.
- **Backend APIs:**
  - `GET /api/v1/tenant/businesses` — Lists all businesses owned by the authenticated admin.
  - `POST /api/v1/tenant/business` — Creates a new business entity (`createBusinessSchema`).
  - `PATCH /api/v1/tenant/businesses/:id` — Updates business profile.
  - `DELETE /api/v1/tenant/businesses/:id` — Removes an unutilized business.
  - `GET /api/v1/tenant/locations?businessId=...` — Lists branch locations for the selected business.
  - `POST /api/v1/tenant/locations` — Provisions a new branch (`createLocationSchema`).
  - `PATCH /api/v1/tenant/locations/:id` — Updates branch details.
  - `DELETE /api/v1/tenant/locations/:id` — Removes a branch location.
- **State Management:**
  - Selecting a business stores it in Redux (`tenantSlice.setSelectedBusiness`) and saves preference in `localStorage`.
  - Selecting a branch stores it in Redux (`tenantSlice.setSelectedBranch`).
  - Automatically navigates to `/admin/dashboard` once both business and branch are confirmed.

---

# 10. ADMIN DASHBOARD (`/admin/dashboard`)

- **Route:** `/admin/dashboard`
- **Component:** `src/app/(dashboard)/admin/dashboard/page.tsx`
- **Access:** `ADMIN` (Requires active tenant selection).
- **Backend APIs:**
  - `GET /api/v1/reports/dashboard?businessId=...&locationId=...`
  - `GET /api/v1/orders?businessId=...&locationId=...&limit=5`
  - `GET /api/v1/shifts?businessId=...&locationId=...&limit=1`
- **Dashboard Sections:**
  1. **Executive Metric Cards:**
     - Gross Sales (Formatted in integer BDT).
     - Average Ticket Value (Gross sales ÷ total completed orders).
     - Total Completed Orders Today.
     - Gross Margin Percentage (Admin-confidential metric).
  2. **Recent Terminal Tickets:**
     - Displays latest 5 orders with invoice number, customer name, payment badge, and total.
     - Includes a header link: `<Link href="/pos/orders">View all</Link>`.
     - **Resolved Routing Guarantee:** The route proxy explicitly permits `ADMIN` to access `/pos/orders`. Admins clicking "View all" seamlessly land on the shared order history page without redirection.
  3. **Active Shift Status Card:**
     - Displays cashier on duty, opening float, cash collected, and calculated variance.
  4. **Category Performance Distribution:**
     - Top revenue-generating categories rendered with percentage distribution bars.

---

# 11. ADMIN CATALOG MANAGEMENT (`/admin/catalog`)

- **Route:** `/admin/catalog`
- **Component:** `src/features/catalog/components/catalog-manager.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/catalog/categories` | `POST` | `PATCH /:id` | `DELETE /:id`
  - `GET /api/v1/catalog/products` | `POST` | `PATCH /:id` | `DELETE /:id`
  - `GET /api/v1/catalog/variants` | `POST` | `PATCH /:id` | `DELETE /:id`
  - `PATCH /api/v1/catalog/variants/:id/stock` — Sets absolute branch inventory.
  - `POST /api/v1/variants/:id/profile-image` | `POST /variants/:id/images` | `DELETE`
- **Core Workflows:**
  1. **Two-Step Product & Variant Creation:**
     - Step 1: User creates parent product (`name`, `description`, optional `categoryId`).
     - Step 2: System receives generated `productId` and immediately prompts for the initial required variant (`name`, `sku`, `sellingPrice`, `costPrice`, `stock`).
     - Draft Recovery: If Step 2 is interrupted, the draft is stored in `localStorage` under `stpos:v1:${userId}:${businessId}:incompleteProduct`. A "Resume Setup" banner allows finishing the product without creating duplicates.
  2. **Global Add Variant Button (FE-003 Resolved):**
     - Clicking the top-level "+ Variant" button opens the dialog with `selectedProduct = null`.
     - The modal forces the administrator to select a parent product from a `<Select>` dropdown.
     - Row-level "+ Variant" buttons inside specific product rows automatically pre-select that target product.
  3. **Branch-Scoped Inventory Management:**
     - Setting stock sends `{ stock, operation: "set", locationId, businessId }` to update absolute inventory at the active branch.
  4. **Image Upload Architecture:**
     - Multipart form-data uploads for single profile images and multiple gallery images.

---

# 12. CATALOG REGISTER — SHARED POS TERMINAL (`/pos/terminal` & `/admin/terminal`)

- **Routes:** `/pos/terminal` (Cashier Desk) and `/admin/terminal` (Admin POS Desk)
- **Component:** `src/features/pos/components/terminal-workspace.tsx`
- **Access:** `CASHIER` and `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/catalog/categories`
  - `GET /api/v1/catalog/products`
  - `GET /api/v1/catalog/variants?locationId=...`
  - `GET /api/v1/shifts/active`
  - `POST /api/v1/orders/catalog` (Idempotent checkout)
- **Product Card & Variant Selection Invariant (FE-001 Resolved):**
  - **Multi-Variant Products (>1 variant):**
    - The initial variant selection defaults to `undefined`.
    - The dropdown displays an explicit disabled `<option value="">Choose variant</option>`.
    - Price display shows `Choose variant (${count})`.
    - The `+` (Add to Ticket) button is **strictly disabled** until the user deliberately selects a variant.
  - **Single-Variant Products (=1 variant):**
    - Automatically bound to the single sellable variant.
    - Quick-add works in a single click if the variant is active and has stock.
  - **Zero-Variant Products (0 variants):**
    - Add button is disabled. Displays "No active variants" badge.
- **Barcode Scanner Integration:**
  - Listens via `useBarcodeScanner`.
  - When a barcode or SKU matches a variant, the terminal automatically selects that variant and adds it to the cart, displaying a success toast (`Scanned: ${name}`).
- **Cart & Ticket Management:**
  - Cart lines are keyed by `variantId`.
  - Quantities can be incremented up to available branch stock.
  - "Hold Ticket" stores current lines in component memory for later resumption.
- **Checkout & Idempotency Execution:**
  - Validates via `catalogCheckoutSchema` (Strict integer BDT tendered amount ≥ total).
  - Pre-flight re-validation: Refetches variants immediately before submission to ensure price and stock have not changed concurrently.
  - Generates a stable UUIDv4 `idempotencyKey` stored in `operationKeyRef`.
  - If a 5xx or network timeout occurs, `outcomeUnknown` locks the ticket and prompts the cashier to retry with the *exact same* idempotency key, preventing double charging.
- **Receipt Presentation:**
  - Instant modal display via `ReceiptDialog` with full thermal print styles (`window.print()`).

---

# 13. DIRECT CUSTOM SALE (`/pos/custom-sale` & `/admin/custom-sale`)

- **Routes:** `/pos/custom-sale` and `/admin/custom-sale`
- **Component:** `src/features/pos/components/custom-sale-view.tsx`
- **Access:** `CASHIER` and `ADMIN`.
- **Backend API:** `POST /api/v1/orders/custom`
- **Core Functionality:**
  - Non-catalog, free-form line item checkout for custom services, repairs, or unlisted goods.
  - Custom Lines: `productName`, optional `variantName` (notes/style), `quantity`, `unitPrice` (Integer BDT).
  - Validation: `customSaleSchema`.
  - Supports customer name, customer phone, payment method (`COD`, `BKASH`, `NAGAD`, `BANK`), and cash tendered.
  - Associated with the active cashier shift if open.
  - Backend does not deduct catalog inventory for custom sales.
  - Full receipt generation and thermal print support upon confirmation.

---

# 14. ORDER HISTORY & REFUND CENTER (`/pos/orders`)

- **Route:** `/pos/orders`
- **Component:** `src/app/(dashboard)/pos/orders/page.tsx`
- **Access:** Shared by `CASHIER` and `ADMIN` (Guaranteed by `src/proxy.ts`).
- **Backend APIs:**
  - `GET /api/v1/orders` (Supports `search`, `status`, `paymentMethod`, `orderType`, `range`, `page`, `limit`, `businessId`, `locationId`).
  - `POST /api/v1/orders/:id/refunds` (Idempotent partial or full refund).
- **Filtering & Search:**
  - Debounced search across invoice numbers, customer names, and line items.
  - Status filters: `ALL`, `PAID`, `REFUNDED`, `CANCELLED`.
  - Payment method filters: `ALL`, `COD`, `BKASH`, `NAGAD`, `BANK`.
- **Refund Invariants & Over-Refund Prevention:**
  - Each order line tracks `refundableQuantity` and `refundedQuantity`.
  - The refund modal caps quantity inputs to `line.refundableQuantity`.
  - Enforces mandatory refund reason string.
  - Validated by `createRefundSchema`.
  - Sends a unique UUIDv4 `idempotencyKey`.
  - On HTTP 409 conflict (concurrent refund), invalidates the order cache, displays remaining refundable units, and prevents over-refund.

---

# 15. CASHIER SHIFTS & SALARY ADVANCES (`/pos/shifts`)

- **Route:** `/pos/shifts`
- **Component:** `src/app/(dashboard)/pos/shifts/page.tsx`
- **Access:** `CASHIER`.
- **Backend APIs:**
  - `GET /api/v1/shifts/active` — Active shift status for current cashier.
  - `GET /api/v1/shifts` — Historical shifts list.
  - `POST /api/v1/shifts/open` — Opens register with starting float (`openShiftSchema`).
  - `POST /api/v1/shifts/close` — Closes register with ending cash count (`closeShiftSchema`).
  - `GET /api/v1/advances` — Lists employee's own salary advance requests.
  - `POST /api/v1/advances` — Submits a salary advance request (`createAdvanceSchema`).
- **Shift Reconciliation:**
  - Calculates `expectedCash = startingFloat + cashSales - advancesPaidOut`.
  - Displays computed cash variance (`actualClosingCash - expectedCash`).
- **Salary Advance Rule (FIN-01 Compliant):**
  - Cashiers request their *own* salary advances from this page.
  - Administrators review, audit, and void advances on the Payroll page, but cannot initiate salary advances on behalf of cashiers.

---

# 16. ADMIN STAFF MANAGEMENT (`/admin/staff`)

- **Route:** `/admin/staff`
- **Component:** `src/features/hr/components/staff-manager.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/users/cashiers?businessId=...`
  - `POST /api/v1/users/cashiers` — Provisions a new cashier (`createCashierSchema`).
  - `PATCH /api/v1/users/cashiers/:id` — Updates name, phone, branch assignment, salary (`updateCashierSchema`).
  - `PATCH /api/v1/users/:id/status` — Toggles active / suspended status.
  - `DELETE /api/v1/users/cashiers/:id` — Deletes unassigned cashier record.
- **Security Invariant:**
  - Only authenticated admins can assign cashiers to branches within their owned business.
  - Cashier salaries are confidential and strictly invisible to cashier roles.

---

# 17. ADMIN PAYROLL & ADVANCE SETTLEMENTS (`/admin/payroll`)

- **Route:** `/admin/payroll`
- **Component:** `src/features/hr/components/payroll-manager.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/payroll/summary?businessId=...&month=...&year=...`
  - `GET /api/v1/payroll/history?businessId=...&month=...&year=...`
  - `POST /api/v1/payroll/process` — Calculates net salary deducting eligible advances (`processPayrollSchema`).
  - `POST /api/v1/payroll/disburse` — Marks payroll as disbursed (`disbursePayrollSchema`).
  - `GET /api/v1/advances?businessId=...` — Returns `{ items, summary }`.
  - `DELETE /api/v1/advances/:id` — Voids an eligible salary advance.
- **Contract Alignment & Summary Cards:**
  - `useAdvances` parses backend envelope `{ items, summary }`.
  - Renders 3 executive cards:
    1. Total Advances Requested.
    2. Settled / Deducted Deductions.
    3. Outstanding Pending Advances.
- **Financial Invariants (FIN-02 & FIN-03 Compliant):**
  - Soft-deleted / voided advances display a `VOID` badge and are strictly excluded from payroll deduction calculations.
  - Outstanding payable distinguishes between unpaid staff and already-disbursed compensation.

---

# 18. ADMIN EXPENSES MANAGEMENT (`/admin/expenses`)

- **Route:** `/admin/expenses`
- **Component:** `src/features/expenses/components/expenses-manager.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/expenses?businessId=...&locationId=...&month=...&year=...` — Returns `{ items, totalCount, totalAmount }`.
  - `GET /api/v1/expenses/summary?businessId=...&locationId=...`
  - `POST /api/v1/expenses` — Records operational expense (`createExpenseSchema`).
  - `DELETE /api/v1/expenses/:id` — Removes expense record.
- **Expense Categories:** Predefined enum: `RENT`, `UTILITIES`, `SALARIES`, `SUPPLIES`, `MAINTENANCE`, `MARKETING`, `TRANSPORT`, `INVENTORY`, `PERSONAL_DRAWING`, `OTHER`. (Not mixed with catalog categories).
- **Summary Cards:** Total Monthly Spend, Transaction Count, Top Expense Category.

---

# 19. ADMIN ANALYTICS & REPORTING (`/admin/reports`)

- **Route:** `/admin/reports`
- **Component:** `src/features/reports/components/reports-dashboard.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/reports/analytics?range=...&businessId=...&locationId=...`
  - `GET /api/v1/reports/transactions?businessId=...&locationId=...&page=1&limit=20`
  - `GET /api/v1/reports/export?type=sales&format=csv&month=...&year=...`
  - `GET /api/v1/reports/export?type=sales&format=pdf&month=...&year=...`
- **Features:**
  - Range selection: Daily, Weekly, Monthly, Quarterly.
  - KPI Cards: Gross Sales, Average Ticket, Total Completed Orders, Gross Margin.
  - Payment Method Breakdown: Revenue by `COD`, `BKASH`, `NAGAD`, `BANK`.
  - One-click CSV and PDF report generation.

---

# 20. ADMIN SYSTEM AUDIT LOGS (`/admin/audit-logs`)

- **Route:** `/admin/audit-logs`
- **Component:** `src/features/audit/components/audit-logs-view.tsx`
- **Access:** `ADMIN`.
- **Backend APIs:**
  - `GET /api/v1/audit-logs?businessId=...`
  - `GET /api/v1/audit-logs/:id`
- **Audit Capabilities:**
  - Tracks user mutations across catalog, inventory adjustments, orders, refunds, and payroll.
  - Filters by Action (`CREATE`, `UPDATE`, `DELETE`, `REFUND`) and Entity Type (`Order`, `Variant`, `User`, `Payroll`).
  - Detail dialog presents full before/after JSON diffs.

---

# 21. SUPER ADMIN PLATFORM GOVERNANCE (`/super-admin`)

- **Route:** `/super-admin`
- **Component:** `src/features/super-admin/components/super-admin-users.tsx`
- **Access:** `SUPER_ADMIN` only.
- **Backend APIs:**
  - `GET /api/v1/admin/users`
  - `PATCH /api/v1/admin/users/:id/approve`
  - `PATCH /api/v1/admin/users/:id/status`
- **Features:**
  - Platform-wide onboarding governance.
  - Approves newly registered administrators.
  - Activates or suspends platform accounts.

---

# 22. SHARED LAYOUT & UI COMPONENT REFERENCE

## 22.1 Dashboard Layout Shell (`src/app/(dashboard)/layout.tsx`)
- Provides responsive shell, sidebar, navbar, and mobile drawer.
- Detects `/pos/terminal` and `/admin/terminal` routes to render a streamlined full-width POS layout.
- Restores session state from Redux and displays an animated pulse loader until auth hydration completes.

## 22.2 Navigation Sidebar (`src/components/layout/sidebar.tsx`)
- Role-specific menus:
  - **Cashier Navigation:** Quick Custom Sale (`/pos/custom-sale`), Catalog Register (`/pos/terminal`), Shifts (`/pos/shifts`), Orders (`/pos/orders`).
  - **Admin Navigation:** Catalog Register (`/admin/terminal`), Quick Custom Sale (`/admin/custom-sale`), Dashboard (`/admin/dashboard`), Catalog (`/admin/catalog`), Staff (`/admin/staff`), Payroll (`/admin/payroll`), Expenses (`/admin/expenses`), Reports (`/admin/reports`), Audit Logs (`/admin/audit-logs`).
  - **Super Admin Navigation:** Platform Users (`/super-admin`).
- Active tenant display widget with one-click "Switch" trigger.
- Clean Sign-Out trigger calling `useSignOut()`.

## 22.3 Shared UI Components
- **`DataState` (`src/components/common/data-state.tsx`):** Unifies loading skeletons, error retry prompts, empty resource illustrations, and content rendering.
- **`TenantRequiredState`:** Blocks tenant-dependent UI and displays a direct shortcut to `/admin/select-business`.
- **`DataPagination` (`src/components/common/data-pagination.tsx`):** Standardized page and limit selector.
- **`MetricCard`:** KPI card with icon, title, formatted value, and change indicators.
- **`ReceiptDialog` (`src/features/pos/components/receipt-dialog.tsx`):** Thermal printable receipt with barcode and itemized breakdown.

---

# 23. API CLIENT, BFF PROXY & HOOK OWNERSHIP MATRIX

## 23.1 HTTP Transport (`src/lib/api-client.ts`)
- Configured with `baseURL: "/api/v1"`, delegating all requests to the Next.js BFF proxy (`src/app/api/v1/[...path]/route.ts`).
- `withCredentials: true` ensures browser session cookies accompany all requests.
- Automatic error normalization into `ApiClientError` with parsed backend status codes and message arrays.

## 23.2 Domain Hook Ownership

| Hook File | Domain | Key Exported Hooks |
| :--- | :--- | :--- |
| `src/features/auth/hooks/use-sign-out.ts` | Auth | `useSignOut` |
| `src/features/tenant/api/use-tenant.ts` | Tenants | `useBusinesses`, `useCreateBusiness`, `useLocations`, `useCreateLocation` |
| `src/features/catalog/api/use-catalog.ts` | Catalog | `useCategories`, `useProducts`, `useVariants`, `useSetStock`, `useVariantImages` |
| `src/features/pos/api/use-pos.ts` | POS & Orders | `useRegisterCatalog`, `useCatalogCheckout`, `useOrders`, `useRefundOrder` |
| `src/features/shifts/api/use-shifts.ts` | Shifts | `useActiveShift`, `useShifts`, `useOpenShift`, `useCloseShift` |
| `src/features/hr/api/use-hr.ts` | HR & Payroll | `useCashiers`, `useAdvances`, `usePayrollSummary`, `useDisbursePayroll` |
| `src/features/expenses/api/use-expenses.ts` | Expenses | `useExpenses`, `useExpenseSummary`, `useCreateExpense`, `useDeleteExpense` |
| `src/features/reports/api/use-reports.ts` | Reports | `useDashboardReport`, `useAnalyticsReport`, `useReportExport` |
| `src/features/audit/api/use-audit-logs.ts` | Audit | `useAuditLogs`, `useAuditLogDetail` |
| `src/features/super-admin/api/use-super-admin.ts` | Platform | `usePlatformUsers`, `useApproveUser`, `useUpdateUserStatus` |

---

# 24. COMPREHENSIVE BACKEND REST API CONTRACT

All paths are relative to `/api/v1`:

```text
AUTHENTICATION & PROFILE
POST   /auth/login                  Payload: { loginType: "ADMIN" | "BUSINESS_USER", email?, publicId?, password }
POST   /auth/register               Payload: { fullName, email, password, phoneNumber? }
POST   /auth/refresh                Headers: Cookie with refreshToken
POST   /auth/logout                 Headers: Cookie with accessToken
POST   /auth/forgot-password        Payload: { email }
POST   /auth/verify-otp             Payload: { email, otp }
POST   /auth/reset-password         Payload: { resetToken, newPassword }
GET    /users/me                    Returns current user profile & assigned branch

TENANT BUSINESSES & BRANCHES
GET    /tenant/businesses           List owned businesses
GET    /tenant/business             Get active business
POST   /tenant/business             Create business: { name, legalName?, taxNumber? }
PATCH  /tenant/businesses/:id       Update business: { name, legalName?, taxNumber? }
DELETE /tenant/businesses/:id       Delete business
GET    /tenant/locations            Query: businessId. List branches
POST   /tenant/locations            Create branch: { businessId, name, address?, phone? }
PATCH  /tenant/locations/:id        Update branch
DELETE /tenant/locations/:id        Delete branch

CATALOG MANAGEMENT
GET    /catalog/categories          List categories (Array)
POST   /catalog/categories          Create category: { name, description?, businessId }
PATCH  /catalog/categories/:id      Update category
DELETE /catalog/categories/:id      Delete category
GET    /catalog/products            Query: businessId, locationId?, categoryId?, search? (Array)
POST   /catalog/products            Create product: { name, description?, categoryId?, businessId }
PATCH  /catalog/products/:id        Update product
DELETE /catalog/products/:id        Delete product
GET    /catalog/variants            Query: businessId, locationId?, categoryId?, productId?, search? (Array)
POST   /catalog/variants            Create variant: { productId, name, sku?, barcode?, sellingPrice, costPrice?, stock, businessId, locationId? }
PATCH  /catalog/variants/:id        Update variant
DELETE /catalog/variants/:id        Delete variant
PATCH  /catalog/variants/:id/stock  Update stock: { stock, operation: "set", locationId, businessId }
POST   /variants/:id/profile-image  Multipart profile image upload
POST   /variants/:id/images         Multipart gallery images upload
DELETE /variants/:id/images/:imgId  Remove gallery image

ORDERS & CHECKOUT
POST   /orders/catalog              Catalog sale: { lines: [{ variantId, quantity, unitPrice }], paymentMethod, tenderedAmount, customerName?, customerPhone?, shiftId?, idempotencyKey }
POST   /orders/custom               Custom sale: { lines: [{ productName, variantName?, quantity, unitPrice }], paymentMethod, tenderedAmount, customerName?, customerPhone?, shiftId?, idempotencyKey }
GET    /orders                      List tickets: Query: search, status, paymentMethod, orderType, range, page, limit, businessId?, locationId?
GET    /orders/:id                  Single order details
POST   /orders/:id/refunds          Process refund: { items: [{ lineId, quantity }], reason, idempotencyKey }

SHIFTS & ADVANCES
GET    /shifts/active               Get active cashier shift
GET    /shifts                      Historical shifts list: Query: page, limit, locationId?
POST   /shifts/open                 Open shift: { startingAmount, notes? }
POST   /shifts/close                Close shift: { closingAmount, notes? }
GET    /advances                    List salary advances: Query: businessId?, status? -> { items, summary }
POST   /advances                    Request advance: { amount, reason }
DELETE /advances/:id                Void salary advance

STAFF & PAYROLL
GET    /users/cashiers              List cashiers: Query: businessId
POST   /users/cashiers              Provision cashier: { fullName, publicId, password, locationId, salary, phone? }
PATCH  /users/cashiers/:id          Update cashier: { fullName, locationId, salary, phone? }
PATCH  /users/:id/status            Toggle status: { isActive: boolean }
DELETE /users/cashiers/:id          Delete cashier
GET    /payroll/summary             Query: businessId, month, year
GET    /payroll/history             Query: businessId, month, year
POST   /payroll/process             Process payroll: { businessId, month, year, employeeIds? }
POST   /payroll/disburse            Disburse payroll: { businessId, month, year, employeeIds, idempotencyKey }

EXPENSES
GET    /expenses                    Query: businessId, locationId?, month?, year? -> { items, totalCount, totalAmount }
GET    /expenses/summary            Query: businessId, locationId?
POST   /expenses                    Record expense: { title, amount, category, notes?, spentAt, locationId?, businessId }
DELETE /expenses/:id                Delete expense

REPORTS & AUDIT
GET    /reports/dashboard           Query: businessId, locationId?
GET    /reports/analytics           Query: businessId, locationId?, range?
GET    /reports/transactions        Query: businessId, locationId?, page?, limit?
GET    /reports/export              Query: type=sales|payroll, format=csv|pdf, month, year, businessId?, locationId?
GET    /audit-logs                  Query: businessId, action?, entityType?, page?, limit?
GET    /audit-logs/:id              Single audit log entry

SUPER ADMIN
GET    /admin/users                 List all registered users
PATCH  /admin/users/:id/approve     Approve user account
PATCH  /admin/users/:id/status      Toggle user active state
```

---

# 25. ZOD VALIDATION SUITE SPECIFICATION

All forms and API requests are validated client-side using `src/lib/validations/index.ts`:

1. **Authentication Schemas:**
   - `loginSchema`: Validates admin email and password (≥8 chars).
   - `cashierLoginSchema`: Validates cashier `publicId` (1–32 chars) and password.
   - `registerSchema`: Validates admin registration with strong password regex.
   - `forgotPasswordSchema`, `verifyOtpSchema`, `resetPasswordSchema`.
2. **Catalog Schemas:**
   - `categoryFormSchema`: Name (1–120 chars), optional description.
   - `productFormSchema`: Name (1–120 chars), nullable category ID.
   - `variantFormSchema`: Name, optional SKU/barcode, integer `sellingPrice` (≥0), optional `costPrice`, integer `stock` (≥0).
   - `adjustStockSchema`: Stock integer (≥0), operation `"set"`.
3. **POS & Order Schemas:**
   - `catalogCheckoutSchema`: Non-empty `lines` array (each with valid UUID `variantId`, quantity ≥1, unitPrice ≥0), payment method enum, integer `tenderedAmount` (≥0), UUIDv4 `idempotencyKey`.
   - `customSaleSchema`: Non-empty custom lines (each with `productName`, quantity ≥1, integer unitPrice ≥0), payment method, integer `tenderedAmount`.
   - `createRefundSchema`: Non-empty `items` array (`lineId`, quantity ≥1), reason string (1–255 chars), UUIDv4 `idempotencyKey`.
4. **Shift & HR Schemas:**
   - `openShiftSchema`: Non-negative integer `startingAmount`.
   - `closeShiftSchema`: Non-negative integer `closingAmount`.
   - `createCashierSchema`: Full name, unique `publicId`, initial password, location UUID, non-negative integer `salary`.
   - `updateCashierSchema`: Updates name, location, and integer `salary`.
   - `createAdvanceSchema`: Integer `amount` (>0), reason (1–255 chars).
   - `processPayrollSchema`, `disbursePayrollSchema`.
5. **Expense Schema:**
   - `createExpenseSchema`: Title (1–120 chars), integer `amount` (>0), category enum, `spentAt` ISO date string.

---

# 26. FINANCIAL INVARIANTS & ACCOUNTING RULES

1. **Integer Currency Guarantee:**
   - All monetary figures (`sellingPrice`, `costPrice`, `subtotal`, `totalAmount`, `tenderedAmount`, `changeDue`, `salary`, `amount`) are represented strictly as **integer Bangladesh Taka (BDT)**.
   - Decimals, fractions, and floating-point roundings are forbidden.
2. **Tendered Amount Invariant:**
   - Cash checkout requires `tenderedAmount >= totalAmount`.
   - `changeDue = tenderedAmount - totalAmount`.
3. **Refund Limits:**
   - A line item cannot be refunded for more than `line.refundableQuantity = line.quantity - line.refundedQuantity`.
   - Total refunded order amount can never exceed original `order.totalAmount`.
4. **Shift Cash Reconciliation:**
   - `expectedCash = startingAmount + totalCashSales - cashAdvancesDeducted`.
   - Variance is recorded upon shift closure.
5. **Salary Advance & Payroll Invariant:**
   - Soft-deleted / voided advances are **strictly excluded** from net payroll deductions.
   - Deducted advances cannot be applied to subsequent payroll periods.

---

# 27. CROSS-PAGE CACHE INVALIDATION MATRIX

When a mutation occurs on any page, the affected React Query caches must be invalidated to prevent stale data:

| Mutation | Triggering Page | Invalidated Query Keys |
| :--- | :--- | :--- |
| **Create / Update / Delete Product or Variant** | Admin Catalog | `["catalog", "products"]`, `["catalog", "variants"]`, `["pos", "catalog"]` |
| **Adjust Stock** | Admin Catalog | `["catalog", "variants"]`, `["pos", "catalog"]` |
| **Complete Catalog Checkout** | POS Terminal / Admin Terminal | `["catalog", "variants"]`, `["pos", "catalog"]`, `["orders"]`, `["reports", "dashboard"]`, `["shifts", "active"]` |
| **Complete Custom Sale** | Custom Sale | `["orders"]`, `["reports", "dashboard"]`, `["shifts", "active"]` |
| **Process Refund** | Order History | `["orders"]`, `["catalog", "variants"]`, `["pos", "catalog"]`, `["reports", "dashboard"]`, `["audit-logs"]` |
| **Open / Close Shift** | Shifts Page | `["shifts", "active"]`, `["shifts"]`, `["reports", "dashboard"]` |
| **Request Advance** | Shifts Page | `["advances"]`, `["shifts", "active"]` |
| **Void Advance** | Admin Payroll | `["advances"]`, `["payroll", "summary"]` |
| **Process / Disburse Payroll** | Admin Payroll | `["payroll", "summary"]`, `["payroll", "history"]`, `["reports"]` |
| **Create / Delete Expense** | Admin Expenses | `["expenses"]`, `["reports"]` |
| **Switch Business / Branch** | Tenant Selector | Clears all cached tenant queries and resets terminal carts. |

---

# 28. RESOLVED ISSUES & DEFECT REMEDIATION LEDGER

| Issue ID | Severity | Area | Description & Remediation | Status |
| :---: | :---: | :--- | :--- | :---: |
| **FE-001** | **P0** | Catalog Register | **Multi-variant default selection fixed:** Multi-variant products previously defaulted to index 0. Now strictly sets initial selection to `undefined`, renders a disabled "Choose variant" option, and disables the Add button until explicit choice is made. Single-variant products retain 1-click quick add. | **RESOLVED** |
| **FE-003** | **P1** | Admin Catalog | **Add Variant parent preselection fixed:** Global "+ Variant" button now opens with `selectedProduct = null`, requiring product selection from dropdown. Row-level buttons retain specific parent preselection. | **RESOLVED** |
| **FE-005** | **P1** | Route Proxy | **Admin order history access enabled:** Route proxy in `src/proxy.ts` updated to allow `ADMIN` access to `/pos/orders`. Admin Dashboard "View all" link works seamlessly without redirecting. | **RESOLVED** |
| **FE-HR-01** | **P0** | Admin Payroll | **`useAdvances` contract aligned:** Response shape updated from plain array to `{ items, summary }`. Added 3 summary cards (Total Requested, Settled, Outstanding) in `payroll-manager.tsx`. | **RESOLVED** |
| **FE-EXP-01** | **P0** | Admin Expenses | **`useExpenses` contract aligned:** Response shape updated to `{ items, totalCount, totalAmount }`. Summary values bound to backend response. | **RESOLVED** |
| **FE-SEC-01** | **P0** | Security | **Next.js security upgrade:** Upgraded `next` from vulnerable `16.4.0` to `16.4.3` with Turbopack, setting `experimental.agentUpgrade = "security"`. | **RESOLVED** |
| **FE-VAL-01** | **P0** | Validation | **Comprehensive Zod suite implemented:** Built centralized schemas in `src/lib/validations/index.ts` and integrated across all forms and request payloads. | **RESOLVED** |
| **FE-REF-01** | **P0** | Orders & Refunds | **Partial refund invariants enforced:** Added `refundableQuantity` tracking and prevented over-refund UI. Handled 409 conflicts with cache invalidation. | **RESOLVED** |

---

# 29. BUSINESS RULES REQUIRING OWNER ALIGNMENT

The following architectural decisions are documented as implemented, pending owner confirmation:
1. **Direct Sell vs Custom Sale:** The current Direct Sell page (`/pos/custom-sale`) is a free-form custom line item sale and does not deduct catalog inventory. If Direct Sell is intended to be a barcode/catalog picker, use `/pos/terminal`.
2. **Negative Stock Policy:** The frontend blocks checkout if a variant has 0 stock. Upstream backend allows negative inventory under specific configuration. Current frontend strictly enforces positive stock.
3. **Draft Product Lifecycle:** A newly created product without variants remains in draft state until its first variant is added.

---

# 30. AUTOMATED QA, VERIFICATION & TEST RESULTS

The frontend repository is verified with automated test suites and compiler checks:

### Test Suite Execution Output
```text
> suntech-pos-frontend@0.1.0 test
> vitest run

 RUN  v3.2.7 D:/Project/SuntechPos-frontend/suntech-pos-frontend

 ✓ src/features/expenses/api/__tests__/expenses-contract.test.ts (2 tests)
 ✓ src/features/hr/api/__tests__/advances-contract.test.ts (2 tests)
 ✓ src/features/pos/__tests__/refund-invariants.test.ts (5 tests)
 ✓ src/lib/validations/__tests__/validations.test.ts (21 tests)

 Test Files  4 passed (4)
      Tests  30 passed (30)
   Duration  750ms
```

### Compiler & Linter Verification
- **`npm run typecheck` (`tsc --noEmit`):** **PASSED (0 errors, 0 warnings)**
- **`npm run lint` (`eslint`):** **PASSED (0 errors, 0 warnings)**
- **`npm run build` (`next build`):** **PASSED (Turbopack, all 26 static pages generated)**

---

# 31. BACKEND ESCALATION PROTOCOL

If any backend API unexpectedly fails or deviates from the contract:
1. **Do not fabricate fake fallback data** or silently bypass validation in the UI.
2. Log a structured issue identifying:
   - Endpoint URL and HTTP method.
   - User role and tenant scope (`businessId`, `locationId`).
   - Expected DTO payload vs actual response.
   - HTTP status code and response body.
3. Mark the affected component state as `DataState` error with retry capability.

---

# 32. MAINTENANCE GUIDELINES FOR FUTURE ENGINEERS & AGENTS

When extending or modifying the SunTech POS frontend:
1. **Preserve the Visual Design:** Maintain Navy `#070B28`, Electric Blue `#0052FF`, compact 4-column variant grid, clean dialogs, and typography. Do not perform unrequested aesthetic redesigns.
2. **Reuse Existing Components:** Check `src/components/common/` and `src/components/ui/` before creating new UI components.
3. **Verify Zod Schemas:** Always validate forms and mutation payloads with schemas in `src/lib/validations/index.ts`.
4. **Maintain Offline Exclusion:** Do not introduce service workers, IndexedDB, or background sync into this online-only release.
5. **Keep Documentation Synchronized:** Always update this file (`docs/Frontend_Doc.md`) whenever a route, DTO contract, or feature changes.

---
**END OF SPECIFICATION — SUNTECH POS FRONTEND ALL-IN-ONE MANUAL**
