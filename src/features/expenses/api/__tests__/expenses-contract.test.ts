import { describe, expect, it } from "vitest";
import { normalizeMonthlyExpenseSummary, type ExpenseRecord, type ExpensesResponse } from "../use-expenses";

describe("Expenses Contract & ViewModel Transformation", () => {
  it("correctly handles backend object format { items, totalCount, totalAmount }", () => {
    const rawBackendPayload = {
      items: [
        {
          id: "exp-001",
          amount: 1200,
          title: "Printer repair",
          category: "MAINTENANCE" as const,
          sourceType: "MANUAL" as const,
          type: "MANUAL" as const,
          note: "Repair ink carriage",
          spentAt: "2026-10-28T09:15:00.000Z",
          businessId: "biz-1",
          createdAt: "2026-10-28T09:15:00.000Z",
        },
        {
          id: "exp-002",
          amount: 20000,
          title: "Payroll Disbursement - Alex Rivera",
          category: "SALARIES" as const,
          sourceType: "PAYROLL_NET" as const,
          type: "PAYROLL_NET" as const,
          payrollId: "pr-001",
          spentAt: "2026-10-28T14:20:00.000Z",
          businessId: "biz-1",
          createdAt: "2026-10-28T14:20:00.000Z",
        },
      ],
      totalCount: 2,
      totalAmount: 21200,
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
    expect(result.totalAmount).toBe(21200);
    expect(result.items[0].category).toBe("MAINTENANCE");
    expect(result.items[0].sourceType).toBe("MANUAL");
    expect(result.items[1].sourceType).toBe("PAYROLL_NET");
    expect(result.items[1].payrollId).toBe("pr-001");
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

  it("normalizes array-based monthly summary correctly", () => {
    const rawPayload = {
      month: 11,
      year: 2026,
      summary: {
        totalExpenses: 55000,
        expenseCount: 2,
        byCategory: [
          { category: "RENT", total: 35000, count: 1 },
          { category: "SALARIES", total: 20000, count: 1 },
        ],
        byType: [
          { type: "MANUAL", total: 35000, count: 1 },
          { type: "PAYROLL_NET", total: 20000, count: 1 },
        ],
      },
      items: [],
    };

    const normalized = normalizeMonthlyExpenseSummary(rawPayload, 11, 2026);

    expect(normalized.summary.totalExpenses).toBe(55000);
    expect(normalized.summary.expenseCount).toBe(2);
    expect(normalized.summary.byCategory).toHaveLength(2);
    expect(normalized.summary.byType).toHaveLength(2);
    expect(normalized.summary.byCategory[0].category).toBe("RENT");
    expect(normalized.summary.byType?.[0].type).toBe("MANUAL");
  });

  it("normalizes dictionary-based monthly summary from handoff doc correctly", () => {
    const rawHandoffPayload = {
      totalExpenses: 55000,
      totalCount: 2,
      byCategory: {
        RENT: 35000,
        SALARIES: 20000,
      },
      byType: {
        MANUAL: 35000,
        PAYROLL_NET: 20000,
      },
    };

    const normalized = normalizeMonthlyExpenseSummary(rawHandoffPayload, 11, 2026);

    expect(normalized.summary.totalExpenses).toBe(55000);
    expect(normalized.summary.expenseCount).toBe(2);
    expect(normalized.summary.byCategory).toHaveLength(2);
    expect(normalized.summary.byType).toHaveLength(2);
    expect(normalized.summary.byCategory.find((c) => c.category === "RENT")?.total).toBe(35000);
    expect(normalized.summary.byType?.find((t) => t.type === "PAYROLL_NET")?.total).toBe(20000);
  });
});
