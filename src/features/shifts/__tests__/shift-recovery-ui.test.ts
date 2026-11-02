import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { financialOperations, type OperationScopeParams } from "@/lib/financial-operation";
import { MemoryStorage } from "@/lib/__tests__/test-storage";

if (typeof window === "undefined" || !window.sessionStorage) {
  const memStorage = new MemoryStorage();
  (globalThis as unknown as { window: { sessionStorage: MemoryStorage } }).window = {
    sessionStorage: memStorage,
  };
}

/**
 * UI State Model for Shift Operations Page
 * Mirrors the exact reactive state derivations and modal handlers of ShiftsPage.
 */
class ShiftsPageViewModel {
  // Scopes
  readonly shiftOpenScope: OperationScopeParams;
  readonly shiftCloseScope: OperationScopeParams;

  // Server queries
  activeShift: { id: string; openingFloat: number; expectedCash?: number } | null = null;
  userId: string | null = "usr-cashier-1";
  businessId: string | null = "biz-1";
  locationId: string | null = "loc-1";

  // Local component state
  modal: "open" | "close" | null = null;
  amount = "";
  note = "";
  autoClosePrevious = false;
  outcomeUnknown = false;
  hasShiftSnapshot = false;
  opSyncTick = 0;

  constructor() {
    this.shiftOpenScope = {
      operationType: "shift_open",
      userId: this.userId,
      businessId: this.businessId,
      locationId: this.locationId,
    };
    this.shiftCloseScope = {
      operationType: "shift_close",
      userId: this.userId,
      businessId: this.businessId,
      locationId: this.locationId,
    };
  }

  // Reactive derivations (mirrors ShiftsPage lines 66-90)
  get pendingShiftOpen() {
    return Boolean(this.userId) && this.opSyncTick >= 0
      ? financialOperations.getPendingOperation<{
          startingAmount?: number;
          autoClosePrevious?: boolean;
          businessId?: string;
          locationId?: string;
        }>(this.shiftOpenScope)
      : null;
  }

  get pendingShiftClose() {
    return Boolean(this.userId) && this.opSyncTick >= 0
      ? financialOperations.getPendingOperation<{
          shiftId?: string;
          actualCash?: number;
          closingAmount?: number;
          notes?: string;
          businessId?: string;
        }>(this.shiftCloseScope)
      : null;
  }

  get isShiftOpenUnknown(): boolean {
    return Boolean(this.pendingShiftOpen && this.pendingShiftOpen.outcome === "unknown");
  }

  get isShiftCloseUnknown(): boolean {
    return Boolean(this.pendingShiftClose && this.pendingShiftClose.outcome === "unknown");
  }

  get uncertainShiftKind(): "open" | "close" | null {
    return this.isShiftCloseUnknown ? "close" : this.isShiftOpenUnknown ? "open" : null;
  }

  get headerActionLabel(): string {
    if (this.uncertainShiftKind) {
      return `Review uncertain shift ${this.uncertainShiftKind}`;
    }
    if (this.activeShift) {
      return "Close shift";
    }
    return "Open shift";
  }

  get hasCloseRecoveryBanner(): boolean {
    return this.isShiftCloseUnknown;
  }

  get hasOpenRecoveryBanner(): boolean {
    return this.isShiftOpenUnknown;
  }

  // Handlers (mirrors ShiftsPage showModal & handleClearShiftLock)
  showModal(kind: "open" | "close"): void {
    if (kind === "open" && this.isShiftCloseUnknown && !this.isShiftOpenUnknown) {
      kind = "close";
    }
    this.modal = kind;
    const scope = kind === "open" ? this.shiftOpenScope : this.shiftCloseScope;
    const pendingOp = financialOperations.getPendingOperation<{
      startingAmount?: number;
      autoClosePrevious?: boolean;
      actualCash?: number;
      closingAmount?: number;
      notes?: string;
      shiftId?: string;
    }>(scope);

    const isUnknown = pendingOp?.outcome === "unknown";
    this.outcomeUnknown = isUnknown;

    if (kind === "open") {
      const snap = pendingOp?.payloadSnapshot;
      if (isUnknown && snap?.startingAmount != null) {
        this.amount = String(snap.startingAmount);
        this.autoClosePrevious = Boolean(snap.autoClosePrevious);
        this.hasShiftSnapshot = true;
      } else {
        this.amount = "";
        this.autoClosePrevious = false;
        this.hasShiftSnapshot = Boolean(snap?.startingAmount != null);
      }
      this.note = "";
    } else {
      const snap = pendingOp?.payloadSnapshot;
      if (isUnknown && (snap?.actualCash != null || snap?.closingAmount != null)) {
        this.amount = String(snap.actualCash ?? snap.closingAmount);
        this.note = snap.notes ?? "";
        this.hasShiftSnapshot = true;
      } else {
        this.amount = this.activeShift?.expectedCash != null ? String(this.activeShift.expectedCash) : "";
        this.note = "";
        this.hasShiftSnapshot = Boolean(snap?.actualCash != null || snap?.closingAmount != null);
      }
      this.autoClosePrevious = false;
    }
  }

  handleClearShiftLock(kind: "open" | "close"): void {
    const scope = kind === "open" ? this.shiftOpenScope : this.shiftCloseScope;
    financialOperations.clearOperation(scope);
    this.outcomeUnknown = false;
    this.hasShiftSnapshot = false;
    this.amount = "";
    this.note = "";
    this.opSyncTick += 1;
  }

