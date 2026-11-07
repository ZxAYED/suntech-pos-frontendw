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

export function persistSavedDrafts(drafts: SavedDraft[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage errors (quota, private mode)
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

