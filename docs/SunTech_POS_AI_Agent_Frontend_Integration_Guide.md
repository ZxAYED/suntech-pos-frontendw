Executive Summary
We have completed a near-MVP backend for SunTech POS and are now turning full attention to the Next.js frontend. The goal is to deliver a stable, performant, and user-friendly frontend that faithfully implements the backend API. Our plan includes: (1) Implementation instructions with exact code changes (deliverable: implement.md); (2) a POS API reference linking every endpoint to UI usage and calculations (deliverable: POS.md); and (3) a backlog of future improvements (deliverable: improvements.md). We will address key issues including duplicate API calls, stale or out-of-sync state, race conditions, idempotency in mutations, data caching/invalidation, authentication/session sync, business/location switching, checkout/payment reliability, and performance (N+1/API waterfalls, render optimization). We also cover UI/UX consistency, accessibility, and testing.

Approach: We will audit the existing frontend repo (Next.js, likely using React Query or similar) and prescribe minimal, targeted fixes. Major changes will be delivered as file diffs or replacements, with tests to cover each fix. We avoid large rewrites or over-engineering. We assume the current architecture (e.g. React Query, Axios, TanStack hooks) is broadly correct but needs refinement. We will not alter any backend API contracts; any needed backend tweaks will be noted separately.

Citations: When possible, we cite authoritative guidance on React Query patterns, HTTP idempotency, Next.js environment variables, fetch vs axios tradeoffs, ARIA accessibility, etc., to justify recommendations. Each technical point is grounded in industry best practices (see e.g. Kent C. Dodds on fetch vs axios, HTTP idempotency guide, React Query docs on optimistic updates and parallel queries, Next.js env var conventions, and MDN ARIA guidelines).

Unknowns and Assumptions
Repo structure: We assume a typical Next.js layout (e.g. pages/ or src/pages/, components/, hooks/, etc.), using React Query (TanStack Query v3+) for data fetching, and an Axios (or similar) HTTP client. We assume .env.local contains NEXT_PUBLIC_API_URL. All API calls target process.env.NEXT_PUBLIC_API_URL + '/api/v1'.
State management: We assume global state is mostly managed by React Query or Context; no Redux. If any other cache (e.g. Apollo or custom) exists, similar patterns apply.
Authentication: We assume JWT tokens in cookies, with a “refresh” endpoint for session renewal. The Axios interceptors may exist but will be simplified as per best practices.
Build/Test infra: We assume existing Jest for unit tests and Playwright (or similar) for E2E. The plan includes adding tests. We assume a working npm run build and npm run test, though we couldn’t run them here.
CSS/UI library: We assume the visual design (colors, layouts) is fixed (the user said “keep existing design”). We focus on functionality, not redesign.
Back-end contracts: Use the latest backend API definitions. Where details are missing (e.g. specific JSON fields), we’ll mark them unspecified and propose reasonable defaults. We will not change backend endpoints or request/response schemas in this phase.
If any assumption is wrong (e.g. the code uses SWR instead of React Query, or Redux instead of hooks), the suggested file paths and code will need adjustment. The agent implementing this should adjust filenames accordingly.

Implementation Instructions (implement.md)
We will give concrete code changes, complete file replacements or diffs, and test updates. Each item below corresponds to one or more file modifications. The agent should apply them one by one, run npm run build and existing tests after each, and fix any new failures.

Simplify API client (Axios) and add idempotency helper: Replace the existing HTTP client (in src/lib/api-client.ts or similar) with a cleaner wrapper. The current interceptors are overly complex. We will:

Remove blanket idempotency-key header logic from all mutations. Instead, create a small helper to generate unique keys only for critical transactions (e.g. checkout, refunds). Use fetch or Axios simply for most calls.

Use the fetch API or a minimal Axios wrapper as shown by Kent C. Dodds. For example, a custom apiClient that does: fetch(API_URL + endpoint, { method, headers, body }). On response, check response.ok and throw on error. This avoids the huge interceptor logic. If cookies/auth needed, include { credentials: 'include' } in fetch.

Preserve token refresh logic: the agent code used an Axios interceptor for 401→refresh. We can move that to a simpler form, e.g. an async function authFetch(endpoint, config) that internally checks for 401 and retries once.

Code snippet (replace):

ts
Copy
// file: src/lib/api-client.ts (new implementation)
const API_URL = (typeof window !== 'undefined'
? ''
: process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, '')
) + '/api/v1';

