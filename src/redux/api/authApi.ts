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

export type RegisterPayload = { fullName: string; email: string; password: string; phoneNumber?: string };
export type ForgotPasswordPayload = { email: string };
export type VerifyOtpPayload = { email: string; otp: string; loginType?: "ADMIN" };
export type ResetPasswordPayload = { resetToken: string; newPassword: string };

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<User, RegisterPayload>({
      query: (data) => ({ url: "/auth/register", method: "POST", data }),
    }),
    login: builder.mutation<AuthSession, LoginPayload>({
      query: (data) => ({ url: "/auth/login", method: "POST", data }),
      invalidatesTags: ["Auth", "Shift"],
    }),
    me: builder.query<User, void>({
      query: () => ({ url: "/users/me" }),
      queryKey: () => queryKeys.auth.me,
      providesTags: ["Auth"],
    }),
    forgotPassword: builder.mutation<{ accepted: true }, ForgotPasswordPayload>({
      query: (data) => ({ url: "/auth/forgot-password", method: "POST", data: { ...data, loginType: "ADMIN" } }),
    }),
    verifyOtp: builder.mutation<{ resetToken: string }, VerifyOtpPayload>({
      query: (data) => ({ url: "/auth/verify-otp", method: "POST", data }),
    }),
    resetPassword: builder.mutation<{ message: string }, ResetPasswordPayload>({
      query: (data) => ({ url: "/auth/reset-password", method: "POST", data }),
    }),
  }),
});

type Injected = typeof authApi & {
  useRegisterMutation: (
    options?: UseMutationOptions<User, Error, RegisterPayload>,
  ) => ReturnType<typeof useMutation<User, Error, RegisterPayload>>;
  useLoginMutation: (
    options?: UseMutationOptions<AuthSession, Error, LoginPayload>,
  ) => ReturnType<typeof useMutation<AuthSession, Error, LoginPayload>>;
  useMeQuery: (
    arg?: void,
    options?: Omit<UseQueryOptions<User, Error>, "queryKey" | "queryFn">,
  ) => ReturnType<typeof useQuery<User, Error>>;
  useForgotPasswordMutation: (
    options?: UseMutationOptions<{ accepted: true }, Error, ForgotPasswordPayload>,
  ) => ReturnType<typeof useMutation<{ accepted: true }, Error, ForgotPasswordPayload>>;
  useVerifyOtpMutation: (
    options?: UseMutationOptions<{ resetToken: string }, Error, VerifyOtpPayload>,
  ) => ReturnType<typeof useMutation<{ resetToken: string }, Error, VerifyOtpPayload>>;
  useResetPasswordMutation: (
    options?: UseMutationOptions<{ message: string }, Error, ResetPasswordPayload>,
  ) => ReturnType<typeof useMutation<{ message: string }, Error, ResetPasswordPayload>>;
};

const typedAuthApi = authApi as Injected;

export const useRegisterMutation = typedAuthApi.useRegisterMutation;
export const useLoginMutation = typedAuthApi.useLoginMutation;
export const useMeQuery = typedAuthApi.useMeQuery;
export const useForgotPasswordMutation = typedAuthApi.useForgotPasswordMutation;
export const useVerifyOtpMutation = typedAuthApi.useVerifyOtpMutation;
export const useResetPasswordMutation = typedAuthApi.useResetPasswordMutation;
