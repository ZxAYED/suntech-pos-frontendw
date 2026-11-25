/* eslint-disable @typescript-eslint/no-require-imports */
// Independent regression runner: uses the project's actual TypeScript modules.
// TypeScript is already a dev dependency. No Vitest/browser/database claim is made.
// Run npm run test:recovery, or NODE_PATH=<global TypeScript modules> node ...
const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const root = process.env.SUNTECH_TEST_SOURCE || path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, "src", request.slice(2)) : request, ...args);
};
require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const result = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, { getCanonicalFileName: x => x, getCurrentDirectory: () => root, getNewLine: () => "\n" }));
  module._compile(result.outputText, filename);
};
const from = (name) => require(path.join(root, "src", name));
const { financialOperations: operations } = from("lib/financial-operation.ts");
const { registerGuard } = from("lib/register-guard.ts");
const { DRAFTS_STORAGE_KEY, persistSavedDrafts } = from("redux/storage.ts");
const { MemoryStorage } = from("lib/__tests__/test-storage.ts");
const scope = { userId: "test-user", businessId: "test-business", locationId: "test-location" };
const opScope = { ...scope, operationType: "catalog_sale" };
const registerKey = "stpos:register_draft:test-user:test-business:test-location";
const line = { variantId: "variant-a", name: "Shirt", sku: "S1", unitPrice: 500, quantity: 1, stock: 10 };
const payload = { lines: [line], paymentMethod: "COD", tenderedAmount: 500 };
const active = { cart: [line], heldTickets: [], customerName: "Customer", customerPhone: "01700000000", paymentMethod: "COD", tendered: "1000", showCustomerInput: true };
const ticket = { ...scope, id: "draft-a", label: "Held", lines: [line], customerName: active.customerName, customerPhone: active.customerPhone, paymentMethod: active.paymentMethod, tendered: active.tendered, showCustomerInput: true, createdAt: "2026-11-24T00:00:00Z" };
let session, local;
beforeEach(() => { session = new MemoryStorage(); local = new MemoryStorage(); globalThis.window = { sessionStorage: session, localStorage: local }; });
afterEach(() => { delete globalThis.window; });
function injectWriteFailure(storage, predicate) {
  const original = storage.setItem.bind(storage);
  storage.setItem = (key, value) => { if (predicate(key, value)) throw new DOMException("Storage quota", "QuotaExceededError"); original(key, value); };
  return () => { storage.setItem = original; };
}
// These five tests exercise functions already present in the original source.
// They can be run against the unmodified upload with SUNTECH_BASELINE_ONLY=1.
test("F01: first archive write fails — original transaction survives", () => {
  const original = operations.getOrCreateKey(opScope, payload);
  operations.recordOutcome(opScope, "unknown");
  injectWriteFailure(session, key => key.includes(":archived:"));
  operations.reconcileOperation(opScope, "operator_review");
  assert.equal(operations.getPendingOperation(opScope)?.key, original.key);
});
test("F01: second archive write fails — original transaction survives", () => {
  const original = operations.getOrCreateKey(opScope, payload);
  operations.recordOutcome(opScope, "unknown");
  injectWriteFailure(session, key => key === `stpos:finop:archived:${original.key}`);
  operations.reconcileOperation(opScope, "operator_review");
  assert.equal(operations.getPendingOperation(opScope)?.key, original.key);
});
test("F01: legacy archive lookup cannot expose a different register", () => {
  const { key } = operations.getOrCreateKey(opScope, payload);
  operations.reconcileOperation(opScope, "verified");
  assert.equal(operations.getArchivedOperation(opScope, key)?.key, key);
  assert.equal(operations.getArchivedOperation({ ...opScope, locationId: "other" }, key), null);
});
test("F05: ordinary register persistence must not erase unreadable evidence", () => {
  local.setItem(registerKey, "{corrupt");
  registerGuard.saveDraft(scope.userId, scope.businessId, scope.locationId, { cart: [], heldTickets: [] });
  assert.equal(local.getItem(registerKey), "{corrupt");
});
test("F05: held-list persistence must not overwrite unreadable evidence", () => {
  local.setItem(DRAFTS_STORAGE_KEY, "{corrupt");
  persistSavedDrafts([]);
  assert.equal(local.getItem(DRAFTS_STORAGE_KEY), "{corrupt");
});
if (!process.env.SUNTECH_BASELINE_ONLY) {
  const { prepareFinancialOperation: prepare } = from("lib/prepare-financial-operation.ts");
  const { financialFailureOutcome, isInitialPriceRejection } = from("lib/financial-failure.ts");
  const { ApiClientError } = from("types/api.ts");
  const { commitRegisterTransition: transition } = from("lib/register-transition.ts");
  const { fallbackReceiptAmounts } = from("features/pos/utils/fallback-receipt-amounts.ts");
  const { allowsResponseBody } = from("lib/http-response-body.ts");
  const { classifyRefreshFailure } = from("lib/session-refresh-result.ts");
  const validate = (key) => ({ ...payload, idempotencyKey: key });
  test("F01: successful archive verified before releasing active record", () => {
    const { key } = operations.getOrCreateKey(opScope, payload);
    assert.equal(operations.reconcileOperation(opScope, "verified"), true);
    assert.equal(operations.getPendingOperation(opScope), null);
    assert.equal(operations.getArchivedOperation(opScope, key)?.resolution, "verified");
  });
  test("F02: invalid input reserves no key; corrected input creates one", () => {
    assert.throws(() => prepare(opScope, payload, () => { throw new Error("Invalid input"); }), /Invalid input/);
    assert.equal(operations.getPendingOperation(opScope), null);
    const result = prepare(opScope, payload, validate);
    assert.equal(result.data.idempotencyKey, result.key);
    assert.equal(operations.getPendingOperation(opScope)?.key, result.key);
  });
  test("F02: invalid retry input does not erase original pending identity", () => {
    const first = prepare(opScope, payload, validate);
    operations.recordOutcome(opScope, "unknown");
    assert.throws(() => prepare(opScope, payload, () => { throw new Error("Invalid input"); }));
    assert.equal(operations.getPendingOperation(opScope)?.key, first.key);
    assert.equal(prepare(opScope, payload, validate).key, first.key);
  });
  test("F02: storage failure returns no financial key", () => {
    injectWriteFailure(session, () => true);
    assert.throws(() => prepare(opScope, payload, validate), /storage/i);
    assert.equal(operations.getPendingOperation(opScope), null);
  });
  test("F03: pending operation reuses original key after reload-style read", () => {
    const first = prepare(opScope, payload, validate);
    const second = prepare(opScope, payload, validate);
    assert.equal(second.key, first.key);
    assert.equal(second.isRetry, true);
    assert.equal(operations.getPendingOperation(opScope)?.outcome, "pending");
  });
  test("F03: ambiguous conflict, timeout, non-API error and server error stay unknown", () => {
    for (const status of [0, 408, 409, 500, 503]) assert.equal(financialFailureOutcome(new ApiClientError("Error", status), false), "unknown");
    assert.equal(financialFailureOutcome(new Error("Mapping failed"), false), "unknown");
  });
  test("F03: even a later validation/auth error cannot clear an uncertain original", () => {
    for (const status of [400, 401, 403, 404, 422, 429]) {
      assert.equal(financialFailureOutcome(new ApiClientError("Error", status), true), "unknown");
      assert.equal(financialFailureOutcome(new ApiClientError("Error", status), false), "failed");
    }
  });
  test("F03: price rejection only permits replacing a first-attempt key", () => {
    const err = new ApiClientError("Price changed", 409, undefined, undefined, "PRICE_CHANGED");
    assert.equal(isInitialPriceRejection(err, false), true);
    assert.equal(isInitialPriceRejection(err, true), false);
  });
  test("F05: hold writes held and cleared active ticket before success", () => {
    const result = transition(scope, active, [], { type: "hold", draft: ticket }, local);
    assert.equal(result.ok, true);
    assert.deepEqual(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY)), [ticket]);
    assert.deepEqual(JSON.parse(local.getItem(registerKey)).cart, []);
    assert.equal(JSON.parse(local.getItem(registerKey)).heldTickets[0].id, ticket.id);
  });
  test("F05: first write fails — no successful hold and active ticket remains", () => {
    registerGuard.saveDraft(scope.userId, scope.businessId, scope.locationId, active);
    const before = local.getItem(registerKey);
    injectWriteFailure(local, key => key === DRAFTS_STORAGE_KEY);
    assert.equal(transition(scope, active, [], { type: "hold", draft: ticket }, local).ok, false);
    assert.equal(local.getItem(registerKey), before);
    assert.equal(local.getItem(DRAFTS_STORAGE_KEY), null);
  });
  test("F05: second hold write fails — completed first write is rolled back", () => {
    registerGuard.saveDraft(scope.userId, scope.businessId, scope.locationId, active);
    const before = local.getItem(registerKey);
    injectWriteFailure(local, key => key === registerKey);
    assert.equal(transition(scope, active, [], { type: "hold", draft: ticket }, local).ok, false);
    assert.equal(local.getItem(registerKey), before);
    assert.equal(local.getItem(DRAFTS_STORAGE_KEY), null);
  });
  test("F05: incomplete compensation requires explicit recovery", () => {
    registerGuard.saveDraft(scope.userId, scope.businessId, scope.locationId, active);
    injectWriteFailure(local, key => key === registerKey);
    const originalRemove = local.removeItem.bind(local);
    local.removeItem = key => { if (key === DRAFTS_STORAGE_KEY) throw new Error("Rollback blocked"); originalRemove(key); };
    const result = transition(scope, active, [], { type: "hold", draft: ticket }, local);
    assert.equal(result.ok, false);
    assert.equal(result.recoveryRequired, true);
    assert.equal(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY))[0].id, ticket.id);
    assert.deepEqual(JSON.parse(local.getItem(registerKey)).cart, active.cart);
  });
  test("F06: resume into an occupied cart is rejected without modifying either ticket", () => {
    persistSavedDrafts([ticket]);
    const result = transition(scope, active, [ticket], { type: "resume", draftId: ticket.id }, local);
    assert.equal(result.ok, false);
    assert.deepEqual(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY)), [ticket]);
    assert.equal(local.getItem(registerKey), null);
  });
  test("F06: hold and resume preserve lines, tender and customer fields", () => {
    const held = transition(scope, active, [], { type: "hold", draft: ticket }, local);
    assert.equal(held.ok, true);
    const resumed = transition(scope, held.register, held.drafts, { type: "resume", draftId: ticket.id }, local);
    assert.equal(resumed.ok, true);
    assert.deepEqual(resumed.register.cart, active.cart);
    assert.equal(resumed.register.tendered, active.tendered);
    assert.equal(resumed.register.customerName, active.customerName);
    assert.deepEqual(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY)), []);
  });
  test("F06: second resume write fails — held ticket is not removed", () => {
    const held = transition(scope, active, [], { type: "hold", draft: ticket }, local);
    assert.equal(held.ok, true);
    const before = local.getItem(registerKey);
    injectWriteFailure(local, key => key === DRAFTS_STORAGE_KEY);
    assert.equal(transition(scope, held.register, held.drafts, { type: "resume", draftId: ticket.id }, local).ok, false);
    assert.equal(local.getItem(registerKey), before);
    assert.deepEqual(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY)), [ticket]);
  });
  test("F05/F06: foreign-scope ticket and stale held list cannot be modified", () => {
    persistSavedDrafts([ticket]);
    const wrong = { ...scope, locationId: "other" };
    assert.equal(transition(wrong, { ...active, cart: [] }, [ticket], { type: "resume", draftId: ticket.id }, local).ok, false);
    assert.equal(transition(scope, active, [], { type: "hold", draft: { ...ticket, id: "new" } }, local).ok, false);
    assert.deepEqual(JSON.parse(local.getItem(DRAFTS_STORAGE_KEY)), [ticket]);
  });
  test("F05: preserve existing five held-ticket cap per register", () => {
    const held = Array.from({length: 5}, (_, n) => ({ ...ticket, id: `held-${n}` }));
    persistSavedDrafts(held);
    assert.equal(transition(scope, active, held, { type: "hold", draft: ticket }, local).ok, false);
  });
  test("F05: corrupt active snapshot blocks a destructive transition", () => {
    local.setItem(registerKey, "{corrupt");
    assert.equal(transition(scope, active, [], { type: "hold", draft: ticket }, local).ok, false);
    assert.equal(local.getItem(registerKey), "{corrupt");
    assert.equal(local.getItem(DRAFTS_STORAGE_KEY), null);
  });
  test("F07: server unavailable is not invalid credentials", () => {
    for (const code of [undefined, 0, 408, 429, 500, 503]) assert.equal(classifyRefreshFailure(code), "unavailable");
    for (const code of [401, 403]) assert.equal(classifyRefreshFailure(code), "rejected");
  });
  test("F08: actual Fetch Response constructor accepts forwarded bodyless statuses", () => {
    for (const status of [204, 205, 304]) {
      const response = new Response(allowsResponseBody("GET", status) ? new ArrayBuffer(0) : null, {status});
      assert.equal(response.body, null);
      assert.equal(response.status, status);
    }
    assert.equal(allowsResponseBody("HEAD", 200), false);
    assert.equal(allowsResponseBody("GET", 200), true);
  });
  test("F10: 500 BDT sale with 1000 tendered does not become a 1000 BDT receipt", () => {
    assert.deepEqual(fallbackReceiptAmounts([line], 1000), {subtotal: 500, totalAmount: 500, tenderedAmount: 1000, changeDue: 500});
  });
}