interface ApiError { status: number; message: string; errors?: any; }

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
const url = API_URL + endpoint;
const config = {
...options,
credentials: 'include',
headers: { 'Content-Type': 'application/json', ...options.headers },
};
const res = await fetch(url, config);
if (!res.ok) {
const errorBody = await res.json().catch(() => ({}));
throw { status: res.status, ...(errorBody?.message && { message: errorBody.message }), errors: errorBody.errors } as ApiError;
}
return res.json();
}
This replaces the Axios interceptors. It is far simpler and covers most cases. No need to manually set content-type for FormData (browser does it).

Add idempotencyKey() helper: Create src/lib/idempotency.ts that exports getIdempotencyKey() generating a crypto.randomUUID() or Date.now().toString() string. Use this helper only for non-idempotent mutations. For example, in the checkout function (say src/hooks/useCheckout.ts), do:

ts
Copy
const idempKey = getIdempotencyKey();
await apiFetch('/sales/checkout', {
method: 'POST',
headers: { 'Idempotency-Key': idempKey },
body: JSON.stringify(checkoutData),
});
Cite REST idempotency rules. This ensures if the customer double-clicks “Pay” or the network blips, the server can detect and ignore the duplicate if implemented.

Modify request hooks: In any existing hooks or components that use apiClient or axios, switch to use apiFetch. E.g. in useQuery or form submit handlers. Remove old idempotency headers insertion in interceptors; now idempotency is manual as above. Do not forget to import and use the new apiFetch in all service calls. Remove any unused Axios code and interceptors.

Tests: Add/adjust unit tests for the API client. E.g. a Jest test that mocks fetch to return 401 then success, verifying a retry. (Or skip if heavy, at least test error throwing behavior.)

TanStack Query cache keys and invalidation: Review all uses of React Query (in src/hooks/ or page data fetching). Ensure:

Unique and descriptive queryKeys: Every useQuery/useMutation should use an array key, e.g. ['locations', businessId] or ['products', businessId]. Avoid dynamic keys that change incorrectly.

Cache invalidation on mutate: After any change (POST/PUT/DELETE), call queryClient.invalidateQueries({ queryKey: ['resource'] }) on the relevant key. For example, after adding a product, invalidate ['products']. This ensures fresh data.

Use useQueries or parallel queries: To avoid N+1 call waterfalls (e.g. fetching multiple location details), use useQueries with an array of query objects. For instance, if loading stock for multiple variants, batch them. This avoids sequential calls and renders faster.

Set staleTime/cacheTime: For data that changes infrequently (e.g. categories, business list, location list), set a staleTime (e.g. 5–10 minutes) so React Query considers it fresh and won’t refetch on every mount. E.g.:

ts
Copy
useQuery(['categories'], fetchCategories, { staleTime: 300000 /_5min_/ });
This cuts down unnecessary network calls. By default staleTime=0 (always refetch), which we avoid for semi-static data.

Concurrency/cancellation: React Query auto-cancels in-flight fetches if the key changes or component unmounts (with queryFn using AbortController). Ensure each useQuery/useMutation is idempotent with React Query retry logic (it will not retry POST by default). For heavy parallel mutations on same data, consider mutationKey and using useMutationState to manage if needed (per docs).

Add tests: Update any existing query-related tests (e.g. if using MSW or jest-fetch-mock) to account for new staleTime or invalidations. For example, test that after a mutation, the query is invalidated and fresh data is fetched.

Checkout and duplicate/mutation handling: Ensure checkout and other critical mutations are idempotent and thread-safe:

Disable double-submit: In checkout components, disable the “Pay” button while a request is pending (isLoading or isPending from useMutation). Alternatively, use toast.promise or similar.
Stable mutation hook: Use a single useMutation call rather than calling it in a loop.
Optimistic UI (if needed): For actions that update a list (e.g. adding/removing item), use onMutate to optimistically update the local cache and onError to rollback. Example: For refund, remove the item from order UI immediately, then confirm with backend. If error, add it back.
Race guards: If the same cashier tries two refunds quickly, ensure that one doesn’t override the other. For example, disable the refund button while a refund is in progress. React Query’s mutation-level isLoading flag helps.
Add tests: Write a test simulating a customer double-click on checkout and verify only one sale is recorded (backend responds with same sale or error for duplicate IDempotency-Key). Use Jest with fake timers or a mock fetch to ensure the second submit does not result in two POSTs.
Authentication/Session sync: Ensure login/logout and token refresh are bulletproof:

