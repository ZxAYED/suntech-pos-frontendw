import type { User } from "@/types/domain";

const USER_STORAGE_KEY = "suntech_user_profile";

/**
 * Safely reads the locally cached authenticated user profile.
 */
export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (parsed && typeof parsed === "object" && typeof parsed.id === "string" && typeof parsed.fullName === "string") {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

/**
 * Persists the user profile (including name, role, profileImageUrl, etc.) to local storage.
 */
export function saveStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage write errors (e.g. quota exceeded)
  }
}

/**
 * Clears the locally cached user profile on logout.
 */
export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage remove errors
  }
}

