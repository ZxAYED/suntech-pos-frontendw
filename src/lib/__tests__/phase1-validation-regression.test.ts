import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prepareFinancialOperation } from "@/lib/prepare-financial-operation";
import { financialOperations, type OperationScopeParams } from "@/lib/financial-operation";
import { catalogCheckoutSchema, customOrderSchema, createRefundSchema } from "@/lib/validations";
import { MemoryStorage } from "./test-storage";

const scope = { userId: "u", businessId: "b", locationId: "l" };
const catalog = { lines: [{ variantId: "variant-1", quantity: 1, unitPrice: 500 }], paymentMethod: "COD", tenderedAmount: 500 };
const custom = { lines: [{ productName: "Shirt", quantity: 1, unitPrice: 500 }], paymentMethod: "COD", tenderedAmount: 500 };
const refund = { items: [{ orderItemId: "line-1", quantity: 1 }], reason: "Customer return" };

describe("F02: validation before reservation using production schemas", () => {
  beforeEach(() => vi.stubGlobal("window", { sessionStorage: new MemoryStorage() }));
  afterEach(() => vi.unstubAllGlobals());

  it("invalid catalog tender then corrected tender", () => {
    const op: OperationScopeParams = { ...scope, operationType: "catalog_sale" };
    const bad = { ...catalog, tenderedAmount: 499 };
    expect(() => prepareFinancialOperation(op, bad, key => catalogCheckoutSchema.parse({ ...bad, idempotencyKey: key }))).toThrow();
    expect(financialOperations.getPendingOperation(op)).toBeNull();
    const saved = prepareFinancialOperation(op, catalog, key => catalogCheckoutSchema.parse({ ...catalog, idempotencyKey: key }));
    expect(saved.data.idempotencyKey).toBe(saved.key);
  });

  it("invalid custom quantity then corrected quantity", () => {
    const op: OperationScopeParams = { ...scope, operationType: "custom_sale" };
    const bad = { ...custom, lines: [{ ...custom.lines[0], quantity: 0 }] };
    expect(() => prepareFinancialOperation(op, bad, key => customOrderSchema.parse({ ...bad, idempotencyKey: key }))).toThrow();
    expect(financialOperations.getPendingOperation(op)).toBeNull();
    expect(prepareFinancialOperation(op, custom, key => customOrderSchema.parse({ ...custom, idempotencyKey: key })).isRetry).toBe(false);
  });

  it("invalid refund quantity then corrected quantity", () => {
    const op: OperationScopeParams = { ...scope, operationType: "refund", scopeExtra: "order-1" };
    const bad = { ...refund, items: [] };
    expect(() => prepareFinancialOperation(op, bad, key => createRefundSchema.parse({ ...bad, idempotencyKey: key }))).toThrow();
    expect(financialOperations.getPendingOperation(op)).toBeNull();
    expect(prepareFinancialOperation(op, refund, key => createRefundSchema.parse({ ...refund, idempotencyKey: key })).isRetry).toBe(false);
  });
});
