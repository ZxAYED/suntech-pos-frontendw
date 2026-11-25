import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders, type AxiosResponse } from "axios";
import { apiClient } from "@/lib/api-client";
import { financialOperations } from "@/lib/financial-operation";
import { MemoryStorage } from "@/lib/__tests__/test-storage";
import { readLegacyCheckoutStatus } from "../legacy-status";
import { legacyCatalogCart } from "@/features/pos/utils/legacy-catalog-cart";
import { mapOrderToReceipt } from "@/features/pos/view-models";

const operationScope = { operationType: "catalog_sale" as const, userId: "operator", businessId: "shop", locationId: "branch" };
const payload = { lines: [{ variantId: "variant", quantity: 2, unitPrice: 50 }], tenderedAmount: 120, paymentMethod: "COD", customerName: "Buyer" };
const order = {
  id: "original-order", invoiceNumber: "RECEIPT-1", orderType: "CATALOG", status: "PAID", paymentMethod: "COD",
  businessId: "shop", locationId: "branch", cashierId: "operator", subtotal: 100, totalAmount: 100, tenderedAmount: 120, changeDue: 20,
  createdAt: "2026-11-22T12:00:00Z", lines: [{ id: "line", variantId: "variant", quantity: 2, unitPrice: 50, subtotal: 100, productName: "Shirt" }],
};
function response(data: unknown): AxiosResponse { return { data, status: 200, statusText: "OK", headers: {}, config: { headers: new AxiosHeaders() } }; }
function pending() {
  financialOperations.getOrCreateKey(operationScope, payload);
  financialOperations.recordOutcome(operationScope, "unknown");
  return financialOperations.getPendingOperation(operationScope)!;
}
beforeEach(() => vi.stubGlobal("window", { sessionStorage: new MemoryStorage(), localStorage: new MemoryStorage() }));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Read-only original checkout recovery", () => {
  it.each(["NOT_FOUND", "UNKNOWN"])("keeps the exact original identity when the server says %s", async status => {
    const original = pending();
    const get = vi.spyOn(apiClient, "get").mockResolvedValueOnce(response({ status, canCreateReplacement: false }));
    const post = vi.spyOn(apiClient, "post");
    await expect(readLegacyCheckoutStatus(original)).resolves.toEqual({ status });
    expect(financialOperations.getPendingOperation(operationScope)).toEqual(original);
    expect(get).toHaveBeenCalledWith(`/orders/legacy-status/${original.key}`);
    expect(post).not.toHaveBeenCalled();
  });

  it.each([false, true])("recovers the exact server receipt with envelope=%s without posting or clearing identity", async wrapped => {
    const original = pending();
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(response({ status: "CONFIRMED", canCreateReplacement: false, originalPath: "/api/v1/orders/catalog", response: wrapped ? { success: true, data: order } : order }));
    const post = vi.spyOn(apiClient, "post");
    const result = await readLegacyCheckoutStatus(original);
    expect(result.status).toBe("CONFIRMED");
    if (result.status !== "CONFIRMED") throw new Error("Expected confirmed receipt");
    expect(mapOrderToReceipt(result.order)).toMatchObject({ orderId: "original-order", invoiceNumber: "RECEIPT-1", totalAmount: 100, tenderedAmount: 120, changeDue: 20 });
    expect(financialOperations.getPendingOperation(operationScope)?.key).toBe(original.key); // Only durable cart acknowledgment may release it.
    expect(post).not.toHaveBeenCalled();
  });

  it.each([{ locationId: "another-branch" }, { cashierId: "another-operator" }, { businessId: "another-shop" }, { orderType: "CUSTOM" }])("rejects a foreign confirmed order %j", async changed => {
    const original = pending();
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(response({ status: "CONFIRMED", canCreateReplacement: false, originalPath: "/orders/catalog", response: { ...order, ...changed } }));
    await expect(readLegacyCheckoutStatus(original)).rejects.toMatchObject({ code: "LEGACY_STATUS_MISMATCH" });
    expect(financialOperations.getPendingOperation(operationScope)).toEqual(original);
  });

  it("rejects a response from another original route", async () => {
    const original = pending();
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(response({ status: "CONFIRMED", canCreateReplacement: false, originalPath: "/orders/custom", response: order }));
    await expect(readLegacyCheckoutStatus(original)).rejects.toMatchObject({ code: "LEGACY_STATUS_MISMATCH" });
  });

  it("displays an absent old cart from its immutable request without changing that request", () => {
    const original = pending();
    const cart = legacyCatalogCart(original);
    expect(cart).toMatchObject({ lines: [{ variantId: "variant", quantity: 2, unitPrice: 50 }], customerName: "Buyer", paymentMethod: "COD", tendered: "120" });
    expect(financialOperations.getPendingOperation(operationScope)).toEqual(original);
    expect(() => legacyCatalogCart({ ...original, payloadSnapshot: { ...payload, lines: [{ variantId: "variant", quantity: -1, unitPrice: 50 }] } })).toThrow(/saved cart/i);
  });
});
