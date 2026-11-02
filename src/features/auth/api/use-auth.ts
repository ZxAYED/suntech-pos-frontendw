"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type VerifyOtpPayload = {
  email: string;
  otp: string;
  loginType?: "ADMIN";
};

export type ResetPasswordPayload = {
  resetToken: string;
  newPassword: string;
};

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export function useRegisterMutation(
  options?: UseMutationOptions<User, Error, RegisterPayload>,
) {
  return useMutation({
    mutationFn: async (data: RegisterPayload) => {
      const res = await apiClient.post<User>("/auth/register", data);
      return res.data;
    },
    ...options,
  });
}

export function useLoginMutation(
  options?: UseMutationOptions<AuthSession, Error, LoginPayload>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (data: LoginPayload) => {
      const res = await apiClient.post<AuthSession>("/auth/login", data);
      return res.data;
    },
    onSuccess: async (...args) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["shifts"] }),
      ]);
      await options?.onSuccess?.(...args);
    },
  });
}

export function useMeQuery(
  options?: Omit<UseQueryOptions<User, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<User>("/users/me", { signal });
      return res.data;
    },
    staleTime: 60_000,
    ...options,
  });
}

export function useForgotPasswordMutation(
  options?: UseMutationOptions<{ accepted: true }, Error, ForgotPasswordPayload>,
) {
  return useMutation({
    mutationFn: async (data: ForgotPasswordPayload) => {
      const res = await apiClient.post<{ accepted: true }>("/auth/forgot-password", {
        ...data,
        loginType: "ADMIN",
      });
      return res.data;
    },
    ...options,
  });
}

export function useVerifyOtpMutation(
  options?: UseMutationOptions<{ resetToken: string }, Error, VerifyOtpPayload>,
) {
  return useMutation({
    mutationFn: async (data: VerifyOtpPayload) => {
      const res = await apiClient.post<{ resetToken: string }>("/auth/verify-otp", data);
      return res.data;
    },
    ...options,
  });
}

export function useResetPasswordMutation(
  options?: UseMutationOptions<{ message: string }, Error, ResetPasswordPayload>,
) {
  return useMutation({
    mutationFn: async (data: ResetPasswordPayload) => {
      const res = await apiClient.post<{ message: string }>("/auth/reset-password", data);
      return res.data;
    },
    ...options,
  });
}
