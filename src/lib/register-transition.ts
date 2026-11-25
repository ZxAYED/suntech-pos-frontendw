import type { SavedDraft } from "@/redux/types";
import { DRAFTS_STORAGE_KEY } from "@/redux/storage";
import { registerDraftStorageKey, type RegisterDraftState } from "@/lib/register-guard";

export type RegisterScope = { userId: string; businessId: string; locationId: string };
export type RegisterTransitionResult = { ok: true; drafts: SavedDraft[]; register: Omit<RegisterDraftState, "updatedAt"> } | { ok: false; message: string; recoveryRequired?: boolean };
type Transition = { type: "hold"; draft: SavedDraft } | { type: "resume" | "discard"; draftId: string };

const sameScope = (draft: SavedDraft, scope: RegisterScope) =>
  draft.userId === scope.userId && draft.businessId === scope.businessId && draft.locationId === scope.locationId;

/** Phase 1: commit before clearing visible state. Two legacy storage keys are
 * not crash-atomic; Phase 3 must replace this transition with one IndexedDB
 * transaction. On a synchronous write failure, retain the original UI state
 * and compensate only writes still matching this transition. */
export function commitRegisterTransition(
  scope: RegisterScope,
  current: Omit<RegisterDraftState, "updatedAt">,
  allDrafts: readonly SavedDraft[],
  action: Transition,
  storage?: Storage,
): RegisterTransitionResult {
  const fail = (message: string): RegisterTransitionResult => ({ ok: false, message });
  if (!scope.userId || !scope.businessId || !scope.locationId || current.outcomeUnknown) {
    return fail("Register scope or recovery state does not allow this change.");
  }
  const scoped = allDrafts.filter((d) => sameScope(d, scope));
  let drafts: SavedDraft[];
  let register = { ...current };
  if (action.type === "hold") {
    if (!current.cart.length || !sameScope(action.draft, scope)) return fail("Invalid held ticket.");
    if (scoped.length >= 5 || allDrafts.some((d) => d.id === action.draft.id)) return fail("Draft limit reached or duplicate ticket.");
    drafts = [action.draft, ...allDrafts];
    register = { ...register, cart: [], customerName: "", customerPhone: "", tendered: "", showCustomerInput: false };
  } else {
    const draft = scoped.find((d) => d.id === action.draftId);
    if (!draft) return fail("Held ticket is not in this register.");
    if (action.type === "resume") {
      if (current.cart.length) return fail("Hold or complete the active cart before resuming another draft.");
      register = { ...register, cart: draft.lines, customerName: draft.customerName ?? "", customerPhone: draft.customerPhone ?? "", paymentMethod: draft.paymentMethod ?? "COD", tendered: draft.tendered ?? "", showCustomerInput: draft.showCustomerInput ?? Boolean(draft.customerName || draft.customerPhone) };
    }
    drafts = allDrafts.filter((d) => d.id !== action.draftId);
  }
  register.heldTickets = drafts.filter((d) => sameScope(d, scope));
  let target: Storage;
  const registerKey = registerDraftStorageKey(scope.userId, scope.businessId, scope.locationId);
  let oldRegister: string | null;
  let oldDrafts: string | null;
  let encodedRegister: string;
  let encodedDrafts: string;
  try {
    target = storage ?? window.localStorage;
    oldRegister = target.getItem(registerKey);
    oldDrafts = target.getItem(DRAFTS_STORAGE_KEY);
    const persisted = oldDrafts === null ? [] : JSON.parse(oldDrafts);
    if (!Array.isArray(persisted) || JSON.stringify(persisted) !== JSON.stringify(allDrafts)) {
      return fail("Saved drafts changed or are unreadable. Reload and review your register before continuing.");
    }
    if (oldRegister !== null) {
      const parsed = JSON.parse(oldRegister) as RegisterDraftState;
      if (!parsed || !Array.isArray(parsed.cart) || !Array.isArray(parsed.heldTickets)) return fail("Saved register is unreadable. Recovery required.");
    }
    encodedRegister = JSON.stringify({ ...register, updatedAt: Date.now() });
    encodedDrafts = JSON.stringify(drafts);
  } catch {
    return fail("Register storage is unavailable or unreadable. No ticket was cleared.");
  }
  const heldWrite = { key: DRAFTS_STORAGE_KEY, before: oldDrafts, after: encodedDrafts };
  const activeWrite = { key: registerKey, before: oldRegister, after: encodedRegister };
  // Create the destination before removing the source on a hold/resume.
  const writes = action.type === "resume" ? [activeWrite, heldWrite] : [heldWrite, activeWrite];
  const attempted: typeof writes = [];
  try {
    for (const write of writes) {
      attempted.push(write);
      target.setItem(write.key, write.after);
      if (target.getItem(write.key) !== write.after) throw new Error("Write verification failed");
    }
    return { ok: true, drafts, register };
  } catch {
    let restored = true;
    for (const write of attempted.reverse()) {
      try {
        const latest = target.getItem(write.key);
        if (latest === write.before) continue;
        if (latest !== write.after) { restored = false; continue; }
        if (write.before === null) target.removeItem(write.key);
        else target.setItem(write.key, write.before);
        if (target.getItem(write.key) !== write.before) restored = false;
      } catch { restored = false; }
    }
    return restored
      ? fail("Could not save the register change. Your ticket remains visible.")
      : { ok: false, recoveryRequired: true, message: "Register storage recovery is required. Do not submit a replacement ticket; keep this register open and contact an administrator." };
  }
}
