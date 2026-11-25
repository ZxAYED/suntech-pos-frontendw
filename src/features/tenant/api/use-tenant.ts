"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useCurrentUserId } from "@/features/auth/hooks/use-current-user-id";
import { useOffline } from "@/features/offline/ui/offline-provider";
import { offlineDb } from "@/features/offline/db/offline-db";
import { readPreparedBusinesses } from "@/features/offline/services/tenant-read";
import { requireOnlineEdit } from "@/features/offline/services/catalog-read";
import { OfflineError } from "@/features/offline/core/scope";
import { apiClient } from "@/lib/api-client";
import { hydrateAuth } from "@/redux/actions/authActions";
import type { Business, Location } from "@/types/domain";

export const tenantKeys = {
  all: (userId: string) => ["tenant", userId] as const,
  businesses: (userId: string) => ["tenant", userId, "businesses"] as const,
  profile: (userId: string) => ["tenant", userId, "profile"] as const,
  locations: (userId: string, businessId?: string) =>
    ["tenant", userId, "locations", businessId ?? "assigned"] as const,
};

export function useBusinessesQuery(enabled = true) {
  const userId = useCurrentUserId();
  const offline = useOffline();
  const local = offline.mode === "OFFLINE";
  return useQuery({
    queryKey: [...tenantKeys.businesses(userId), ...(local ? ["offline", offline.revision] : [])],
    networkMode: local ? "always" : "online",
    queryFn: async ({ signal }) => local ? readPreparedBusinesses(offlineDb, userId) :
      (await apiClient.get<Business[]>("/tenant/businesses", { signal })).data,
    enabled: enabled && userId !== "anonymous",
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useBusinessProfileQuery(enabled = true) {
  const userId = useCurrentUserId();
  const offline = useOffline();
  const local = offline.mode === "OFFLINE";
  return useQuery({
    queryKey: [...tenantKeys.profile(userId), ...(local ? ["offline", offline.scope?.businessId, offline.revision] : [])],
    networkMode: local ? "always" : "online",
    queryFn: async ({ signal }) => {
      if (local) {
        const business = (await readPreparedBusinesses(offlineDb, userId)).find(item => item.id === offline.scope?.businessId);
        if (!business) throw new OfflineError("BRANCH_NOT_PREPARED", "Choose a prepared business and branch first.");
        return business;
      }
      return (await apiClient.get<Business>("/tenant/business", { signal })).data;
    },
    enabled: enabled && userId !== "anonymous",
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useLocationsQuery(businessId?: string, enabled = true) {
  const userId = useCurrentUserId();
  const offline = useOffline();
  const local = offline.mode === "OFFLINE";
  return useQuery({
    queryKey: [...tenantKeys.locations(userId, businessId), ...(local ? ["offline", offline.revision] : [])],
    networkMode: local ? "always" : "online",
    queryFn: async ({ signal }) => local ? (await readPreparedBusinesses(offlineDb, userId)).find(item => item.id === businessId)?.locations ?? [] :
      (await apiClient.get<Location[]>("/tenant/locations", { params: businessId ? { businessId } : undefined, signal })).data,
    enabled: enabled && userId !== "anonymous" && Boolean(businessId),
    staleTime: 10 * 60 * 1000, // 10 minutes (locations rarely change)
    gcTime: 30 * 60 * 1000,
  });
}

function useTenantMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const userId = useCurrentUserId();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const offline = useOffline();
  return useMutation({
    networkMode: "always",
    mutationFn: (variables: TVariables) => { requireOnlineEdit(offline.mode); return mutationFn(variables); },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all(userId) });
      try {
        const response = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const session = (await response.json()) as { user: import("@/types/domain").User };
          dispatch(hydrateAuth(session));
        }
      } catch {
        // Session refresh must not retry a completed business/branch edit.
      }
      await offline.refresh().catch(() => {});
    },
  });
}

export function useCreateBusiness() {
  return useTenantMutation(async (body: { name: string }) =>
    (await apiClient.post<{ business: Business }>("/tenant/business", body)).data,
  );
}

export function useUpdateBusiness() {
  return useTenantMutation(async ({ id, name }: { id: string; name: string }) =>
    (await apiClient.patch<Business>(`/tenant/businesses/${id}`, { name })).data,
  );
}

export function useDeleteBusiness() {
  return useTenantMutation(async (id: string) =>
    (await apiClient.delete(`/tenant/businesses/${id}`)).data,
  );
}

export function useCreateLocation() {
  return useTenantMutation(async (body: { businessId: string; name: string; address?: string }) =>
    (await apiClient.post<Location>("/tenant/locations", body)).data,
  );
}

export function useUpdateLocation() {
  return useTenantMutation(async ({ id, ...body }: { id: string; name: string; address?: string }) =>
    (await apiClient.patch<Location>(`/tenant/locations/${id}`, body)).data,
  );
}

export function useDeleteLocation() {
  return useTenantMutation(async (id: string) =>
    (await apiClient.delete(`/tenant/locations/${id}`)).data,
  );
}
