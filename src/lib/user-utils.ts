/**
 * Calculates 1-2 letter initials from a user's full name.
 * If multiple words separated by space are present (e.g. "John Doe", "Abu Zayed"), takes the first letter of the first 2 words -> "JD", "AZ".
 * If a single word is present (e.g. "ZX", "Admin"), takes 2 letters -> "ZX", "AD".
 * Always returns an uppercase string (like Google Gmail without photo).
 */
export function getUserInitials(name?: string | null): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const single = parts[0];
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }
  return single.toUpperCase();
}

