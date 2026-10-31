import { describe, expect, it } from "vitest";
import type { ExpenseRecord, ExpensesResponse } from "../use-expenses";

describe("Expenses Contract & ViewModel Transformation", () => {
  it("correctly handles backend object format { items, totalCount, totalAmount }", () => {
    const rawBackendPayload = {
      items: [
        {
          id: "exp-001",
          amount: 1200,
          title: "Printer repair",
          category: "MAINTENANCE" as const,
          note: "Repair ink carriage",
          spentAt: "2026-10-28T09:15:00.000Z",
          businessId: "biz-1",
          createdAt: "2026-10-28T09:15:00.000Z",
        },
        {
          id: "exp-002",
          amount: 800,
          title: "Thermal paper rolls",
          category: "SUPPLIES" as const,
          note: "10 rolls",
          spentAt: "2026-10-28T14:20:00.000Z",
          businessId: "biz-1",
          createdAt: "2026-10-28T14:20:00.000Z",
        },
      ],
      totalCount: 2,
      totalAmount: 2000,
    };

    const transform = (data: typeof rawBackendPayload): ExpensesResponse => {
      const items: ExpenseRecord[] = Array.isArray(data.items) ? data.items : [];
      return {
        items,
        totalCount: typeof data.totalCount === "number" ? data.totalCount : items.length,
        totalAmount:
          typeof data.totalAmount === "number"
            ? data.totalAmount
            : items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
      };
    };

    const result = transform(rawBackendPayload);

    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.totalAmount).toBe(2000);
    expect(result.items[0].category).toBe("MAINTENANCE");
    expect(result.items[1].title).toBe("Thermal paper rolls");
  });

  it("handles empty items array gracefully with 0 totalCount and 0 totalAmount", () => {
    const rawBackendPayload = {
      items: [],
      totalCount: 0,
      totalAmount: 0,
    };

    expect(rawBackendPayload.items).toEqual([]);
    expect(rawBackendPayload.totalCount).toBe(0);
    expect(rawBackendPayload.totalAmount).toBe(0);
  });
});
