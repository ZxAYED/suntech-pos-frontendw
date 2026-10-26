"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { AccountStatus, Cashier } from "@/types/domain";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    cashiers: builder.query<Cashier[], void>({
      query: () => ({ url: "/users/cashiers" }),
      queryKey: () => queryKeys.staff.list(),
      providesTags: ["Cashier"],
    }),
    createCashier: builder.mutation<
      Cashier,
      { fullName: string; email?: string; phoneNumber?: string; password: string; locationId: string; monthlySalary?: number }
    >({
      query: (data) => ({ url: "/users/cashiers", method: "POST", data }),
      invalidatesTags: ["Cashier"],
    }),
    toggleCashierStatus: builder.mutation<
      Cashier,
      { id: string; status: AccountStatus }
    >({
      query: ({ id, status }) => ({
        url: `/users/${id}/status`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["Cashier"],
    }),
  }),
});

type Injected = typeof usersApi & {
  useCashiersQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<Cashier[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Cashier[], Error>>;
  useCreateCashierMutation: (
    options?: UseMutationOptions<
      Cashier,
      Error,
      { fullName: string; email?: string; phoneNumber?: string; password: string; locationId: string; monthlySalary?: number }
    >,
  ) => ReturnType<
    typeof useMutation<
      Cashier,
      Error,
      { fullName: string; email?: string; phoneNumber?: string; password: string; locationId: string; monthlySalary?: number }
    >
  >;
  useToggleCashierStatusMutation: (
    options?: UseMutationOptions<Cashier, Error, { id: string; status: AccountStatus }>,
  ) => ReturnType<typeof useMutation<Cashier, Error, { id: string; status: AccountStatus }>>;
};

const typed = usersApi as Injected;
export const useCashiersQuery = typed.useCashiersQuery;
export const useCreateCashierMutation = typed.useCreateCashierMutation;
export const useToggleCashierStatusMutation = typed.useToggleCashierStatusMutation;
