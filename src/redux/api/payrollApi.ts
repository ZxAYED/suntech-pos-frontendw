"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { AdvanceEntry, PayrollSummary } from "@/types/domain";

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    payrollSummary: builder.query<
      PayrollSummary,
      { cashierId: string; month: number; year: number }
    >({
      query: ({ cashierId, month, year }) => ({
        url: `/payroll/summary`,
        params: { cashierId, month, year },
      }),
      queryKey: ({ cashierId, month, year }) =>
        queryKeys.payroll.summary(cashierId, month, year),
      providesTags: ["Payroll"],
    }),
    payrollHistory: builder.query<PayrollSummary[], { month: number; year: number }>({
      query: ({ month, year }) => ({
        url: "/payroll/history",
        params: { month, year },
      }),
      queryKey: ({ month, year }) => queryKeys.payroll.history(month, year),
      providesTags: ["Payroll"],
    }),
    advances: builder.query<
      AdvanceEntry[],
      { cashierId: string; month: number; year: number }
    >({
      query: ({ cashierId, month, year }) => ({
        url: "/payroll/advances",
        params: { cashierId, month, year },
      }),
      queryKey: ({ cashierId, month, year }) =>
        queryKeys.payroll.advances(cashierId, month, year),
      providesTags: ["Payroll"],
    }),
    processPayroll: builder.mutation<
      PayrollSummary,
      { cashierId: string; month: number; year: number }
    >({
      query: (data) => ({ url: "/payroll/process", method: "POST", data }),
      invalidatesTags: ["Payroll", "Report"],
    }),
  }),
});

type SummaryArg = { cashierId: string; month: number; year: number };

type Injected = typeof payrollApi & {
  usePayrollSummaryQuery: (
    arg: SummaryArg,
    options?: Omit<UseQueryOptions<PayrollSummary, Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<PayrollSummary, Error>>;
  usePayrollHistoryQuery: (
    arg: { month: number; year: number },
    options?: Omit<UseQueryOptions<PayrollSummary[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<PayrollSummary[], Error>>;
  useAdvancesQuery: (
    arg: SummaryArg,
    options?: Omit<UseQueryOptions<AdvanceEntry[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<AdvanceEntry[], Error>>;
  useProcessPayrollMutation: (
    options?: UseMutationOptions<PayrollSummary, Error, SummaryArg>,
  ) => ReturnType<typeof useMutation<PayrollSummary, Error, SummaryArg>>;
};

const typed = payrollApi as Injected;
export const usePayrollSummaryQuery = typed.usePayrollSummaryQuery;
export const usePayrollHistoryQuery = typed.usePayrollHistoryQuery;
export const useAdvancesQuery = typed.useAdvancesQuery;
export const useProcessPayrollMutation = typed.useProcessPayrollMutation;