Cookie/session: The frontend should not store tokens in localStorage (for security). Use HTTP-only cookies (as backend likely does). Use an Axios interceptor or wrapper to handle 401→/auth/refresh once. With our fetch wrapper, we can check for 401 and attempt refresh. After refresh, retry original request once.
Global auth state: On login, set the user state (e.g. via React Context or useQuery cache). On logout, clear it and redirect to login. Ensure window.location or router pushes to login, and purge React Query cache (queryClient.clear()).
Business/Location context: After login, the Admin selects a business and location. Store these in React Context or cookies. All subsequent requests must include businessId and locationId (in body or query) as the user interface does. Do not fallback to JWT businessId if front-end supplied values exist. If a request is made without businessId, show an error in UI (bad request), not silently use a default.
Cache reset on switch: When Admin switches business or location, clear any React Query caches keyed by the old context (use queryClient.removeQueries) to avoid stale data bleed-through. Also clear any local state (e.g. cart contents).
Tests: Simulate a stale-login or token expiration: e.g. stub fetch to return 401 once then success on refresh, and verify the first request is retried after refresh. Use jest.mock('node-fetch') or similar.
Business/Location switching: The frontend must not show data from the previous branch. Implement:

On business or location change, invalidate or clear caches from all queries scoped to the old branch. For example:
ts
Copy
// After selecting new businessId
queryClient.clear();
// Alternatively:
queryClient.invalidateQueries({ predicate: query => /_ queryKey includes old businessId _/ });
Or wrap data hooks to automatically use the current businessId in the queryKey (so new keys for new business). This avoids “stale branch data”.
If the backend relies on businessId param, ensure the UI always sends it (even if Admin forgets, we should fail fast). Do not hardcode a default.
Test: If possible, create a scenario: Load data for Business A, then switch to Business B, then verify no data from A appears in B’s pages (e.g. product list is different). This may require mocking backend responses for two businesses.
Form submissions and inputs: Review all forms (e.g. product/variant creation, category add, staff add, payroll entry):

Debounce on typing: For search filters or typeahead, use a debounce (e.g. 300ms) before triggering API calls. This prevents sending a request per keystroke. (We can use lodash.debounce or a custom hook).
Cancel stale requests: When using useQuery for a filterable list, enable automatic cancellation so that a slower response doesn’t overwrite a newer result. React Query does this by default for identical keys, but if search term changes, use a stable queryKey (e.g. ['products', searchTerm]) so old results aren’t applied after a new query.
Validation: Add any missing front-end form validation to catch obvious errors early (e.g. empty required fields, invalid numbers). Show user-friendly messages. But preserve back-end validation (don’t trust only frontend). No page should assume the request “will always succeed.”
Tests: Unit-test critical form logic (e.g. payroll deduction calculation hooks) and an integration test that simulates a user filling out a form and seeing validation errors.
UI/UX and Responsiveness:

Consistent components: Review repetitive JSX. If multiple pages have similar tables, buttons or dialogs, refactor into shared components (e.g. <ConfirmModal>, <DataTable>, etc.) to enforce consistency. This is cleanup but low priority.
Styling: Ensure all pages use the same color theme and spacing. Verify the existing “navy Admin interface and compact product cards” style is uniform. (Likely no code needed beyond lint/format).
Responsive design: Though POS is often desktop/tablet, check at least that layouts adapt to smaller screens gracefully (using CSS grid or media queries). For example, ensure the product grid stacks columns on narrow screens.
Accessibility (a11y): Use semantic HTML where possible. Add aria-label or <label> for all inputs. For example, a search input should have <label htmlFor="search">Search Products</label>. For dynamic components (modals, dropdowns), ensure focus management (trap focus in modal, return focus on close) and use WAI-ARIA roles if necessary (progress bars, tabs, etc.). Example: a loading spinner should have role="status" and visible text for screen readers. ARIA rule: If native HTML element exists (like <button>, <table>, etc.), prefer it over adding ARIA to a <div>.
Testing: Run an accessibility audit (e.g. Lighthouse, axe) to catch missing alt-text or labels. Write a sample test using axe-core for Jest on a critical page (e.g. login form) to assert it meets basic a11y rules.
Payments & Receipts:

