import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { v4 as uuidv4 } from "uuid";
import { AUTH_STORAGE_KEY } from "@/lib/utils";
import { ApiClientError, type ApiErrorResponse, type ApiResponse } from "@/types/api";
import type { AuthSession } from "@/types/domain";

type AuthReader = () => string | null;
type UnauthorizedHandler = () => void;

let readAccessToken: AuthReader = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
};

let handleUnauthorized: UnauthorizedHandler = () => {
  if (typeof window === "undefined") return;
  const token = readAccessToken();
  if (token) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.replace(`${window.location.origin}/login`);
  } else {
    console.warn("[ApiClient] 401 received while browsing in preview mode without token.");
  }
};

export function bindAuthSession(reader: AuthReader, onUnauthorized: UnauthorizedHandler) {
  readAccessToken = reader;
  handleUnauthorized = onUnauthorized;
}

const mutatingMethods = new Set(["post", "patch", "put", "delete"]);

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const method = (config.method ?? "get").toLowerCase();
  if (mutatingMethods.has(method)) {
    const existing = config.headers["Idempotency-Key"] ?? config.headers["idempotency-key"];
    if (!existing) {
      config.headers["Idempotency-Key"] = uuidv4();
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response;
    }

    const payload = response.data as ApiResponse<unknown> | unknown;
    if (
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      (payload as ApiResponse<unknown>).success === true &&
      "data" in payload
    ) {
      return { ...response, data: (payload as ApiResponse<unknown>).data };
    }

    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status ?? 0;
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";
    const timestamp = error.response?.data?.timestamp;

    if (status === 401) {
      handleUnauthorized();
    }

    return Promise.reject(new ApiClientError(message, status, timestamp));
  },
);
