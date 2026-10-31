"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { tenantPreferences } from "@/lib/tenant-preferences";
import type { BranchItem, BusinessItem, RootState } from "@/redux/types";

export type RoleType = "admin" | "cashier" | "super-admin";

export interface TenantScopeParams {
  businessId?: string;
  locationId?: string;
}

export interface UseTenantScopeReturn {
  role: RoleType;
  isAdmin: boolean;
  isCashier: boolean;
  isSuperAdmin: boolean;
  isTenantReady: boolean;
  activeBusiness: BusinessItem | null;
  activeBranch: BranchItem | null;
  businessId?: string;
  locationId?: string;
  tenantParams: TenantScopeParams;
  buildQueryParams: <T extends Record<string, unknown>>(params?: T) => T & TenantScopeParams;
}

function sessionRole(role?: string): RoleType | undefined {
  if (role === "SUPER_ADMIN") return "super-admin";
  if (role === "ADMIN") return "admin";
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
    if (pathname.startsWith("/super-admin")) return "super-admin";
    return pathname.startsWith("/admin") ? "admin" : "cashier";
  }, [authUser?.role, pathname, previewRole]);

  const isSuperAdmin = role === "super-admin";
  const isAdmin = role === "admin";
  const isCashier = role === "cashier";
  const authUserId = authUser?.id;

  const storedTenant = useMemo(() => {
    if (!isAdmin || !authUserId) return null;
    return tenantPreferences.getTenantContext(authUserId);
  }, [authUserId, isAdmin]);

  const activeBusiness: BusinessItem | null = isAdmin
    ? (tenant.selectedBusiness ?? (storedTenant ? {
        id: storedTenant.businessId,
        name: storedTenant.businessName,
        code: storedTenant.businessId.slice(0, 6).toUpperCase(),
        status: "ACTIVE",
        branches: storedTenant.locationId ? [{
          id: storedTenant.locationId,
          businessId: storedTenant.businessId,
          name: storedTenant.locationName ?? "Operational Branch",
          code: storedTenant.locationId.slice(0, 6).toUpperCase(),
          address: null,
          status: "ACTIVE",
        }] : [],
      } : null))
    : null;

  const activeBranch: BranchItem | null = isAdmin
    ? (tenant.selectedBranch ?? (storedTenant && storedTenant.locationId ? {
        id: storedTenant.locationId,
        businessId: storedTenant.businessId,
        name: storedTenant.locationName ?? "Operational Branch",
        code: storedTenant.locationId.slice(0, 6).toUpperCase(),
        address: null,
        status: "ACTIVE",
      } : null))
    : null;

  const businessId = isSuperAdmin ? undefined : isAdmin ? activeBusiness?.id : (authUser?.businessId ?? undefined);
  const locationId = isSuperAdmin ? undefined : isAdmin ? activeBranch?.id : (authUser?.locationId ?? undefined);
  const isTenantReady = isSuperAdmin ? true : isCashier ? true : Boolean(businessId && locationId);

  const tenantParams = useMemo<TenantScopeParams>(
    () => {
      if (isAdmin && businessId && locationId) {
        return { businessId, locationId };
      }
      if (isCashier) {
        return locationId ? { locationId } : {};
      }
      return {};
    },
    [businessId, isAdmin, isCashier, locationId],
  );

  const buildQueryParams = useCallback(
    <T extends Record<string, unknown>>(params?: T): T & TenantScopeParams => {
      const scoped = { ...(params ?? ({} as T)) } as T & TenantScopeParams;
      if (isSuperAdmin) {
        delete scoped.businessId;
        delete scoped.locationId;
        return scoped;
      }
      if (isAdmin) {
        if (businessId) scoped.businessId = businessId;
        if (locationId) scoped.locationId = locationId;
      } else if (isCashier) {
        delete scoped.businessId; // Cashier business is locked by token
        if (locationId) scoped.locationId = locationId;
      }
      return scoped;
    },
    [businessId, isAdmin, isCashier, isSuperAdmin, locationId],
  );

  return {
    role,
    isAdmin,
    isCashier,
    isSuperAdmin,
    isTenantReady,
    activeBusiness,
    activeBranch,
    businessId,
    locationId,
    tenantParams,
    buildQueryParams,
  };
}
