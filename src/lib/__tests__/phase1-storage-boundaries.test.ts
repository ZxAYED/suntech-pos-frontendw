import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { financialOperations, type ScopedFinancialOperation } from "../financial-operation";
import { registerGuard, registerDraftStorageKey } from "../register-guard";
import { prepareFinancialOperation } from "../prepare-financial-operation";
import { MemoryStorage } from "./test-storage";

const scope = { operationType: "catalog_sale" as const, userId: "u", businessId: "b", locationId: "l" };
const storageKey = "stpos:finop:catalog_sale:u:b:l:root";
const payload = { lines: [{ variantId: "v", quantity: 1, unitPrice: 500 }], paymentMethod: "COD", tenderedAmount: 500 };

describe("Phase 1 storage and protocol boundaries", () => {
  let sessionStorage: MemoryStorage;
  let localStorage: MemoryStorage;
  beforeEach(() => {
    sessionStorage = new MemoryStorage();
    localStorage = new MemoryStorage();
    vi.stubGlobal("window", { sessionStorage, localStorage });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("cannot convert a legacy pending operation into a new local-first sale", () => {
    const first = financialOperations.getOrCreateKey(scope, payload);
    const oldRecord = JSON.parse(sessionStorage.getItem(storageKey)!) as ScopedFinancialOperation;
    delete oldRecord.deliveryProtocol;
    sessionStorage.setItem(storageKey, JSON.stringify(oldRecord));
    expect(() => financialOperations.getOrCreateKey(scope, payload, "LOCAL_FIRST_V2")).toThrow(/original route/i);
    const retry = financialOperations.getOrCreateKey(scope, payload);
    expect(retry).toMatchObject({ key: first.key, isRetry: true, deliveryProtocol: "LEGACY_HTTP" });
  });

  it("writes new protocol and stable identity together after validation", () => {
    const first = prepareFinancialOperation(scope, payload, key => ({ ...payload, idempotencyKey: key }), "LOCAL_FIRST_V2");
    expect(financialOperations.getPendingOperation(scope)).toMatchObject({ key: first.key, deliveryProtocol: "LOCAL_FIRST_V2", payloadSnapshot: payload });
    expect(() => financialOperations.getOrCreateKey(scope, payload)).toThrow(/original route/i);
    expect(financialOperations.getOrCreateKey(scope, payload, "LOCAL_FIRST_V2")).toMatchObject({ key: first.key, isRetry: true });
  });

  it("refuses a record stored under the wrong actor or branch", () => {
    financialOperations.getOrCreateKey(scope, payload);
    const record = JSON.parse(sessionStorage.getItem(storageKey)!);
    record.userId = "another-operator";
    sessionStorage.setItem(storageKey, JSON.stringify(record));
    expect(() => financialOperations.getPendingOperation(scope)).toThrow(/unreadable/i);
    expect(() => financialOperations.getOrCreateKey(scope, payload)).toThrow(/unreadable/i);
    expect(JSON.parse(sessionStorage.getItem(storageKey)!).userId).toBe("another-operator");
  });

  it.each(["", "{}", '{"key":"legacy","operationType":"catalog_sale"}'])("does not overwrite corrupt evidence %s", raw => {
    sessionStorage.setItem(storageKey, raw);
    expect(() => financialOperations.getOrCreateKey(scope, payload)).toThrow(/unreadable/i);
    expect(sessionStorage.getItem(storageKey)).toBe(raw);
  });

  it("compares the saved payload as well as the legacy hash", () => {
    financialOperations.getOrCreateKey(scope, payload);
    const record = JSON.parse(sessionStorage.getItem(storageKey)!);
    record.payloadSnapshot.tenderedAmount = 900;
    sessionStorage.setItem(storageKey, JSON.stringify(record));
    expect(() => financialOperations.getOrCreateKey(scope, payload)).toThrow(/pending|uncertain/i);
  });

  it("does not return an identity when storage silently changes the persisted record", () => {
    const realWrite = sessionStorage.setItem.bind(sessionStorage);
    vi.spyOn(sessionStorage, "setItem").mockImplementation((key, value) => realWrite(key, `${value} `));
    expect(() => financialOperations.getOrCreateKey(scope, payload)).toThrow(/verify/i);
  });

  it("distinguishes storage denied from no pending work and cannot claim reconciliation", () => {
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("SecurityError"); }, configurable: true });
    expect(() => financialOperations.getPendingOperation(scope)).toThrow(/storage/i);
    expect(financialOperations.hasUncertainOperations("u", "b", "l")).toBe(true);
    expect(financialOperations.reconcileOperation(scope, "resolved")).toBe(false);
  });

  it("does not attribute anonymous legacy work to a different named register", () => {
    financialOperations.getOrCreateKey({ operationType: "catalog_sale" }, payload);
    expect(financialOperations.hasUncertainOperations("u", "b", "l")).toBe(false);
    expect(financialOperations.hasUncertainOperations()).toBe(true);
  });

  it("distinguishes corrupt saved cart from an empty register and preserves it", () => {
    const key = registerDraftStorageKey("u", "b", "l");
    expect(registerGuard.readDraft("u", "b", "l").status).toBe("empty");
    localStorage.setItem(key, "broken cart evidence");
    expect(registerGuard.readDraft("u", "b", "l").status).toBe("corrupt");
    expect(registerGuard.hasActiveRegisterWork("u", "b", "l").isOutcomeUnknown).toBe(true);
    expect(registerGuard.saveDraft("u", "b", "l", { cart: [], heldTickets: [] })).toBe(false);
    expect(localStorage.getItem(key)).toBe("broken cart evidence");
  });

  it("does not hide denied durable storage behind an empty sessionStorage fallback", () => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("SecurityError"); }, configurable: true });
    expect(registerGuard.readDraft("u", "b", "l").status).toBe("unavailable");
    expect(registerGuard.hasActiveRegisterWork("u", "b", "l").isOutcomeUnknown).toBe(true);
  });
});
