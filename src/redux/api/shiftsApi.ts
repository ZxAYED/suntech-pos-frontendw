"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Shift } from "@/types/domain";

export interface OpenShiftPayload {
  startingAmount: number;
  locationId?: string;
  businessId?: string;
  autoClosePrevious?: boolean;
}

export interface CloseShiftPayload {
  closingAmount: number;
  notes?: string;
}

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    activeShift: builder.query<Shift | null, (QueryScope & { businessId?: string; locationId?: string }) | void>({
      query: (params) => ({ url: "/shifts/active", params: params || undefined }),
      queryKey: (params) => queryKeys.shifts.active(params || undefined),
      providesTags: ["Shift"],
    }),
    shifts: builder.query<Shift[], (QueryScope & Record<string, unknown>) | void>({
      query: (params) => ({ url: "/shifts", params: params || undefined }),
      queryKey: (params) => queryKeys.shifts.list(params || undefined, params || undefined),
      providesTags: ["Shift"],
    }),
    openShift: builder.mutation<Shift, OpenShiftPayload>({
      query: (data) => ({ url: "/shifts/open", method: "POST", data }),
      invalidatesTags: ["Shift"],
    }),
    closeShift: builder.mutation<Shift, CloseShiftPayload>({
      query: (data) => ({ url: "/shifts/close", method: "POST", data }),
      invalidatesTags: ["Shift", "Report"],
    }),
  }),
});

type Injected = typeof shiftsApi & {
  useActiveShiftQuery: (arg?: (QueryScope & { businessId?: string; locationId?: string }), options?: Omit<UseQueryOptions<Shift | null, Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Shift | null, Error>>;
  useShiftsQuery: (arg?: QueryScope & Record<string, unknown>, options?: Omit<UseQueryOptions<Shift[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Shift[], Error>>;
  useOpenShiftMutation: (options?: UseMutationOptions<Shift, Error, OpenShiftPayload>) => ReturnType<typeof useMutation<Shift, Error, OpenShiftPayload>>;
  useCloseShiftMutation: (options?: UseMutationOptions<Shift, Error, CloseShiftPayload>) => ReturnType<typeof useMutation<Shift, Error, CloseShiftPayload>>;
};
const typed = shiftsApi as Injected;
export const useActiveShiftQuery = typed.useActiveShiftQuery;
export const useShiftsQuery = typed.useShiftsQuery;
export const useOpenShiftMutation = typed.useOpenShiftMutation;
export const useCloseShiftMutation = typed.useCloseShiftMutation;
