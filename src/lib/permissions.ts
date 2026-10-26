import type { UserRole } from "@/types/domain";

export function canViewSensitiveFinancialData(role: UserRole): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
