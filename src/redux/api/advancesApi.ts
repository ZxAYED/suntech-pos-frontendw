"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Advance } from "@/types/domain";

type AdvanceFilters = QueryScope & { cashierId?: string; month?: number; year?: number; page?: number; limit?: number };
type CreateAdvanceInput = { cashierId: string; amount: number; note?: string };

export const advancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    advances: builder.query<Advance[], AdvanceFilters | void>({
      query: (params) => ({ url: "/advances", params: params || undefined }),
      queryKey: (params) => queryKeys.advances.list(params || {}, params || undefined),
      providesTags: ["Advance"],
    }),
    advancesSummary: builder.query<{ total: number; outstanding: number }, AdvanceFilters | void>({
      query: (params) => ({ url: "/advances/summary", params: params || undefined }),
      queryKey: (params) => ["advances", "summary", params] as const,
      providesTags: ["Advance"],
    }),
    createAdvance: builder.mutation<Advance, CreateAdvanceInput>({
      query: (data) => ({ url: "/advances", method: "POST", data }),
      invalidatesTags: ["Advance", "Payroll"],
    }),
    deleteAdvance: builder.mutation<{ id: string }, string>({
      query: (id) => ({ url: `/advances/${id}`, method: "DELETE" }),
      invalidatesTags: ["Advance", "Payroll"],
    }),
  }),
});

type Injected = typeof advancesApi & {
  useAdvancesQuery: (arg?: AdvanceFilters, options?: Omit<UseQueryOptions<Advance[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Advance[], Error>>;
  useAdvancesSummaryQuery: (arg?: AdvanceFilters, options?: Omit<UseQueryOptions<{ total: number; outstanding: number }, Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<{ total: number; outstanding: number }, Error>>;
  useCreateAdvanceMutation: (options?: UseMutationOptions<Advance, Error, CreateAdvanceInput>) => ReturnType<typeof useMutation<Advance, Error, CreateAdvanceInput>>;
  useDeleteAdvanceMutation: (options?: UseMutationOptions<{ id: string }, Error, string>) => ReturnType<typeof useMutation<{ id: string }, Error, string>>;
};
const typed = advancesApi as Injected;
export const useAdvancesQuery = typed.useAdvancesQuery;
export const useAdvancesSummaryQuery = typed.useAdvancesSummaryQuery;
export const useCreateAdvanceMutation = typed.useCreateAdvanceMutation;
export const useDeleteAdvanceMutation = typed.useDeleteAdvanceMutation;