Payment method selection: Ensure the UI flows match backend logic: if multiple payment types (Cash, bKash, etc.), display correct fields. E.g. if bKash is selected, require mobile number; if COD, skip payment details.
Receipt generation: If receipts are PDFs or images, lazy-load them or generate them on demand (to avoid bundling large libraries).
No retries on final charge: Once a payment is confirmed on backend, disallow accidental re-submission. Use the idempotency key or disable the pay button, as above.
Testing: Simulate a multi-payment checkout: e.g. 50% cash, 50% bank. Verify UI divides amounts correctly and backend records two payment records. Write a Playwright test clicking through the checkout UI and verifying network calls.
Payroll and Financial Calculations:

Exact formulas: Verify that the frontend calculations match the backend’s. For example, if showing “Net Salary” on UI, it should be computed as baseSalary – advances – deductions. (Or clarify: if backend gives net salary, just display it.) Check that handling of payroll advances and monthly deductions is correct (e.g. if you advanced more than salary, net pay should not be negative; perhaps show as debt).
Edge cases: If base salary is zero/missing, disable the payroll button (backend change done earlier). When refunding, ensure negative balances aren’t allowed (refund cannot exceed original sale). If an expense is recorded for a non-existent date or beyond shift, show errors.
Testing: Write unit tests for the calculation functions. For example:
ts
Copy
// payrollUtils.test.ts
test('netSalary formula', () => {
expect(calculateNetSalary(1000, 200, 100)).toBe(700);
});
And an E2E scenario: create a salary and advances, then verify the displayed net on UI matches expectation.
Performance (N+1 and Rendering):

Data Fetching: Identify places where the code fetches multiple items in a loop (N+1 problem). For example, if loading details for each product in a list using separate API calls in a loop, replace with a single batch endpoint (if available) or use useQueries to run them concurrently.
React rendering: Use React’s DevTools profiler to find unnecessary renders. Memoize pure components or use React.memo where props change infrequently. Use key props on lists to avoid re-mounting. Use dynamic imports (React.lazy) for large modal components (e.g. Receipts viewer).
Bundle size: Analyze npm run build stats. Remove any large unused libraries (e.g. moment.js, if not needed). Use lighter alternatives or dynamic import.
Testing: Optionally run Lighthouse (in the browser) to check performance. No citations needed here; performance tuning is specific to the app.
Forms, Pagination, Search:

Ensure all paginated lists (products, staff, orders) use server-side pagination. Verify page components accept page and limit params and update queryKey, so switching page invalidates/refetches. Test that “Next/Prev” buttons work and query params sync with URL.
For search/filter fields, debounce and handle empty states gracefully (e.g. “No products found” vs blank).
Tests: Unit-test pagination logic (e.g. if page=2, offset=10). E2E test searching for a known product and checking it appears/disappears.
Final Checklist Updates:

Build/Test: Run npm run build and fix any errors. Run all Jest tests and achieve 100% passing. Possibly increase timeouts for slow network calls or mocks.
TypeScript and Lint: Fix all TypeScript compiler errors and npm run lint. Remove or refactor any // @ts-ignore.
Release Readiness: After applying changes, prepare a short report (like we did for backend) listing any remaining “to dos” or risk areas. Aim to have no new critical issues, then promote to staging and canary.
Throughout, the agent must “Read every frontend file; apply only necessary changes; run full build, tests, and report failures.” The emphasis is on minimal but robust fixes. Do not rewrite major parts (e.g. no migrating to a new state library). All changes should preserve existing functionality and design.

API Reference and Calculations (POS.md)
Below is a consolidated mapping of the backend API endpoints and how they integrate with the frontend, including request/response shapes, UI usage, and any calculation logic. Assume all URLs are prefixed by /api/v1 (per backend) and that businessId and locationId are passed as needed.

