"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Order } from "@/types/domain";

export interface CreateOrderPayload {
  shiftId: string;
  tenderedAmount: number;
  lines: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    variantId?: string;
    custom?: boolean;
  }>;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    orders: builder.query<Order[], Record<string, unknown> | void>({
      query: (params) => ({
        url: "/orders",
        params: params ? (params as Record<string, unknown>) : undefined,
      }),
      queryKey: (params) => queryKeys.orders.list(params as Record<string, unknown> | undefined),
      providesTags: ["Order"],
    }),
    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (data) => ({ url: "/orders", method: "POST", data }),
      invalidatesTags: ["Order", "Report", "Shift"],
    }),
  }),
});

type Injected = typeof ordersApi & {
  useOrdersQuery: (
    arg?: Record<string, unknown>,
    options?: Omit<UseQueryOptions<Order[], Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<Order[], Error>>;
  useCreateOrderMutation: (
    options?: UseMutationOptions<Order, Error, CreateOrderPayload>,
  ) => ReturnType<typeof useMutation<Order, Error, CreateOrderPayload>>;
};

const typed = ordersApi as Injected;
export const useOrdersQuery = typed.useOrdersQuery;
export const useCreateOrderMutation = typed.useCreateOrderMutation;
