"use client";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import type { RootState } from "@/redux/types";

export interface AuditActor {
  id: string;
  name: string;
  role: string;
}

export interface AuditLocation {
  id: string;
  name: string;
}

export interface AuditEntity {
  type: string;
  id: string;
  name: string;
  sku?: string | null;
  productName?: string | null;
  variantName?: string | null;
}

export interface AuditLogItem {
  id: string;
  action: string;             // Raw enum action, e.g. "LOW_STOCK_AFTER_SALE"
  issue: string;              // Human-friendly title, e.g. "Low Stock Alert"
  summary: string;            // Formatted 1-sentence explanation of what occurred

  // Actor / Staff
  actorId: string;
  actorName: string;          // e.g. "ZX" or "Jane Cashier"
  actorRole: string;          // e.g. "ADMIN" or "CASHIER"
  actor: AuditActor;

  // Location / Branch
  businessId: string;
  locationId: string | null;
  locationName: string | null;// e.g. "Uttara Doyel Branch"
  location: AuditLocation | null;

  // Target Entity
  entityType: string;         // e.g. "VARIANT", "USER", "ORDER"
  entityId: string;
  entityName: string;         // e.g. "Nothing 3a pro (Default)"
  sku?: string | null;        // e.g. "PRD-XTJAN3"
  entity: AuditEntity;

  // Clean Business Metrics (Noisy UUIDs and nulls stripped)
  metadata: Record<string, unknown> | null;
  diff?: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;          // ISO Timestamp
}

export interface AuditLogPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuditLogListData {
  items: AuditLogItem[];
  meta: AuditLogPaginationMeta;
}

export interface AuditLogListResponse {
  success: boolean;
  message: string;
  data: AuditLogListData;
  timestamp: string;
}

export interface AuditLogSingleResponse {
  success: boolean;
  message: string;
  data: AuditLogItem;
  timestamp: string;
}

export interface AuditLogFilters {
  businessId?: string;
  locationId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (userId: string, filters: Record<string, unknown>) =>
    ["audit-logs", userId, "list", filters] as const,
  detail: (userId: string, id: string, businessId?: string) =>
    ["audit-logs", userId, "detail", id, businessId ?? ""] as const,
};

function useUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export function useAuditLogs(filters: AuditLogFilters = {}, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");

  const queryParams: Record<string, unknown> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
  };

  if (filters.action && filters.action !== "all") {
    queryParams.action = filters.action;
  }
  if (filters.entityType && filters.entityType !== "all") {
    queryParams.entityType = filters.entityType;
  }
  if (filters.entityId) queryParams.entityId = filters.entityId;
  if (filters.actorId) queryParams.actorId = filters.actorId;
  if (filters.from) queryParams.from = filters.from;
  if (filters.to) queryParams.to = filters.to;

  if (filters.locationId && filters.locationId !== "all") {
    queryParams.locationId = filters.locationId;
  } else if (tenant.locationId && (!filters.locationId || filters.locationId === "tenant")) {
    queryParams.locationId = tenant.locationId;
  }

  const effectiveBusinessId = filters.businessId || tenant.businessId;
  if (effectiveBusinessId) {
    queryParams.businessId = effectiveBusinessId;
  }

  return useQuery({
    queryKey: auditKeys.list(userId, queryParams),
    queryFn: async ({ signal }) => {
      // apiClient response interceptor unwraps payload.data -> AuditLogListData
      const res = await apiClient.get<AuditLogListData>("/audit-logs", {
        params: queryParams,
        signal,
      });
      return res.data;
    },
    enabled: enabled && userId !== "anonymous" && Boolean(effectiveBusinessId),
    staleTime: 15_000,
  });
}

export function useAuditLogDetail(id?: string | null, customBusinessId?: string, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");
  const businessId = customBusinessId || tenant.businessId;

  return useQuery({
    queryKey: auditKeys.detail(userId, id ?? "", businessId),
    queryFn: async ({ signal }) => {
      // apiClient response interceptor unwraps payload.data -> AuditLogItem
      const res = await apiClient.get<AuditLogItem>(`/audit-logs/${id}`, {
        params: businessId ? { businessId } : undefined,
        signal,
      });
      return res.data;
    },
    enabled: enabled && userId !== "anonymous" && Boolean(id) && Boolean(businessId),
    staleTime: 60_000,
  });
}
