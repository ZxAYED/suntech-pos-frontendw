"use client";

import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { useTenantScope } from "@/features/tenant/hooks/use-tenant-scope";
import type { RootState } from "@/redux/types";

export interface AuditLogItem {
  id: string;
  businessId: string;
  locationId?: string | null;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  locationId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  businessId?: string;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditKeys = {
  all: ["audit-logs"] as const,
  list: (userId: string, filters: AuditLogFilters) =>
    ["audit-logs", userId, "list", filters] as const,
  detail: (userId: string, id: string) =>
    ["audit-logs", userId, "detail", id] as const,
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
  if (filters.action) queryParams.action = filters.action;
  if (filters.entityType) queryParams.entityType = filters.entityType;
  if (filters.entityId) queryParams.entityId = filters.entityId;
  if (filters.actorId) queryParams.actorId = filters.actorId;
  if (filters.from) queryParams.from = filters.from;
  if (filters.to) queryParams.to = filters.to;
  if (filters.locationId || tenant.locationId) {
    queryParams.locationId = filters.locationId || tenant.locationId;
  }
  if (filters.businessId || tenant.businessId) {
    queryParams.businessId = filters.businessId || tenant.businessId;
  }

  return useQuery({
    queryKey: auditKeys.list(userId, queryParams),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AuditLogListResponse>("/audit-logs", {
        params: queryParams,
        signal,
      });
      return res.data;
    },
    enabled: enabled && userId !== "anonymous" && Boolean(queryParams.businessId),
    staleTime: 30_000,
  });
}

export function useAuditLogDetail(id: string, enabled = true) {
  const userId = useUserId();
  const tenant = useTenantScope("admin");

  return useQuery({
    queryKey: auditKeys.detail(userId, id),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AuditLogItem>(`/audit-logs/${id}`, {
        params: { businessId: tenant.businessId },
        signal,
      });
      return res.data;
    },
    enabled: enabled && userId !== "anonymous" && Boolean(id) && Boolean(tenant.businessId),
  });
}
