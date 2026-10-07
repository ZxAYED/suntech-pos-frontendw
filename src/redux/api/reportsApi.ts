"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
import { baseApi } from "@/redux/api/baseApi";
import type { DashboardMetrics, Order } from "@/types/domain";

async function downloadExport(path: string, params: Record<string, unknown>, filename: string) {
  const response = await apiClient.get<Blob>(path, {
    params,
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboard: builder.query<DashboardMetrics, string>({
      query: (role) => ({ url: "/reports/dashboard", params: { role } }),
      queryKey: (role) => queryKeys.reports.dashboard(role),
      providesTags: ["Report"],
    }),
    transactions: builder.query<Order[], Record<string, unknown> | void>({
      query: (params) => ({
        url: "/reports/transactions",
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      queryKey: (params) =>
        queryKeys.reports.transactions(params as Record<string, unknown> | undefined),
      providesTags: ["Report", "Order"],
    }),
  }),
});

type Injected = typeof reportsApi & {
  useDashboardQuery: (
    role: string,
    options?: Omit<UseQueryOptions<DashboardMetrics, Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<DashboardMetrics, Error>>;
  useTransactionsQuery: (
    arg?: Record<string, unknown>,
    options?: Omit<UseQueryOptions<Order[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Order[], Error>>;
};

const typed = reportsApi as Injected;
export const useDashboardQuery = typed.useDashboardQuery;
export const useTransactionsQuery = typed.useTransactionsQuery;

export function useExportReportsMutation(
  options?: UseMutationOptions<void, Error, { format: "csv" | "pdf"; from?: string; to?: string }>,
) {
  return useMutation({
    mutationFn: async ({ format, from, to }) => {
      const filename = `suntech-report.${format}`;
      await downloadExport(`/reports/export/${format}`, { from, to }, filename);
    },
    ...options,
  });
}