Endpoint Method Request (body / query) Response (data) Used In (Front-End) Notes / Edge Cases
Auth<br>/auth/login POST { username, password } { token (cookie), user } Login page (sets session cookie) Returns JWT in httpOnly cookie; on fail, HTTP 401.
/auth/logout POST None (cookie included) { success: true } Logout button/action Clears session cookie on server.
/auth/refresh POST None (cookie) { success: true } Axios/Fetch interceptor (session refresh) Used internally. If refresh fails, force logout.
Businesses<br>/businesses GET (optionally ?adminId=) [{ id, name, ... }...] Admin’s “Select Business” dropdown/page Only businesses owned by this admin; none if JWT invalid.
/businesses POST { name, ... } { id, name, ... } (Admin panel) Create Business form None special.
/businesses/:id GET N/A { id, name, locations: [...], ... } Business detail page, and initial load for location list 404 if not owned by admin.
/businesses/:id PATCH { name, ... } { id, name, ... } Edit Business form Edits name or other fields.
/businesses/:id DELETE N/A { success: true } (Admin panel) Delete business 409 Conflict if business has any sales/orders.
Locations<br>/locations GET ?businessId= [{ id, name, address, ... }] Location selection after business is chosen Only locations under that business.
/locations POST { businessId, name, address, ... } { id, name, ... } Add Location form Fails if businessId not owned by admin.
/locations/:id PATCH { name, address, ... } { id, name, ... } Edit Location form
/locations/:id DELETE N/A { success: true } (Admin) Delete location 409 if any sales were made at that location.
Staff/Cashiers<br>/staff GET ?businessId=&locationId= [{ id, name, salary, branch, ... }] Staff list page Filters by location.
/staff POST { name, phone, branchId, salary, ... } { id, ... } Add Staff form branchId must be valid location.
/staff/:id PATCH { name, phone, salary, ... } { id, ... } Edit Staff form
/staff/:id/status PATCH { active: boolean } { id, status } Activate/Deactivate toggle on Staff list
Categories<br>/categories GET ?businessId= [{ id, name, ... }] Category list in product pages
/categories POST { name, businessId } { id, name } Add Category form
/categories/:id PATCH { name } { id, name } Edit Category
/categories/:id DELETE N/A { success: true } Delete Category button (maybe hidden if in use) Edge: 409 Conflict if any non-archived product under this category has been sold.
Products<br>/products GET ?businessId=&categoryId=&search=&page=&limit= { items: [...], total: N } Products page (with filters, pagination) Pagination and search parameters.
/products POST { name, categoryId, businessId, price, initialVariant: {...} } { id, ... } Add Product form (may allow sending first variant) If initialVariant is empty or price 0, block (frontend check).
/products/:id PATCH { name, categoryId, ... } { id, ... } Edit Product
/products/:id DELETE N/A { success: true } Delete product button Edge: 409 Conflict if any variant was sold (even refunded).
Variants<br>/variants GET ?productId=&branchId= [{ id, sku, barcode, stock, price, ... }] Variant list under a product If branch filter, shows stock.
/variants POST { name, productId, sku, price, ... } { id, ... } Add Variant form
/variants/:id PATCH { sku, price, ... } { id, ... } Edit Variant
/variants/:id DELETE N/A { success: true } Delete variant Edge: 409 Conflict if sold/refunded at all.
Inventory (Stock)<br>/stock GET ?productId=&locationId= { onHand, sold, remaining } Show current stock on product page “remaining” may go negative if oversold allowed.
/stock/adjust POST { variantId, locationId, quantity, reason } { success: true } Manual stock adjustment modal New stock = old + quantity; if decreasing below 0, allow only if flagged.
Sales (Checkout)<br>/sales/catalog POST { cart: [...variants], payments:[{type,amount}], businessId, locationId } { saleId, totals, ... } POS checkout page: item scanning and payment Sum(payments) must equal sum(cart); if offline payments or credit, handle accordingly.
Custom Sales<br>/sales/custom POST { items:[{name,amount}], payments, businessId, locationId } { saleId, totals } Free-form sale (no inventory) Used for services or non-stock items.
Payments (implicit in sales) – – – Handled inside /sales/\* above.
Orders (Purchases) GET ?businessId=&locationId=&dateFrom=&dateTo= [{ orderId, date, total, ... }] Order list page (for incoming supplier orders) Filtering by date, status.
/orders/:id GET N/A { order details ... } Order detail page
/orders/:id/refund POST { items:[...], refundAmount, businessId, locationId } { success: true, refundId } Order detail: Create refund Must be on same branch. Shift ID auto-handled on backend.
Refunds GET ?businessId=&locationId= [{ refundId, date, amount, saleId }] Refund report page
/refunds/:id GET N/A { refund details } Refund detail modal
Salary Advances<br>/hr/advances GET ?cashierId=&dateFrom=&dateTo= [{ advanceId, amount, date, cashierId }] Cashier advances page
/hr/advances POST { cashierId, amount, date, reason } { id, ... } Give advance modal (no approval needed)
Payroll<br>/hr/payrolls GET ?dateFrom=&dateTo=&status= [{ payrollId, netSalary, ... }] Payroll run or history list
/hr/payrolls POST { cashierId, deductionAmount, date } { id, ... } Deduct salary API Ensure base salary > 0 on create.
/hr/payrolls/batch POST { entries:[{ cashierId, amount }], date } { count, ... } Batch deduction from monthly closure
Expenses GET ?businessId=&locationId=&dateFrom=&dateTo= [{ expenseId, amount, category, ... }] Expenses list (also includes payroll as expense)
/expenses POST { amount, category, date, businessId, locationId } { id, ... } Add expense modal
Shifts<br>/shifts GET ?businessId=&locationId=&open=true [{ shiftId, cashierId, openTime, ... }] Current open shift for cashier/branch
/shifts/open POST { businessId, locationId, startingCash, cashierId } { id, ... } Open shift action
/shifts/close/:id POST { actualCash, depositAmount } { variance, ... } Close shift confirmation Calculate variance = actual - expected.
Dashboard / Reports GET ?businessId=&locationId=&date=... { KPI summary... } Dashboard landing (sales totals, etc.)
Image Upload<br>/upload POST FormData { file } { url: string } For product/business avatars Uses Cloudinary; returns public URL.

