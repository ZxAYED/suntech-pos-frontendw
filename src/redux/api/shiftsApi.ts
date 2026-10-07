"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Shift } from "@/types/domain";

export const shiftsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    activeShift: builder.query<Shift | null, void>({
      query: () => ({ url: "/shifts/active" }),
      queryKey: () => queryKeys.shifts.active,
      providesTags: ["Shift"],
    }),
    openShift: builder.mutation<Shift, { startingAmount: number }>({
      query: (data) => ({ url: "/shifts/open", method: "POST", data }),
      invalidatesTags: ["Shift"],
    }),
    closeShift: builder.mutation<Shift, { closingAmount: number }>({
      query: (data) => ({ url: "/shifts/close", method: "POST", data }),
      invalidatesTags: ["Shift", "Report"],
    }),
  }),
});

type Injected = typeof shiftsApi & {
  useActiveShiftQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<Shift | null, Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Shift | null, Error>>;
  useOpenShiftMutation: (
    options?: UseMutationOptions<Shift, Error, { startingAmount: number }>,
  ) => ReturnType<typeof useMutation<Shift, Error, { startingAmount: number }>>;
  useCloseShiftMutation: (
    options?: UseMutationOptions<Shift, Error, { closingAmount: number }>,
  ) => ReturnType<typeof useMutation<Shift, Error, { closingAmount: number }>>;
};

const typed = shiftsApi as Injected;
export const useActiveShiftQuery = typed.useActiveShiftQuery;
export const useOpenShiftMutation = typed.useOpenShiftMutation;
export const useCloseShiftMutation = typed.useCloseShiftMutation;
