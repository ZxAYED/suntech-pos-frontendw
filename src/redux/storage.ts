import type { SavedDraft } from "@/redux/types";

export const DRAFTS_STORAGE_KEY = "stpos_saved_drafts";

export function loadSavedDrafts(): SavedDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedDrafts(drafts: SavedDraft[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.localStorage;
    const old = storage.getItem(DRAFTS_STORAGE_KEY);
    if (old !== null && !Array.isArray(JSON.parse(old))) return false;
    const encoded = JSON.stringify(drafts);
    storage.setItem(DRAFTS_STORAGE_KEY, encoded);
    return storage.getItem(DRAFTS_STORAGE_KEY) === encoded;
  } catch {
    return false;
  }
}

export function clearSavedDrafts(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFTS_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

