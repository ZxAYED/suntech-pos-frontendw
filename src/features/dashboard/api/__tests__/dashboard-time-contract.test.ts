import { describe, it, expect } from "vitest";
import type { DashboardOverviewResponse } from "../use-admin-dashboard";

describe("Dashboard Time & Session Contract (Phase F1)", () => {
  it("supports dashboard overview without optional session and shift extensions (legacy server compatibility)", () => {
    const legacy: DashboardOverviewResponse = {
      date: "2026-11-07",
      businessId: "biz-1",
      locationId: "loc-1",
      locationName: "Uttara Branch",
      kpis: {
        todayGrossSales: 5000,
        todayNetSales: 5000,
        todayOrderCount: 4,
        averageTicketValue: 1250,
        todayRefundCount: 0,
        todayRefundedAmount: 0,
        todayExpenseTotal: 500,
        netCashflowToday: 4500,
      },
      drawer: {
        hasActiveShift: true,
        shiftId: "shift-1",
        cashierName: "Alice",
        cashierPublicId: "CSH-01",
        openedAt: "2026-11-07T04:00:00.000Z",
        openingFloat: 2000,
        cashCollected: 3000,
        cashPaidOut: 0,
        expectedCashInDrawer: 5000,
        currency: "BDT",
      },
    };

    expect(legacy.todayShifts).toBeUndefined();
    expect(legacy.cashierLoginStatuses).toBeUndefined();
    expect(legacy.drawer.openedAt).toBe("2026-11-07T04:00:00.000Z");
  });

  it("supports modern overview response with cashierLoginStatuses and shift telemetry extensions", () => {
    const modern: DashboardOverviewResponse = {
      date: "2026-11-07",
      businessId: "biz-1",
      locationId: "loc-1",
      locationName: "Uttara Branch",
      kpis: {
        todayGrossSales: 10000,
        todayNetSales: 10000,
        todayOrderCount: 8,
        averageTicketValue: 1250,
        todayRefundCount: 0,
        todayRefundedAmount: 0,
        todayExpenseTotal: 1000,
        netCashflowToday: 9000,
      },
      drawer: {
        hasActiveShift: true,
        shiftId: "shift-1",
        cashierName: "Alice",
        cashierPublicId: "CSH-01",
        openedAt: "2026-11-07T04:00:00.000Z",
        openingFloat: 2000,
        cashCollected: 8000,
        cashPaidOut: 0,
        expectedCashInDrawer: 10000,
        currency: "BDT",
      },
      todayShifts: [
        {
          id: "shift-1",
          cashierId: "cashier-1",
          cashierName: "Alice",
          locationId: "loc-1",
          status: "OPEN",
          openedAt: "2026-11-07T04:00:00.000Z",
          closedAt: null,
          openingFloat: 2000,
          expectedAmount: 10000,
          closingAmount: null,
          variance: null,
        },
      ],
      todayShiftCounts: {
        open: 1,
        closed: 0,
        total: 1,
      },
      olderOpenShifts: [
        {
          id: "shift-old",
          cashierId: "cashier-2",
          cashierName: "Bob",
          locationId: "loc-1",
          status: "OPEN",
          openedAt: "2026-11-05T03:00:00.000Z",
          closedAt: null,
          openingFloat: 1000,
          expectedAmount: 1500,
          closingAmount: null,
          variance: null,
          isOverdue: true,
        },
      ],
      olderOpenShiftCount: 1,
      lastClosedShift: null,
      cashierLoginStatuses: [
        {
          cashierId: "cashier-1",
          fullName: "Alice",
          publicId: "CSH-01",
          isLoggedIn: true,
          lastLoginAt: "2026-11-07T03:55:00.000Z",
          lastLogoutAt: null,
        },
        {
          cashierId: "cashier-2",
          fullName: "Bob",
          publicId: "CSH-02",
          isLoggedIn: false,
          lastLoginAt: "2026-11-05T02:50:00.000Z",
          lastLogoutAt: "2026-11-05T12:00:00.000Z",
        },
      ],
    };

    expect(modern.todayShifts).toHaveLength(1);
    expect(modern.olderOpenShifts).toHaveLength(1);
    expect(modern.cashierLoginStatuses).toHaveLength(2);
    expect(modern.cashierLoginStatuses![0].isLoggedIn).toBe(true);
    expect(modern.cashierLoginStatuses![1].isLoggedIn).toBe(false);
  });
});

