"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys, type QueryScope } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { Order, PaymentMethod, Refund } from "@/types/domain";

export interface CreateOrderPayload {
  shiftId?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  tenderedAmount?: number;
  lines: Array<{ variantId: string; quantity: number; unitPrice: number }>;
}

export interface CreateRefundPayload {
  orderId: string;
  reason?: string;
  items: Array<{ orderItemId: string; quantity: number }>;
}

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    orders: builder.query<Order[], (QueryScope & Record<string, unknown>) | void>({
      query: (params) => ({ url: "/orders", params: params || undefined }),
      queryKey: (params) => queryKeys.orders.list(params || undefined, params || undefined),
      providesTags: ["Order"],
    }),
    orderDetail: builder.query<Order, string>({
      query: (orderId) => ({ url: `/orders/${orderId}` }),
      queryKey: (orderId) => queryKeys.orders.detail(orderId),
      providesTags: ["Order"],
    }),
    createOrder: builder.mutation<Order, CreateOrderPayload>({
      query: (data) => ({ url: "/orders", method: "POST", data }),
      invalidatesTags: ["Order", "Report", "Shift"],
    }),
    refundOrder: builder.mutation<Refund, CreateRefundPayload>({
      query: ({ orderId, ...data }) => ({ url: `/orders/${orderId}/refunds`, method: "POST", data }),
      invalidatesTags: ["Order", "Report"],
    }),
  }),
});

type Injected = typeof ordersApi & {
  useOrdersQuery: (arg?: QueryScope & Record<string, unknown>, options?: Omit<UseQueryOptions<Order[], Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Order[], Error>>;
  useOrderDetailQuery: (arg: string, options?: Omit<UseQueryOptions<Order, Error>, "queryKey" | "queryFn">) => ReturnType<typeof useQuery<Order, Error>>;
  useCreateOrderMutation: (options?: UseMutationOptions<Order, Error, CreateOrderPayload>) => ReturnType<typeof useMutation<Order, Error, CreateOrderPayload>>;
  useRefundOrderMutation: (options?: UseMutationOptions<Refund, Error, CreateRefundPayload>) => ReturnType<typeof useMutation<Refund, Error, CreateRefundPayload>>;
};
const typed = ordersApi as Injected;
export const useOrdersQuery = typed.useOrdersQuery;
export const useOrderDetailQuery = typed.useOrderDetailQuery;
export const useCreateOrderMutation = typed.useCreateOrderMutation;
export const useRefundOrderMutation = typed.useRefundOrderMutation;
