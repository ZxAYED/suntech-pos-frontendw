import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { registerGuard } from "../register-guard";
import type { CartLine, HeldTicket } from "@/features/pos/view-models";
import { MemoryStorage } from "./test-storage";

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

describe("Register Guard & Scoped Draft Isolation (F07)", () => {
  beforeEach(() => {
    registerGuard.clearDraft("user-1", "biz-1", "loc-A");
    registerGuard.clearDraft("user-1", "biz-1", "loc-B");
  });

  afterEach(() => {
    registerGuard.clearDraft("user-1", "biz-1", "loc-A");
    registerGuard.clearDraft("user-1", "biz-1", "loc-B");
  });

  const cartBranchA: CartLine[] = [
    {
      variantId: "v-1",
      name: "Cotton Shirt",
      sku: "SKU-001",
      quantity: 2,
      unitPrice: 1200,
      stock: 10,
    },
  ];

  it("persists draft for specific branch and restores it cleanly", () => {
    registerGuard.saveDraft("user-1", "biz-1", "loc-A", {
      cart: cartBranchA,
      heldTickets: [],
    });

    const loaded = registerGuard.getDraft("user-1", "biz-1", "loc-A");
    expect(loaded).not.toBeNull();
    expect(loaded?.cart).toHaveLength(1);
    expect(loaded?.cart[0].variantId).toBe("v-1");
    expect(loaded?.cart[0].quantity).toBe(2);
  });

  it("isolates cart draft between different branches", () => {
    registerGuard.saveDraft("user-1", "biz-1", "loc-A", {
      cart: cartBranchA,
      heldTickets: [],
    });

    // Querying location B should be null
    const loadedBranchB = registerGuard.getDraft("user-1", "biz-1", "loc-B");
    expect(loadedBranchB).toBeNull();
  });

  it("correctly indicates active register work when cart or held tickets exist", () => {
    const summaryBefore = registerGuard.hasActiveRegisterWork("user-1", "biz-1", "loc-A");
    expect(summaryBefore.hasCart).toBe(false);

    registerGuard.saveDraft("user-1", "biz-1", "loc-A", {
      cart: cartBranchA,
      heldTickets: [],
    });

    const summaryAfter = registerGuard.hasActiveRegisterWork("user-1", "biz-1", "loc-A");
    expect(summaryAfter.hasCart).toBe(true);
    expect(summaryAfter.cartCount).toBe(2);

    registerGuard.clearDraft("user-1", "biz-1", "loc-A");
    const summaryCleared = registerGuard.hasActiveRegisterWork("user-1", "biz-1", "loc-A");
    expect(summaryCleared.hasCart).toBe(false);
  });

  it("persists and restores held tickets per scoped branch", () => {
    const heldTickets: HeldTicket[] = [
      {
        id: "held-1",
        label: "Customer Parking",
        createdAt: new Date().toISOString(),
        lines: cartBranchA,
      },
    ];

    registerGuard.saveDraft("user-1", "biz-1", "loc-A", {
      cart: [],
      heldTickets,
    });

    const restored = registerGuard.getDraft("user-1", "biz-1", "loc-A");
    expect(restored).not.toBeNull();
    expect(restored?.heldTickets).toHaveLength(1);
    expect(restored?.heldTickets[0].label).toBe("Customer Parking");
  });
});
