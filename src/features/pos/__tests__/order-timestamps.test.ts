import { describe, expect, it } from "vitest";
import { validateAndMapOrder } from "../api/use-pos";
import {
  mapOrderToOrderRow,
  mapOrderToReceipt,
  selectOrderSaleTime,
} from "../view-models";
import type { Order } from "@/types/domain";

describe("Phase B: Preserve Order Event and Persistence Times (R1, R3, R6)", () => {
  const baseRawOrder = {
    id: "ord-test-1",
    invoiceNumber: "INV-20261107-001",
    type: "CATALOG" as const,
    status: "PAID" as const,
    paymentMethod: "COD" as const,
    businessId: "biz-1",
    locationId: "loc-1",
    subtotal: 1200,
    totalAmount: 1200,
    lines: [
      {
        id: "line-1",
        variantId: "v-1",
        productName: "Fast Charger",
        quantity: 1,
        unitPrice: 1200,
        subtotal: 1200,
      },
    ],
  };

  describe("selectOrderSaleTime selector", () => {
    it("prefers valid occurredAt when both occurredAt and createdAt are present", () => {
      const result = selectOrderSaleTime({
        occurredAt: "2026-11-02T10:00:00.000Z",
        createdAt: "2026-11-07T12:00:00.000Z",
      });
      expect(result.source).toBe("occurredAt");
      expect(result.saleAt).toBe("2026-11-02T10:00:00.000Z");
    });

    it("falls back to legacy-createdAt only when occurredAt is absent or null", () => {
      const resultNull = selectOrderSaleTime({
        occurredAt: null,
        createdAt: "2026-11-05T08:00:00.000Z",
      });
      expect(resultNull.source).toBe("legacy-createdAt");
      expect(resultNull.saleAt).toBe("2026-11-05T08:00:00.000Z");

      const resultUndefined = selectOrderSaleTime({
        createdAt: "2026-11-05T08:00:00.000Z",
      });
      expect(resultUndefined.source).toBe("legacy-createdAt");
      expect(resultUndefined.saleAt).toBe("2026-11-05T08:00:00.000Z");
    });

    it("returns unavailable when occurredAt is present but malformed (never silently falls back to createdAt)", () => {
      const resultMalformed = selectOrderSaleTime({
        occurredAt: "invalid-time",
        createdAt: "2026-11-07T12:00:00.000Z",
      });
      expect(resultMalformed.source).toBe("unavailable");
      expect(resultMalformed.saleAt).toBeNull();
    });

    it("returns unavailable when both dates are absent or invalid", () => {
      const result = selectOrderSaleTime({
        occurredAt: null,
        createdAt: null,
      });
      expect(result.source).toBe("unavailable");
      expect(result.saleAt).toBeNull();
    });
  });

  describe("validateAndMapOrder mapper", () => {
    it("preserves distinct raw occurredAt and createdAt without overwriting", () => {
      const mapped = validateAndMapOrder({
        ...baseRawOrder,
        occurredAt: "2026-11-02T04:15:00.000Z",
        createdAt: "2026-11-07T08:30:00.000Z",
      });

      expect(mapped.occurredAt).toBe("2026-11-02T04:15:00.000Z");
      expect(mapped.createdAt).toBe("2026-11-07T08:30:00.000Z");
    });

    it("handles absent occurredAt on legacy orders gracefully", () => {
      const mapped = validateAndMapOrder({
        ...baseRawOrder,
        createdAt: "2026-11-05T08:30:00.000Z",
      });

      expect(mapped.occurredAt).toBeNull();
      expect(mapped.createdAt).toBe("2026-11-05T08:30:00.000Z");
    });
  });

  describe("End-to-end view-model projection (mapOrderToOrderRow & mapOrderToReceipt)", () => {
    it("preserves event time as saleAt and recorded time as createdAt on row and receipt", () => {
      const order: Order = {
        ...baseRawOrder,
        occurredAt: "2026-11-02T18:10:00.000Z", // Nov 3, 00:10 Dhaka
        createdAt: "2026-11-07T04:00:00.000Z",  // Nov 7, 10:00 Dhaka
      };

      const row = mapOrderToOrderRow(order);
      expect(row.occurredAt).toBe("2026-11-02T18:10:00.000Z");
      expect(row.createdAt).toBe("2026-11-07T04:00:00.000Z");
      expect(row.saleAt).toBe("2026-11-02T18:10:00.000Z");
      expect(row.timeSource).toBe("occurredAt");

      const receipt = mapOrderToReceipt(order);
      expect(receipt.occurredAt).toBe("2026-11-02T18:10:00.000Z");
      expect(receipt.createdAt).toBe("2026-11-07T04:00:00.000Z");
      expect(receipt.saleAt).toBe("2026-11-02T18:10:00.000Z");
      expect(receipt.timeSource).toBe("occurredAt");
    });

    it("labels legacy fallback clearly when occurredAt is absent", () => {
      const order: Order = {
        ...baseRawOrder,
        occurredAt: null,
        createdAt: "2026-11-05T10:00:00.000Z",
      };

      const row = mapOrderToOrderRow(order);
      expect(row.saleAt).toBe("2026-11-05T10:00:00.000Z");
      expect(row.timeSource).toBe("legacy-createdAt");

      const receipt = mapOrderToReceipt(order);
      expect(receipt.saleAt).toBe("2026-11-05T10:00:00.000Z");
      expect(receipt.timeSource).toBe("legacy-createdAt");
    });
  });
});