Data & Calculation Formulas
Cart Total: Sum of (variant.price \* quantity) for all items. Add any flat charges, subtract discounts, to get Subtotal.
Payment Sum: Sum of all payment amounts (cash + bkash + bank + etc.) must equal or exceed Subtotal. Backend enforces equality; UI should too.
Net Cash (shift): At shift close, variance = actualCash - expectedCash, where expectedCash = startingCash + cashSales - cashRefunds - cashExpenses. Verify this matches backend calculation.
Employee Pay: For each payroll entry, netSalary = baseSalary - advanceAmount - deduction (ensuring non-negative). If baseSalary is 0 or missing, disable payroll deduction (backend now rejects).
Stock Updates: On a sale/refund, newStock = oldStock - soldQty + refundedQty. The frontend should not assume stock goes negative (backed allows negative, but UI can show a warning if sold beyond on-hand).
Example Calculation: If cashier X has Base 10,000 BDT, a salary advance of 3,000 and a deduction of 500 on Nov 30, then displayed net pay = 10,000 − 3,000 − 500 = 6,500 BDT. (If user mistakenly enters advance 0 or deduction 0, prevent or warn.)
Edge cases: Fully-refunded sales should not count as active sales. Deleting categories/products must respect history – once an item was sold (even if fully refunded), treat it as “sold” (cannot delete).
Backlog of Improvements (improvements.md)
Below is a prioritized backlog of UX, performance, and architectural improvements for future phases (beyond v1 stabilization). Each item includes rough effort and risk:

Priority Improvement Area Description & Benefit Effort Risk/Notes
P0 Authentication UX Show session-expiry warning, single sign-on, stricter 2FA. Med Enhances security; low break risk.
P0 Business Switch (state) Use React Query’s queryClient.resetQueries() on branch-change to clear all cache. Low Minor refactor.
P0 Checkout reliability Add Stripe-like payment processing indicator, prevent browser back. Med UX polish; ensures no double-payment.
P0 Data Loading Indicators Add spinners/loading overlays for all long ops (queries/mutations). Low Improves perceived performance.
P1 TanStack Devtools Integrate React Query DevTools for debugging in dev. Low Dev-only; no user impact.
P1 Code Splitting Use next/dynamic to lazy-load heavy components (reports, receipts). Med Reduces initial bundle.
P1 Image Optimization Use Next.js <Image> component for cloud images, with placeholders. Med Better load times.
P1 Accessibility Audit Perform full aXe/Lighthouse audit and fix remaining issues. Med Improves usability (cit. WAI-ARIA best practice).
P1 Debounce & Throttle Globally debounce high-frequency inputs (search, auto-save). Low Prevents wasteful calls.
P1 Mobile Responsiveness Ensure forms and tables are scrollable/pinch-zoomable on tablets/phones. Med Important for modern clients.
P2 Code Refactoring Remove dead code (old mocks), consolidate duplicate utilities. Low Improves maintainability.
P2 Enhanced Error Handling Global error boundary component to catch JS errors, custom 500/404 pages. Med UX improvement; moderate effort.
P2 Progressive Web App (PWA) (Future) Add offline caching for key data (optional). High Deferred – out of MVP scope.
P2 Browser Tests Add Playwright tests for more flows (printing, responsive layouts). Med Ensures regressions are caught.
P3 Performance Budgeting Set budgets in CI (Lighthouse CI) and keep performance tracked. Low Ongoing maintenance.
P3 Theming If multiple color themes needed (e.g. dark mode), plan CSS vars. Low If requested in future.

