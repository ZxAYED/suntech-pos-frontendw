import { describe, it, expect } from "vitest";
import { mapShiftToViewModel, type ShiftApiRecord } from "../view-models";

describe("Shift Time & Metadata Contract (Phase E)", () => {
  it("preserves OPEN shift with null closedAt and optional fields", () => {
    const raw: ShiftApiRecord = {
      id: "shift-open-1",
      businessId: "biz-1",
      locationId: "loc-1",
      cashierId: "cashier-1",
      status: "OPEN",
      openedAt: "2026-11-06T18:15:00.000Z",
      closedAt: null,
      openingFloat: 2000,
      closingAmount: null,
      variance: null,
    };

    const vm = mapShiftToViewModel(raw);
    expect(vm.status).toBe("OPEN");
    expect(vm.openedAt).toBe("2026-11-06T18:15:00.000Z");
    expect(vm.closedAt).toBeUndefined();
    expect(vm.closingCash).toBeNull();
    expect(vm.closingCashNotProvided).toBe(false); // not CLOSED yet
    expect(vm.variance).toBeUndefined();
  });

  it("distinguishes genuinely counted 0 BDT from uncounted null cash on a CLOSED shift", () => {
    const countedZero: ShiftApiRecord = {
      id: "shift-closed-zero",
      businessId: "biz-1",
      locationId: "loc-1",
      cashierId: "cashier-1",
      status: "CLOSED",
      openedAt: "2026-11-06T18:15:00.000Z",
      closedAt: "2026-11-07T04:00:00.000Z",
      openingFloat: 1000,
      closingAmount: 0,
      variance: -1000,
    };

    const vm = mapShiftToViewModel(countedZero);
    expect(vm.closingCash).toBe(0);
    expect(vm.closingCashNotProvided).toBe(false);
    expect(vm.variance).toBe(-1000);
  });

  it("preserves uncounted automatic closure with null closingAmount, autoCloseReason and overdue status", () => {
    const autoClosed: ShiftApiRecord = {
      id: "shift-auto-closed",
      businessId: "biz-1",
      locationId: "loc-1",
      cashierId: "cashier-1",
      status: "CLOSED",
      openedAt: "2026-11-05T04:00:00.000Z",
      closedAt: "2026-11-06T18:05:00.000Z",
      openingFloat: 3000,
      closingAmount: null,
      variance: null,
      autoCloseReason: "Auto-closed on next shift open for new business day",
      isOverdue: true,
      autoClosedPreviousShiftId: "shift-auto-closed",
    };

    const vm = mapShiftToViewModel(autoClosed);
    expect(vm.closingCash).toBeNull();
    expect(vm.closingCashNotProvided).toBe(true);
    expect(vm.autoCloseReason).toContain("Auto-closed");
    expect(vm.isOverdue).toBe(true);
    expect(vm.autoClosedPreviousShiftId).toBe("shift-auto-closed");
  });
});
