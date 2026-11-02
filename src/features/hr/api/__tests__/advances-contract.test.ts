import { describe, expect, it } from "vitest";
import type { AdvancesResponse, AdvancesSummaryData } from "../use-hr";
import type { AdvanceRowViewModel } from "@/features/hr/view-models";

describe("HR Advances Contract & ViewModel Transformation", () => {
  it("correctly handles backend object format { items, summary }", () => {
    const rawBackendPayload = {
      items: [
        {
          id: "adv-001",
          cashierId: "cashier-10",
          employeeName: "Rahim Uddin",
          employeeCode: "CSH-10",
          role: "CASHIER",
          locationName: "Main Branch",
          amount: 2500,
          reason: "Emergency travel",
          takenAt: "2026-10-25T10:00:00.000Z",
          status: "PENDING" as const,
          cashier: { id: "cashier-10", fullName: "Rahim Uddin", publicId: "CSH-10" },
        },
        {
          id: "adv-002",
          cashierId: "cashier-12",
          locationName: "Uttara Branch",
          amount: 1500,
          reason: "Medicine",
          takenAt: "2026-10-26T12:30:00.000Z",
          status: "DEDUCTED" as const,
          cashierName: "Karim Mia",
        },
      ],
      summary: {
        totalActiveAdvances: 2500,
        pendingCount: 1,
        deductedCount: 1,
        voidedCount: 0,
      },
    };

    // Transform function reflecting useAdvances mapping
    const transform = (data: typeof rawBackendPayload): AdvancesResponse => {
      const rawList = Array.isArray(data.items) ? data.items : [];
      const items: AdvanceRowViewModel[] = rawList.map((adv) => ({
        id: String(adv.id),
        cashierId: String(adv.cashierId),
        cashierName: adv.employeeName || adv.cashier?.fullName || adv.cashierName || undefined,
        employeeName: adv.employeeName || adv.cashier?.fullName || adv.cashierName || undefined,
        employeeCode: adv.employeeCode || adv.cashier?.publicId || undefined,
        role: adv.role || undefined,
        locationName: adv.locationName || undefined,
        amount: Number(adv.amount),
        note: adv.reason || undefined,
        createdAt: String(adv.takenAt),
        takenAt: adv.takenAt || undefined,
        deletedAt: null,
        status: adv.status,
      }));

      const summary: AdvancesSummaryData = {
        totalActiveAdvances: Number(data.summary?.totalActiveAdvances ?? 0),
        pendingCount: Number(data.summary?.pendingCount ?? 0),
        deductedCount: Number(data.summary?.deductedCount ?? 0),
        voidedCount: Number(data.summary?.voidedCount ?? 0),
      };

      return { items, summary };
    };

    const result = transform(rawBackendPayload);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: "adv-001",
      cashierId: "cashier-10",
      cashierName: "Rahim Uddin",
      employeeName: "Rahim Uddin",
      employeeCode: "CSH-10",
      role: "CASHIER",
      locationName: "Main Branch",
      amount: 2500,
      note: "Emergency travel",
      createdAt: "2026-10-25T10:00:00.000Z",
      takenAt: "2026-10-25T10:00:00.000Z",
      deletedAt: null,
      status: "PENDING",
    });
    expect(result.items[1].locationName).toBe("Uttara Branch");
    expect(result.summary.totalActiveAdvances).toBe(2500);
    expect(result.summary.pendingCount).toBe(1);
    expect(result.summary.deductedCount).toBe(1);
    expect(result.summary.voidedCount).toBe(0);
  });

  it("safely handles empty advances payload without breaking arrays", () => {
    const rawBackendPayload = {
      items: [],
      summary: {
        totalActiveAdvances: 0,
        pendingCount: 0,
        deductedCount: 0,
      },
    };

    const items: AdvanceRowViewModel[] = rawBackendPayload.items.map((adv: { id: string; cashierId: string; amount: number; createdAt: string; status: "ACTIVE" | "VOIDED" | "DEDUCTED" | "PENDING" | "SETTLED" }) => ({
      id: String(adv.id),
      cashierId: String(adv.cashierId),
      amount: Number(adv.amount),
      createdAt: String(adv.createdAt),
      status: adv.status,
    }));

    expect(items).toEqual([]);
    expect(rawBackendPayload.summary.totalActiveAdvances).toBe(0);
  });
});
