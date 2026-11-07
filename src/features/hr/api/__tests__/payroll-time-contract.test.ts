import { describe, it, expect } from "vitest";
import { mapPayrollToPayrollRow, mapAdvanceToAdvanceRow } from "../../view-models";

describe("Payroll & Advance Time Contract (Phase E)", () => {
  it("formats salary period without timezone drift", () => {
    const row = mapPayrollToPayrollRow({
      id: "pay-1",
      cashierId: "c-1",
      cashierName: "Alice",
      cashierPublicId: "CSH-1",
      month: 11,
      year: 2026,
      baseSalary: 15000,
      advancesTotal: 2000,
      netPayable: 13000,
      processed: true,
      paidAt: "2026-11-30T10:00:00.000Z",
    });

    expect(row.periodLabel).toBe("November 2026");
    expect(row.paidAt).toBe("2026-11-30T10:00:00.000Z");
  });

  it("preserves advance takenAt separately from createdAt without inventing timestamps", () => {
    const advance = mapAdvanceToAdvanceRow({
      id: "adv-1",
      cashierId: "c-1",
      cashierName: "Bob",
      amount: 5000,
      status: "PENDING",
      createdAt: "2026-11-07T05:00:00.000Z",
      takenAt: "2026-11-05T09:30:00.000Z",
    });

    expect(advance.takenAt).toBe("2026-11-05T09:30:00.000Z");
    expect(advance.createdAt).toBe("2026-11-07T05:00:00.000Z");
  });

  it("handles missing takenAt gracefully without synthesizing current time", () => {
    const legacy = mapAdvanceToAdvanceRow({
      id: "adv-legacy",
      cashierId: "c-2",
      amount: 1000,
      status: "ACTIVE",
      createdAt: "2026-10-15T08:00:00.000Z",
    });

    expect(legacy.takenAt).toBeUndefined();
    expect(legacy.createdAt).toBe("2026-10-15T08:00:00.000Z");
  });
});
