import { afterEach, describe, expect, it, vi } from "vitest";
import { belongsToRegister, type SavedDraft } from "@/features/pos/view-models";
import { hydrateDrafts } from "@/redux/actions/draftsActions";
import { createAppStore } from "@/redux/store";
import { clearAllAuthStorage } from "../auth-storage";
import { financialOperations } from "../financial-operation";
import { tenantPreferences } from "../tenant-preferences";
import { MemoryStorage } from "./test-storage";

const scope = { userId: "u", businessId: "b", locationId: "l" };
const draft: SavedDraft = { ...scope, id: "d", label: "Held", createdAt: "2026-11-21", lines: [] };

afterEach(() => vi.unstubAllGlobals());

describe("register recovery across session changes", () => {
  it.each(["pending", "unknown"] as const)("retains the %s operation and drafts during cleanup", (status) => {
    const localStorage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage, sessionStorage: new MemoryStorage() });
    const op = { ...scope, operationType: "catalog_sale" as const };
    const { key } = financialOperations.getOrCreateKey(op, { amount: 200 });
    financialOperations.recordOutcome(op, status);
    localStorage.setItem("suntech_user_profile", "old profile");
    localStorage.setItem("stpos_saved_drafts", JSON.stringify([draft]));
    localStorage.setItem(tenantPreferences.contextKey("u"), "old tenant");
    const store = createAppStore();
    store.dispatch({ type: "SESSION_START" });
    store.dispatch(hydrateDrafts([draft]));
    clearAllAuthStorage();
    tenantPreferences.clearAll();
    expect(localStorage.getItem("stpos_saved_drafts")).toBe(JSON.stringify([draft]));
    expect(localStorage.getItem("suntech_user_profile")).toBeNull();
    expect(localStorage.getItem(tenantPreferences.contextKey("u"))).toBeNull();
    expect(financialOperations.getPendingOperation(op)).toMatchObject({ key, outcome: status });
    expect(financialOperations.getPendingOperation({ ...op, userId: "other" })).toBeNull();
  });

  it("requires exact actor, business and branch, including for legacy drafts", () => {
    expect(belongsToRegister(draft, scope)).toBe(true);
    for (const field of ["userId", "businessId", "locationId"] as const) {
      expect(belongsToRegister(draft, { ...scope, [field]: "other" })).toBe(false);
      expect(belongsToRegister({ ...draft, [field]: undefined }, { ...scope, [field]: undefined })).toBe(false);
    }
  });
});
