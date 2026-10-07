"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { AccountStatus, CashierAccount } from "@/types/domain";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    cashiers: builder.query<CashierAccount[], void>({
      query: () => ({ url: "/users/cashiers" }),
      queryKey: () => queryKeys.staff.cashiers,
      providesTags: ["Cashier"],
    }),
    createCashier: builder.mutation<
      CashierAccount,
      { displayName: string; password: string; locationId?: string }
    >({
      query: (data) => ({ url: "/users/cashiers", method: "POST", data }),
      invalidatesTags: ["Cashier"],
    }),
    toggleCashierStatus: builder.mutation<
      CashierAccount,
      { id: string; status: AccountStatus }
    >({
      query: ({ id, status }) => ({
        url: `/users/cashiers/${id}/status`,
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
    options?: Omit<UseQueryOptions<CashierAccount[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<CashierAccount[], Error>>;
  useCreateCashierMutation: (
    options?: UseMutationOptions<
      CashierAccount,
      Error,
      { displayName: string; password: string; locationId?: string }
    >,
  ) => ReturnType<
    typeof useMutation<
      CashierAccount,
      Error,
      { displayName: string; password: string; locationId?: string }
    >
  >;
  useToggleCashierStatusMutation: (
    options?: UseMutationOptions<CashierAccount, Error, { id: string; status: AccountStatus }>,
  ) => ReturnType<typeof useMutation<CashierAccount, Error, { id: string; status: AccountStatus }>>;
};

const typed = usersApi as Injected;
export const useCashiersQuery = typed.useCashiersQuery;
export const useCreateCashierMutation = typed.useCreateCashierMutation;
export const useToggleCashierStatusMutation = typed.useToggleCashierStatusMutation;
