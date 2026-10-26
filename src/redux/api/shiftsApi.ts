"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Shift } from "@/types/domain";

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    activeShift: builder.query<Shift | null, QueryScope | void>({
      query: (params) => ({ url: "/shifts/active", params: params || undefined }),
      queryKey: (params) => queryKeys.shifts.active(params || undefined),
      providesTags: ["Shift"],
    }),
    shifts: builder.query<Shift[], (QueryScope & Record<string, unknown>) | void>({
      query: (params) => ({ url: "/shifts", params: params || undefined }),
      queryKey: (params) => queryKeys.shifts.list(params || undefined, params || undefined),
      providesTags: ["Shift"],
    }),
    openShift: builder.mutation<Shift, { openingFloat: number; locationId?: string }>({
      query: (data) => ({ url: "/shifts/open", method: "POST", data }),
      invalidatesTags: ["Shift"],
    }),
    closeShift: builder.mutation<Shift, { closingCash: number }>({
      query: (data) => ({ url: "/shifts/close", method: "POST", data }),
      invalidatesTags: ["Shift", "Report"],
    }),
  }),
});

type Injected = typeof shiftsApi & {
  useActiveShiftQuery: (arg?: QueryScope, options?: Omit<UseQueryOptions<Shift | null, Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Shift | null, Error>>;
  useShiftsQuery: (arg?: QueryScope & Record<string, unknown>, options?: Omit<UseQueryOptions<Shift[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Shift[], Error>>;
  useOpenShiftMutation: (options?: UseMutationOptions<Shift, Error, { openingFloat: number; locationId?: string }>) => ReturnType<typeof useMutation<Shift, Error, { openingFloat: number; locationId?: string }>>;
  useCloseShiftMutation: (options?: UseMutationOptions<Shift, Error, { closingCash: number }>) => ReturnType<typeof useMutation<Shift, Error, { closingCash: number }>>;
};
const typed = shiftsApi as Injected;
export const useActiveShiftQuery = typed.useActiveShiftQuery;
export const useShiftsQuery = typed.useShiftsQuery;
export const useOpenShiftMutation = typed.useOpenShiftMutation;
export const useCloseShiftMutation = typed.useCloseShiftMutation;
