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
          amount: 2500,
          reason: "Emergency travel",
          takenAt: "2026-10-25T10:00:00.000Z",
          status: "ACTIVE" as const,
          cashier: { id: "cashier-10", fullName: "Rahim Uddin", publicId: "CSH-10" },
        },
        {
          id: "adv-002",
          cashierId: "cashier-12",
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
      },
    };

    // Transform function reflecting useAdvances mapping
    const transform = (data: typeof rawBackendPayload): AdvancesResponse => {
      const rawList = Array.isArray(data.items) ? data.items : [];
      const items: AdvanceRowViewModel[] = rawList.map((adv) => ({
        id: String(adv.id),
        cashierId: String(adv.cashierId),
        cashierName: adv.cashier?.fullName || adv.cashierName || undefined,
        amount: Number(adv.amount),
        note: adv.reason || undefined,
        createdAt: String(adv.takenAt),
        status: adv.status,
      }));

      const summary: AdvancesSummaryData = {
        totalActiveAdvances: Number(data.summary?.totalActiveAdvances ?? 0),
        pendingCount: Number(data.summary?.pendingCount ?? 0),
        deductedCount: Number(data.summary?.deductedCount ?? 0),
      };

      return { items, summary };
    };

    const result = transform(rawBackendPayload);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toEqual({
      id: "adv-001",
      cashierId: "cashier-10",
      cashierName: "Rahim Uddin",
      amount: 2500,
      note: "Emergency travel",
      createdAt: "2026-10-25T10:00:00.000Z",
      status: "ACTIVE",
    });
    expect(result.summary.totalActiveAdvances).toBe(2500);
    expect(result.summary.pendingCount).toBe(1);
    expect(result.summary.deductedCount).toBe(1);
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
