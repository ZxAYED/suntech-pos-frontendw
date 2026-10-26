"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";

export type RoleType = "admin" | "cashier";

export interface TenantScopeParams {
  businessId?: string;
  locationId?: string;
}

export interface UseTenantScopeReturn {
  role: RoleType;
  isAdmin: boolean;
  isCashier: boolean;
  isTenantReady: boolean;
  activeBusiness: BusinessItem | null;
  activeBranch: BranchItem | null;
  businessId?: string;
  locationId?: string;
  tenantParams: TenantScopeParams;
  buildQueryParams: <T extends Record<string, unknown>>(params?: T) => T & TenantScopeParams;
}

function sessionRole(role?: string): RoleType | undefined {
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "admin";
  if (role === "CASHIER") return "cashier";
  return undefined;
}

export function useTenantScope(previewRole?: RoleType): UseTenantScopeReturn {
  const pathname = usePathname() ?? "";
  const authUser = useSelector((state: RootState) => state.auth.user);
  const tenant = useSelector((state: RootState) => state.tenant);

  const role = useMemo<RoleType>(() => {
    const authenticatedRole = sessionRole(authUser?.role);
    if (authenticatedRole) return authenticatedRole;
    if (previewRole) return previewRole;
    // Route inference is isolated to unauthenticated static preview mode only.
    return pathname.startsWith("/admin") ? "admin" : "cashier";
  }, [authUser?.role, pathname, previewRole]);

  const isAdmin = role === "admin";
  const isCashier = role === "cashier";
  const activeBusiness = isAdmin ? tenant.selectedBusiness : null;
  const activeBranch = isAdmin ? tenant.selectedBranch : null;
  const businessId = activeBusiness?.id;
  const locationId = activeBranch?.id;
  const isTenantReady = isCashier || Boolean(businessId && locationId);

  const tenantParams = useMemo<TenantScopeParams>(
    () => (isAdmin ? { businessId, locationId } : {}),
    [businessId, isAdmin, locationId],
  );

  const buildQueryParams = useCallback(
    <T extends Record<string, unknown>>(params?: T): T & TenantScopeParams => {
      const scoped = { ...(params ?? ({} as T)) } as T & TenantScopeParams;
      if (isCashier) {
        delete scoped.businessId;
        delete scoped.locationId;
        return scoped;
      }
      if (businessId) scoped.businessId = businessId;
      if (locationId) scoped.locationId = locationId;
      return scoped;
    },
    [businessId, isCashier, locationId],
  );

  return {
    role,
    isAdmin,
    isCashier,
    isTenantReady,
    activeBusiness,
    activeBranch,
    businessId,
    locationId,
    tenantParams,
    buildQueryParams,
  };
}
