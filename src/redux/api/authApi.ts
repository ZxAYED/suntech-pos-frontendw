"use client";

import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { baseApi } from "@/redux/api/baseApi";
import type { AuthSession, User } from "@/types/domain";

export type AdminLoginPayload = {
  loginType: "ADMIN";
  email: string;
  password: string;
};

export type CashierLoginPayload = {
  loginType: "BUSINESS_USER";
  publicId: string;
  password: string;
};

export type LoginPayload = AdminLoginPayload | CashierLoginPayload;

export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = { token: string; password: string };

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthSession, LoginPayload>({
      query: (data) => ({ url: "/auth/login", method: "POST", data }),
      invalidatesTags: ["Auth", "Shift"],
    }),
    me: builder.query<User, void>({
      query: () => ({ url: "/auth/me" }),
      queryKey: () => queryKeys.auth.me,
      providesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation<{ message: string }, ForgotPasswordPayload>({
      query: (data) => ({ url: "/auth/forgot-password", method: "POST", data }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordPayload>({
      query: (data) => ({ url: "/auth/reset-password", method: "POST", data }),
    }),
  }),
});

type Injected = typeof authApi & {
  useLoginMutation: (
    options?: UseMutationOptions<AuthSession, Error, LoginPayload>,
  ) => ReturnType<typeof useMutation<AuthSession, Error, LoginPayload>>;
  useMeQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<User, Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<User, Error>>;
  useForgotPasswordMutation: (
    options?: UseMutationOptions<{ message: string }, Error, ForgotPasswordPayload>,
  ) => ReturnType<typeof useMutation<{ message: string }, Error, ForgotPasswordPayload>>;
  useResetPasswordMutation: (
    options?: UseMutationOptions<{ message: string }, Error, ResetPasswordPayload>,
  ) => ReturnType<typeof useMutation<{ message: string }, Error, ResetPasswordPayload>>;
};

const typedAuthApi = authApi as Injected;

export const useLoginMutation = typedAuthApi.useLoginMutation;
export const useMeQuery = typedAuthApi.useMeQuery;
export const useForgotPasswordMutation = typedAuthApi.useForgotPasswordMutation;
export const useResetPasswordMutation = typedAuthApi.useResetPasswordMutation;