  submitCloseRetry(): { shiftId?: string; key: string; isRetry: boolean } {
    if (!this.outcomeUnknown) {
      throw new Error("Only retry is tested here");
    }
    const pendingOp = this.pendingShiftClose;
    if (!pendingOp?.payloadSnapshot) {
      throw new Error("Cannot restore snapshot");
    }
    const shiftId = pendingOp.payloadSnapshot.shiftId;
    const actualCash = pendingOp.payloadSnapshot.actualCash ?? pendingOp.payloadSnapshot.closingAmount;
    const notes = pendingOp.payloadSnapshot.notes;
    const businessId = pendingOp.payloadSnapshot.businessId;

    const payloadToHash = {
      shiftId,
      actualCash,
      closingAmount: actualCash,
      notes,
      businessId,
    };

    const keyInfo = financialOperations.getOrCreateKey(this.shiftCloseScope, payloadToHash);
    return { shiftId, key: keyInfo.key, isRetry: keyInfo.isRetry };
  }
}

describe("UI-Level Shift Recovery Flow (F1)", () => {
  beforeEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it("retains shift-close recovery visibility and modal restore when activeShift becomes null after timeout", () => {
    const vm = new ShiftsPageViewModel();

    // 1. Initial state: active shift S1 is open
    vm.activeShift = { id: "shift-S1", openingFloat: 3000, expectedCash: 7500 };
    expect(vm.headerActionLabel).toBe("Close shift");
    expect(vm.hasCloseRecoveryBanner).toBe(false);

    // 2. Cashier initiates close shift with BDT 7500
    const closePayload = {
      shiftId: "shift-S1",
      actualCash: 7500,
      closingAmount: 7500,
      notes: "Night register count",
      businessId: "biz-1",
    };
    const initialKey = financialOperations.getOrCreateKey(vm.shiftCloseScope, closePayload);
    expect(initialKey.key).toBeTruthy();

    // 3. Network timeout occurs: outcome recorded as unknown
    financialOperations.recordOutcome(vm.shiftCloseScope, "unknown");
    vm.opSyncTick += 1;

    // 4. Client refreshes: server closed shift S1, so activeShift query returns null
    vm.activeShift = null;

    // UI Verification:
    // Even though activeShift is null, the recovery banner and review action are visible!
    expect(vm.isShiftCloseUnknown).toBe(true);
    expect(vm.hasCloseRecoveryBanner).toBe(true);
    expect(vm.uncertainShiftKind).toBe("close");
    expect(vm.headerActionLabel).toBe("Review uncertain shift close");

    // 5. Cashier clicks review action to open recovery modal
    vm.showModal("close");
    expect(vm.modal).toBe("close");
    expect(vm.outcomeUnknown).toBe(true);
    expect(vm.hasShiftSnapshot).toBe(true);
    expect(vm.amount).toBe("7500");
    expect(vm.note).toBe("Night register count");

    // 6. Cashier attempts to open a new shift while close is unresolved -> redirected/blocked
    vm.showModal("open");
    expect(vm.modal).toBe("close"); // Guarded: redirected to close

    // 7. Retrying close reuses original shiftId and original Idempotency-Key
    const retryResult = vm.submitCloseRetry();
    expect(retryResult.shiftId).toBe("shift-S1");
    expect(retryResult.key).toBe(initialKey.key);
    expect(retryResult.isRetry).toBe(true);

    // 8. Reconciled and cleared
    vm.handleClearShiftLock("close");
    expect(vm.isShiftCloseUnknown).toBe(false);
    expect(vm.hasCloseRecoveryBanner).toBe(false);
    expect(vm.uncertainShiftKind).toBeNull();
    expect(vm.headerActionLabel).toBe("Open shift");
  });

  it("retains shift-open recovery visibility when server commits and activeShift becomes non-null", () => {
    const vm = new ShiftsPageViewModel();

    // 1. Initial state: no active shift
    vm.activeShift = null;
    expect(vm.headerActionLabel).toBe("Open shift");

    // 2. Open shift float 2000 submitted, but network times out
    const openPayload = {
      startingAmount: 2000,
      autoClosePrevious: false,
      businessId: "biz-1",
      locationId: "loc-1",
    };
    const openKey = financialOperations.getOrCreateKey(vm.shiftOpenScope, openPayload);
    expect(openKey.key).toBeTruthy();
    financialOperations.recordOutcome(vm.shiftOpenScope, "unknown");
    vm.opSyncTick += 1;

    // 3. Server did commit; subsequent active shift fetch returns shift-S1
    vm.activeShift = { id: "shift-S1", openingFloat: 2000 };

    // UI Verification:
    // Open recovery action remains visible despite activeShift being non-null!
    expect(vm.isShiftOpenUnknown).toBe(true);
    expect(vm.hasOpenRecoveryBanner).toBe(true);
    expect(vm.uncertainShiftKind).toBe("open");
    expect(vm.headerActionLabel).toBe("Review uncertain shift open");

    // 4. Review modal restores opening float and locks editing
    vm.showModal("open");
    expect(vm.modal).toBe("open");
    expect(vm.amount).toBe("2000");
    expect(vm.outcomeUnknown).toBe(true);
    expect(vm.hasShiftSnapshot).toBe(true);

    // 5. Cashier verifies in shift history that shift was indeed opened, then clears lock
    vm.handleClearShiftLock("open");
    expect(vm.isShiftOpenUnknown).toBe(false);
    expect(vm.hasOpenRecoveryBanner).toBe(false);
    expect(vm.uncertainShiftKind).toBeNull();
    // Now normal close action is visible since activeShift is open
    expect(vm.headerActionLabel).toBe("Close shift");
  });
});
