"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { PayrollRecord } from "@/types/domain";

type PayrollPeriod = QueryScope & { month: number; year: number; cashierId?: string };

export const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    payrollSummary: builder.query<PayrollRecord[], PayrollPeriod>({
      query: (params) => ({ url: "/payroll/summary", params }),
      queryKey: ({ month, year, ...scope }) => queryKeys.payroll.summary(scope, { month, year }),
      providesTags: ["Payroll"],
    }),
    payrollHistory: builder.query<PayrollRecord[], PayrollPeriod>({
      query: (params) => ({ url: "/payroll/history", params }),
      queryKey: (params) => queryKeys.payroll.history(params, params),
      providesTags: ["Payroll"],
    }),
    processPayroll: builder.mutation<PayrollRecord[], PayrollPeriod>({
      query: (data) => ({ url: "/payroll/process", method: "POST", data }),
      invalidatesTags: ["Payroll", "Report"],
    }),
    disbursePayroll: builder.mutation<PayrollRecord, { payrollId: string }>({
      query: (data) => ({ url: "/payroll/disburse", method: "POST", data }),
      invalidatesTags: ["Payroll", "Report"],
    }),
  }),
});

type Injected = typeof payrollApi & {
  usePayrollSummaryQuery: (arg: PayrollPeriod, options?: Omit<UseQueryOptions<PayrollRecord[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<PayrollRecord[], Error>>;
  usePayrollHistoryQuery: (arg: PayrollPeriod, options?: Omit<UseQueryOptions<PayrollRecord[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<PayrollRecord[], Error>>;
  useProcessPayrollMutation: (options?: UseMutationOptions<PayrollRecord[], Error, PayrollPeriod>) => ReturnType<typeof useMutation<PayrollRecord[], Error, PayrollPeriod>>;
  useDisbursePayrollMutation: (options?: UseMutationOptions<PayrollRecord, Error, { payrollId: string }>) => ReturnType<typeof useMutation<PayrollRecord, Error, { payrollId: string }>>;
};
const typed = payrollApi as Injected;
export const usePayrollSummaryQuery = typed.usePayrollSummaryQuery;
export const usePayrollHistoryQuery = typed.usePayrollHistoryQuery;
export const useProcessPayrollMutation = typed.useProcessPayrollMutation;
export const useDisbursePayrollMutation = typed.useDisbursePayrollMutation;