These items focus on scalability, UX polish, and maintainability. They should be revisited in future sprints.

Data Flow Diagrams and Timeline
Adds item to cart

Pays / completes sale

Inventory update

Sale record

Payments recorded

Audit log

User

Cart State

Checkout API

Database

Database

Database

Database

Show code
2026-11-03
2026-11-05
2026-11-07
2026-11-09
2026-11-11
2026-11-13
2026-11-15
2026-11-17
2026-11-19
Simplify API client
Fix ReactQuery usage
Checkout & mutations
Add/Update unit tests
Playwright E2E tests
Business/Session fixes
Accessibility fixes
Review & polish
Code freeze & final build
Canaries & staging deploy
Implementation (Week 1-2)
Testing & QA (Week 2-3)
Release Prep (Week 3)
Frontend Stabilization Tasks

Show code
Test Cases
Unit Tests (Jest):

API Client: Simulate fetch returning 401 then success; verify automatic retry (mock global fetch). Test error object thrown on 4xx/5xx (should include status and message).
Cart Calculations: Given sample items, verify total and payment splits.
Payroll Calculations: As above (calculateNetSalary(1000,200,100)===700). Also test edge (if base=0, error).
React Query Hooks: Use react-query testing library to assert that after mutation, relevant queries are invalidated.
Hooks with Race Conditions: Test that a component using useQueries (with mocked queries) cancels the first when key changes.
Integration Tests:

Auth Flow: Login with valid/invalid credentials. Attempt action after logout, expect redirect. Token refresh on 401.
Business Switch: Login as admin, switch business and location, then ensure product list corresponds to new branch.
Checkout: Add products (including negative-stock item), complete checkout with multi-payments. Then verify stock update and that duplicate clicks do not double-charge.
Refund: Open a sale, issue a full refund. Verify stock is returned and sale status updated. Attempt to refund again, expect error.
Payroll: Create a cashier with salary, give advance and deduction. Run payroll for that employee and verify net pay and ledger entry. Attempt payroll with salary=0 and expect failure.
E2E (Playwright/Selenium):

Critical Flow #1: Login → Select Business/Location → Open Shift → Add Product to Cart → Checkout → Logout. Assert UI navigates correctly and no console errors.
Critical Flow #2: Login → Select Business → Staff Management → Add New Cashier (with image upload) → Log Out → Log In as that cashier → View Dashboard (no Admin menu).
Accessibility Check: Navigate with keyboard only (tab/enter) through main menu and a form, ensure all interactive elements are reachable (no [role="button"] without tabIndex). Use automated tool in test to catch missing labels.
Every critical test should assert both success and failure/error paths. Use fixtures/mocks only where needed to isolate external services.

Release Checklist
Before rolling out, ensure:

Build passes (npm run build).
All tests pass (unit, integration, E2E).
No console errors in UI.
Manual smoke test of key pages (Login, POS, Reports, Admin settings).
Backup and DB migration scripts are verified. (Frontend has no DB, but confirm any required version update in API calls.)
Staging deployment: Deploy to a staging environment; run sanity checks (log in, create test data).
Canary rollout (if applicable): Gradually enable to a subset of users to monitor.
Post-release monitoring: Check error logs, frontend performance metrics, and user feedback for any issues.
Rollout Plan: First release the frontend v1 alongside backend v1 into a staging environment. Conduct internal testing and bug fixes. Then promote to production with a small user group (canary) for 1-2 days. If stable, open to all users. Keep the backend in read-only mode during final build if necessary, to avoid mid-release changes.

Note: All code changes have been described above. No further backend contract changes are required for these frontend fixes. If any backend issues remain (such as response shapes or missing validation), they should be documented separately.

Sources: We applied industry best practices for data fetching and state management (e.g. React Query optimizations), HTTP request handling, environment configuration, and accessibility. These inform the detailed implementation notes above.
