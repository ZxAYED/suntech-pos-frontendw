import { describe, expect, it } from "vitest";
import { financialOperations } from "@/lib/financial-operation";
import { MemoryStorage } from "@/lib/__tests__/test-storage";
import type { AdvancesResponse, AdvancesSummaryData } from "../use-hr";
import type { AdvanceRowViewModel } from "@/features/hr/view-models";

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

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

  describe("ADV-01 Cashier Salary Advance Idempotency & Uncertain Retry", () => {
    const advanceScope = {
      operationType: "advance_create" as const,
      userId: "cashier-10",
      businessId: "biz-1",
      locationId: "loc-1",
    };

    it("reuses the exact same idempotency key for identical retry after uncertain outcome", () => {
      financialOperations.clearOperation(advanceScope);
      const payload = { amount: 2000, reason: "Emergency medical" };

      // 1. Initial attempt
      const attempt1 = financialOperations.getOrCreateKey(advanceScope, payload);
      expect(attempt1.isRetry).toBe(false);
      expect(attempt1.isOutcomeUnknown).toBe(false);
      expect(attempt1.key).toBeDefined();

      // 2. Mark outcome as unknown (e.g. timeout 408 / 503)
      financialOperations.recordOutcome(advanceScope, "unknown");

      // 3. Retry identical payload
      const attempt2 = financialOperations.getOrCreateKey(advanceScope, payload);
      expect(attempt2.isRetry).toBe(true);
      expect(attempt2.isOutcomeUnknown).toBe(true);
      expect(attempt2.key).toBe(attempt1.key); // Same idempotency key!

      // 4. Success resolves operation
      financialOperations.recordOutcome(advanceScope, "success");
      const pendingAfterSuccess = financialOperations.getPendingOperation(advanceScope);
      expect(pendingAfterSuccess).toBeNull();
    });

    it("blocks payload modification while an advance outcome remains uncertain", () => {
      financialOperations.clearOperation(advanceScope);
      const payloadOriginal = { amount: 3000, reason: "Rent" };

      // 1. Initial attempt
      financialOperations.getOrCreateKey(advanceScope, payloadOriginal);
      financialOperations.recordOutcome(advanceScope, "unknown");

      // 2. Modified payload (attempting different amount)
      const payloadModified = { amount: 5000, reason: "Rent & fees" };
      expect(() => {
        financialOperations.getOrCreateKey(advanceScope, payloadModified);
      }).toThrow(/uncertain for this register/i);

      // 3. User clears lock after reconciliation
      financialOperations.clearOperation(advanceScope);
      const attemptAfterClear = financialOperations.getOrCreateKey(advanceScope, payloadModified);
      expect(attemptAfterClear.isRetry).toBe(false);
      financialOperations.clearOperation(advanceScope);
    });
  });
});
