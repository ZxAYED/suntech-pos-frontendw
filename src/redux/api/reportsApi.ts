"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { DashboardSummary, Order } from "@/types/domain";

type ReportFilters = QueryScope & { range?: string; month?: number; week?: number; year?: number; search?: string; page?: number; limit?: number };

async function downloadExport(params: ReportFilters & { format: "csv" | "pdf" }, filename: string) {
  const response = await apiClient.get<Blob>("/reports/export", { params, responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    dashboard: builder.query<DashboardSummary, ReportFilters | void>({
      query: (params) => ({ url: "/reports/dashboard", params: params || undefined }),
      queryKey: (params) => queryKeys.reports.dashboard(params || {}, params?.range),
      providesTags: ["Report"],
    }),
    transactions: builder.query<Order[], ReportFilters | void>({
      query: (params) => ({ url: "/reports/transactions", params: params || undefined }),
      queryKey: (params) => queryKeys.reports.transactions(params || {}, params || undefined),
      providesTags: ["Report", "Order"],
    }),
  }),
});

type Injected = typeof reportsApi & {
  useDashboardQuery: (arg?: ReportFilters, options?: Omit<UseQueryOptions<DashboardSummary, Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<DashboardSummary, Error>>;
  useTransactionsQuery: (arg?: ReportFilters, options?: Omit<UseQueryOptions<Order[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Order[], Error>>;
};
const typed = reportsApi as Injected;
export const useDashboardQuery = typed.useDashboardQuery;
export const useTransactionsQuery = typed.useTransactionsQuery;

export function useExportReportsMutation(options?: UseMutationOptions<void, Error, ReportFilters & { format: "csv" | "pdf" }>) {
  return useMutation({
    mutationFn: async (params) => downloadExport(params, `suntech-report.${params.format}`),
    ...options,
  });
}
