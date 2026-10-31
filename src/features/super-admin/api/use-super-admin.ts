"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { apiClient } from "@/lib/api-client";
import type { RootState } from "@/redux/types";
import type { AccountStatus } from "@/types/domain";

export interface AdminUserItem {
  id: string;
  publicId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: "ADMIN";
  status: AccountStatus;
  statusReason: string | null;
  createdAt: string;
  updatedAt: string;
  business: {
    id: string;
    name: string;
    _count: {
      locations: number;
    };
  } | null;
}

export interface AdminUserFilters {
  status?: AccountStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserListResponse {
  items: AdminUserItem[];
  page: number;
  limit: number;
  total: number;
}

export const superAdminKeys = {
  all: ["super-admin"] as const,
  users: (filters: AdminUserFilters) => ["super-admin", "users", filters] as const,
};

export function useAdminUsers(filters: AdminUserFilters = {}, enabled = true) {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  return useQuery({
    queryKey: superAdminKeys.users(filters),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<AdminUserListResponse>("/admin/users", {
        params: {
          page: filters.page ?? 1,
          limit: filters.limit ?? 20,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
        },
        signal,
      });
      return res.data;
    },
    enabled: enabled && Boolean(isSuperAdmin),
    staleTime: 30_000,
  });
}

export function useApproveAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<AdminUserItem>(`/admin/users/${id}/approve`);
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminKeys.all });
    },
  });
}

export function useUpdateAdminUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      statusReason,
    }: {
      id: string;
      status: "ACTIVE" | "SUSPENDED" | "REJECTED";
      statusReason?: string;
    }) => {
      const res = await apiClient.patch<AdminUserItem>(`/admin/users/${id}/status`, {
        status,
        statusReason,
      });
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: superAdminKeys.all });
    },
  });
}
