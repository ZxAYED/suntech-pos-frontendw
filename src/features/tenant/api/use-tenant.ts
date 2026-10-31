"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import { hydrateAuth } from "@/redux/actions/authActions";
import type { RootState } from "@/redux/types";
import type { Business, Location } from "@/types/domain";

export const tenantKeys = {
  all: (userId: string) => ["tenant", userId] as const,
  businesses: (userId: string) => ["tenant", userId, "businesses"] as const,
  profile: (userId: string) => ["tenant", userId, "profile"] as const,
  locations: (userId: string, businessId?: string) =>
    ["tenant", userId, "locations", businessId ?? "assigned"] as const,
};

function useUserId() {
  return useSelector((state: RootState) => state.auth.user?.id ?? "anonymous");
}

export function useBusinessesQuery(enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: tenantKeys.businesses(userId),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Business[]>("/tenant/businesses", { signal })).data,
    enabled: enabled && userId !== "anonymous",
    staleTime: 60_000 * 5,
  });
}

export function useBusinessProfileQuery(enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: tenantKeys.profile(userId),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Business>("/tenant/business", { signal })).data,
    enabled: enabled && userId !== "anonymous",
  });
}

export function useLocationsQuery(businessId?: string, enabled = true) {
  const userId = useUserId();
  return useQuery({
    queryKey: tenantKeys.locations(userId, businessId),
    queryFn: async ({ signal }) =>
      (await apiClient.get<Location[]>("/tenant/locations", {
        params: businessId ? { businessId } : undefined,
        signal,
      })).data,
    enabled: enabled && userId !== "anonymous" && Boolean(businessId),
  });
}

function useTenantMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all(userId) });
      try {
        const response = await fetch("/api/session", { credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const session = (await response.json()) as { user: import("@/types/domain").User };
          dispatch(hydrateAuth(session));
        }
      } catch {
        // Silently continue if session check fails (e.g. offline/network)
      }
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
